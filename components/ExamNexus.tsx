
import React, { useState } from 'react';
import { Subject, Session } from '../types';
import { Zap, Search, ChevronRight, FileText, Target, Sparkles } from 'lucide-react';

interface ExamNexusProps {
    subjects: Subject[];
    sessions: Session[];
    onOpenSession: (id: string) => void;
}

const ExamNexus: React.FC<ExamNexusProps> = ({ subjects, sessions, onOpenSession }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string>('all');

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

    return (
        <div className="max-w-[1550px] mx-auto pb-24 animate-apple-in px-8">
            <header className="mb-16 pt-10">
                <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-[var(--glass-border)] pb-10 relative">
                    <div className="absolute -bottom-px left-0 w-64 h-[3px] bg-[var(--vidyos-gold)] shadow-[0_0_15px_var(--vidyos-gold-glow)]" />
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                            <Zap className="w-5 h-5 text-[var(--vidyos-gold)] fill-current animate-pulse" />
                            <span className="label-caps mb-0 text-[var(--vidyos-gold)]">The Probability Nexus</span>
                        </div>
                        <h1 className="section-title mb-4">Exam Intelligence</h1>
                        <p className="text-xl text-[var(--text-muted)] font-bold max-w-3xl leading-relaxed opacity-70 italic">
                            Consolidated predicted questions and core conceptual synthesis across your MBA journey.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Stats Sidebar */}
                <aside className="lg:col-span-3 space-y-8">
                    <div className="vidyos-card p-8 bg-[var(--vidyos-gold-light)]/30 border-[var(--vidyos-gold-glow)]">
                        <span className="label-caps mb-6 text-[var(--vidyos-gold)]">Global Metrics</span>
                        <div className="space-y-6">
                            <div>
                                <span className="block text-5xl font-black text-[var(--text-main)] tracking-tighter">{totalQuestions}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Predicted Questions</span>
                            </div>
                            <div>
                                <span className="block text-5xl font-black text-[var(--text-main)] tracking-tighter">{sessionsWithQuestions.length}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Synthesized Units</span>
                            </div>
                        </div>
                    </div>

                    <div className="vidyos-card p-6">
                        <span className="label-caps mb-6">Filter by Hub</span>
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
                </aside>

                {/* Main Content */}
                <div className="lg:col-span-9 space-y-10">
                    <div className="vidyos-card p-2 bg-white/50 border-[var(--glass-border)] flex items-center gap-4">
                        <Search className="w-5 h-5 ml-6 text-[var(--text-muted)] opacity-30" />
                        <input
                            type="text"
                            placeholder="Search within synthesized intelligence..."
                            className="flex-1 bg-transparent border-none outline-none py-6 font-bold text-md text-[var(--text-main)] placeholder:opacity-20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="space-y-8">
                        {filteredSessions.map(session => {
                            const subject = subjects.find(s => s.id === session.subjectId);
                            return (
                                <div key={session.id} className="vidyos-card p-10 group relative transition-all hover:bg-white overflow-hidden">
                                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[var(--vidyos-gold-light)]/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex justify-between items-start mb-8 border-b border-[var(--glass-border)] pb-6">
                                        <div>
                                            <span className="label-caps text-[var(--vidyos-gold)] mb-1">{subject?.name}</span>
                                            <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight">{session.title}</h3>
                                        </div>
                                        <button
                                            onClick={() => onOpenSession(session.id)}
                                            className="w-12 h-12 rounded-full border border-[var(--glass-border)] flex items-center justify-center hover:bg-[var(--vidyos-gold)] hover:text-white transition-all shadow-premium"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div>
                                            <div className="flex items-center gap-3 mb-6">
                                                <Target className="w-4 h-4 text-[var(--vidyos-gold)]" />
                                                <span className="label-caps mb-0 text-[var(--text-muted)]">Predicted Questions</span>
                                            </div>
                                            <ul className="space-y-4">
                                                {session.examQuestions?.map((q, i) => (
                                                    <li key={i} className="flex gap-4 group/li">
                                                        <span className="text-[11px] font-black text-[var(--vidyos-gold)] opacity-40 group-hover/li:opacity-100">{i + 1}.</span>
                                                        <p className="text-sm font-bold text-[var(--text-main)] leading-relaxed">{q}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-black/[0.02] p-8 rounded-3xl border border-black/5">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Sparkles className="w-4 h-4 text-[var(--vidyos-teal)]" />
                                                <span className="label-caps mb-0 text-[var(--text-muted)]">Core Synthesis</span>
                                            </div>
                                            <p className="text-[13px] font-bold text-[var(--text-main)] opacity-70 leading-relaxed italic">
                                                {session.summary}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredSessions.length === 0 && (
                            <div className="py-24 text-center vidyos-card bg-transparent border-dashed border-2 flex flex-col items-center justify-center border-[var(--glass-border)] opacity-30 grayscale">
                                <Target className="w-12 h-12 mb-6" />
                                <h3 className="text-xl font-black uppercase tracking-widest italic">Nexus Synchronization Required</h3>
                                <p className="text-sm font-bold mt-2">No synthesized questions found for the current filter.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamNexus;
