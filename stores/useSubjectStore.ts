
import { create } from 'zustand';
import { Subject } from '../types';
import { storage } from '../services/db';

interface SubjectState {
    subjects: Subject[];
    activeSubjectId: string | null;
    setSubjects: (subjects: Subject[]) => void;
    setActiveSubjectId: (id: string | null) => void;
    loadSubjects: () => Promise<void>;
    addSubject: (subject: Subject) => Promise<void>;
    updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
    deleteSubject: (id: string) => Promise<void>;
    clearAllSubjects: () => Promise<void>;
}

export const useSubjectStore = create<SubjectState>((set, get) => ({
    subjects: [],
    activeSubjectId: null,
    setSubjects: (subjects) => set({ subjects }),
    setActiveSubjectId: (id) => set({ activeSubjectId: id }),
    loadSubjects: async () => {
        const savedSubjects = await storage.getAllSubjects();
        set({ subjects: savedSubjects });
    },
    addSubject: async (subject) => {
        await storage.saveSubject(subject);
        set({ subjects: [...get().subjects, subject] });
    },
    updateSubject: async (id, updates) => {
        const subject = get().subjects.find(s => s.id === id);
        if (!subject) return;
        const updated = { ...subject, ...updates, updatedAt: Date.now() };
        await storage.saveSubject(updated);
        set({ subjects: get().subjects.map(s => s.id === id ? updated : s) });
    },
    deleteSubject: async (id) => {
        await storage.deleteSubject(id);
        set({
            subjects: get().subjects.filter((s) => s.id !== id),
            activeSubjectId: get().activeSubjectId === id ? null : get().activeSubjectId
        });
    },
    clearAllSubjects: async () => {
        await storage.clearAllSubjects();
        set({ subjects: [], activeSubjectId: null });
    },
}));
