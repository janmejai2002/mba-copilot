
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicCardProps {
    type: 'text' | 'image' | 'audio' | 'graph' | 'research';
    payload: any;
    agentName: string;
}

const DynamicCard: React.FC<DynamicCardProps> = ({ type, payload, agentName }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden min-w-[300px] max-w-md"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
                    {agentName[0].toUpperCase()}
                </div>
                <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">
                    {agentName}
                </span>
            </div>

            <div className="space-y-4">
                {type === 'text' && (
                    <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                        {payload.text}
                    </p>
                )}

                {type === 'image' && (
                    <div className="rounded-lg overflow-hidden bg-white/5 border border-white/10 aspect-video flex items-center justify-center">
                        {payload.url ? (
                            <img src={payload.url} alt="AI Generated" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white/30 text-xs">Generating Visual...</span>
                        )}
                    </div>
                )}

                {type === 'audio' && (
                    <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/10">
                        <button className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg">
                            <span className="text-white">▶</span>
                        </button>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '40%' }}
                                className="h-full bg-indigo-400"
                            />
                        </div>
                    </div>
                )}

                {type === 'research' && (
                    <div className="space-y-3">
                        <h4 className="text-indigo-300 font-bold text-sm underline decoration-indigo-500/50">Research Synthesis</h4>
                        <p className="text-white/80 text-xs italic">{payload.summary}</p>
                        <div className="flex flex-wrap gap-2 text-[10px]">
                            {payload.sources?.map((s: string, i: number) => (
                                <span key={i} className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-white/40">
                <span>DeepMind Advanced Agentic Coding</span>
                <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live Ready
                </span>
            </div>
        </motion.div>
    );
};

export default DynamicCard;
