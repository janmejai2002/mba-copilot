import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Layout, Layouts } from 'react-grid-layout';

export interface PanelConfig {
    id: string;
    title: string;
    icon: string;
    isCollapsed: boolean;
    isMaximized: boolean;
}

interface LayoutStore {
    layouts: Layouts;
    panels: Map<string, PanelConfig>;
    currentBreakpoint: string;

    setLayouts: (layouts: Layouts) => void;
    setCurrentBreakpoint: (breakpoint: string) => void;

    togglePanelCollapse: (panelId: string) => void;
    togglePanelMaximize: (panelId: string) => void;

    resetLayout: () => void;
    saveLayoutPreset: (name: string) => void;
    loadLayoutPreset: (name: string) => void;
}

// Default layouts for different screen sizes
const DEFAULT_LAYOUTS: Layouts = {
    lg: [
        { i: 'transcript', x: 3, y: 0, w: 6, h: 16, minW: 4, minH: 8 },
        { i: 'neural-map', x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 4 },
        { i: 'notes', x: 0, y: 8, w: 3, h: 8, minW: 2, minH: 4 },
        { i: 'qa-console', x: 9, y: 0, w: 3, h: 10, minW: 2, minH: 6 },
        { i: 'flashcards', x: 9, y: 10, w: 3, h: 6, minW: 2, minH: 4 },
    ],
    md: [
        { i: 'transcript', x: 0, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
        { i: 'neural-map', x: 6, y: 0, w: 4, h: 6, minW: 2, minH: 4 },
        { i: 'qa-console', x: 6, y: 6, w: 4, h: 6, minW: 2, minH: 4 },
        { i: 'notes', x: 0, y: 12, w: 5, h: 6, minW: 2, minH: 4 },
        { i: 'flashcards', x: 5, y: 12, w: 5, h: 6, minW: 2, minH: 4 },
    ],
    sm: [
        { i: 'transcript', x: 0, y: 0, w: 6, h: 10, minW: 6, minH: 6 },
        { i: 'neural-map', x: 0, y: 10, w: 6, h: 6, minW: 6, minH: 4 },
        { i: 'qa-console', x: 0, y: 16, w: 6, h: 6, minW: 6, minH: 4 },
        { i: 'notes', x: 0, y: 22, w: 6, h: 6, minW: 6, minH: 4 },
        { i: 'flashcards', x: 0, y: 28, w: 6, h: 6, minW: 6, minH: 4 },
    ],
};

const DEFAULT_PANELS: [string, PanelConfig][] = [
    ['transcript', { id: 'transcript', title: 'Live Transcript', icon: 'FileText', isCollapsed: false, isMaximized: false }],
    ['neural-map', { id: 'neural-map', title: 'Neural Map', icon: 'Brain', isCollapsed: false, isMaximized: false }],
    ['notes', { id: 'notes', title: 'Notes Canvas', icon: 'PenTool', isCollapsed: false, isMaximized: false }],
    ['qa-console', { id: 'qa-console', title: 'Doubt Console', icon: 'HelpCircle', isCollapsed: false, isMaximized: false }],
    ['flashcards', { id: 'flashcards', title: 'Quick Quiz', icon: 'Zap', isCollapsed: false, isMaximized: false }],
];

export const useLayoutStore = create<LayoutStore>()(
    persist(
        (set, get) => ({
            layouts: DEFAULT_LAYOUTS,
            panels: new Map(DEFAULT_PANELS),
            currentBreakpoint: 'lg',

            setLayouts: (layouts) => set({ layouts }),

            setCurrentBreakpoint: (breakpoint) => set({ currentBreakpoint: breakpoint }),

            togglePanelCollapse: (panelId) => {
                set(state => {
                    const panels = new Map(state.panels);
                    const panel = panels.get(panelId);
                    if (panel) {
                        panels.set(panelId, { ...panel, isCollapsed: !panel.isCollapsed });
                    }
                    return { panels };
                });
            },

            togglePanelMaximize: (panelId) => {
                set(state => {
                    const panels = new Map(state.panels);
                    const panel = panels.get(panelId);
                    if (panel) {
                        // If maximizing, minimize all others
                        if (!panel.isMaximized) {
                            panels.forEach((p, id) => {
                                panels.set(id, { ...p, isMaximized: id === panelId });
                            });
                        } else {
                            panels.set(panelId, { ...panel, isMaximized: false });
                        }
                    }
                    return { panels };
                });
            },

            resetLayout: () => {
                set({
                    layouts: DEFAULT_LAYOUTS,
                    panels: new Map(DEFAULT_PANELS)
                });
            },

            saveLayoutPreset: (name) => {
                const { layouts, panels } = get();
                const presets = JSON.parse(localStorage.getItem('layout-presets') || '{}');
                presets[name] = {
                    layouts,
                    panels: Array.from(panels.entries())
                };
                localStorage.setItem('layout-presets', JSON.stringify(presets));
            },

            loadLayoutPreset: (name) => {
                const presets = JSON.parse(localStorage.getItem('layout-presets') || '{}');
                const preset = presets[name];
                if (preset) {
                    set({
                        layouts: preset.layouts,
                        panels: new Map(preset.panels)
                    });
                }
            }
        }),
        {
            name: 'layout-store',
            partialize: (state) => ({
                layouts: state.layouts,
                panels: Array.from(state.panels.entries()),
                currentBreakpoint: state.currentBreakpoint
            }),
            merge: (persisted: any, current) => ({
                ...current,
                layouts: persisted?.layouts || DEFAULT_LAYOUTS,
                panels: new Map(persisted?.panels || DEFAULT_PANELS),
                currentBreakpoint: persisted?.currentBreakpoint || 'lg'
            })
        }
    )
);
