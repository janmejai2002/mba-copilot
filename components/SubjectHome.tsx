
import React from 'react';
import { Subject, Session } from '../types';
import { Play, Calendar, FileText, ChevronRight, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface SubjectHomeProps {
    subject: Subject;
    sessions: Session[];
    onBack: () => void;
    onOpenSession: (id: string) => void;
    onStartNewSession: () => void;
}

const SubjectHome: React.FC<SubjectHomeProps> = ({ subject, sessions, onBack, onOpenSession, onStartNewSession }) => {
    const sortedSessions = [...sessions].sort((a, b) => b.date - a.date);

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-apple-in">
            <header className="mb-12">
                <button onClick={onBack} className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 hover:text-black transition-all mb-6">
                    ← Back to Library
                </button>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-2">{subject.name}</h1>
                        <p className="text-lg text-black/40 font-medium">{subject.description}</p>
                    </div>
                    <button
                        onClick={onStartNewSession}
                        className="hidden md:flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-bold text-sm hover:bg-black/80 active:scale-95 transition-all shadow-xl shadow-black/10"
                    >
                        <Plus className="w-4 h-4" />
                        New Class
                    </button>
                </div>
            </header>

            <div className="space-y-12 relative">
                {/* Timeline Line */}
                <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-black/[0.03]" />

                {sortedSessions.length > 0 ? (
                    sortedSessions.map((session, index) => (
                        <div key={session.id} className="relative pl-16 group">
                            {/* Timeline Dot */}
                            <div className="absolute left-0 top-1 w-12 h-12 bg-white border-2 border-black/[0.03] rounded-2xl flex items-center justify-center z-10 group-hover:border-black/10 transition-colors shadow-sm">
                                <div className={`w-3 h-3 rounded-full ${index === 0 && new Date(session.date).toDateString() === new Date().toDateString() ? 'bg-red-500 animate-pulse' : 'bg-black/10'}`} />
                            </div>

                            {/* Day Badge (Sticky-like feel) */}
                            <div className="mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-black/30 bg-black/[0.02] px-3 py-1 rounded-full">
                                    {format(session.date, 'EEEE, MMMM do')}
                                </span>
                            </div>

                            {/* Session Card */}
                            <div
                                onClick={() => onOpenSession(session.id)}
                                className="apple-card p-6 cursor-pointer group/card hover:bg-black/[0.01] transition-all"
                            >
                                <div className="flex justify-between items-start gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-[#1d1d1f] group-hover/card:text-blue-600 transition-colors">{session.title}</h3>
                                            {session.summary && <span className="bg-green-50 text-green-600 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border border-green-100">Analyzed</span>}
                                        </div>

                                        <div className="flex items-center gap-6 text-black/40 text-sm font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                <span>{format(session.date, 'HH:mm')}</span>
                                            </div>
                                            {session.transcript && (
                                                <div className="flex items-center gap-1.5">
                                                    <FileText className="w-4 h-4" />
                                                    <span>{session.transcript.split(' ').length} words</span>
                                                </div>
                                            )}
                                        </div>

                                        {session.summary && (
                                            <p className="mt-4 text-sm text-black/60 line-clamp-2 leading-relaxed">
                                                {session.summary}
                                            </p>
                                        )}
                                    </div>

                                    <div className="w-12 h-12 rounded-2xl bg-black/[0.03] flex items-center justify-center group-hover/card:bg-black group-hover/card:text-white transition-all">
                                        <Play className="w-5 h-5 ml-0.5" />
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap gap-2">
                                    {(session.concepts || []).slice(0, 3).map((c, i) => (
                                        <span key={i} className="text-[9px] font-bold text-black/40 uppercase tracking-widest bg-black/[0.03] px-2 py-1 rounded">
                                            {c.keyword}
                                        </span>
                                    ))}
                                    {(session.concepts || []).length > 3 && (
                                        <span className="text-[9px] font-bold text-black/20 uppercase tracking-widest px-2 py-1">
                                            +{(session.concepts || []).length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center apple-card bg-transparent border-dashed border-2 border-black/10 flex flex-col items-center">
                        <Calendar className="w-12 h-12 text-black/10 mb-4" />
                        <p className="text-black/30 font-bold uppercase tracking-widest text-sm">No recordings yet</p>
                        <button
                            onClick={onStartNewSession}
                            className="mt-6 px-8 py-3 bg-black text-white rounded-full font-bold text-sm"
                        >
                            Record First Lecture
                        </button>
                    </div>
                )}
            </div>

            {/* Floating Action for Mobile */}
            <button
                onClick={onStartNewSession}
                className="md:hidden fixed bottom-8 right-8 w-16 h-16 bg-black text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-50"
            >
                <Plus className="w-8 h-8" />
            </button>
        </div>
    );
};

export default SubjectHome;
