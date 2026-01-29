
import React, { useState } from 'react';
import { Subject, Session, Note } from '../types';
import { Play, Calendar, FileText, ChevronRight, Clock, Plus, BarChart3, Search, UploadCloud, Mic, Layout, BookOpen, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import UnifiedInput from './UnifiedInput';
import SubjectGraph from './SubjectGraph';
import ClassScheduler from './ClassScheduler';
import MaterialsVault from './MaterialsVault';

interface SubjectHomeProps {
    subject: Subject;
    sessions: Session[];
    onBack: () => void;
    onOpenSession: (id: string, mode?: 'view' | 'live') => void;
    onStartNewSession: () => void;
    onCreateScheduledSessions: (dates: Date[]) => void;
}

const SubjectHome: React.FC<SubjectHomeProps> = ({ subject, sessions, onBack, onOpenSession, onStartNewSession, onCreateScheduledSessions }) => {
    const [view, setView] = useState<'dashboard' | 'graph'>('dashboard');
    const [showScheduler, setShowScheduler] = useState(false);
    const [showVault, setShowVault] = useState(false);
    const sortedSessions = [...sessions].sort((a, b) => b.date - a.date);
    const pendingNotes = sessions.flatMap(s => (s.notes || []).filter(n => n.status === 'pending'));

    // Stats
    const totalHours = sessions.reduce((acc, s) => acc + (s.transcript ? s.transcript.length / 150 / 60 : 0), 0);
    const topicCount = sessions.reduce((acc, s) => acc + (s.concepts?.length || 0), 0);

    if (view === 'graph') {
        return (
            <div className="max-w-[1550px] mx-auto pb-24 animate-apple-in px-8">
                <header className="mb-16 pt-10">
                    <button onClick={() => setView('dashboard')} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-[var(--vidyos-teal)] hover:opacity-60 transition-all mb-10 w-fit">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to Hub
                    </button>
                    <div className="flex justify-between items-end gap-10 border-b border-[var(--glass-border)] pb-10 relative">
                        <div className="absolute -bottom-px left-0 w-32 h-[3px] bg-[var(--vidyos-teal)]" />
                        <div>
                            <span className="label-caps mb-4">Neural Architecture map</span>
                            <h1 className="section-title mb-0">{subject.name}</h1>
                        </div>
                    </div>
                </header>
                <div className="vidyos-card p-1">
                    <SubjectGraph subject={subject} sessions={sessions} />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1550px] mx-auto pb-24 animate-apple-in px-8">
            {/* Header */}
            <header className="mb-16 pt-10">
                <button onClick={onBack} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-[var(--vidyos-teal)] hover:opacity-60 transition-all mb-10 w-fit">
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Back to Library
                </button>
                <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-[var(--glass-border)] pb-10 relative">
                    <div className="absolute -bottom-px left-0 w-48 h-[3px] bg-[var(--vidyos-teal)] shadow-[0_0_15px_var(--vidyos-teal-glow)]" />
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="w-3 h-3 rounded-full bg-[var(--vidyos-teal)] shadow-[0_0_10px_var(--vidyos-teal-glow)]" />
                            <span className="label-caps mb-0">Cognitive Structure</span>
                        </div>
                        <h1 className="section-title mb-4">{subject.name}</h1>
                        <p className="text-xl text-[var(--text-muted)] font-bold max-w-3xl leading-relaxed opacity-70 italic">"{subject.description}"</p>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-10 md:pt-0">
                        <button
                            onClick={() => onStartNewSession()}
                            className="btn-fusion"
                        >
                            <Mic className="w-4 h-4" />
                            Attend Live
                        </button>
                        <button
                            onClick={() => setShowScheduler(true)}
                            className="flex items-center gap-3 px-8 py-4 bg-white border border-[var(--glass-border)] text-[var(--text-main)] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[var(--vidyos-teal-light)] transition-all"
                        >
                            <Calendar className="w-4 h-4" />
                            Schedule
                        </button>
                        <button className="flex items-center gap-3 px-8 py-4 bg-white border border-[var(--glass-border)] text-[var(--text-main)] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[var(--vidyos-gold-light)] transition-all">
                            <UploadCloud className="w-4 h-4" />
                            Import
                        </button>
                    </div>
                </div>
            </header>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Left Column: Timeline & Sessions (Span 4) */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="flex items-center justify-between px-3">
                        <span className="label-caps mb-0 text-[var(--vidyos-teal)]">Session Timeline</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-40">{sessions.length} nodes archived</span>
                    </div>

                    <div className="space-y-6 max-h-[750px] overflow-y-auto pr-4 custom-scrollbar">
                        {sortedSessions.map((session, index) => (
                            <div
                                key={session.id}
                                onClick={() => onOpenSession(session.id, 'view')}
                                className="vidyos-card p-6 border-l-4 border-l-transparent hover:border-l-[var(--vidyos-teal)] hover:bg-white/80 transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vidyos-gold)] bg-[var(--vidyos-gold-light)] px-3 py-1.5 rounded-full">
                                        {format(session.date, 'MMM do')}
                                    </span>
                                    {session.transcript && <div className="w-2.5 h-2.5 rounded-full bg-[var(--vidyos-teal)] shadow-[0_0_10px_var(--vidyos-teal-glow)]" title="Transcribed" />}
                                </div>
                                <h4 className="font-black text-xl text-[var(--text-main)] mb-2 group-hover:translate-x-1 transition-transform">{session.title}</h4>
                                <p className="text-[12px] text-[var(--text-muted)] font-bold line-clamp-2 leading-relaxed opacity-60 italic">{session.summary || "No synthesis available yet."}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Stats Card */}
                    <div className="vidyos-card p-10 bg-gradient-to-br from-[var(--vidyos-teal-light)] to-white/20">
                        <span className="label-caps mb-6 text-[var(--vidyos-teal)]">Subject Analytics</span>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <span className="block text-4xl font-black text-[var(--text-main)] tracking-tight">{totalHours.toFixed(1)}h</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">Capture Time</span>
                            </div>
                            <div>
                                <span className="block text-4xl font-black text-[var(--text-main)] tracking-tight">{topicCount}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">Key Nodes</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Column: Intelligence & Pending Notes (Span 8) */}
                <div className="lg:col-span-8 space-y-10">

                    {/* Cross-Session Intelligence */}
                    <div className="vidyos-card p-12 bg-black text-white relative overflow-hidden group border-none shadow-2xl">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[var(--vidyos-teal)]/40 to-transparent pointer-events-none blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/5">
                                    <Search className="w-6 h-6 text-[var(--vidyos-teal)]" />
                                </div>
                                <span className="label-caps mb-0 text-white/50 tracking-[0.4em]">Neural Search Interface</span>
                            </div>
                            <h2 className="text-4xl font-black mb-10 max-w-xl leading-tight tracking-tight">Synthesize across {sessions.length} archived sessions of {subject.name}.</h2>

                            <div className="bg-white/10 backdrop-blur-3xl p-2 rounded-3xl border border-white/10 flex items-center gap-4 focus-within:bg-white/15 transition-all">
                                <input
                                    type="text"
                                    placeholder={`"Extract all references to Game Theory across Term 1..."`}
                                    className="flex-1 bg-transparent border-none outline-none text-md text-white px-8 py-5 placeholder:text-white/20 font-bold"
                                />
                                <button className="w-14 h-14 bg-[var(--vidyos-teal)] text-white rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-[var(--vidyos-teal)]/30">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pending Ingestion Pipeline */}
                    <div className="vidyos-card p-12 border-[var(--vidyos-teal-glow)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--vidyos-teal)] to-transparent" />
                        <div className="flex justify-between items-center mb-12">
                            <div>
                                <span className="label-caps mb-2 text-[var(--vidyos-teal)]">Knowledge Processing Pipeline</span>
                                <h2 className="text-3xl font-black text-[var(--text-main)]">Input Validation</h2>
                            </div>
                            <span className="text-[11px] font-black bg-[var(--vidyos-teal-light)] px-4 py-1.5 rounded-full text-[var(--vidyos-teal)] uppercase tracking-widest">{pendingNotes.length} Pending Nodes</span>
                        </div>

                        {pendingNotes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-16 opacity-40">
                                <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-[var(--vidyos-teal)]" />
                                </div>
                                <h4 className="font-black text-xl mb-2">Synchronized</h4>
                                <p className="text-sm font-bold opacity-60 max-w-sm">All live neural triggers have been successfully ingested into your subject architecture.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingNotes.map(note => (
                                    <div key={note.id} className="p-6 vidyos-card bg-white/50 border-[var(--glass-border)] hover:bg-white transition-all flex justify-between items-center gap-6 group">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-3">
                                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${note.type === 'todo' ? 'bg-red-100 text-red-500' :
                                                    note.type === 'question' ? 'bg-orange-100 text-orange-500' : 'bg-[var(--vidyos-teal-light)] text-[var(--vidyos-teal)]'
                                                    }`}>
                                                    {note.type} TRIGGER
                                                </span>
                                                <span className="text-[10px] font-black text-[var(--text-muted)] opacity-40">
                                                    CAPTURED {format(note.timestamp, 'HH:mm')}
                                                </span>
                                            </div>
                                            <p className="text-md font-bold text-[var(--text-main)]">{note.content}</p>
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 px-6 py-3 bg-[var(--vidyos-teal)] text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--vidyos-teal)]/20">
                                            Commit to Memory
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Interaction Hub Preview */}
                    <div className="grid grid-cols-2 gap-8">
                        <div
                            className="vidyos-card p-10 hover:bg-white/80 transition-all cursor-pointer group relative overflow-hidden"
                            onClick={() => setShowVault(true)}
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                                <BookOpen className="w-20 h-20" />
                            </div>
                            <div className="w-14 h-14 bg-[var(--vidyos-teal-light)] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <BookOpen className="w-7 h-7 text-[var(--vidyos-teal)]" />
                            </div>
                            <h3 className="font-black text-2xl mb-2">Subject Materials</h3>
                            <p className="text-sm font-bold text-[var(--text-muted)] opacity-60">Consolidated archival files</p>
                        </div>
                        <div
                            onClick={() => setView('graph')}
                            className="vidyos-card p-10 hover:bg-white/80 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                                <Layout className="w-20 h-20" />
                            </div>
                            <div className="w-14 h-14 bg-[var(--vidyos-gold-light)] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Layout className="w-7 h-7 text-[var(--vidyos-gold)]" />
                            </div>
                            <h3 className="font-black text-2xl mb-2">Neural Map</h3>
                            <p className="text-sm font-bold text-[var(--text-muted)] opacity-60">Explore architectural links</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Class Scheduler Modal */}
            {showScheduler && (
                <ClassScheduler
                    onSchedule={(dates) => {
                        onCreateScheduledSessions(dates);
                        setShowScheduler(false);
                    }}
                    onClose={() => setShowScheduler(false)}
                />
            )}

            <MaterialsVault
                isOpen={showVault}
                onClose={() => setShowVault(false)}
                subjectId={subject.id}
                subjectName={subject.name}
            />
        </div>
    );
};

export default SubjectHome;
