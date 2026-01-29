

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import remarkGfm from 'remark-gfm';
// @ts-ignore
import remarkMath from 'remark-math';
// @ts-ignore
import rehypeKatex from 'rehype-katex';
import { Send, Sparkles, Maximize2, ChevronDown } from 'lucide-react';
import 'katex/dist/katex.min.css';

// Basic preprocessor to ensure common patterns are recognized by remark-math
const preprocessMarkdown = (text: string) => {
    return text
        // Escape dollar signs followed by digits (currency) to prevent aggressive math pairing
        .replace(/\$(\d)/g, '\\$$$1')
        // Convert (( formula )) to $$ formula $$
        .replace(/\(\(\s*([^)]+)\s*\)\)/g, '$$$$$1$$$$')
        // Ensure subscripts are handled correctly in markdown context (avoiding italics collision)
        .replace(/\b([a-zA-Z])_([a-zA-Z0-9])\b/g, '$1_{$2}')
        // Remove citation brackets like [1][2]
        .replace(/\[\d+\]/g, '')
        // Remove [Transcript context] style citations
        .replace(/\[Transcript[^\]]*\]/g, '');
};

interface QAConsoleProps {
    onAskAI: (query: string) => Promise<string | undefined>;
    suggestedQuestions?: string[];
    onExecuteSuggested?: (question: string) => void;
    onExpand?: () => void;
    messages?: { role: 'user' | 'ai'; text: string }[];
    onMessagesChange?: React.Dispatch<React.SetStateAction<{ role: 'user' | 'ai'; text: string }[]>>;
}

const QAConsole: React.FC<QAConsoleProps> = ({
    onAskAI,
    suggestedQuestions = [],
    onExecuteSuggested,
    onExpand,
    messages: externalMessages,
    onMessagesChange
}) => {
    const [query, setQuery] = useState('');
    const [internalMessages, setInternalMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);

    // Use external messages if provided, otherwise use internal state
    const messages = externalMessages !== undefined ? externalMessages : internalMessages;
    const setMessages = onMessagesChange || setInternalMessages;
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Only auto-scroll if user is already near the bottom
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
        const finalQuery = questionText || query;
        if (!finalQuery.trim()) return;

        setMessages(prev => [...prev, { role: 'user', text: finalQuery }]);
        setQuery('');
        setIsThinking(true);

        try {
            const response = await onAskAI(finalQuery);
            if (response) {
                setMessages(prev => [...prev, { role: 'ai', text: response }]);
            }
        } catch (error) {
            console.error('AI Error:', error);
        } finally {
            setIsThinking(false);
        }

        if (questionText && onExecuteSuggested) {
            onExecuteSuggested(questionText);
        }
    };

    return (
        <div className="flex flex-col h-[500px] apple-card overflow-hidden group">
            <div className="px-6 py-4 border-b border-black/[0.04] bg-[#fbfbfd] flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">Doubt Console</h3>
                    {onExpand && (
                        <button
                            onClick={onExpand}
                            className="expand-btn p-1.5 hover:bg-black/5 rounded-lg transition-all"
                            title="Expand console"
                        >
                            <Maximize2 className="w-3 h-3 text-black/30" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Live</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar bg-white">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-20 py-10">
                        <p className="text-[11px] font-bold text-black/80 uppercase tracking-widest">AI Tutor Ready</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'ai' && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                        )}
                        <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-black text-white' : 'bg-[#f5f5f7] text-black'} px-4 py-3 rounded-2xl text-[11px] leading-relaxed font-medium shadow-sm`}>
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
                ))}

                {isThinking && (
                    <div className="flex gap-4 justify-start">
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

            {suggestedQuestions.length > 0 && (
                <div className="border-t border-black/[0.04] bg-[#fbfbfd]">
                    <button
                        onClick={() => setSuggestionsExpanded(!suggestionsExpanded)}
                        className="w-full px-6 py-3 flex items-center justify-between hover:bg-black/[0.02] transition-all"
                    >
                        <p className="text-[8px] font-bold uppercase tracking-widest text-black/30">
                            Suggested ({suggestedQuestions.length})
                        </p>
                        <ChevronDown
                            className={`w-3 h-3 text-black/30 transition-transform ${suggestionsExpanded ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {suggestionsExpanded && (
                        <div className="px-6 pb-4">
                            <div className="flex flex-wrap gap-1.5">
                                {suggestedQuestions.map((sq, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(sq)}
                                        className="text-[9px] font-bold px-3 py-1.5 bg-white border border-black/5 rounded-full hover:bg-black hover:text-white transition-all text-left shadow-sm"
                                    >
                                        {sq}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <form
                onSubmit={(e) => { e.preventDefault(); handleSend(query); }}
                className="px-6 py-4 bg-white border-t border-black/[0.04]"
            >
                <div className="relative flex items-center gap-3">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask a doubt..."
                        className="flex-1 pl-4 pr-10 py-3 bg-[#f5f5f7] border-none rounded-xl text-[12px] font-medium focus:ring-1 focus:ring-black transition-all outline-none text-black"
                    />
                    <button
                        type="submit"
                        disabled={!query.trim() || isThinking}
                        className="absolute right-2 p-2 bg-black text-white rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QAConsole;
