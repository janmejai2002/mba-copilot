
import React, { useState } from 'react';
import { Subject, Session } from '../types';
import { Brain, ChevronLeft, ChevronRight, RefreshCw, Sparkles, Filter } from 'lucide-react';

interface PracticeProps {
    subjects: Subject[];
    sessions: Session[];
}

const Practice: React.FC<PracticeProps> = ({ subjects, sessions }) => {
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const runDailyRecallSync = async (force = false) => {
        const lastSync = localStorage.getItem('lastRecallSync');
        const today = new Date().toDateString();

        if (!force && lastSync === today) return;

        console.log("Starting Daily Recall Sync...");
        setIsSyncing(true);
        try {
            // Find sessions with few concepts
            const needsAnalysis = sessions.filter(s => (!s.concepts || s.concepts.length < 3) && s.transcript && s.transcript.length > 500);

            if (needsAnalysis.length > 0) {
                const { extractConceptsFromTranscript } = await import('../services/gemini');
                const { useSessionStore } = await import('../stores/useSessionStore');

                for (const session of needsAnalysis.slice(0, 3)) { // Limit to batch of 3 to save credits
                    try {
                        const concepts = await extractConceptsFromTranscript(session.transcript || '');
                        if (concepts && concepts.length > 0) {
                            const updated = { ...session, concepts: [...(session.concepts || []), ...concepts] };
                            await useSessionStore.getState().updateSession(session.id, updated);
                        }
                    } catch (e) { console.error(e); }
                }
            }

            localStorage.setItem('lastRecallSync', today);
        } catch (error) {
            console.error("Daily Recall Sync Failed:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    React.useEffect(() => {
        // Auto-run daily
        runDailyRecallSync();
    }, []);

    const allConcepts = sessions
        .filter(s => selectedSubject === 'all' || s.subjectId === selectedSubject)
        .flatMap(s => (s.concepts || []).map(c => ({
            ...c,
            subjectName: subjects.find(sub => sub.id === s.subjectId)?.name || 'Unknown'
        })))
        .sort(() => Math.random() - 0.5); // Shuffle

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((prev) => (prev + 1) % allConcepts.length);
        }, 300);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((prev) => (prev - 1 + allConcepts.length) % allConcepts.length);
        }, 300);
    };

    const currentCard = allConcepts[currentCardIndex];

    return (
        <div className="max-w-[1550px] mx-auto pb-24 animate-apple-in px-8 flex flex-col items-center">
            <header className="w-full mb-8 pt-10 text-center">
                <div className="flex flex-col items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-[var(--vidyos-teal)] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[var(--vidyos-teal-glow)]">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <span className="label-caps mb-0 text-[var(--vidyos-teal)]">Neural Retention Practice</span>
                </div>
                <h1 className="section-title mb-8">Active Recall Labs</h1>

                <div className="flex flex-col items-center gap-6">
                    <div className="flex justify-center gap-3 flex-wrap">
                        <button
                            onClick={() => { setSelectedSubject('all'); setCurrentCardIndex(0); }}
                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedSubject === 'all' ? 'bg-black text-white shadow-xl' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
                        >
                            Total Recall
                        </button>
                        {subjects.map(s => (
                            <button
                                key={s.id}
                                onClick={() => { setSelectedSubject(s.id); setCurrentCardIndex(0); }}
                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedSubject === s.id ? 'bg-[var(--vidyos-teal)] text-white shadow-xl' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>

                    {/* Smart Populator */}
                    <button
                        onClick={() => runDailyRecallSync(true)}
                        disabled={isSyncing}
                        className="px-5 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-[10px] font-bold uppercase tracking-widest text-black/60 transition-all flex items-center gap-2"
                    >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Populating Neural Vault...' : 'Force Daily Recall Sync'}
                    </button>
                </div>
            </header>

            {allConcepts.length > 0 && currentCard ? (
                <div className="w-full max-w-2xl">
                    <div className="relative h-[450px] w-full perspective-1000 group">
                        <div
                            className={`relative w-full h-full transition-all duration-700 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                            onClick={() => setIsFlipped(!isFlipped)}
                        >
                            {/* Front */}
                            <div className="absolute inset-0 backface-hidden vidyos-card flex flex-col items-center justify-center p-16 text-center border-2 border-[var(--vidyos-teal-light)] shadow-2xl">
                                <span className="label-caps mb-8 opacity-40">{currentCard.subjectName}</span>
                                <h3 className="text-4xl font-black text-[var(--text-main)] tracking-tight leading-tight">
                                    {currentCard.keyword}
                                </h3>
                                <div className="mt-16 flex items-center gap-3 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                                    <span className="label-caps mb-0 pt-1">Click to reveal meaning</span>
                                </div>
                            </div>

                            {/* Back */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 vidyos-card flex flex-col items-center justify-center p-16 text-center bg-white border-2 border-[var(--vidyos-teal)] shadow-2xl overflow-y-auto custom-scrollbar">
                                <Sparkles className="w-8 h-8 text-[var(--vidyos-teal)] mb-8 opacity-40" />
                                <p className="text-xl font-bold text-[var(--text-main)] leading-relaxed italic pr-4">
                                    {currentCard.explanation}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex justify-between items-center w-full px-10">
                        <button
                            onClick={handlePrev}
                            className="w-16 h-16 rounded-full bg-black/5 hover:bg-black hover:text-white flex items-center justify-center transition-all active:scale-90"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="text-center">
                            <span className="label-caps text-[var(--vidyos-teal)] mb-1 block">Memory Node</span>
                            <span className="text-lg font-black text-black/30">{currentCardIndex + 1} / {allConcepts.length}</span>
                        </div>
                        <button
                            onClick={handleNext}
                            className="w-16 h-16 rounded-full bg-black/5 hover:bg-black hover:text-white flex items-center justify-center transition-all active:scale-90"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="vidyos-card p-24 text-center opacity-20 grayscale flex flex-col items-center">
                    <Brain className="w-20 h-20 mb-8" />
                    <h2 className="text-3xl font-black uppercase tracking-[0.4em]">Neural Vault Empty</h2>
                    <p className="text-sm font-bold mt-4">Generate concepts in session views to activate flashcards.</p>
                </div>
            )}

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            `}</style>
        </div>
    );
};

export default Practice;
