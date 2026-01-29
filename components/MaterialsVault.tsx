import React, { useState, useEffect, useCallback } from 'react';
import { X, Upload, FileText, Trash2, CheckCircle2, Loader2, Music, Image as ImageIcon, Search } from 'lucide-react';
import { GroundingMaterial } from '../types';
import { storage } from '../services/db';

interface MaterialsVaultProps {
    subjectId: string;
    subjectName: string;
    isOpen: boolean;
    onClose: () => void;
}

const MaterialsVault: React.FC<MaterialsVaultProps> = ({ subjectId, subjectName, isOpen, onClose }) => {
    const [materials, setMaterials] = useState<GroundingMaterial[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadMaterials();
        }
    }, [isOpen, subjectId]);

    const loadMaterials = async () => {
        const data = await storage.getGroundingMaterials(subjectId);
        setMaterials(data.sort((a, b) => b.uploadedAt - a.uploadedAt));
    };

    const processFiles = async (files: File[]) => {
        setIsUploading(true);
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = async () => {
                const material: GroundingMaterial = {
                    id: crypto.randomUUID(),
                    subjectId,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: reader.result as string,
                    uploadedAt: Date.now(),
                    status: 'indexed'
                };
                await storage.saveGroundingMaterial(material);
                await loadMaterials();
            };
            reader.readAsDataURL(file);
        }
        setIsUploading(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Permanently purge this record from Neural Hub?")) {
            await storage.deleteGroundingMaterial(id);
            await loadMaterials();
        }
    };

    const getIcon = (type: string) => {
        if (type.includes('audio')) return <Music className="w-5 h-5" />;
        if (type.includes('image')) return <ImageIcon className="w-5 h-5" />;
        return <FileText className="w-5 h-5" />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!isOpen) return null;

    const filteredMaterials = materials.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/20 backdrop-blur-3xl" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-[var(--glass-heavy)] border border-[var(--glass-border)] rounded-[40px] shadow-[var(--shadow-premium)] overflow-hidden animate-apple-in">
                {/* Header */}
                <div className="px-10 py-10 flex justify-between items-center border-b border-[var(--glass-border)]">
                    <div>
                        <span className="label-caps mb-2 text-[var(--vidyos-teal)]">Neural Hub / The Vault</span>
                        <h2 className="text-4xl font-black">{subjectName}</h2>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-auto md:h-[600px] overflow-y-auto md:overflow-hidden">
                    {/* Upload Zone */}
                    <div className="w-full md:w-1/3 p-6 md:p-10 border-b md:border-b-0 md:border-r border-[var(--glass-border)] bg-black/[0.02]">
                        <div
                            className="h-full border-2 border-dashed border-[var(--glass-border)] rounded-3xl flex flex-col items-center justify-center p-8 text-center group hover:border-[var(--vidyos-teal)] hover:bg-[var(--vidyos-teal)]/[0.02] transition-all cursor-pointer relative"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                processFiles(Array.from(e.dataTransfer.files));
                            }}
                            onClick={() => document.getElementById('vault-upload')?.click()}
                        >
                            <input
                                type="file"
                                id="vault-upload"
                                multiple
                                hidden
                                onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))}
                            />
                            <div className="w-20 h-20 bg-white rounded-[24px] shadow-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                {isUploading ? <Loader2 className="w-8 h-8 text-[var(--vidyos-teal)] animate-spin" /> : <Upload className="w-8 h-8 text-[var(--vidyos-teal)]" />}
                            </div>
                            <h3 className="font-black uppercase tracking-widest text-[11px] mb-2">Ground Your AI</h3>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] opacity-60 leading-relaxed uppercase tracking-widest">
                                Drop PDFs, recordings, or images to stabilize reasoning.
                            </p>
                        </div>
                    </div>

                    {/* Material List */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-[var(--glass-border)]">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-40" />
                                <input
                                    type="text"
                                    placeholder="Search indexed nodes..."
                                    className="w-full bg-black/[0.03] border-none rounded-2xl py-4 pl-12 pr-6 outline-none text-sm font-bold text-[var(--text-main)] placeholder:opacity-20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {filteredMaterials.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                                    <FileText className="w-20 h-20 mb-6" />
                                    <p className="font-black uppercase tracking-[0.4em] text-xs">No Nodes Grounded</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {filteredMaterials.map(m => (
                                        <div key={m.id} className="group flex items-center gap-6 p-5 bg-white/40 border border-[var(--glass-border)] rounded-2xl hover:border-[var(--vidyos-teal)] transition-all">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-[var(--vidyos-teal)]">
                                                {getIcon(m.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm truncate pr-4">{m.name}</h4>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{formatSize(m.size)}</span>
                                                    <span className="w-1 h-1 bg-[var(--vidyos-teal)] rounded-full opacity-30" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--vidyos-teal)] flex items-center gap-1">
                                                        <CheckCircle2 className="w-2.5 h-2.5" /> {m.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(m.id)}
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaterialsVault;
