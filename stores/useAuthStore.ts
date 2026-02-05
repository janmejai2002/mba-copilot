
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
    setUser: async (user) => {
        if (user) {
            localStorage.setItem('vidyos_user', JSON.stringify(user));
            // Verify status with server immediately
            try {
                const response = await fetch(`/api/verify-subscription?userId=${user.id}`);
                if (response.ok) {
                    const status = await response.json();
                    set({ isSovereign: status.isSovereign });
                }
            } catch (e) {
                console.error("Shield verification failed", e);
            }
        } else {
            localStorage.removeItem('vidyos_user');
            set({ isSovereign: false });
        }
        set({ user });
    },
    setShowAuth: (show) => set({ showAuth: show }),
    setShowOnboarding: (show) => {
        if (!show) {
            localStorage.setItem('vidyos_onboarding_complete', 'true');
        }
        set({ showOnboarding: show });
    },
    setIsSovereign: (isSovereign) => set({ isSovereign }),
    logout: () => {
        localStorage.removeItem('vidyos_user');
        clearDriveToken();
        set({ user: null, showAuth: false });
    },
}));
