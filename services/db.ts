
import Dexie, { Table } from 'dexie';
import { Subject, Session } from '../types';
import { googleDrive } from './googleDrive';

export class VidyosDatabase extends Dexie {
    subjects!: Table<Subject>;
    sessions!: Table<Session>;
    groundingMaterials!: Table<any>;

    constructor() {
        super('VidyosDB');
        this.version(1).stores({
            subjects: 'id, name, createdAt, userId',
            sessions: 'id, subjectId, date, title, userId',
            groundingMaterials: 'id, subjectId, name'
        });
    }
}

export const db = new VidyosDatabase();

// Google Drive Sync Logic
let gapiAccessToken: string | null = null;
let gdriveFileId: string | null = null;

export const setDriveToken = (token: string) => {
    gapiAccessToken = token;
};

let authErrorCallback: (() => void) | null = null;
export const onAuthError = (cb: () => void) => {
    authErrorCallback = cb;
    return () => { authErrorCallback = null; };
};

// Debounce timer for sync
let syncTimeout: any = null;

const syncToDrive = async () => {
    if (!gapiAccessToken) return;

    // Clear existing timeout to reset the debounce
    if (syncTimeout) clearTimeout(syncTimeout);

    // Set a new timeout (e.g., 30 seconds)
    syncTimeout = setTimeout(async () => {
        try {
            console.log("☁️ Syncing to Google Drive...");
            const subjects = await db.subjects.toArray();
            const sessions = await db.sessions.toArray();
            const backupData = { subjects, sessions, lastSync: Date.now() };

            const result = await googleDrive.saveToAppData(gapiAccessToken, 'vidyos_backup.json', backupData, gdriveFileId || undefined);
            if (result && result.id) gdriveFileId = result.id;
            console.log("✅ Drive Sync Complete");
        } catch (e: any) {
            console.error("GDrive Sync Failed:", e);
            if (e.message === 'UNAUTHORIZED_DRIVE_ACCESS' && authErrorCallback) {
                authErrorCallback();
            }
        }
    }, 30000); // 30 second debounce
};

export const storage = {
    async pullFromDrive() {
        if (!gapiAccessToken) return;
        try {
            const data = await googleDrive.getAppDataFile(gapiAccessToken, 'vidyos_backup.json');
            if (data && data.content) {
                gdriveFileId = data.id;
                const { subjects, sessions } = data.content;
                await db.subjects.bulkPut(subjects);
                await db.sessions.bulkPut(sessions);
                return true;
            }
            return false;
        } catch (e: any) {
            if (e.message === 'UNAUTHORIZED_DRIVE_ACCESS' && authErrorCallback) {
                authErrorCallback();
            }
            return false;
        }
    },
    async getAllSubjects() {
        return await db.subjects.toArray();
    },
    async getAllSessions() {
        return await db.sessions.toArray();
    },
    async getSessionById(id: string) {
        return await db.sessions.get(id);
    },
    async saveSubject(subject: Subject) {
        await db.subjects.put(subject);
        syncToDrive();
    },
    async deleteSubject(id: string) {
        await db.subjects.delete(id);
        await db.sessions.where('subjectId').equals(id).delete();
        syncToDrive();
    },
    async clearAllSubjects() {
        await db.subjects.clear();
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
    },

    async initializeDefaultSubjects(userId: string) {
        const existingSubjects = await db.subjects.toArray();
        if (existingSubjects.length > 0) return; // Already initialized

        const defaultSubjects: Subject[] = [
            {
                id: crypto.randomUUID(),
                name: 'Financial Management - II',
                code: 'FM2',
                faculty: 'Unknown',
                createdAt: Date.now(),
                userId
            },
            {
                id: crypto.randomUUID(),
                name: 'Operations Management - II',
                code: 'ORM2',
                faculty: 'Unknown',
                createdAt: Date.now(),
                userId
            },
            {
                id: crypto.randomUUID(),
                name: 'Org. Structure, Design and Change',
                code: 'BOB2',
                faculty: 'Unknown',
                createdAt: Date.now(),
                userId
            },
            {
                id: crypto.randomUUID(),
                name: 'Strategic Management',
                code: 'STM',
                faculty: 'Unknown',
                createdAt: Date.now(),
                userId
            },
            {
                id: crypto.randomUUID(),
                name: 'Business Law',
                code: 'BLA',
                faculty: 'Unknown',
                createdAt: Date.now(),
                userId
            },
            {
                id: crypto.randomUUID(),
                name: 'Human Resource Management',
                code: 'HRM',
                faculty: 'Unknown',
                createdAt: Date.now(),
                userId
            },
            {
                id: crypto.randomUUID(),
                name: 'Operations Research',
                code: 'OPR',
                faculty: 'Unknown',
                createdAt: Date.now(),
                userId
            },
            {
                id: crypto.randomUUID(),
                name: 'Business Research Methods',
                code: 'BRM',
                faculty: 'Unknown',
                createdAt: Date.now(),
                userId
            }
        ];

        await db.subjects.bulkAdd(defaultSubjects);
        syncToDrive();
        console.log('✅ Initialized default study subjects');
    },

    // --- Neural Vault Store ---
    async saveGroundingMaterial(material: any) {
        await db.groundingMaterials.put(material);
        syncToDrive();
    },
    async deleteGroundingMaterial(id: string) {
        await db.groundingMaterials.delete(id);
        syncToDrive();
    },
    async getGroundingMaterials(subjectId: string) {
        return await db.groundingMaterials.where('subjectId').equals(subjectId).toArray();
    }
};
