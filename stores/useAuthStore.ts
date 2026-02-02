
import { create } from 'zustand';
import { GoogleUser } from '../types';
import { clearDriveToken } from '../services/db';

interface AuthState {
    user: GoogleUser | null;
    showAuth: boolean;
    showOnboarding: boolean;
    isSovereign: boolean;
    setUser: (user: GoogleUser | null) => void;
    setShowAuth: (show: boolean) => void;
    setShowOnboarding: (show: boolean) => void;
    setIsSovereign: (isSovereign: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: (() => {
        const saved = localStorage.getItem('vidyos_user');
        return saved ? JSON.parse(saved) : null;
    })(),
    showAuth: false,
    showOnboarding: !localStorage.getItem('vidyos_onboarding_complete'),
    isSovereign: false,
    setUser: (user) => {
        if (user) {
            localStorage.setItem('vidyos_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('vidyos_user');
        }
        set({ user });
    },
    setShowAuth: (show) => set({ showAuth: show }),
    setShowOnboarding: (show) => set({ showOnboarding: show }),
    setIsSovereign: (isSovereign) => set({ isSovereign }),
    logout: () => {
        localStorage.removeItem('vidyos_user');
        clearDriveToken();
        set({ user: null, showAuth: false });
    },
}));
