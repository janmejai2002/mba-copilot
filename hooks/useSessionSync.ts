
import { useState, useEffect } from 'react';
import { Session } from '../types';

export function useSessionSync(
    session: Session,
    onUpdateSession: (session: Session) => void,
    transcription: any[],
    concepts: any[],
    suggestedQuestions: any[]
) {
    const [lastSaved, setLastSaved] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            if (Date.now() - lastSaved > 15000 && transcription.length > 0) {
                onUpdateSession({
                    ...session,
                    transcript: transcription.map(t => t.text).join('\n'),
                    turns: transcription,
                    concepts,
                    suggestedQuestions,
                    updatedAt: Date.now()
                });
                setLastSaved(Date.now());
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [transcription, concepts, suggestedQuestions, session, onUpdateSession, lastSaved]);

    return { lastSaved };
}
