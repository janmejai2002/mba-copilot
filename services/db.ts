
import Dexie, { Table } from 'dexie';
import { Subject, Session } from '../types';
import { googleDrive } from './googleDrive';

export class MBADatabase extends Dexie {
    subjects!: Table<Subject>;
    sessions!: Table<Session>;
    groundingMaterials!: Table<any>;

    constructor() {
        super('MBACopilotDB');
        this.version(3).stores({
            subjects: 'id, name, createdAt, userId',
            sessions: 'id, subjectId, date, title, userId',
            groundingMaterials: 'id, sessionId, name'
        });
    }
}

export const db = new MBADatabase();

// Google Drive Sync Logic
let gapiAccessToken: string | null = null;
let gdriveFileId: string | null = null;

export const setDriveToken = (token: string) => {
    gapiAccessToken = token;
};

const syncToDrive = async () => {
    if (!gapiAccessToken) return;

    try {
        const subjects = await db.subjects.toArray();
        const sessions = await db.sessions.toArray();
        const backupData = { subjects, sessions, lastSync: Date.now() };

        const result = await googleDrive.saveToAppData(gapiAccessToken, 'mba_copilot_backup.json', backupData, gdriveFileId || undefined);
        if (result && result.id) gdriveFileId = result.id;
    } catch (e) {
        console.error("GDrive Sync Failed:", e);
    }
};

export const storage = {
    async pullFromDrive() {
        if (!gapiAccessToken) return;
        const data = await googleDrive.getAppDataFile(gapiAccessToken, 'mba_copilot_backup.json');
        if (data && data.content) {
            gdriveFileId = data.id;
            const { subjects, sessions } = data.content;
            await db.subjects.bulkPut(subjects);
            await db.sessions.bulkPut(sessions);
            return true;
        }
        return false;
    },
    async getAllSubjects() {
        return await db.subjects.toArray();
    },
    async getAllSessions() {
        return await db.sessions.toArray();
    },
    async saveSubject(subject: Subject) {
        await db.subjects.put(subject);
        syncToDrive();
    },
    async saveSession(session: Session) {
        await db.sessions.put(session);
        syncToDrive();
    },
    async updateSessionTranscript(sessionId: string, transcript: string) {
        await db.sessions.update(sessionId, { transcript });
        syncToDrive();
    },
    async deleteSession(id: string) {
        await db.sessions.delete(id);
        syncToDrive();
    }
};
