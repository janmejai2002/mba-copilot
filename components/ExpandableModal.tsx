
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ExpandableModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    icon?: React.ReactNode;
}

const ExpandableModal: React.FC<ExpandableModalProps> = ({ isOpen, onClose, title, children, actions, icon }) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-apple-in">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal content */}
            <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 bg-white/95 backdrop-blur-sm border-b border-black/5">
                    <div className="flex items-center gap-4">
                        {icon && icon}
                        <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-black/60">
                            {title}
                        </h2>
                    </div>
                    <div className="flex items-center gap-6">
                        {actions && actions}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-black/5 rounded-xl transition-all active:scale-95"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5 text-black/40" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ExpandableModal;
