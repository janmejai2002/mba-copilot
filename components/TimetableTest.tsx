
import React, { useState, useEffect } from 'react';
import { parseTimetableWithSteps, TimetableEntry, ParseStep } from '../services/timetableParser';

const TimetableTest: React.FC = () => {
    const [url, setUrl] = useState('');
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [steps, setSteps] = useState<ParseStep[]>([]);
    const [results, setResults] = useState<TimetableEntry[]>([]);

    const handleParse = async () => {
        setIsProcessing(true);
        setSteps([]);
        setResults([]);

        // Simulated Fetch Step if URL is provided
        if (url) {
            setSteps(prev => [...prev, { message: `Fetching content from ${url}...`, status: 'processing' }]);
            await new Promise(r => setTimeout(r, 2000));
            // For now, we simulate fetching. In a real app, this would be a fetch call.
            setSteps(prev => {
                const newSteps = [...prev];
                newSteps[0].status = 'done';
                return newSteps;
            });
        }

        const onStepUpdate = (step: ParseStep) => {
            setSteps(prev => [...prev.map(s => s.status === 'processing' ? { ...s, status: 'done' as const } : s), step]);
        };

        const parsed = await parseTimetableWithSteps(input || "Monday 09:00 - 11:00 Demo Class", onStepUpdate);

        setResults(parsed);
        setIsProcessing(false);
    };

    return (
        <div className="p-10 bg-[#050505] text-white min-h-screen font-sans selection:bg-white selection:text-black">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12 border-b border-white/5 pb-10">
                    <h1 className="text-5xl font-black tracking-tighter mb-4 italic uppercase">Neural Parser Protocol</h1>
                    <p className="text-white/40 font-mono text-sm tracking-widest uppercase">Curriculum Data Extraction Interface</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-3 block">Target Source URL</label>
                            <input
                                className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 font-mono text-sm focus:outline-none focus:border-white/30 transition-all"
                                placeholder="https://university.portal/timetable"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-3 block">Data Input (Raw Text/OCR)</label>
                            <textarea
                                className="w-full h-40 bg-white/[0.03] border border-white/10 rounded-sm p-4 font-mono text-sm focus:outline-none focus:border-white/30 transition-all resize-none"
                                placeholder="Paste timetable text here if no URL..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleParse}
                            disabled={isProcessing}
                            className={`w-full py-5 font-black uppercase tracking-[0.4em] text-xs transition-all ${isProcessing ? 'bg-white/10 text-white/20 cursor-not-allowed' : 'bg-white text-black hover:scale-[1.02] active:scale-95'}`}
                        >
                            {isProcessing ? 'Analyzing...' : 'Initialize Extraction'}
                        </button>
                    </div>

                    <div className="space-y-6">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-3 block">Process Log</label>
                        <div className="bg-white/[0.02] border border-white/10 rounded-sm p-6 min-h-[300px] font-mono text-[11px] space-y-4">
                            {steps.length === 0 && <div className="text-white/10 italic">Waiting for process initialization...</div>}
                            {steps.map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <span className="text-white/20">[{i.toString().padStart(2, '0')}]</span>
                                    <span className={step.status === 'processing' ? 'text-white animate-pulse' : step.status === 'done' ? 'text-green-500' : 'text-white'}>
                                        {step.message}
                                    </span>
                                </div>
                            ))}
                            {isProcessing && <div className="text-white/20 animate-pulse">_</div>}
                        </div>
                    </div>
                </div>

                {results.length > 0 && (
                    <div className="mt-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-4">
                            <div className="w-3 h-3 bg-green-500" />
                            Extracted Curriculum
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {results.map((entry, i) => (
                                <div key={i} className="p-6 border border-white/10 bg-white/[0.03] hover:border-white/30 transition-all group">
                                    <div className="text-xs font-mono text-white/40 mb-2 uppercase tracking-widest">{entry.day}</div>
                                    <div className="text-xl font-bold mb-1">{entry.subject}</div>
                                    <div className="text-sm font-mono text-white/60">
                                        {entry.startTime} — {entry.endTime}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimetableTest;
