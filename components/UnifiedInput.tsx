
import React, { useState, useRef, useCallback } from 'react';
import { Paperclip, Send, X, Image as ImageIcon, FileText, CheckCircle2, HelpCircle, AlertCircle } from 'lucide-react';
import { Attachment } from '../types';

interface UnifiedInputProps {
    onSend: (text: string, attachments: Attachment[], type: 'note' | 'question' | 'todo') => void;
    placeholder?: string;
    isLive?: boolean;
}

const UnifiedInput: React.FC<UnifiedInputProps> = ({ onSend, placeholder = "Type a note...", isLive = false }) => {
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [inputType, setInputType] = useState<'note' | 'question' | 'todo'>('note');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        if (!text.trim() && attachments.length === 0) return;
        onSend(text, attachments, inputType);
        setText('');
        setAttachments([]);
        setInputType('note');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            await processFiles(Array.from(e.target.files));
        }
    };

    const processFiles = async (files: File[]) => {
        const newAttachments: Attachment[] = await Promise.all(files.map(async (file) => {
            return new Promise<Attachment>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    resolve({
                        id: crypto.randomUUID(),
                        name: file.name,
                        type: file.type.startsWith('image/') ? 'image' : 'file',
                        url: reader.result as string,
                        size: file.size
                    });
                };
                reader.readAsDataURL(file);
            });
        }));
        setAttachments(prev => [...prev, ...newAttachments]);
    };

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            await processFiles(Array.from(e.dataTransfer.files));
        }
    }, []);

    const getTypeIcon = (type: 'note' | 'question' | 'todo') => {
        switch (type) {
            case 'question': return <HelpCircle className="w-3.5 h-3.5" />;
            case 'todo': return <AlertCircle className="w-3.5 h-3.5" />;
            default: return <FileText className="w-3.5 h-3.5" />;
        }
    };

    const getModeStyles = (type: 'note' | 'question' | 'todo', active: boolean) => {
        if (!active) return "bg-black/[0.03] text-[var(--text-muted)] hover:bg-black/[0.06] opacity-40";
        switch (type) {
            case 'question': return "bg-[var(--vidyos-gold)] text-white shadow-lg shadow-[var(--vidyos-gold)]/20";
            case 'todo': return "bg-red-500 text-white shadow-lg shadow-red-500/20";
            default: return "bg-[var(--vidyos-teal)] text-white shadow-lg shadow-[var(--vidyos-teal)]/20";
        }
    };

    return (
        <div
            className={`vidyos-card p-0 overflow-hidden border transition-all duration-500 ${isDragging ? 'border-[var(--vidyos-teal)] ring-4 ring-[var(--vidyos-teal-light)]' : 'border-[var(--glass-border)]'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            {/* Mode Switcher */}
            <div className="flex gap-2 px-4 pt-4 mb-2">
                {(['note', 'question', 'todo'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setInputType(t)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${getModeStyles(t, inputType === t)}`}
                    >
                        {getTypeIcon(t)}
                        {t}
                    </button>
                ))}
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="flex gap-3 px-4 mb-3 overflow-x-auto pb-1 custom-scrollbar">
                    {attachments.map(att => (
                        <div key={att.id} className="relative group flex-shrink-0 animate-apple-in">
                            {att.type === 'image' ? (
                                <img src={att.url} alt={att.name} className="h-12 w-12 object-cover rounded-xl border border-[var(--glass-border)] shadow-sm" />
                            ) : (
                                <div className="h-12 w-12 flex items-center justify-center bg-black/[0.03] rounded-xl border border-[var(--glass-border)]">
                                    <FileText className="w-5 h-5 text-[var(--text-muted)]" />
                                </div>
                            )}
                            <button
                                onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform shadow-xl"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Interface */}
            <div className="flex items-end gap-3 px-4 pb-4">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-black/[0.03] hover:bg-black/[0.06] rounded-xl text-[var(--text-muted)] transition-all active:scale-90"
                >
                    <Paperclip className="w-4.5 h-4.5" />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={handleFileSelect}
                />

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none outline-none text-sm font-bold text-[var(--text-main)] resize-none py-3 placeholder:text-[var(--text-muted)] placeholder:opacity-30 leading-relaxed"
                    rows={1}
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                />

                <button
                    onClick={handleSend}
                    disabled={!text.trim() && attachments.length === 0}
                    className={`p-3 rounded-xl transition-all shadow-lg active:scale-95 ${(!text.trim() && attachments.length === 0) ? 'bg-black/5 text-black/10' : 'bg-black text-white shadow-black/20 hover:scale-105'}`}
                >
                    <Send className="w-4.5 h-4.5" />
                </button>
            </div>

            {isDragging && (
                <div className="absolute inset-0 bg-[var(--vidyos-teal)]/10 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-[var(--vidyos-teal)] z-50 animate-apple-in">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-4">
                        <Paperclip className="w-8 h-8 text-[var(--vidyos-teal)]" />
                    </div>
                    <span className="label-caps mb-0 text-[var(--vidyos-teal)]">Neural Input Mapping</span>
                    <p className="text-[11px] font-black uppercase text-[var(--vidyos-teal)] opacity-60">Release to attach node</p>
                </div>
            )}
        </div>
    );
};

export default UnifiedInput;
