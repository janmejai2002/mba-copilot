

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import remarkGfm from 'remark-gfm';
// @ts-ignore
import remarkMath from 'remark-math';
// @ts-ignore
import rehypeKatex from 'rehype-katex';
import {
    Sparkles, Send, ChevronDown, Maximize2, Brain,
    GraduationCap, Search, Map, PenTool, Palette, Headphones, ShieldCheck,
    RefreshCw, Lightbulb, HelpCircle, Zap, MessageSquare
} from 'lucide-react';

const AGENT_ICONS: Record<string, any> = {
    'ScribeAgent': PenTool,
    'NavigatorAgent': Map,
    'ResearchAgent': Search,
    'ProfessorAgent': GraduationCap,
    'ArtistAgent': Palette,
    'ComposerAgent': Headphones,
    'CurriculumMaster': ShieldCheck,
    'MasterMind': Brain
};

const AGENT_GUIDE: Record<string, string> = {
    'ProfessorAgent': 'Deep academic explanations, exam-critical theory, and conceptual breakdowns.',
    'ResearchAgent': 'Real-time web research, industry trends, and case study analysis.',
    'ScribeAgent': 'Extracts knowledge graph concepts and builds your neural map.',
    'NavigatorAgent': 'Explains concept connections and prerequisite relationships.',
    'ArtistAgent': 'Generates visual diagrams, flowcharts, and schematics.',
    'ComposerAgent': 'Creates audio summaries and podcast-style recaps.',
    'CurriculumMaster': 'Optimizes your learning path and identifies knowledge gaps.',
};

// Basic preprocessor to ensure common patterns are recognized by remark-math
function preprocessMarkdown(text: string) {
    if (!text) return '';
    return text
        .replace(/\\\(/g, '$')
        .replace(/\\\)/g, '$')
        .replace(/\\\[/g, '$$')
        .replace(/\\\]/g, '$$')
        .replace(/\n\s*-\s/g, '\n- ')
        .replace(/\n\s*\d+\.\s/g, (match) => '\n' + match.trim() + ' ');
}

interface QAMessage {
    role: 'user' | 'ai';
    text: string;
    agent?: string;
}

interface QAConsoleProps {
    onAskAI: (query: string) => Promise<{ text: string; agent?: string } | string | undefined>;
    suggestedQuestions?: string[];
    liveQuestions?: string[];
    onExecuteSuggested?: (question: string) => void;
    onExpand?: () => void;
    messages?: QAMessage[];
    onMessagesChange?: React.Dispatch<React.SetStateAction<QAMessage[]>>;
}

const QAConsole: React.FC<QAConsoleProps> = ({
    onAskAI,
    suggestedQuestions = [],
    liveQuestions = [],
    onExecuteSuggested,
    onExpand,
    messages: externalMessages,
    onMessagesChange
}) => {
    const [query, setQuery] = useState('');
    const [internalMessages, setInternalMessages] = useState<QAMessage[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);
    const [showAgentGuide, setShowAgentGuide] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'questions'>('chat');

    const messages = externalMessages !== undefined ? externalMessages : internalMessages;
    const setMessages = onMessagesChange || setInternalMessages;
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            const container = messagesEndRef.current.parentElement;
            if (container) {
                const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                if (isNearBottom) {
                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    }, [messages]);

    const handleSend = async (questionText?: string) => {
        const text = questionText || query;
        if (!text.trim()) return;
        setQuery('');
        setActiveTab('chat');

        const newMessages: QAMessage[] = [...messages, { role: 'user', text: text.trim() }];
        setMessages(newMessages);
        setIsThinking(true);

        try {
            const response = await onAskAI(text.trim());
            if (response) {
                const responseText = typeof response === 'string' ? response : response.text;
                const agent = typeof response === 'string' ? undefined : response.agent;
                setMessages(prev => [...prev, {
                    role: 'ai',
                    text: responseText || "I've processed your request.",
                    agent
                }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Error processing your request.' }]);
        } finally {
            setIsThinking(false);
        }
    };

    const allQuestions = [...new Set([...liveQuestions, ...suggestedQuestions])];

    return (
        <div className="flex flex-col apple-card overflow-hidden group resize-y" style={{ minHeight: '300px', maxHeight: '700px', height: '500px' }}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-black/[0.04] bg-[#fbfbfd] flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex bg-black/[0.04] rounded-lg p-0.5">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-white shadow-sm text-black' : 'text-black/30 hover:text-black/50'
                                }`}
                        >
                            <MessageSquare className="w-3 h-3 inline mr-1" /> Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'questions' ? 'bg-white shadow-sm text-black' : 'text-black/30 hover:text-black/50'
                                }`}
                        >
                            <Lightbulb className="w-3 h-3 inline mr-1" /> Questions
                            {allQuestions.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--vidyos-teal)] text-white text-[7px] font-black rounded-full flex items-center justify-center">
                                    {allQuestions.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAgentGuide(!showAgentGuide)}
                        className="p-1.5 hover:bg-black/5 rounded-lg transition-all"
                        title="Agent Guide"
                    >
                        <HelpCircle className={`w-3.5 h-3.5 transition-colors ${showAgentGuide ? 'text-[var(--vidyos-teal)]' : 'text-black/25'}`} />
                    </button>
                    {onExpand && (
                        <button onClick={onExpand} className="p-1.5 hover:bg-black/5 rounded-lg transition-all" title="Expand console">
                            <Maximize2 className="w-3 h-3 text-black/30" />
                        </button>
                    )}
                    <div className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Live</span>
                    </div>
                </div>
            </div>

            {/* Agent Guide Drawer */}
            {showAgentGuide && (
                <div className="px-4 py-3 border-b border-black/[0.04] bg-gradient-to-b from-[#f8f8fa] to-white/50 flex-shrink-0">
                    <p className="text-[8px] font-black uppercase tracking-widest text-black/25 mb-2">
                        Agent Capabilities
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {Object.entries(AGENT_GUIDE).map(([name, desc]) => {
                            const Icon = AGENT_ICONS[name] || Sparkles;
                            return (
                                <div key={name} className="flex items-start gap-1.5 p-1.5 rounded-lg hover:bg-black/[0.03] transition-colors">
                                    <Icon className="w-3 h-3 text-black/30 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-[8px] font-black text-black/50">{name.replace('Agent', '')}</span>
                                        <p className="text-[7px] text-black/30 leading-tight">{desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Content */}
            {activeTab === 'chat' ? (
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 custom-scrollbar bg-white">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-20 py-10">
                            <Brain className="w-6 h-6 mb-2 opacity-40" />
                            <p className="text-[11px] font-bold text-black/80 uppercase tracking-widest">AI Tutor Ready</p>
                            <p className="text-[9px] text-black/40 mt-1">Ask any question about the lecture</p>
                        </div>
                    )}

                    {messages.map((msg, i) => {
                        const AgentIcon = msg.agent ? (AGENT_ICONS[msg.agent] || Sparkles) : Sparkles;
                        return (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'ai' && (
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={`w-7 h-7 rounded-full ${msg.agent ? 'bg-black text-white' : 'bg-gradient-to-br from-purple-500 to-purple-600'} flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20`}>
                                            <AgentIcon className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-[7px] font-black uppercase tracking-tighter opacity-30">{msg.agent?.replace('Agent', '') || 'AI'}</span>
                                    </div>
                                )}
                                <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-black text-white' : 'bg-[#f5f5f7] text-black'} px-4 py-3 rounded-2xl text-[11px] leading-relaxed font-medium shadow-sm transition-all hover:shadow-md relative overflow-hidden group`}>
                                    {msg.agent && (
                                        <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-black uppercase text-black/20 tracking-widest">{msg.agent}</span>
                                        </div>
                                    )}
                                    {msg.role === 'ai' ? (
                                        <div className="markdown-content">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                            >
                                                {preprocessMarkdown(msg.text)}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {isThinking && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="bg-[#f5f5f7] px-4 py-3 rounded-2xl flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-black/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-black/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-black/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            ) : (
                /* Questions Tab */
                <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar bg-white">
                    {allQuestions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-30 py-10">
                            <Lightbulb className="w-5 h-5 mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-wider">No questions yet</p>
                            <p className="text-[8px] mt-1">Questions will appear as the lecture progresses</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {liveQuestions.length > 0 && (
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-[var(--vidyos-teal)] mb-2 flex items-center gap-1.5">
                                        <Zap className="w-3 h-3" /> Live from Transcript
                                    </p>
                                    {liveQuestions.map((q, i) => (
                                        <button
                                            key={`live-${i}`}
                                            onClick={() => handleSend(q)}
                                            className="w-full text-left px-3 py-2.5 mb-1.5 bg-[var(--vidyos-teal)]/5 border border-[var(--vidyos-teal)]/10 rounded-xl hover:bg-[var(--vidyos-teal)]/10 transition-all text-[10px] font-medium text-black/70 flex items-start gap-2 group"
                                        >
                                            <Lightbulb className="w-3 h-3 text-[var(--vidyos-teal)] opacity-50 flex-shrink-0 mt-0.5" />
                                            <span className="flex-1">{q}</span>
                                            <Send className="w-3 h-3 opacity-0 group-hover:opacity-40 flex-shrink-0 mt-0.5 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            {suggestedQuestions.length > 0 && (
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-black/25 mb-2 flex items-center gap-1.5">
                                        <HelpCircle className="w-3 h-3" /> Session Suggestions
                                    </p>
                                    {suggestedQuestions.map((q, i) => (
                                        <button
                                            key={`sug-${i}`}
                                            onClick={() => handleSend(q)}
                                            className="w-full text-left px-3 py-2 mb-1.5 bg-black/[0.02] border border-black/5 rounded-xl hover:bg-black/[0.05] transition-all text-[10px] font-medium text-black/50 flex items-start gap-2 group"
                                        >
                                            <span className="flex-1">{q}</span>
                                            <Send className="w-3 h-3 opacity-0 group-hover:opacity-30 flex-shrink-0 mt-0.5 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Input */}
            <form
                onSubmit={(e) => { e.preventDefault(); handleSend(query); }}
                className="px-4 py-3 bg-white border-t border-black/[0.04] flex-shrink-0"
            >
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask a doubt..."
                        className="flex-1 pl-4 pr-10 py-2.5 bg-[#f5f5f7] border-none rounded-xl text-[11px] font-medium focus:ring-1 focus:ring-black transition-all outline-none text-black"
                    />
                    <button
                        type="submit"
                        disabled={!query.trim() || isThinking}
                        className="absolute right-1.5 p-2 bg-black text-white rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Send className="w-3 h-3" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QAConsole;
