import React, { useState } from 'react';
import { storage } from '../services/db';
import { Session } from '../types';
import NeuralNexus from '../components/NeuralNexus';
import NexusAIController from '../components/NexusAIController';
import { ArrowLeft, Share2, Download, Layers, ShieldCheck, Sparkles, Layout } from 'lucide-react';
import { masterIntelligence } from '../services/intelligence';

interface NexusViewProps {
    session: Session;
    onBack: () => void;
}

const NexusView: React.FC<NexusViewProps> = ({ session, onBack }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [aiResponse, setAiResponse] = useState<{ text: string; agent?: string } | null>(null);

    const handleCommand = async (command: string) => {
        setIsProcessing(true);
        setAiResponse(null);
        try {
            const res = await masterIntelligence.askMasterMind(command, session.id);
            setAiResponse({ text: res.response, agent: res.agent });
            console.log("Nexus AI Response:", res);
        } catch (e) {
            console.error("Nexus AI failed:", e);
            setAiResponse({ text: "I encountered a synchronization error in the neural core.", agent: "MasterMind" });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-screen w-screen bg-black overflow-hidden relative">
            {/* Top Bar Navigation */}
            <div className="absolute top-0 inset-x-0 p-8 flex justify-between items-center z-50 pointer-events-none">
                <div className="flex items-center gap-8 pointer-events-auto">
                    <button onClick={onBack} className="w-12 h-12 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h4 className="text-white font-black text-xl tracking-tight">{session.title}</h4>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-[var(--vidyos-teal)]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">Quantum Secured Neural Nexus • 2026 Proto-Layer</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 pointer-events-auto">
                    <button className="flex items-center gap-3 px-6 py-2.5 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 transition-all">
                        <Share2 className="w-4 h-4" />
                        Relay Map
                    </button>
                    <button className="flex items-center gap-3 px-6 py-2.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        <Download className="w-4 h-4" />
                        Export DNA
                    </button>
                </div>
            </div>

            {/* Side Indicators */}
            <div className="absolute left-8 bottom-12 z-50 flex flex-col gap-6 pointer-events-none opacity-40">
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase text-white tracking-widest">Physics Engine</span>
                    <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-3/4 h-full bg-[var(--vidyos-teal)]" />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase text-white tracking-widest">Neural Density</span>
                    <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-1/2 h-full bg-purple-500" />
                    </div>
                </div>
            </div>

            {/* Main 3D Canvas */}
            <div className="w-full h-full">
                <NeuralNexus
                    sessionId={session.id}
                    onAgentResponse={(res) => setAiResponse({ text: res.response, agent: res.agent })}
                />
            </div>

            {/* AI Response Overlay */}
            {aiResponse && (
                <div className="absolute top-32 right-8 w-80 bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-3xl animate-apple-in z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-4 h-4 text-[var(--vidyos-teal)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                {aiResponse.agent || 'Commander'} Analysis
                            </span>
                        </div>
                        {aiResponse.agent && (
                            <div className="px-2 py-0.5 bg-white/10 rounded text-[7px] font-black uppercase tracking-tighter text-white/40 border border-white/5">
                                {aiResponse.agent}
                            </div>
                        )}
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-medium">{aiResponse.text}</p>
                    <button
                        onClick={() => setAiResponse(null)}
                        className="mt-6 text-[9px] font-black uppercase tracking-widest text-[var(--vidyos-teal)] hover:text-white transition-colors"
                    >
                        Dismiss Analysis
                    </button>
                </div>
            )}

            {/* AI Commander */}
            <NexusAIController onCommand={handleCommand} isProcessing={isProcessing} />

            {/* Bottom Tech Decals */}
            <div className="absolute bottom-12 right-12 z-50 pointer-events-none opacity-20 hidden md:block text-right">
                <p className="text-[9px] font-mono text-white leading-relaxed uppercase">
                    Core: V0.9-Stable<br />
                    Sim: ForceDirect-3D<br />
                    Cluster: AdaptiveSpectral<br />
                    ID: {session.id.substring(0, 8)}
                </p>
            </div>
        </div>
    );
};

export default NexusView;
