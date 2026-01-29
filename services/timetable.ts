
import { Subject, Session } from '../types';
import { storage } from './db';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Q11tXArxJqN9aUMRSSwpbKJss6xzy0OAwVwmUzgHaTw/export?format=csv&gid=0';

/**
 * Robust CSV parser that handles newlines inside quotes.
 */
const parseFullCSV = (data: string) => {
    const rows: string[][] = [];
    let currentColumn = '';
    let currentRow: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < data.length; i++) {
        const char = data[i];
        const nextChar = data[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentColumn += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentColumn.trim());
            currentColumn = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (currentRow.length > 0 || currentColumn !== '') {
                currentRow.push(currentColumn.trim());
                rows.push(currentRow);
            }
            currentColumn = '';
            currentRow = [];
            if (char === '\r' && nextChar === '\n') i++;
        } else {
            currentColumn += char;
        }
    }
    if (currentColumn !== '' || currentRow.length > 0) {
        currentRow.push(currentColumn.trim());
        rows.push(currentRow);
    }
    return rows;
};

export async function syncTimetable() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        const allRows = parseFullCSV(csvText);

        const header = allRows[0] || [];

        // 1. Build Course Look-up Table (Scanning all columns H-K)
        const courseLookup: Record<string, { name: string; faculty: string }> = {};
        allRows.forEach(row => {
            const code = row[7]?.trim(); // Column H
            const name = row[8]?.trim(); // Column I
            const facultyArr = row[10]?.trim(); // Column K

            if (code && name && code !== "Course Code") {
                courseLookup[code] = { name, faculty: facultyArr || "Unknown" };
            }
        });

        const slotTimes = [
            header[1] || '09:00 AM - 10:30 AM',
            header[2] || '11:00 AM - 12:30 PM',
            header[3] || '14:00 PM - 15:30 PM',
            header[4] || '16:00 PM - 17:30 PM'
        ];

        const sessionsToCreate: any[] = [];
        const subjectsFound = new Map<string, string>(); // Name -> Faculty

        let currentActiveDate = "";
        const dateAnchorRegex = /^[A-Z][a-z]{2}\s\d{1,2}.*?\d{4}/;

        // Extraction protocol from Row 10 (index 9)
        for (let i = 9; i < allRows.length; i++) {
            const row = allRows[i];
            if (!row) continue;

            const rawDateCell = row[0] || "";
            if (dateAnchorRegex.test(rawDateCell)) {
                currentActiveDate = rawDateCell;
            }

            if (!currentActiveDate) continue;

            // Only consider columns B, C, D, E (index 1-4)
            [1, 2, 3, 4].forEach((colIdx, slotIdx) => {
                const content = row[colIdx];
                if (content && content.includes('[') && content.length > 3) {
                    const parts = content.split('\n').map(p => p.trim());
                    const subjectPart = parts[0] || "";
                    let subjectCode = subjectPart.split('[')[0]?.trim() || "Unknown";

                    // Clean up potential stray quotes from CSV splitting
                    subjectCode = subjectCode.replace(/^["']+|["']+$/g, '').trim();

                    // Filter out date-like strings that might have a [ in them (unlikely but possible if formatting is weird)
                    const isDatePattern = /^\d{4}|^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(subjectCode);
                    if (isDatePattern || subjectCode.length < 2) return;

                    // Extract Session/Section
                    const sessionMatch = content.match(/\[(\d+)\]/);
                    const sectionMatch = content.match(/\[([EFG])\]/i);
                    const sessionNum = sessionMatch ? sessionMatch[1] : "?";
                    const sectionLetter = sectionMatch ? sectionMatch[1].toUpperCase() : "?";

                    const lookup = courseLookup[subjectCode];
                    const subjectName = lookup ? lookup.name : subjectCode;
                    let faculty = lookup ? lookup.faculty : (parts[1] || "").replace(/[\[\]"']/g, '').trim();
                    if (!faculty || faculty === "Unknown") faculty = (parts[1] || "").replace(/[\[\]"']/g, '').trim() || "Unknown";

                    if (subjectName && subjectName !== "Unknown" && !isDatePattern) {
                        subjectsFound.set(subjectName, faculty);
                    }

                    // Parse Date for timestamp
                    // Format: "Jan 13, 2026 Tuesday" -> "Jan 13, 2026"
                    const dateMatch = currentActiveDate.match(/^[A-Z][a-z]{2}\s\d{1,2},?\s\d{4}/);
                    if (dateMatch) {
                        const cleanedDate = dateMatch[0];
                        const startTime = slotTimes[slotIdx].split('-')[0].trim();
                        const sessionDate = new Date(`${cleanedDate} ${startTime}`).getTime();

                        if (!isNaN(sessionDate)) {
                            sessionsToCreate.push({
                                title: `${subjectName} (Session ${sessionNum}) [Sec ${sectionLetter}]`,
                                subjectId: subjectName,
                                faculty,
                                date: sessionDate
                            });
                        }
                    }
                }
            });
        }

        return {
            subjectsFound: Array.from(subjectsFound.entries()).map(([name, faculty]) => ({ name, faculty })),
            sessionsToCreate
        };

    } catch (error) {
        console.error('Failed to sync timetable:', error);
        return null;
    }
}

export async function applyTimetableSync(userId: string) {
    const data = await syncTimetable();
    if (!data) return;

    const existingSubjects = await storage.getAllSubjects();
    const existingSessions = await storage.getAllSessions();

    // 1. Ensure Subjects exist
    for (const sub of data.subjectsFound) {
        if (!existingSubjects.find(s => s.name === sub.name)) {
            await storage.saveSubject({
                id: Math.random().toString(36).substr(2, 9),
                userId,
                name: sub.name,
                description: `Faculty: ${sub.faculty}`,
                createdAt: Date.now()
            });
        }
    }

    // Refresh subjects to get IDs
    const currentSubjects = await storage.getAllSubjects();

    // 2. Create Sessions for the next 14 days if they don't exist
    const now = Date.now();
    const pastLimit = now - (3 * 60 * 60 * 1000); // Include classes that started in the last 3 hours
    const futureLimit = now + (14 * 24 * 60 * 60 * 1000);

    for (const sessionData of data.sessionsToCreate) {
        if (sessionData.date > pastLimit && sessionData.date < futureLimit) {
            const cleanSubId = sessionData.subjectId.replace(/^["']+|["']+$/g, '').trim();
            const subject = currentSubjects.find(s => s.name === cleanSubId);
            if (subject) {
                const exists = existingSessions.find(s =>
                    s.subjectId === subject.id &&
                    Math.abs(s.date - sessionData.date) < 3600000 // Within 1 hour
                );

                if (!exists) {
                    await storage.saveSession({
                        id: Math.random().toString(36).substr(2, 9),
                        userId,
                        subjectId: subject.id,
                        title: sessionData.title,
                        date: sessionData.date,
                        transcript: '',
                        turns: [],
                        groundingFiles: [],
                        groundingFileDetails: []
                    });
                }
            }
        }
    }
}
