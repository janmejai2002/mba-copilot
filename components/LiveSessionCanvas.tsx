import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import GridLayout, { Layout, Layouts, Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
    Maximize2, Minimize2, X, GripVertical,
    FileText, Brain, PenTool, HelpCircle, Zap,
    RotateCcw, Save, Layout as LayoutIcon,
    Camera, Bookmark, Star, MessageCircle,
    Play, Pause, ChevronDown, ChevronUp
} from 'lucide-react';
import { Subject, Session, TranscriptionTurn, Note } from '../types';
import { callPerplexity } from '../services/perplexity';
import { CREDIT_COSTS } from '../constants/pricing';
import { useLayoutStore } from '../stores/useLayoutStore';
import { useBackgroundStore } from '../stores/useBackgroundStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useTranscription } from '../hooks/useTranscription';
import { useSessionSync } from '../hooks/useSessionSync';

import TranscriptStream from './TranscriptStream';
import SessionControls from './SessionControls';
import AudioVisualizer from './AudioVisualizer';
import QAConsole from './QAConsole';
import DrawingCanvas from './DrawingCanvas';

const KnowledgeGraph = React.lazy(() => import('./EnhancedKnowledgeGraph'));

const ResponsiveGridLayout = WidthProvider(Responsive);

interface LiveSessionCanvasProps {
    session: Session;
    subject: Subject;
    onBack: () => void;
    onUpdateSession: (session: Session) => void;
    consumeCredits: (amount: number, operation: string) => Promise<boolean>;
}

const PANEL_ICONS: Record<string, React.ReactNode> = {
    'transcript': <FileText className="w-4 h-4" />,
    'neural-map': <Brain className="w-4 h-4" />,
    'notes': <PenTool className="w-4 h-4" />,
    'qa-console': <HelpCircle className="w-4 h-4" />,
    'flashcards': <Zap className="w-4 h-4" />,
};

const PANEL_TITLES: Record<string, string> = {
    'transcript': 'Live Transcript',
    'neural-map': 'Neural Map',
    'notes': 'Notes Canvas',
    'qa-console': 'Doubt Console',
    'flashcards': 'Quick Quiz',
};

const LiveSessionCanvas: React.FC<LiveSessionCanvasProps> = ({
    session,
    subject,
    onBack,
    onUpdateSession,
    consumeCredits
}) => {
    const { addNotification } = useNotificationStore();
    const setBackgroundState = useBackgroundStore(state => state.setState);
    const { layouts, setLayouts, panels, togglePanelCollapse, togglePanelMaximize, resetLayout } = useLayoutStore();

    // Session State
    const [transcription, setTranscription] = useState<TranscriptionTurn[]>(session.turns || []);
    const [concepts, setConcepts] = useState(session.concepts || []);
    const [consoleMessages, setConsoleMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [bookmarks, setBookmarks] = useState<{ time: number; label: string }[]>([]);

    // UI State
    const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
    const [showQuickActions, setShowQuickActions] = useState(true);

    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Transcription Hook
    const {
        isRecording,
        isPaused,
        setIsPaused,
        volumeBoost,
        setVolumeBoost,
        skipSilence,
        setSkipSilence,
        analyser,
        startRecording,
        stopRecording
    } = useTranscription((text) => {
        updateTranscription('user', text);
    });

    // Background Sync
    useSessionSync(session, onUpdateSession, transcription, concepts, []);

    const updateTranscription = useCallback((role: 'user' | 'model' | 'system', text: string) => {
        setTranscription(prev => {
            const lastTurn = prev[prev.length - 1];
            if (lastTurn && lastTurn.role === role) {
                const updatedTurns = [...prev];
                updatedTurns[updatedTurns.length - 1] = {
                    ...lastTurn,
                    text: lastTurn.text + " " + text
                };
                return updatedTurns;
            } else {
                return [...prev, { role, text, timestamp: Date.now() }];
            }
        });
    }, []);

    // Quick Actions
    const addBookmark = useCallback(() => {
        const label = `Bookmark ${bookmarks.length + 1}`;
        setBookmarks(prev => [...prev, { time: Date.now(), label }]);
        addNotification({ type: 'success', message: `📌 ${label} added` });
    }, [bookmarks.length, addNotification]);

    const captureScreenshot = useCallback(() => {
        // This would capture the current view
        addNotification({ type: 'info', message: '📸 Screenshot captured' });
    }, [addNotification]);

    const markImportant = useCallback(() => {
        if (transcription.length > 0) {
            const lastTurn = transcription[transcription.length - 1];
            // Mark with star
            addNotification({ type: 'success', message: '⭐ Marked as important' });
        }
    }, [transcription, addNotification]);

    // Handle layout change
    const handleLayoutChange = (layout: Layout[], layouts: Layouts) => {
        setLayouts(layouts);
    };

    // Panel renderer
    const renderPanelContent = (panelId: string) => {
        const panel = panels.get(panelId);
        if (!panel || panel.isCollapsed) return null;

        switch (panelId) {
            case 'transcript':
                return (
                    <div className="h-full flex flex-col">
                        {analyser && <AudioVisualizer analyser={analyser} />}
                        <div className="flex-1 overflow-hidden">
                            <TranscriptStream transcription={transcription} transcriptEndRef={transcriptEndRef} />
                        </div>
                        <SessionControls
                            isRecording={isRecording}
                            isPaused={isPaused}
                            setIsPaused={setIsPaused}
                            skipSilence={skipSilence}
                            setSkipSilence={setSkipSilence}
                            volumeBoost={volumeBoost}
                            setVolumeBoost={setVolumeBoost}
                            onStart={startRecording}
                            onStop={stopRecording}
                            onExport={() => { }}
                        />
                    </div>
                );

            case 'neural-map':
                return (
                    <Suspense fallback={
                        <div className="h-full flex items-center justify-center text-[9px] font-black uppercase opacity-20">
                            Loading Neural Map...
                        </div>
                    }>
                        <KnowledgeGraph concepts={concepts} isSyncing={isSyncing} />
                    </Suspense>
                );

            case 'notes':
                return <DrawingCanvas className="h-full" />;

            case 'qa-console':
                return (
                    <QAConsole
                        suggestedQuestions={[]}
                        messages={consoleMessages}
                        onMessagesChange={setConsoleMessages}
                        onAskAI={async (query) => {
                            const charged = await consumeCredits(CREDIT_COSTS.DOUBT_RESOLUTION, 'Doubt Resolution');
                            if (!charged) return "Insufficient credits.";
                            const context = transcription.slice(-10).map(t => t.text).join(' ');
                            return await callPerplexity(`Context: ${context}\n\nQuestion: ${query}`);
                        }}
                    />
                );

            case 'flashcards':
                return (
                    <div className="h-full flex flex-col items-center justify-center p-4">
                        <Zap className="w-8 h-8 text-[var(--vidyos-teal)] opacity-20 mb-3" />
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest text-center">
                            Quick flashcards will appear here based on your session concepts
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    // Render maximized panel
    const maximizedPanel = Array.from(panels.values()).find(p => p.isMaximized);

    if (maximizedPanel) {
        return (
            <div className="fixed inset-0 z-[1000] bg-black/95 p-4">
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {PANEL_ICONS[maximizedPanel.id]}
                            <span className="text-white font-black uppercase tracking-widest text-sm">
                                {PANEL_TITLES[maximizedPanel.id]}
                            </span>
                        </div>
                        <button
                            onClick={() => togglePanelMaximize(maximizedPanel.id)}
                            className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                        >
                            <Minimize2 className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-black/40 rounded-3xl overflow-hidden border border-white/10">
                        {renderPanelContent(maximizedPanel.id)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030712] pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--vidyos-teal)] opacity-60 hover:opacity-100 transition-all"
                        >
                            ← Return
                        </button>
                        <div className="w-px h-6 bg-white/10" />
                        <div>
                            <h1 className="text-lg font-black text-white tracking-tight">{session.title}</h1>
                            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{subject.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Recording indicator */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${isRecording
                                ? 'bg-red-500/20 border border-red-500/30'
                                : 'bg-white/5 border border-white/10'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                                }`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
                                {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready'}
                            </span>
                        </div>

                        {/* Layout controls */}
                        <button
                            onClick={resetLayout}
                            className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                            title="Reset layout"
                        >
                            <RotateCcw className="w-4 h-4 text-white/40" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Grid Layout */}
            <div className="max-w-[1800px] mx-auto px-4 pt-4">
                <ResponsiveGridLayout
                    className="layout"
                    layouts={layouts}
                    breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                    cols={{ lg: 12, md: 10, sm: 6 }}
                    rowHeight={40}
                    onLayoutChange={handleLayoutChange}
                    onBreakpointChange={setCurrentBreakpoint}
                    draggableHandle=".drag-handle"
                    useCSSTransforms={true}
                    compactType="vertical"
                    preventCollision={false}
                    margin={[12, 12]}
                >
                    {Array.from(panels.entries()).map(([id, panel]) => (
                        <div
                            key={id}
                            className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col ${panel.isCollapsed ? 'opacity-60' : ''
                                }`}
                        >
                            {/* Panel Header */}
                            <div className="drag-handle flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 cursor-move">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="w-3 h-3 text-white/20" />
                                    <span className="text-white/60">{PANEL_ICONS[id]}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
                                        {PANEL_TITLES[id]}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => togglePanelCollapse(id)}
                                        className="p-1 hover:bg-white/10 rounded transition-all"
                                    >
                                        {panel.isCollapsed
                                            ? <ChevronDown className="w-3 h-3 text-white/40" />
                                            : <ChevronUp className="w-3 h-3 text-white/40" />
                                        }
                                    </button>
                                    <button
                                        onClick={() => togglePanelMaximize(id)}
                                        className="p-1 hover:bg-white/10 rounded transition-all"
                                    >
                                        <Maximize2 className="w-3 h-3 text-white/40" />
                                    </button>
                                </div>
                            </div>

                            {/* Panel Content */}
                            {!panel.isCollapsed && (
                                <div className="flex-1 overflow-hidden">
                                    {renderPanelContent(id)}
                                </div>
                            )}
                        </div>
                    ))}
                </ResponsiveGridLayout>
            </div>

            {/* Quick Action Dock */}
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 transition-all duration-300 ${showQuickActions ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
                }`}>
                <div className="flex items-center gap-2 px-4 py-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                    <button
                        onClick={markImportant}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-xl transition-all"
                        title="Mark Important"
                    >
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400 hidden md:inline">Important</span>
                    </button>

                    <button
                        onClick={addBookmark}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all"
                        title="Bookmark"
                    >
                        <Bookmark className="w-4 h-4 text-blue-400" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-400 hidden md:inline">Bookmark</span>
                    </button>

                    <button
                        onClick={captureScreenshot}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl transition-all"
                        title="Screenshot"
                    >
                        <Camera className="w-4 h-4 text-purple-400" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 hidden md:inline">Capture</span>
                    </button>

                    <div className="w-px h-8 bg-white/10 mx-2" />

                    {/* Recording toggle in dock */}
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${isRecording
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-[var(--vidyos-teal)] hover:bg-[var(--vidyos-teal)]/80 text-white'
                            }`}
                    >
                        {isRecording ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        <span className="text-[10px] font-black uppercase tracking-wider hidden md:inline">
                            {isRecording ? 'Stop' : 'Start'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Bookmarks sidebar (shows on hover) */}
            {bookmarks.length > 0 && (
                <div className="fixed right-4 top-1/2 -translate-y-1/2 space-y-2">
                    {bookmarks.map((bookmark, i) => (
                        <div
                            key={i}
                            className="w-2 h-2 bg-blue-400 rounded-full cursor-pointer hover:scale-150 transition-transform"
                            title={bookmark.label}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default LiveSessionCanvas;
