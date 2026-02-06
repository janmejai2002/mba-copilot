import React, { useState } from 'react';
import { storage } from '../services/db';
import { Session } from '../types';
import NeuralNexus from '../components/NeuralNexus';
import NexusAIController from '../components/NexusAIController';
import { ArrowLeft, Share2, Download, Layers, ShieldCheck } from 'lucide-react';

interface NexusViewProps {
    session: Session;
    onBack: () => void;
}

const NexusView: React.FC<NexusViewProps> = ({ session, onBack }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCommand = async (command: string) => {
        setIsProcessing(true);
        // Mock processing time for AI Command
        setTimeout(() => {
            console.log("Nexus AI executing:", command);
            setIsProcessing(false);
        }, 1500);
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
                <NeuralNexus sessionId={session.id} />
            </div>

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
