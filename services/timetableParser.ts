
/**
 * Advanced Timetable Parser with Step-by-Step Logic
 */

export interface TimetableEntry {
    subject: string;
    startTime: string;
    endTime: string;
    day: string;
    room?: string;
}

export type ParseStep = {
    message: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    data?: any;
};

export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const parseTimetableWithSteps = async (
    input: string,
    onStep: (step: ParseStep) => void
): Promise<TimetableEntry[]> => {

    // Step 1: Initialize
    onStep({ message: "Initializing analysis engine...", status: 'processing' });
    await new Promise(r => setTimeout(r, 800));

    // Step 2: Content Normalization
    onStep({ message: "Normalizing text structure and removing noise...", status: 'processing' });
    const cleanText = input.replace(/<[^>]*>?/gm, ' '); // Strip HTML if it's a URL response
    await new Promise(r => setTimeout(r, 1000));
    onStep({ message: "Normalization complete.", status: 'done' });

    // Step 3: Pattern Extraction
    onStep({ message: "Identifying date and time signatures...", status: 'processing' });
    const timeRangeRegex = /(\d{1,2}[:.]\d{2})\s*[-–to ]+\s*(\d{1,2}[:.]\d{2})/gi;
    const timeMatches = cleanText.match(timeRangeRegex);
    await new Promise(r => setTimeout(r, 1200));
    onStep({ message: `Found ${timeMatches?.length || 0} time slots.`, status: 'done', data: timeMatches });

    // Step 4: Subject Mapping
    onStep({ message: "Mapping subjects to identified slots...", status: 'processing' });
    const lines = cleanText.split('\n');
    const entries: TimetableEntry[] = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const dayMatch = days.find(d => trimmed.toLowerCase().includes(d.toLowerCase()));
        const timeMatch = trimmed.match(/(\d{1,2}[:.]\d{2})\s*[-–to ]+\s*(\d{1,2}[:.]\d{2})/i);

        if (timeMatch) {
            let subject = trimmed
                .replace(timeMatch[0], '')
                .replace(dayMatch || '', '')
                .replace(/[|,:;]/g, ' ')
                .trim();

            if (subject) {
                entries.push({
                    subject,
                    startTime: timeMatch[1].replace('.', ':'),
                    endTime: timeMatch[2].replace('.', ':'),
                    day: dayMatch || "Unknown"
                });
            }
        }
    });

    await new Promise(r => setTimeout(r, 1500));
    onStep({ message: `Extracted ${entries.length} curriculum entries.`, status: 'done', data: entries });

    return entries;
};
