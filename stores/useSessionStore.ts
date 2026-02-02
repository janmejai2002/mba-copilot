
import { create } from 'zustand';
import { Session } from '../types';
import { storage } from '../services/db';

interface SessionState {
    sessions: Session[];
    activeSessionId: string | null;
    isMiniMode: boolean;
    setSessions: (sessions: Session[]) => void;
    setActiveSessionId: (id: string | null) => void;
    setIsMiniMode: (mini: boolean) => void;
    loadSessions: () => Promise<void>;
    addSession: (session: Session) => Promise<void>;
    updateSession: (session: Session) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    removeSessionsBySubjectId: (subjectId: string) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
    sessions: [],
    activeSessionId: null,
    isMiniMode: false,
    setSessions: (sessions) => set({ sessions }),
    setActiveSessionId: (id) => set({ activeSessionId: id }),
    setIsMiniMode: (mini) => set({ isMiniMode: mini }),
    loadSessions: async () => {
        const savedSessions = await storage.getAllSessions();
        set({ sessions: savedSessions });
    },
    addSession: async (session) => {
        await storage.saveSession(session);
        set({ sessions: [...get().sessions, session] });
    },
    updateSession: async (updatedSession) => {
        await storage.saveSession(updatedSession);
        set({
            sessions: get().sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
        });
    },
    deleteSession: async (id) => {
        await storage.deleteSession(id);
        set({
            sessions: get().sessions.filter((s) => s.id !== id),
            activeSessionId: get().activeSessionId === id ? null : get().activeSessionId
        });
    },
    removeSessionsBySubjectId: (subjectId) => {
        set({
            sessions: get().sessions.filter((s) => s.subjectId !== subjectId),
            activeSessionId: get().activeSessionId && get().sessions.find(s => s.id === get().activeSessionId)?.subjectId === subjectId ? null : get().activeSessionId
        });
    }
}));
