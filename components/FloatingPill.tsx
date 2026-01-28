
import React, { useState, useEffect, useRef } from 'react';

interface FloatingPillProps {
  isActive: boolean;
  lastText?: string;
  onAskAI: (query: string) => Promise<string | undefined>;
}

const FloatingPill: React.FC<FloatingPillProps> = ({ isActive, lastText, onAskAI }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isThinking) return;

    const userText = query;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setQuery('');
    setIsThinking(true);

    try {
      const response = await onAskAI(userText);
      if (response) {
        setMessages(prev => [...prev, { role: 'ai', text: response }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm sorry, I couldn't process that. Please try again." }]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isActive && !isExpanded) return null;

  return (
    <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 ease-in-out ${isExpanded ? 'w-[400px] h-[500px]' : 'w-[280px] h-[64px]'}`}>
      <div className={`w-full h-full glass rounded-[32px] overflow-hidden flex flex-col shadow-2xl shadow-black/10 border border-black/10 transition-all ${isExpanded ? 'rounded-[24px]' : ''}`}>
        
        {/* Header / Pill Content */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center px-6 transition-all cursor-pointer hover:bg-black/5 ${isExpanded ? 'h-16 border-b border-black/5' : 'h-full'}`}
        >
          {isExpanded ? (
            <div className="flex justify-between items-center w-full">
              <span className="text-xs font-bold uppercase tracking-widest">Q&A Console</span>
              <svg className="w-4 h-4 text-black/40 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
            </div>
          ) : (
            <div className="flex items-center gap-4 w-full">
              <div className="w-2 h-2 rounded-full bg-red-500 pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">Live Transcript</p>
                <p className="text-xs font-medium truncate italic text-black/80">"{lastText || 'Listening for audio...'}"</p>
              </div>
              <svg className="w-4 h-4 text-black/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/></svg>
            </div>
          )}
        </div>

        {/* Expanded Console Body */}
        {isExpanded && (
          <div className="flex-1 flex flex-col min-h-0 bg-white/50">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-center px-8">
                  <p className="text-xs text-black/30 font-medium">Ask questions about the lecture, uploaded slides, or related syllabus concepts.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-black text-white' : 'bg-black/5 text-black'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-2xl bg-black/5 flex gap-1 items-center">
                    <span className="w-1 h-1 bg-black/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-black/40 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                    <span className="w-1 h-1 bg-black/40 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-black/5">
              <div className="relative">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a doubt..."
                  className="w-full pl-4 pr-12 py-3 bg-black/5 border-none rounded-xl text-xs focus:ring-1 focus:ring-black transition-all outline-none"
                />
                <button 
                  type="submit"
                  disabled={!query.trim() || isThinking}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center disabled:opacity-20 transition-all hover:scale-105 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingPill;
