
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
        setInputType('note'); // Reset to default
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
            case 'question': return <HelpCircle className="w-3 h-3 text-orange-500" />;
            case 'todo': return <AlertCircle className="w-3 h-3 text-red-500" />;
            default: return <FileText className="w-3 h-3 text-blue-500" />;
        }
    };

    return (
        <div
            className={`relative rounded-xl border transition-all ${isDragging ? 'border-blue-500 bg-blue-50/10' : 'border-black/10 bg-white/50 backdrop-blur-md'} ${isLive ? 'shadow-lg' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            {/* Type Selector Pills */}
            <div className="flex gap-2 px-3 pt-3">
                {(['note', 'question', 'todo'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setInputType(t)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${inputType === t ? 'bg-black text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
                    >
                        {getTypeIcon(t)}
                        {t}
                    </button>
                ))}
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="flex gap-2 px-3 pt-2 overflow-x-auto">
                    {attachments.map(att => (
                        <div key={att.id} className="relative group flex-shrink-0">
                            {att.type === 'image' ? (
                                <img src={att.url} alt={att.name} className="h-10 w-10 object-cover rounded-lg border border-black/10" />
                            ) : (
                                <div className="h-10 w-10 flex items-center justify-center bg-black/5 rounded-lg border border-black/10">
                                    <FileText className="w-4 h-4 text-black/40" />
                                </div>
                            )}
                            <button
                                onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-2 h-2" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Input Area */}
            <div className="flex items-end gap-2 p-3">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-black/5 rounded-lg text-black/40 transition-colors"
                >
                    <Paperclip className="w-4 h-4" />
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
                    className="flex-1 max-h-32 min-h-[20px] bg-transparent border-none outline-none text-sm resize-none py-2 placeholder:text-black/30"
                    rows={1}
                    style={{ height: 'auto', minHeight: '24px' }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                />

                <button
                    onClick={handleSend}
                    disabled={!text.trim() && attachments.length === 0}
                    className="p-2 bg-black text-white rounded-lg hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <Send className="w-3.5 h-3.5" />
                </button>
            </div>

            {isDragging && (
                <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-dashed border-blue-500 z-10">
                    <div className="text-blue-600 font-bold text-xs uppercase tracking-widest">Drop files to attach</div>
                </div>
            )}
        </div>
    );
};

export default UnifiedInput;
