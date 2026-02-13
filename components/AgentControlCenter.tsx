
import React, { useState } from 'react';
import {
    Sparkles, GraduationCap, Search, Map,
    PenTool, Palette, Headphones, ShieldCheck,
    Cpu, Zap, MessageSquare, Brain
} from 'lucide-react';
import { masterIntelligence } from '../services/intelligence';

interface Agent {
    id: string;
    name: string;
    role: string;
    icon: any;
    color: string;
    prompt: string;
    description: string;
}

const AGENTS: Agent[] = [
    {
        id: 'professor',
        name: 'Professor Agent',
        role: 'Academic Expert',
        icon: GraduationCap,
        color: 'from-blue-500 to-indigo-600',
        prompt: 'Analyze current progress and provide a deep academic dive into the most complex topics discussed so far.',
        description: 'Deep dives and exam-critical theory'
    },
    {
        id: 'researcher',
        name: 'Research Agent',
        role: 'Knowledge Scout',
        icon: Search,
        color: 'from-emerald-500 to-teal-600',
        prompt: 'Research the practical applications of these concepts in the current industry landscape.',
        description: 'Industry insights and web research'
    },
    {
        id: 'artist',
        name: 'Artist Agent',
        role: 'Visualizer',
        icon: Palette,
        color: 'from-pink-500 to-rose-600',
        prompt: 'Generate a visual diagram or schematic representation of the concepts discussed in this session.',
        description: 'Diagrams and visual aids'
    },
    {
        id: 'composer',
        name: 'Composer Agent',
        role: 'Audio Producer',
        icon: Headphones,
        color: 'from-amber-500 to-orange-600',
        prompt: 'Compose a concise audio summary (podcast style) of the key takeaways from this lecture.',
        description: 'Audio summaries and podcasts'
    },
    {
        id: 'curriculum',
        name: 'Curriculum Master',
        role: 'Learning Path Architect',
        icon: ShieldCheck,
        color: 'from-violet-500 to-purple-600',
        prompt: 'Optimize my learning path. What should I focus on next based on my current mastery?',
        description: 'Personalized study plans'
    },
    {
        id: 'navigator',
        name: 'Navigator Agent',
        role: 'Graph Specialist',
        icon: Map,
        color: 'from-cyan-500 to-blue-600',
        prompt: 'Explain the connections between the concepts in our knowledge graph. How does it all fit together?',
        description: 'Knowledge graph navigation'
    }
];

interface AgentControlCenterProps {
    sessionId: string;
    onExecuteCommand: (query: string) => void;
}

const AgentControlCenter: React.FC<AgentControlCenterProps> = ({ sessionId, onExecuteCommand }) => {
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

    return (
        <div className="vidyos-card p-6 bg-white/50 backdrop-blur-xl border-white/20">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 flex items-center gap-2">
                        <Cpu className="w-3 h-3" />
                        Master Agent Controller
                    </h3>
                </div>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/20" />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AGENTS.map((agent) => (
                    <button
                        key={agent.id}
                        onClick={() => {
                            setSelectedAgent(agent);
                            onExecuteCommand(agent.prompt);
                        }}
                        className="group relative flex flex-col items-center p-4 rounded-2xl bg-white/40 border border-black/[0.03] hover:border-black/10 hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-[0.03] transition-opacity`} />
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                            <agent.icon className="w-5 h-5" />
                        </div>
                        <span className="mt-3 text-[9px] font-black uppercase tracking-wider text-black/60 group-hover:text-black transition-colors">{agent.name.split(' ')[0]}</span>
                        <span className="text-[7px] font-bold text-black/20 uppercase tracking-widest mt-0.5">{agent.role.split(' ')[0]}</span>
                    </button>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-black/5">
                <div className="flex items-center gap-4 text-black/40">
                    <Brain className="w-4 h-4 opacity-30" />
                    <p className="text-[9px] font-bold italic">
                        Select an agent to summon specialized intelligence on the current neural context.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AgentControlCenter;
