
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
