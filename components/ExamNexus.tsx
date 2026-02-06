import React, { useState, useMemo, Suspense } from 'react';
import { Subject, Session } from '../types';
import {
    Zap, Search, ChevronRight, Target, Sparkles, Brain,
    TrendingUp, AlertTriangle, CheckCircle, Clock, BarChart3,
    BookOpen, Flame, RefreshCw
} from 'lucide-react';
import { useKnowledgeStore } from '../stores/useKnowledgeStore';
import { getTopExamTopics, generateStudyPriority, ExamPrediction } from '../services/exam-prediction';

const NeuralNexus = React.lazy(() => import('./NeuralNexus'));

interface ExamNexusProps {
    subjects: Subject[];
    sessions: Session[];
    onOpenSession: (id: string) => void;
}

const ExamNexus: React.FC<ExamNexusProps> = ({ subjects, sessions, onOpenSession }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'predictions' | 'sessions' | 'graph'>('predictions');

    const { nodes, getStats, buildConnections, isProcessing } = useKnowledgeStore();
    const stats = getStats();

    // Generate predictions from knowledge graph
    const predictions = useMemo(() => {
        const nodeArray = Array.from(nodes.values());
        const transcript = sessions.map(s => s.transcript || '').join(' ');
        return getTopExamTopics(nodeArray, transcript, 15);
    }, [nodes, sessions]);

    // Generate study priorities
    const studyPriorities = useMemo(() => {
        const nodeArray = Array.from(nodes.values());
        const transcript = sessions.map(s => s.transcript || '').join(' ');
        return generateStudyPriority(nodeArray, transcript);
    }, [nodes, sessions]);

    const criticalTopics = studyPriorities.filter(p => p.priority === 'critical').length;
    const highTopics = studyPriorities.filter(p => p.priority === 'high').length;

    const sessionsWithQuestions = sessions.filter(s =>
        (s.examQuestions && s.examQuestions.length > 0) || (s.summary)
    ).sort((a, b) => b.date - a.date);

    const filteredSessions = sessionsWithQuestions.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.summary?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = selectedSubject === 'all' || s.subjectId === selectedSubject;
        return matchesSearch && matchesSubject;
    });

    const totalQuestions = sessions.reduce((acc, s) => acc + (s.examQuestions?.length || 0), 0);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
            case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
            default: return 'text-green-500 bg-green-500/10 border-green-500/30';
        }
    };

    const getConfidenceIcon = (confidence: string) => {
        switch (confidence) {
            case 'high': return <Flame className="w-4 h-4 text-red-500" />;
            case 'medium': return <TrendingUp className="w-4 h-4 text-orange-500" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const [isNexusSyncing, setIsNexusSyncing] = useState(false);

    // Nexus Smart Sync: Automatically enrich sessions without insights
    const runSmartSync = async () => {
        const unasalyzedSessions = sessions.filter(s => !s.summary || !s.examQuestions || s.examQuestions.length === 0);
        if (unasalyzedSessions.length === 0) return;

        setIsNexusSyncing(true);
        for (const session of unasalyzedSessions) {
            // Skip if no transcript
            if (!session.transcript && (!session.turns || session.turns.length === 0)) continue;

            try {
                // Generate Insight
                const fullText = session.transcript || session.turns?.map(t => t.text).join(' ') || '';
                if (fullText.length < 100) continue; // Skip empty sessions

                // Generate Intelligence (Questions + Summary)
                // Note: We'd normally use consumeCredits here but this is a bulk op
                // For now, let's assume we do 1 by 1 or batch. 
                // Implementing 1 by 1 for safety.

                // We need a service that does this. 'generateSessionInsight' is in 'SessionView'. 
                // We should lift it or import it.
                // Importing generateSessionInsight from gemini service (it was used in SessionView)
                const { generateSessionInsight } = await import('../services/gemini');

                const result = await generateSessionInsight(fullText);

                // Update Session in DB (via Prop or Store?)
                // We have sessions prop, but to update we need the store function.
                // ExamNexus receives 'sessions' but no update function.
                // We should use useSessionStore directly since we are in a 'smart' component.
                const { updateSession } = (await import('../stores/useSessionStore')).useSessionStore.getState();

                const updated = { ...session, summary: result.summary, examQuestions: result.examQuestions };
                await updateSession(session.id, updated);

            } catch (e) {
                console.error("Nexus Sync Error for session", session.id, e);
            }
        }
        setIsNexusSyncing(false);
    };

    // Auto-run on mount if needed (optional, maybe manual button is safer for credits?)
    // User asked "Automatically call all relevant AI apis".
    // I will add a "Smart Sync" button that pulses if needed.

    return (
        <div className="max-w-[1600px] mx-auto pb-24 animate-apple-in px-8">
            <header className="mb-12 pt-10">
                <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-[var(--glass-border)] pb-10 relative">
                    <div className="absolute -bottom-px left-0 w-64 h-[3px] bg-[var(--vidyos-gold)] shadow-[0_0_15px_var(--vidyos-gold-glow)]" />
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                            <Zap className="w-5 h-5 text-[var(--vidyos-gold)] fill-current animate-pulse" />
                            <span className="label-caps mb-0 text-[var(--vidyos-gold)]">Neural Exam Intelligence</span>
                        </div>
                        <h1 className="section-title mb-4">Exam Nexus 2.0</h1>
                        <div className="flex items-center gap-4 text-xl text-[var(--text-muted)] font-bold max-w-3xl leading-relaxed opacity-70 italic">
                            AI-powered exam prediction, knowledge graph visualization, and personalized study priorities.
                            {sessions.some(s => !s.summary) && (
                                <button
                                    onClick={runSmartSync}
                                    disabled={isNexusSyncing}
                                    className="ml-4 px-4 py-2 bg-[var(--vidyos-gold)]/10 hover:bg-[var(--vidyos-gold)]/20 text-[var(--vidyos-gold)] text-xs uppercase tracking-widest rounded-lg transition-all flex items-center gap-2"
                                >
                                    <RefreshCw className={`w-3 h-3 ${isNexusSyncing ? 'animate-spin' : ''}`} />
                                    {isNexusSyncing ? 'Enriching Nexus...' : 'Sync Missing Intelligence'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex gap-4">
                        <div className="vidyos-card px-6 py-4 text-center">
                            <span className="block text-3xl font-black text-[var(--vidyos-gold)]">{predictions.length}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Predicted Topics</span>
                        </div>
                        <div className="vidyos-card px-6 py-4 text-center">
                            <span className="block text-3xl font-black text-red-500">{criticalTopics}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Critical</span>
                        </div>
                        <div className="vidyos-card px-6 py-4 text-center">
                            <span className="block text-3xl font-black text-green-500">{stats.mastered}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Mastered</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8">
                {(['predictions', 'sessions', 'graph'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                            ? 'bg-black text-white shadow-lg'
                            : 'bg-white hover:bg-black/5 text-[var(--text-muted)]'
                            }`}
                    >
                        {tab === 'predictions' && <Target className="w-4 h-4 inline mr-2" />}
                        {tab === 'sessions' && <BookOpen className="w-4 h-4 inline mr-2" />}
                        {tab === 'graph' && <Brain className="w-4 h-4 inline mr-2" />}
                        {tab}
                    </button>
                ))}

                <div className="flex-1" />

                <button
                    onClick={() => buildConnections()}
                    disabled={isProcessing}
                    className="px-4 py-3 bg-[var(--vidyos-teal)]/10 text-[var(--vidyos-teal)] rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[var(--vidyos-teal)]/20 transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 inline mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                    {isProcessing ? 'Analyzing...' : 'Rebuild Graph'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Sidebar */}
                <aside className="lg:col-span-3 space-y-6">
                    <div className="vidyos-card p-6 bg-[var(--vidyos-gold-light)]/30 border-[var(--vidyos-gold-glow)]">
                        <span className="label-caps mb-4 text-[var(--vidyos-gold)]">Study Priority</span>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Critical</span>
                                <span className="text-lg font-black text-red-500">{criticalTopics}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">High</span>
                                <span className="text-lg font-black text-orange-500">{highTopics}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Mastered</span>
                                <span className="text-lg font-black text-green-500">{stats.mastered}</span>
                            </div>
                        </div>
                    </div>

                    <div className="vidyos-card p-6">
                        <span className="label-caps mb-6">Filter by Subject</span>
                        <div className="space-y-2">
                            <button
                                onClick={() => setSelectedSubject('all')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedSubject === 'all' ? 'bg-black text-white shadow-lg' : 'hover:bg-black/5 text-[var(--text-muted)]'}`}
                            >
                                All Disciplines
                            </button>
                            {subjects.map(subject => (
                                <button
                                    key={subject.id}
                                    onClick={() => setSelectedSubject(subject.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedSubject === subject.id ? 'bg-[var(--vidyos-teal)] text-white shadow-lg' : 'hover:bg-black/5 text-[var(--text-muted)]'}`}
                                >
                                    {subject.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mastery Overview */}
                    <div className="vidyos-card p-6">
                        <span className="label-caps mb-4">Knowledge Mastery</span>
                        <div className="relative h-4 bg-black/10 rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--vidyos-teal)] to-green-400 transition-all duration-500"
                                style={{ width: `${stats.averageMastery * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-[9px] font-bold text-[var(--text-muted)]">Average</span>
                            <span className="text-[11px] font-black text-[var(--vidyos-teal)]">{Math.round(stats.averageMastery * 100)}%</span>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="lg:col-span-9">
                    {/* Search */}
                    <div className="vidyos-card p-2 bg-white/50 border-[var(--glass-border)] flex items-center gap-4 mb-8">
                        <Search className="w-5 h-5 ml-6 text-[var(--text-muted)] opacity-30" />
                        <input
                            type="text"
                            placeholder="Search predictions, concepts, or questions..."
                            className="flex-1 bg-transparent border-none outline-none py-4 font-bold text-md text-[var(--text-main)] placeholder:opacity-20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Predictions Tab */}
                    {activeTab === 'predictions' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {predictions.slice(0, 10).map((prediction, i) => (
                                    <div
                                        key={prediction.nodeId}
                                        className="vidyos-card p-6 hover:shadow-lg transition-all relative overflow-hidden group"
                                    >
                                        {/* Probability indicator */}
                                        <div
                                            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[var(--vidyos-gold)] to-orange-500 transition-all"
                                            style={{ width: `${prediction.probability * 100}%` }}
                                        />

                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {getConfidenceIcon(prediction.confidence)}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                                    #{i + 1}
                                                </span>
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${prediction.confidence === 'high' ? 'bg-red-500/10 text-red-500' :
                                                prediction.confidence === 'medium' ? 'bg-orange-500/10 text-orange-500' :
                                                    'bg-gray-500/10 text-gray-500'
                                                }`}>
                                                {Math.round(prediction.probability * 100)}% likely
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-black text-[var(--text-main)] mb-2">{prediction.label}</h3>

                                        {prediction.reasons.length > 0 && (
                                            <div className="space-y-1">
                                                {prediction.reasons.slice(0, 2).map((reason, j) => (
                                                    <p key={j} className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                                        {reason}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {predictions.length === 0 && (
                                <div className="py-24 text-center vidyos-card bg-transparent border-dashed border-2 flex flex-col items-center justify-center border-[var(--glass-border)] opacity-30">
                                    <Brain className="w-12 h-12 mb-6" />
                                    <h3 className="text-xl font-black uppercase tracking-widest">Build Your Knowledge Graph</h3>
                                    <p className="text-sm font-bold mt-2">Start learning sessions to populate exam predictions</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sessions Tab */}
                    {activeTab === 'sessions' && (
                        <div className="space-y-6">
                            {filteredSessions.map(session => {
                                const subject = subjects.find(s => s.id === session.subjectId);
                                return (
                                    <div key={session.id} className="vidyos-card p-8 group relative transition-all hover:bg-white overflow-hidden">
                                        <div className="flex justify-between items-start mb-6 border-b border-[var(--glass-border)] pb-4">
                                            <div>
                                                <span className="label-caps text-[var(--vidyos-gold)] mb-1">{subject?.name}</span>
                                                <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{session.title}</h3>
                                            </div>
                                            <button
                                                onClick={() => onOpenSession(session.id)}
                                                className="w-10 h-10 rounded-full border border-[var(--glass-border)] flex items-center justify-center hover:bg-[var(--vidyos-gold)] hover:text-white transition-all"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Target className="w-4 h-4 text-[var(--vidyos-gold)]" />
                                                    <span className="label-caps mb-0">Predicted Questions</span>
                                                </div>
                                                <ul className="space-y-3">
                                                    {session.examQuestions?.slice(0, 3).map((q, i) => (
                                                        <li key={i} className="flex gap-3">
                                                            <span className="text-[10px] font-black text-[var(--vidyos-gold)]">{i + 1}.</span>
                                                            <p className="text-sm font-medium text-[var(--text-main)] leading-relaxed">{q}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="bg-black/[0.02] p-6 rounded-2xl">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Sparkles className="w-4 h-4 text-[var(--vidyos-teal)]" />
                                                    <span className="label-caps mb-0">Summary</span>
                                                </div>
                                                <p className="text-[13px] font-medium text-[var(--text-main)] opacity-70 leading-relaxed">
                                                    {session.summary?.substring(0, 200)}...
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredSessions.length === 0 && (
                                <div className="py-24 text-center vidyos-card bg-transparent border-dashed border-2 flex flex-col items-center justify-center border-[var(--glass-border)] opacity-30">
                                    <Target className="w-12 h-12 mb-6" />
                                    <h3 className="text-xl font-black uppercase tracking-widest">No Synthesized Sessions</h3>
                                    <p className="text-sm font-bold mt-2">Complete sessions with "Synthesize Insights" to see predictions</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Graph Tab */}
                    {activeTab === 'graph' && (
                        <div className="vidyos-card p-0 overflow-hidden rounded-3xl" style={{ height: '600px' }}>
                            <Suspense fallback={
                                <div className="h-full flex items-center justify-center bg-black">
                                    <div className="text-center">
                                        <Brain className="w-12 h-12 text-[var(--vidyos-teal)] opacity-30 mx-auto mb-4 animate-pulse" />
                                        <p className="text-white/30 text-[11px] font-black uppercase tracking-widest">Loading Neural Nexus...</p>
                                    </div>
                                </div>
                            }>
                                <NeuralNexus />
                            </Suspense>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamNexus;
