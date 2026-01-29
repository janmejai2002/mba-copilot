
import React, { useState, useMemo } from 'react';
import { Subject, Session } from '../types';
import { Share2, Maximize2, Zap, BookOpen, Clock, Activity } from 'lucide-react';

interface SubjectGraphProps {
    subject: Subject;
    sessions: Session[];
}

const SubjectGraph: React.FC<SubjectGraphProps> = ({ subject, sessions }) => {
    const [hoveredSession, setHoveredSession] = useState<string | null>(null);

    // Calculate positions in a timeline-based flow
    const nodes = useMemo(() => {
        return sessions.sort((a, b) => a.date - b.date).map((s, i) => {
            const angle = (i / sessions.length) * Math.PI * 2;
            const radius = 35;
            return {
                id: s.id,
                title: s.title,
                x: 50 + radius * Math.cos(angle - Math.PI / 2),
                y: 50 + radius * Math.sin(angle - Math.PI / 2),
                conceptCount: s.concepts?.length || 0,
                date: s.date
            };
        });
    }, [sessions]);

    return (
        <div className="apple-card p-8 min-h-[500px] flex flex-col relative overflow-hidden bg-white">
            <div className="flex justify-between items-center mb-10 relative z-10">
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 flex items-center gap-2 mb-1">
                        <Activity className="w-3 h-3" />
                        Cross-Session Subject Graph
                    </h3>
                    <p className="text-[9px] text-black/20 font-medium italic">Visualizing knowledge progression in {subject.name}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-black/40 uppercase tracking-widest">{sessions.length} Sessions Linked</span>
                </div>
            </div>

            <div className="flex-1 relative border border-black/[0.03] rounded-3xl bg-[#fbfbfd] overflow-hidden">
                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="25" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L6,3 z" fill="#000" fillOpacity="0.05" />
                        </marker>
                    </defs>
                    {nodes.map((node, i) => {
                        if (i === 0) return null;
                        const prev = nodes[i - 1];
                        return (
                            <line
                                key={`edge-${i}`}
                                x1={`${prev.x}%`}
                                y1={`${prev.y}%`}
                                x2={`${node.x}%`}
                                y2={`${node.y}%`}
                                stroke="#000"
                                strokeWidth="2"
                                strokeOpacity="0.04"
                                strokeDasharray="5,5"
                                markerEnd="url(#arrow)"
                            />
                        );
                    })}
                </svg>

                {/* Nodes */}
                {nodes.map((node, i) => {
                    const isHovered = hoveredSession === node.id;
                    return (
                        <div
                            key={node.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group cursor-pointer"
                            style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: isHovered ? 50 : 10 }}
                            onMouseEnter={() => setHoveredSession(node.id)}
                            onMouseLeave={() => setHoveredSession(null)}
                        >
                            <div className={`relative flex flex-col items-center`}>
                                <div className={`w-12 h-12 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${isHovered ? 'bg-black border-black scale-125 shadow-2xl' : 'bg-white border-black/5 shadow-sm'
                                    }`}>
                                    <BookOpen className={`w-5 h-5 ${isHovered ? 'text-white' : 'text-black/20'}`} />
                                </div>

                                {/* Badge */}
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white border-2 border-white">
                                    {node.conceptCount}
                                </div>

                                {/* Label */}
                                <div className={`mt-3 px-3 py-1.5 rounded-xl transition-all duration-300 whitespace-nowrap text-center ${isHovered ? 'bg-black text-white translate-y-1' : 'bg-transparent text-black/40'
                                    }`}>
                                    <p className="text-[10px] font-black tracking-tight leading-none mb-1">{node.title}</p>
                                    <p className="text-[8px] font-bold uppercase tracking-tighter opacity-50">
                                        {new Date(node.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Subject Core Center */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-white border border-black/[0.02] shadow-xl flex items-center justify-center p-4 text-center">
                        <span className="text-[11px] font-black tracking-tighter text-black/60 leading-tight uppercase">
                            {subject.name.split(' ').map(w => w[0]).join('')}
                        </span>
                    </div>
                    <div className="w-40 h-px bg-gradient-to-r from-transparent via-black/[0.05] to-transparent mt-4" />
                    <p className="text-[8px] font-bold tracking-[0.3em] uppercase text-black/20 mt-2">Knowledge Core</p>
                </div>
            </div>

            {/* Bottom details display */}
            <div className="mt-8 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                {sessions.map((s, i) => (
                    <div key={s.id} className={`flex-shrink-0 p-4 rounded-2xl border transition-all ${hoveredSession === s.id ? 'bg-black border-black text-white scale-105 shadow-lg' : 'bg-black/[0.02] border-transparent text-black/40'
                        }`}>
                        <span className="text-[8px] font-bold uppercase block mb-1">Session {i + 1}</span>
                        <p className="text-[11px] font-bold truncate w-32">{s.title}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubjectGraph;
