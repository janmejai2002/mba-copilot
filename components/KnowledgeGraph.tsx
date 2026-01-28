

import React, { useState } from 'react';
import { Share2, Zap, Maximize2, BookOpen, Lightbulb, Calculator, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface Concept {
    keyword: string;
    explanation: string;
    timestamp: number;
}

interface KnowledgeGraphProps {
    concepts: Concept[];
}

// Helper to render text with inline and block formulas
const renderTextWithFormulas = (text: string) => {
    try {
        // First, handle common non-LaTeX patterns and citations
        let processedText = text
            // Remove citation brackets like [1][2]
            .replace(/\[\d+\]/g, '')
            // Convert (( formula )) to $$ formula $$ only if it looks like math (has =, +, -, /, *, _ or ^)
            .replace(/\(\(\s*([^)]+)\s*\)\)/g, (match, formula) => {
                if (/[=+\-*/_^]/.test(formula)) return `$$${formula}$$`;
                return `(${formula})`;
            })
            // Convert simple subscripts like r_d to LaTeX only if not part of a word
            .replace(/\b([a-zA-Z])_([a-zA-Z0-9])\b/g, '$1_{$2}');

        // Split by $$ for block formulas and $ for inline formulas
        const parts: React.ReactNode[] = [];
        let currentIndex = 0;

        // Match both $$ and $ delimited formulas, but avoid currency patterns like $100
        // (Ensures no space after opening $ and no space before closing $)
        const formulaRegex = /(\$\$[^$]+\$\$|\$(?!\s)(?:\\.|[^$])+(?<!\s)\$)/g;
        let match;

        while ((match = formulaRegex.exec(processedText)) !== null) {
            // Add text before formula
            if (match.index > currentIndex) {
                const textBefore = processedText.substring(currentIndex, match.index);
                parts.push(<span key={`text-${currentIndex}`}>{textBefore}</span>);
            }

            const formula = match[0];
            const isBlock = formula.startsWith('$$');
            const mathContent = isBlock ? formula.slice(2, -2) : formula.slice(1, -1);

            // Skip if it looks like currency (e.g., $100) or just plain text with $
            if (!isBlock && /^\d+(\.\d+)?$/.test(mathContent)) {
                parts.push(<span key={`currency-${match.index}`}>{formula}</span>);
                currentIndex = match.index + formula.length;
                continue;
            }

            try {
                const html = katex.renderToString(mathContent, {
                    displayMode: isBlock,
                    throwOnError: false,
                    strict: false
                });

                parts.push(
                    <span
                        key={match.index}
                        dangerouslySetInnerHTML={{ __html: html }}
                        className={isBlock ? 'block my-2' : 'inline-block mx-1'}
                    />
                );
            } catch (e) {
                // If KaTeX fails, show the original text
                parts.push(<span key={match.index}>{formula}</span>);
            }

            currentIndex = match.index + formula.length;
        }

        // Add remaining text
        if (currentIndex < processedText.length) {
            parts.push(processedText.substring(currentIndex));
        }

        return parts.length > 0 ? parts : processedText;
    } catch (error) {
        return text;
    }
};

// Categorize concepts by type for color coding
const categorizeConcept = (keyword: string, explanation: string) => {
    const lower = (keyword + ' ' + explanation).toLowerCase();

    if (lower.includes('formula') || lower.includes('equation') || lower.includes('calculate')) {
        return { type: 'formula', icon: Calculator, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' };
    } else if (lower.includes('example') || lower.includes('case') || lower.includes('instance')) {
        return { type: 'example', icon: Lightbulb, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' };
    } else if (lower.includes('trend') || lower.includes('growth') || lower.includes('increase')) {
        return { type: 'trend', icon: TrendingUp, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' };
    } else {
        return { type: 'concept', icon: BookOpen, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' };
    }
};

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ concepts }) => {
    const [selectedNode, setSelectedNode] = useState<number | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hoveredNode, setHoveredNode] = useState<number | null>(null);

    // Improved spiral layout with better spacing
    const getCoordinates = (index: number, total: number) => {
        if (total === 0) return { x: 50, y: 50 };
        if (total === 1) return { x: 50, y: 50 };

        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const radius = Math.sqrt(index + 1) * 18;
        const angle = index * goldenAngle;

        return {
            x: 50 + radius * Math.cos(angle),
            y: 50 + radius * Math.sin(angle)
        };
    };

    // Find related concepts
    const findRelatedConcepts = (index: number) => {
        const current = concepts[index];
        const currentWords = new Set(current.keyword.toLowerCase().split(/\s+/));

        return concepts
            .map((c, i) => {
                if (i === index) return null;
                const words = new Set(c.keyword.toLowerCase().split(/\s+/));
                const intersection = new Set([...currentWords].filter(x => words.has(x)));
                return intersection.size > 0 ? i : null;
            })
            .filter(i => i !== null) as number[];
    };

    return (
        <div className={`apple-card overflow-hidden flex flex-col ${isFullscreen ? 'fixed inset-4 md:inset-8 z-[101]' : 'p-4 md:p-6 min-h-[350px] md:min-h-[450px]'}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 px-6 pt-6">
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 flex items-center gap-2 mb-1">
                        <Share2 className="w-3 h-3" />
                        Subject Knowledge Graph
                    </h3>
                    <p className="text-[9px] text-black/20 font-medium">Auto-updating concept network from live lecture</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-black/[0.03] text-black/40 text-[8px] font-bold rounded-full border border-black/[0.03]">
                        {concepts.length} Nodes
                    </span>
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1.5 hover:bg-black/5 rounded-lg transition-all"
                        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                        <Maximize2 className="w-3 h-3 text-black/30" />
                    </button>
                </div>
            </div>

            {/* Legend */}
            {concepts.length > 0 && (
                <div className="px-6 mb-4 flex flex-wrap gap-x-4 gap-y-2 text-[8px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-500 to-purple-600" />
                        <span className="text-black/30">Concept</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-600" />
                        <span className="text-black/30">Formula</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-amber-500 to-amber-600" />
                        <span className="text-black/30">Example</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-green-500 to-green-600" />
                        <span className="text-black/30">Trend</span>
                    </div>
                </div>
            )}

            {/* Graph Canvas */}
            <div className="relative flex-1 mx-6 mb-6 bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-pink-50/30 rounded-2xl border border-black/[0.05] overflow-hidden">
                {/* Decorative grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }} />

                {/* SVG for connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Draw connections */}
                    {concepts.map((_, i) => {
                        const related = findRelatedConcepts(i);
                        const start = getCoordinates(i, concepts.length);

                        return related.map(relatedIndex => {
                            const end = getCoordinates(relatedIndex, concepts.length);
                            const isHighlighted = hoveredNode === i || hoveredNode === relatedIndex;

                            return (
                                <line
                                    key={`${i}-${relatedIndex}`}
                                    x1={`${start.x}%`}
                                    y1={`${start.y}%`}
                                    x2={`${end.x}%`}
                                    y2={`${end.y}%`}
                                    stroke={isHighlighted ? "url(#connectionGradient)" : "#000"}
                                    strokeWidth={isHighlighted ? "2" : "1"}
                                    strokeOpacity={isHighlighted ? "0.4" : "0.08"}
                                    strokeDasharray="4,4"
                                    filter={isHighlighted ? "url(#glow)" : ""}
                                />
                            );
                        });
                    })}

                    {/* Sequential connections */}
                    {concepts.map((_, i) => {
                        if (i === 0) return null;
                        const start = getCoordinates(i - 1, concepts.length);
                        const end = getCoordinates(i, concepts.length);

                        return (
                            <path
                                key={`seq-${i}`}
                                d={`M ${start.x}% ${start.y}% Q ${(start.x + end.x) / 2}% ${(start.y + end.y) / 2 - 5}% ${end.x}% ${end.y}%`}
                                stroke="#000"
                                strokeWidth="1.5"
                                strokeOpacity="0.1"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    })}

                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 6 3, 0 6" fill="#000" fillOpacity="0.1" />
                    </marker>
                </svg>

                {/* Nodes */}
                <div className="relative w-full h-full min-h-[350px] p-8">
                    {concepts.map((c, i) => {
                        const { x, y } = getCoordinates(i, concepts.length);
                        const isSelected = selectedNode === i;
                        const isHovered = hoveredNode === i;
                        const category = categorizeConcept(c.keyword, c.explanation);
                        const Icon = category.icon;
                        const cleanKeyword = c.keyword.replace(/\*\*/g, '').trim();
                        const cleanExplanation = c.explanation.replace(/\*\*/g, '').trim();

                        return (
                            <div
                                key={i}
                                className="absolute group cursor-pointer transition-all duration-300"
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: isSelected ? 100 : isHovered ? 50 : 10
                                }}
                                onClick={() => setSelectedNode(isSelected ? null : i)}
                                onMouseEnter={() => setHoveredNode(i)}
                                onMouseLeave={() => setHoveredNode(null)}
                            >
                                {/* Pulse ring on hover */}
                                {isHovered && (
                                    <div className="absolute inset-0 -m-4">
                                        <div className={`w-full h-full rounded-full bg-gradient-to-br ${category.color} opacity-20 animate-ping`} />
                                    </div>
                                )}

                                {/* Node with label */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="relative">
                                        <div
                                            className={`w-10 h-10 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${isSelected
                                                ? `bg-gradient-to-br ${category.color} scale-125 shadow-xl`
                                                : `bg-gradient-to-br ${category.color} group-hover:scale-110`
                                                }`}
                                        >
                                            <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                                        </div>

                                        {/* Node number badge */}
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full shadow-sm border border-black/10 flex items-center justify-center">
                                            <span className="text-[9px] font-bold text-black/60">{i + 1}</span>
                                        </div>
                                    </div>

                                    {/* Always visible label */}
                                    <div className={`px-2 py-1 rounded-md ${category.bgColor} ${category.textColor} border ${category.borderColor} shadow-sm max-w-[120px] text-center`}>
                                        <p className="text-[9px] font-bold leading-tight truncate">{cleanKeyword}</p>
                                    </div>
                                </div>

                                {/* Detailed tooltip on click */}
                                {isSelected && (
                                    <div
                                        className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-scale-in"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="bg-white text-black text-[11px] px-5 py-4 rounded-2xl shadow-2xl border border-black/10 w-[320px] max-w-[90vw]">
                                            <div className="flex items-start gap-3 mb-3 pb-3 border-b border-black/5">
                                                <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} flex-shrink-0`}>
                                                    <Icon className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-[12px] mb-1 break-words">{cleanKeyword}</p>
                                                    <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${category.bgColor} ${category.textColor}`}>
                                                        {category.type}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-black/70 leading-relaxed text-[11px] max-h-[200px] overflow-y-auto custom-scrollbar">
                                                {renderTextWithFormulas(cleanExplanation)}
                                            </div>
                                        </div>
                                        {/* Arrow */}
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-black/10" />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Empty state */}
                    {concepts.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                            <Zap className="w-16 h-16 mb-4 text-purple-500" strokeWidth={1.5} />
                            <p className="text-sm font-bold uppercase tracking-widest leading-loose text-black/40">
                                Listening for Concepts
                            </p>
                            <p className="text-[10px] text-black/20 mt-2 max-w-xs">
                                Concepts will auto-populate as they're discovered in your lecture
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent concepts */}
            <div className="px-6 pb-6">
                <p className="text-[8px] font-bold uppercase tracking-wider text-black/20 mb-3">Recent Discoveries</p>
                <div className="flex flex-wrap gap-2">
                    {concepts.slice(-6).map((c, i) => {
                        const category = categorizeConcept(c.keyword, c.explanation);
                        const Icon = category.icon;
                        const actualIndex = concepts.length - 6 + i;
                        const cleanKeyword = c.keyword.replace(/\*\*/g, '').trim();

                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedNode(actualIndex)}
                                className={`text-[9px] px-3 py-2 rounded-xl font-bold uppercase tracking-wider shadow-sm hover:shadow-md hover:scale-105 transition-all active:scale-95 flex items-center gap-1.5 ${category.bgColor} ${category.textColor} border ${category.borderColor}`}
                            >
                                <Icon className="w-3 h-3" />
                                {cleanKeyword.substring(0, 20)}{cleanKeyword.length > 20 ? '...' : ''}
                            </button>
                        );
                    })}
                    {concepts.length === 0 && (
                        <p className="text-[10px] text-black/20 italic">No concepts discovered yet</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeGraph;
