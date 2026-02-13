
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Zap, Brain, RefreshCw, Search, ArrowRight } from 'lucide-react';
import { TranscriptionTurn } from '../types';

interface ContextEntry {
    keyword: string;
    definition: string;
    category: 'concept' | 'formula' | 'framework' | 'term';
    timestamp: number;
    isNew?: boolean;
}

interface LiveContextPanelProps {
    transcription: TranscriptionTurn[];
    subjectName: string;
    onConceptsExtracted?: (concepts: { keyword: string; explanation: string; timestamp: number }[]) => void;
    onAskAbout?: (keyword: string) => void;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: string; border: string }> = {
    concept: { bg: 'bg-blue-500/8', text: 'text-blue-600', icon: '💡', border: 'border-blue-500/10' },
    formula: { bg: 'bg-amber-500/8', text: 'text-amber-600', icon: '📐', border: 'border-amber-500/10' },
    framework: { bg: 'bg-purple-500/8', text: 'text-purple-600', icon: '🧩', border: 'border-purple-500/10' },
    term: { bg: 'bg-emerald-500/8', text: 'text-emerald-600', icon: '📖', border: 'border-emerald-500/10' },
};

const LiveContextPanel: React.FC<LiveContextPanelProps> = ({
    transcription,
    subjectName,
    onConceptsExtracted,
    onAskAbout
}) => {
    const [entries, setEntries] = useState<ContextEntry[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
    const [searchFilter, setSearchFilter] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const lastAnalyzedLengthRef = useRef(0);
    const analysisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Debounced auto-analysis: triggers when transcript grows by 3+ new turns
    useEffect(() => {
        const currentLength = transcription.length;
        const delta = currentLength - lastAnalyzedLengthRef.current;

        if (delta >= 3 && !isAnalyzing) {
            if (analysisTimerRef.current) clearTimeout(analysisTimerRef.current);
            analysisTimerRef.current = setTimeout(() => {
                analyzeTranscript();
            }, 2500);
        }

        return () => {
            if (analysisTimerRef.current) clearTimeout(analysisTimerRef.current);
        };
    }, [transcription.length]);

    const analyzeTranscript = useCallback(async () => {
        if (isAnalyzing || transcription.length === 0) return;
        setIsAnalyzing(true);

        const newTurns = transcription.slice(lastAnalyzedLengthRef.current);
        const newText = newTurns.map(t => t.text).join(' ');

        if (newText.trim().length < 30) {
            setIsAnalyzing(false);
            return;
        }

        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        try {
            const existingKeywords = entries.map(e => e.keyword).join(', ');

            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Custom-Gemini-Key': localStorage.getItem('custom_gemini_key') || ''
                },
                body: JSON.stringify({
                    model: 'gemini-2.0-flash-exp',
                    contents: `You are a live lecture assistant for an MBA student studying ${subjectName}.

Analyze this new segment of lecture transcript and extract KEY TERMS that a student needs to understand immediately.

Already extracted (DO NOT repeat): ${existingKeywords || 'None yet'}

New transcript segment:
"${newText.substring(0, 4000)}"

For each new term:
- keyword: The term (2-4 words max)
- definition: A clear, exam-ready definition (1-2 sentences)
- category: One of "concept", "formula", "framework", or "term"

Return a JSON array. If no new important terms, return [].`,
                    config: { responseMimeType: 'application/json' }
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) throw new Error('API error');
            const data = await response.json();
            const parsed: ContextEntry[] = JSON.parse(data.text || '[]');

            if (parsed.length > 0) {
                const now = Date.now();
                const newEntries = parsed.map(e => ({ ...e, timestamp: now, isNew: true }));

                setEntries(prev => {
                    const existingKeys = new Set(prev.map(p => p.keyword.toLowerCase()));
                    const unique = newEntries.filter(n => !existingKeys.has(n.keyword.toLowerCase()));
                    const updated = prev.map(p => ({ ...p, isNew: false }));
                    return [...unique, ...updated];
                });

                // Feed new concepts to Knowledge Graph
                if (onConceptsExtracted) {
                    const newConcepts = newEntries.map(e => ({
                        keyword: e.keyword,
                        explanation: e.definition,
                        timestamp: now
                    }));
                    onConceptsExtracted(newConcepts);
                }
            }

            lastAnalyzedLengthRef.current = transcription.length;
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Live Context Analysis Error:', err);
            }
        } finally {
            setIsAnalyzing(false);
        }
    }, [transcription, entries, isAnalyzing, subjectName, onConceptsExtracted]);

    const filteredEntries = searchFilter
        ? entries.filter(e =>
            e.keyword.toLowerCase().includes(searchFilter.toLowerCase()) ||
            e.definition.toLowerCase().includes(searchFilter.toLowerCase())
        )
        : entries;

    const categoryGroups = filteredEntries.reduce<Record<string, ContextEntry[]>>((acc, entry) => {
        if (!acc[entry.category]) acc[entry.category] = [];
        acc[entry.category].push(entry);
        return acc;
    }, {});

    if (isCollapsed) {
        return (
            <button
                onClick={() => setIsCollapsed(false)}
                className="glass-card-2026 px-4 py-3 flex items-center justify-between w-full hover:bg-black/[0.02] transition-all group"
            >
                <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-[var(--vidyos-teal)]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-black/50">Live Context</span>
                    {entries.length > 0 && (
                        <span className="text-[8px] font-black text-[var(--vidyos-teal)] bg-[var(--vidyos-teal)]/10 px-2 py-0.5 rounded-full">
                            {entries.length}
                        </span>
                    )}
                </div>
                <ChevronDown className="w-3 h-3 opacity-30" />
            </button>
        );
    }

    return (
        <div className="glass-card-2026 overflow-hidden flex flex-col resize-y" style={{ minHeight: '200px', maxHeight: '600px', height: '420px' }}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-black/[0.04] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Brain className="w-3.5 h-3.5 text-[var(--vidyos-teal)]" />
                        {isAnalyzing && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                        )}
                    </div>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-black/50">Live Context</h3>
                </div>
                <div className="flex items-center gap-1.5">
                    {entries.length > 0 && (
                        <span className="text-[8px] font-black text-[var(--vidyos-teal)] bg-[var(--vidyos-teal)]/10 px-2 py-0.5 rounded-full">
                            {entries.length} terms
                        </span>
                    )}
                    <button onClick={analyzeTranscript} disabled={isAnalyzing || transcription.length === 0}
                        className="p-1 rounded-lg hover:bg-black/5 transition-colors disabled:opacity-30" title="Analyze now">
                        <RefreshCw className={`w-3 h-3 opacity-40 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => setIsCollapsed(true)} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
                        <ChevronUp className="w-3 h-3 opacity-30" />
                    </button>
                </div>
            </div>

            {/* Search */}
            {entries.length > 3 && (
                <div className="px-3 py-2 border-b border-black/[0.03] flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
                        <input type="text" value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
                            placeholder="Filter terms..."
                            className="w-full pl-7 pr-3 py-1.5 text-[10px] bg-black/[0.03] rounded-lg outline-none focus:bg-black/[0.06] transition-colors placeholder:text-black/25" />
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <div className="w-10 h-10 rounded-2xl bg-black/[0.03] flex items-center justify-center mb-3">
                            <BookOpen className="w-4 h-4 opacity-20" />
                        </div>
                        <p className="text-[9px] font-bold text-black/30 uppercase tracking-wider mb-1">
                            {transcription.length === 0 ? 'Start recording' : 'Listening...'}
                        </p>
                        <p className="text-[8px] text-black/20 max-w-[180px]">
                            {transcription.length === 0
                                ? 'Key terms will appear here as the lecture progresses.'
                                : 'Analyzing transcript for key concepts...'}
                        </p>
                    </div>
                ) : (
                    <div className="p-2 space-y-0.5">
                        {Object.entries(categoryGroups).map(([category, items]) => (
                            <div key={category}>
                                <div className="flex items-center gap-1.5 px-2 py-1">
                                    <span className="text-[10px]">{CATEGORY_STYLES[category]?.icon || '📌'}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-black/25">
                                        {category}s
                                    </span>
                                </div>
                                {items.map((entry, i) => {
                                    const style = CATEGORY_STYLES[entry.category] || CATEGORY_STYLES.term;
                                    const isExpanded = expandedKeyword === entry.keyword;

                                    return (
                                        <div key={`${entry.keyword}-${i}`}
                                            className={`rounded-xl transition-all duration-200 ${entry.isNew ? 'animate-apple-in' : ''}`}>
                                            <button
                                                onClick={() => setExpandedKeyword(isExpanded ? null : entry.keyword)}
                                                className={`w-full text-left px-3 py-2 rounded-xl transition-all hover:bg-black/[0.03] ${isExpanded ? 'bg-black/[0.03]' : ''}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {entry.isNew && (
                                                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--vidyos-teal)] animate-pulse" />
                                                        )}
                                                        <span className={`text-[11px] font-black truncate ${style.text}`}>{entry.keyword}</span>
                                                    </div>
                                                    {isExpanded ? <ChevronUp className="w-3 h-3 opacity-20 flex-shrink-0" />
                                                        : <ChevronDown className="w-3 h-3 opacity-20 flex-shrink-0" />}
                                                </div>
                                                {!isExpanded && (
                                                    <p className="text-[9px] text-black/40 mt-0.5 line-clamp-1 pl-3.5">{entry.definition}</p>
                                                )}
                                            </button>

                                            {isExpanded && (
                                                <div className={`mx-3 mb-2 p-2.5 rounded-lg ${style.bg} border ${style.border}`}>
                                                    <p className="text-[10px] font-medium text-black/70 leading-relaxed">{entry.definition}</p>
                                                    {onAskAbout && (
                                                        <button onClick={() => onAskAbout(entry.keyword)}
                                                            className="mt-2 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-black/30 hover:text-black/60 transition-colors">
                                                            <ArrowRight className="w-2.5 h-2.5" /> Ask AI about this
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {isAnalyzing && (
                <div className="px-4 py-2 border-t border-black/[0.04] flex items-center gap-2 flex-shrink-0">
                    <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-black/30 uppercase tracking-wider">Extracting concepts...</span>
                </div>
            )}
        </div>
    );
};

export default LiveContextPanel;
