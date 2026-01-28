
import Dexie, { Table } from 'dexie';
import { Subject, Session } from '../types';

export class MBADatabase extends Dexie {
    subjects!: Table<Subject>;
    sessions!: Table<Session>;
    groundingMaterials!: Table<any>;

    constructor() {
        super('MBACopilotDB');
        this.version(2).stores({
            subjects: 'id, name, createdAt',
            sessions: 'id, subjectId, date, title',
            groundingMaterials: 'id, sessionId, name'
        });
    }
}

export const db = new MBADatabase();

// Wrapper functions for consistency
export const storage = {
    async getAllSubjects() {
        return await db.subjects.toArray();
    },
    async getAllSessions() {
        return await db.sessions.toArray();
    },
    async saveSubject(subject: Subject) {
        return await db.subjects.put(subject);
    },
    async saveSession(session: Session) {
        return await db.sessions.put(session);
    },
    async updateSessionTranscript(sessionId: string, transcript: string) {
        return await db.sessions.update(sessionId, { transcript });
    },
    async deleteSession(id: string) {
        return await db.sessions.delete(id);
    }
};
