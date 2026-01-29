import React, { useState } from 'react';
import { Send, Sparkles, MessageSquare, Zap, Target } from 'lucide-react';

interface NexusAIControllerProps {
    onCommand: (command: string) => void;
    isProcessing?: boolean;
}

const NexusAIController: React.FC<NexusAIControllerProps> = ({ onCommand, isProcessing }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onCommand(input.trim());
            setInput('');
        }
    };

    return (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-6">
            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-4 flex items-center gap-4 shadow-[0_0_50px_rgba(20,184,166,0.2)] group transition-all hover:bg-black/60 hover:border-[var(--vidyos-teal)]/30">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isProcessing ? 'bg-[var(--vidyos-teal)] animate-pulse shadow-[0_0_30px_#14b8a6]' : 'bg-white/5 group-hover:bg-[var(--vidyos-teal)] group-hover:shadow-[0_0_20px_#14b8a6]'}`}>
                    <Sparkles className={`w-6 h-6 ${isProcessing ? 'text-white' : 'text-white/40 group-hover:text-white'}`} />
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Commander, sculpt this graph... or ask a doubt"
                        className="flex-1 bg-transparent border-none text-white font-bold text-sm outline-none placeholder:text-white/20"
                    />

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" className="p-2 hover:bg-white/10 rounded-xl transition-all" title="Identify Clusters">
                            <Target className="w-4 h-4 text-white/40 hover:text-[var(--vidyos-teal)]" />
                        </button>
                        <button type="button" className="p-2 hover:bg-white/10 rounded-xl transition-all" title="Neural Burst">
                            <Zap className="w-4 h-4 text-white/40 hover:text-[var(--vidyos-teal)]" />
                        </button>
                    </div>

                    <button
                        disabled={isProcessing || !input.trim()}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${input.trim() ? 'bg-white text-black scale-110 shadow-lg' : 'bg-white/5 text-white/20'}`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>

            {/* Ambient Instruction */}
            <div className="mt-4 flex justify-center gap-8 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                <span className="flex items-center gap-2 hover:text-[var(--vidyos-teal)] transition-colors cursor-help"><MessageSquare className="w-3 h-3" /> Ask Doubt</span>
                <span className="flex items-center gap-2 hover:text-[var(--vidyos-teal)] transition-colors cursor-help"><Zap className="w-3 h-3" /> Group Metadata</span>
                <span className="flex items-center gap-2 hover:text-[var(--vidyos-teal)] transition-colors cursor-help"><Target className="w-3 h-3" /> Highlight Core</span>
            </div>
        </div>
    );
};

export default NexusAIController;
