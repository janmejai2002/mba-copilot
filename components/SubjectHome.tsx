
import React, { useState } from 'react';
import { Subject, Session, Note } from '../types';
import { Play, Calendar, FileText, ChevronRight, Clock, Plus, BarChart3, Search, UploadCloud, Mic, Layout, BookOpen, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import UnifiedInput from './UnifiedInput';
import SubjectGraph from './SubjectGraph';

interface SubjectHomeProps {
    subject: Subject;
    sessions: Session[];
    onBack: () => void;
    onOpenSession: (id: string, mode?: 'view' | 'live') => void;
    onStartNewSession: () => void;
}

const SubjectHome: React.FC<SubjectHomeProps> = ({ subject, sessions, onBack, onOpenSession, onStartNewSession }) => {
    const [view, setView] = useState<'dashboard' | 'graph'>('dashboard');
    const sortedSessions = [...sessions].sort((a, b) => b.date - a.date);
    const pendingNotes = sessions.flatMap(s => (s.notes || []).filter(n => n.status === 'pending'));

    // Stats
    const totalHours = sessions.reduce((acc, s) => acc + (s.transcript ? s.transcript.length / 150 / 60 : 0), 0);
    const topicCount = sessions.reduce((acc, s) => acc + (s.concepts?.length || 0), 0);

    if (view === 'graph') {
        return (
            <div className="max-w-[1400px] mx-auto pb-20 animate-apple-in px-6">
                <header className="mb-12 pt-8">
                    <button onClick={() => setView('dashboard')} className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 hover:text-black transition-all mb-8 flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 rotate-180" />
                        Back to Dashboard
                    </button>
                    <div className="flex justify-between items-end gap-6 border-b border-black/[0.04] pb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40">Knowledge Network</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[#1d1d1f]">{subject.name}</h1>
                        </div>
                    </div>
                </header>
                <SubjectGraph subject={subject} sessions={sessions} />
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-20 animate-apple-in px-6">
            {/* Header */}
            <header className="mb-12 pt-8">
                <button onClick={onBack} className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 hover:text-black transition-all mb-8 flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    Back to Library
                </button>
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-black/[0.04] pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40">Subject Architecture</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[#1d1d1f] mb-3">{subject.name}</h1>
                        <p className="text-lg text-black/40 font-medium max-w-2xl">{subject.description}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => onStartNewSession()}
                            className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black/80 active:scale-95 transition-all shadow-xl shadow-black/5"
                        >
                            <Mic className="w-4 h-4" />
                            Attend Live
                        </button>
                        <button className="flex items-center gap-2 px-6 py-4 bg-white border border-black/[0.05] text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black/[0.02] active:scale-95 transition-all">
                            <UploadCloud className="w-4 h-4" />
                            Import Recording
                        </button>
                    </div>
                </div>
            </header>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column: Timeline & Sessions (Span 4) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">Session Timeline</h3>
                        <span className="text-[10px] font-mono text-black/20">{sessions.length} Sessions</span>
                    </div>

                    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {sortedSessions.map((session, index) => (
                            <div
                                key={session.id}
                                onClick={() => onOpenSession(session.id, 'view')}
                                className="group p-5 bg-white border border-black/[0.04] rounded-2xl hover:border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-black/30 bg-black/[0.02] px-2 py-1 rounded-md">
                                        {format(session.date, 'MMM do')} • {format(session.date, 'HH:mm')}
                                    </span>
                                    {session.transcript && <div className="w-2 h-2 rounded-full bg-green-500" title="Transcribed" />}
                                </div>
                                <h4 className="font-bold text-[#1d1d1f] mb-1 group-hover:text-blue-700 transition-colors">{session.title}</h4>
                                <p className="text-xs text-black/40 line-clamp-2 leading-relaxed">{session.summary || "No summary available."}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Stats Card */}
                    <div className="p-6 bg-[#fbfbfd] rounded-2xl border border-black/[0.04]">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 mb-4">Subject Metrics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="block text-2xl font-black text-[#1d1d1f]">{totalHours.toFixed(1)}h</span>
                                <span className="text-[9px] font-bold uppercase text-black/30">Total Audio</span>
                            </div>
                            <div>
                                <span className="block text-2xl font-black text-[#1d1d1f]">{topicCount}</span>
                                <span className="text-[9px] font-bold uppercase text-black/30">Key Concepts</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Column: Intelligence & Pending Notes (Span 8) */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Cross-Session Intelligence */}
                    <div className="bg-black text-white p-8 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/20 to-transparent pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                                    <Search className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/60">Subject Intelligence</h3>
                            </div>
                            <h2 className="text-2xl font-bold mb-6 max-w-lg">Ask questions across all {sessions.length} sessions of {subject.name}.</h2>

                            <div className="bg-white/10 backdrop-blur-xl p-1 rounded-2xl border border-white/10 flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder={`How has the concept of 'Strategy' evolved since Session 1?`}
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-white px-4 py-3 placeholder:text-white/30"
                                />
                                <button className="p-3 bg-white text-black rounded-xl hover:scale-105 active:scale-95 transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pending Ingestion Pipeline */}
                    <div className="p-8 bg-white border border-black/[0.04] rounded-3xl min-h-[300px]">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-black/30 mb-1">Knowledge Pipeline</h3>
                                <h2 className="text-xl font-bold">Pending Ingestion</h2>
                            </div>
                            <span className="text-xs font-bold bg-black/[0.03] px-3 py-1 rounded-full text-black/40">{pendingNotes.length} items</span>
                        </div>

                        {pendingNotes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center opacity-30 py-10">
                                <div className="w-16 h-16 bg-black/[0.05] rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-black" />
                                </div>
                                <h4 className="font-bold text-sm">All Caught Up</h4>
                                <p className="text-xs max-w-[200px] mt-2">Notes taken during live sessions will appear here for verification.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingNotes.map(note => (
                                    <div key={note.id} className="p-4 border border-black/5 rounded-2xl bg-white hover:border-black/10 transition-all flex justify-between items-start gap-4 group">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${note.type === 'todo' ? 'bg-red-50 text-red-500' :
                                                        note.type === 'question' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                                                    }`}>
                                                    {note.type}
                                                </span>
                                                <span className="text-[9px] font-bold text-black/20">
                                                    {format(note.timestamp, 'HH:mm')}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-black/70">{note.content}</p>
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 p-2 bg-black text-white rounded-lg transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                            Ingest
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* File Vault Preview */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-[#f5f5f7] rounded-3xl border border-black/[0.02] hover:bg-[#e8e8ed] transition-colors cursor-pointer group">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                <BookOpen className="w-6 h-6 text-black/60" />
                            </div>
                            <h3 className="font-bold text-lg mb-1">Lecture Slides</h3>
                            <p className="text-xs text-black/40 font-medium">View across all sessions</p>
                        </div>
                        <div
                            onClick={() => setView('graph')}
                            className="p-6 bg-[#f5f5f7] rounded-3xl border border-black/[0.02] hover:bg-[#e8e8ed] transition-colors cursor-pointer group"
                        >
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                <Layout className="w-6 h-6 text-black/60" />
                            </div>
                            <h3 className="font-bold text-lg mb-1">Knowledge Graph</h3>
                            <p className="text-xs text-black/40 font-medium">Explore concept connections</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SubjectHome;
