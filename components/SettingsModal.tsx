
import React, { useState, useEffect } from 'react';
import { X, Key, Info, Zap, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [geminiKey, setGeminiKey] = useState('');
    const [perplexityKey, setPerplexityKey] = useState('');
    const [deepgramKey, setDeepgramKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setGeminiKey(localStorage.getItem('custom_gemini_key') || '');
        setPerplexityKey(localStorage.getItem('custom_perplexity_key') || '');
        setDeepgramKey(localStorage.getItem('custom_deepgram_key') || '');
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('custom_gemini_key', geminiKey);
        localStorage.setItem('custom_perplexity_key', perplexityKey);
        localStorage.setItem('custom_deepgram_key', deepgramKey);
        setIsSaved(true);
        setTimeout(() => {
            setIsSaved(false);
            onClose();
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-apple-in border border-black/5">
                {/* Header */}
                <div className="px-8 pt-8 pb-6 flex justify-between items-center bg-white border-b border-black/[0.03]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-black rounded-xl">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">AI & Connectivity</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <X className="w-5 h-5 text-black/40" />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Gemini Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Key className="w-4 h-4 text-black/30" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Gemini Credits</h3>
                            </div>
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline">Get Key</a>
                        </div>
                        <div className="relative group">
                            <input
                                type="password"
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full px-5 py-4 bg-black/[0.03] border border-black/[0.05] rounded-2xl text-sm font-mono placeholder:text-black/20 outline-none focus:border-black/20 focus:bg-white transition-all"
                            />
                        </div>
                        <p className="text-[10px] text-black/30 leading-relaxed">Overrides the default server key. Used for long-form synthesis and session insights.</p>
                    </div>

                    {/* Perplexity Section */}
                    <div className="space-y-4 pt-4 border-t border-black/[0.03]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Key className="w-4 h-4 text-black/30" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Perplexity (Real-time)</h3>
                            </div>
                            <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline">Get Key</a>
                        </div>
                        <input
                            type="password"
                            value={perplexityKey}
                            onChange={(e) => setPerplexityKey(e.target.value)}
                            placeholder="pplx-..."
                            className="w-full px-5 py-4 bg-black/[0.03] border border-black/[0.05] rounded-2xl text-sm font-mono placeholder:text-black/20 outline-none focus:border-black/20 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Deepgram Section */}
                    <div className="space-y-4 pt-4 border-t border-black/[0.03]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Key className="w-4 h-4 text-black/30" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Deepgram (Live Audio)</h3>
                            </div>
                        </div>
                        <input
                            type="password"
                            value={deepgramKey}
                            onChange={(e) => setDeepgramKey(e.target.value)}
                            placeholder="DG-..."
                            className="w-full px-5 py-4 bg-black/[0.03] border border-black/[0.05] rounded-2xl text-sm font-mono placeholder:text-black/20 outline-none focus:border-black/20 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex gap-4 items-start">
                        <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <div>
                            <h4 className="text-[11px] font-bold text-blue-900 mb-1 leading-none">Local Security</h4>
                            <p className="text-[10px] text-blue-700/60 leading-relaxed font-medium">Your API keys are stored only in your browser's local storage and are never sent to our servers.</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-[#fbfbfd] flex justify-end gap-3 border-t border-black/[0.03]">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-black/40 hover:bg-black/5 transition-all">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={isSaved}
                        className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isSaved ? 'bg-green-500 text-white' : 'bg-black text-white hover:scale-105 active:scale-95 shadow-xl shadow-black/10'}`}
                    >
                        {isSaved ? 'Keys Saved' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
