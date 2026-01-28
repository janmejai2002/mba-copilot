
import { storage, MBADatabase } from '../services/db';
import { Session, TranscriptionTurn } from '../types';

async function migrateSessions() {
    console.log('Starting session migration...');
    const db = new MBADatabase();
    await db.open();

    const allSessions = await db.sessions.toArray();
    const sessionsBySubjectAndDate: { [key: string]: Session[] } = {};

    // Group sessions
    allSessions.forEach(session => {
        const dateKey = new Date(session.date).toDateString();
        const key = `${session.subjectId}_${dateKey}`;
        if (!sessionsBySubjectAndDate[key]) {
            sessionsBySubjectAndDate[key] = [];
        }
        sessionsBySubjectAndDate[key].push(session);
    });

    for (const key in sessionsBySubjectAndDate) {
        const group = sessionsBySubjectAndDate[key];
        if (group.length > 1) {
            console.log(`Merging ${group.length} sessions for group ${key}`);

            // Sort by creation time
            group.sort((a, b) => a.date - b.date);

            const masterSession = group[0];
            let mergedTurns: TranscriptionTurn[] = masterSession.turns || [];
            let mergedText = masterSession.transcript || '';
            let mergedFiles = masterSession.groundingFiles || [];
            let mergedFileDetails = masterSession.groundingFileDetails || [];
            let mergedConcepts = masterSession.concepts || [];

            for (let i = 1; i < group.length; i++) {
                const s = group[i];

                // Add separator
                mergedTurns.push({
                    role: 'system',
                    text: `Session Merge: ${new Date(s.date).toLocaleTimeString()}`,
                    timestamp: s.date
                });

                if (s.turns) {
                    mergedTurns = mergedTurns.concat(s.turns);
                }
                mergedText += '\n\n' + (s.transcript || '');

                if (s.groundingFiles) mergedFiles = mergedFiles.concat(s.groundingFiles);
                if (s.groundingFileDetails) mergedFileDetails = mergedFileDetails.concat(s.groundingFileDetails);
                if (s.concepts) mergedConcepts = mergedConcepts.concat(s.concepts);

                // Delete the absorbed session
                await db.sessions.delete(s.id);
            }

            // Update master
            masterSession.turns = mergedTurns;
            masterSession.transcript = mergedText;
            masterSession.groundingFiles = [...new Set(mergedFiles)]; // Dedup
            masterSession.groundingFileDetails = mergedFileDetails;
            masterSession.concepts = mergedConcepts; // Simple concat for now

            await db.sessions.put(masterSession);
            console.log(`Merged into session ${masterSession.id}`);
        }
    }

    console.log('Migration complete. Please refresh the app.');
}

// Since we can't easily run standalone TS in browser env from here,
// we'll inject this logic into a temporary component or expose it via console.
// For now, let's create a temporary button in the Settings or Dashboard to trigger this.
