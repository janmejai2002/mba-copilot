
import { Subject, Session } from '../types';
import { storage } from './db';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Q11tXArxJqN9aUMRSSwpbKJss6xzy0OAwVwmUzgHaTw/export?format=csv&gid=0';

export async function syncTimetable() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(','));

        // Basic parsing logic based on the provided sheet structure
        // Assuming Column A is Date, and Columns B, C, D, E are slots
        // This is a simplified parser - might need refinement based on exact CSV output

        const sessionsToCreate: Partial<Session>[] = [];
        const subjectsFound = new Set<string>();

        let currentDay = '';

        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 2) continue;

            const dateStr = row[0]?.trim();
            if (dateStr) currentDay = dateStr;

            // Slots B, C, D, E
            const slots = [
                { time: '09:00', content: row[1] },
                { time: '11:00', content: row[2] },
                { time: '14:00', content: row[3] },
                { time: '16:00', content: row[4] }
            ];

            slots.forEach(slot => {
                if (slot.content && slot.content.trim().length > 3) {
                    const subjectName = slot.content.split('[')[0].trim();
                    if (subjectName) {
                        subjectsFound.add(subjectName);

                        // Parse date
                        // row[0] might be "Jan 13, 2026 Tuesday"
                        // We'll try to create a valid timestamp
                        const cleanedDate = currentDay.split(' ').slice(0, 3).join(' '); // "Jan 13, 2026"
                        const sessionDate = new Date(`${cleanedDate} ${slot.time}`).getTime();

                        if (!isNaN(sessionDate)) {
                            sessionsToCreate.push({
                                title: `Lecture: ${subjectName}`,
                                subjectId: subjectName, // Use name as temp ID or match existing
                                date: sessionDate
                            });
                        }
                    }
                }
            });
        }

        console.log(`Parsed ${sessionsToCreate.length} sessions from timetable.`);
        return { subjectsFound: Array.from(subjectsFound), sessionsToCreate };

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
    for (const name of data.subjectsFound) {
        if (!existingSubjects.find(s => s.name === name)) {
            await storage.saveSubject({
                id: Math.random().toString(36).substr(2, 9),
                userId,
                name,
                description: 'Imported from ERP Timetable',
                createdAt: Date.now()
            });
        }
    }

    // Refresh subjects to get IDs
    const currentSubjects = await storage.getAllSubjects();

    // 2. Create Sessions for the next 7 days if they don't exist
    const now = Date.now();
    const futureLimit = now + (7 * 24 * 60 * 60 * 1000);

    for (const sessionData of data.sessionsToCreate) {
        if (sessionData.date! > now && sessionData.date! < futureLimit) {
            const subject = currentSubjects.find(s => s.name === sessionData.subjectId);
            if (subject) {
                const exists = existingSessions.find(s =>
                    s.subjectId === subject.id &&
                    Math.abs(s.date - sessionData.date!) < 3600000 // Within 1 hour
                );

                if (!exists) {
                    await storage.saveSession({
                        id: Math.random().toString(36).substr(2, 9),
                        userId,
                        subjectId: subject.id,
                        title: sessionData.title!,
                        date: sessionData.date!,
                        transcript: '',
                        turns: []
                    });
                }
            }
        }
    }
}
