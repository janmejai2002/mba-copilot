
import { create } from 'zustand';

type View = 'dashboard' | 'subject_home' | 'session' | 'nexus' | 'practice' | 'privacy' | 'terms' | 'refund_policy' | 'pricing' | 'relay_map';

interface UIState {
    view: View;
    isLoading: boolean;
    darkMode: boolean;
    showPricing: boolean;
    setView: (view: View) => void;
    setIsLoading: (loading: boolean) => void;
    setDarkMode: (darkMode: boolean) => void;
    setShowPricing: (show: boolean) => void;
    navigateTo: (newView: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
    view: 'dashboard',
    isLoading: true,
    darkMode: false,
    showPricing: false,
    setView: (view) => set({ view }),
    setIsLoading: (loading) => set({ isLoading: loading }),
    setDarkMode: (darkMode) => set({ darkMode }),
    setShowPricing: (show) => set({ showPricing: show }),
    navigateTo: (newView) => {
        const cleanPath = newView === 'dashboard' ? '/' : `/${newView}`;
        window.history.pushState({}, '', cleanPath);
        if (newView === 'pricing') {
            set({ showPricing: true });
        } else {
            set({ view: newView as View, showPricing: false });
        }
    },
}));
