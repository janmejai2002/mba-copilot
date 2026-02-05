import { create } from 'zustand';

export type BackgroundState = 'idle' | 'recording' | 'syncing' | 'thinking' | 'error';

interface BackgroundStore {
    state: BackgroundState;
    intensity: number; // 0-1 for animation intensity
    accentColor: string;
    pulseSpeed: number;
    setState: (state: BackgroundState) => void;
    setIntensity: (intensity: number) => void;
}

// Color mapping for each state
const STATE_COLORS: Record<BackgroundState, string> = {
    idle: '#14b8a6',      // Vidyos Teal
    recording: '#ef4444', // Red
    syncing: '#14b8a6',   // Teal with directional flow
    thinking: '#f59e0b',  // Amber/Gold
    error: '#dc2626'      // Deep Red
};

const STATE_INTENSITIES: Record<BackgroundState, number> = {
    idle: 0.2,
    recording: 0.8,
    syncing: 0.6,
    thinking: 0.7,
    error: 0.5
};

const STATE_PULSE_SPEEDS: Record<BackgroundState, number> = {
    idle: 0.5,
    recording: 2.0,
    syncing: 1.5,
    thinking: 3.0,
    error: 0.3
};

export const useBackgroundStore = create<BackgroundStore>((set) => ({
    state: 'idle',
    intensity: 0.2,
    accentColor: STATE_COLORS.idle,
    pulseSpeed: 0.5,

    setState: (newState) => set({
        state: newState,
        accentColor: STATE_COLORS[newState],
        intensity: STATE_INTENSITIES[newState],
        pulseSpeed: STATE_PULSE_SPEEDS[newState]
    }),

    setIntensity: (intensity) => set({ intensity: Math.max(0, Math.min(1, intensity)) })
}));
