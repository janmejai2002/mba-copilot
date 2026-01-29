
import React from 'react';
import { Check, Zap, Sparkles, Shield, ChevronRight, X, Loader2 } from 'lucide-react';
import { paymentService } from '../services/payment';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
    const [isProcessing, setIsProcessing] = React.useState(false);

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        setIsProcessing(true);
        const success = await paymentService.initiateCheckout();
        setIsProcessing(false);
        if (success) {
            onClose();
            // Force a reload or state check to unlock features
            window.location.reload();
        } else {
            alert("Payment Protocol Handshake Failed. Please verify your connection to the Neural Hub.");
        }
    };

    const tiers = [
        {
            name: "Synthesist",
            price: "Free",
            description: "Essential neural mapping tools for researchers.",
            features: [
                "Up to 10 Subjects",
                "Advanced Knowledge Graph",
                "Google Drive Sync (30s delay)",
                "Standard AI Synthesis"
            ],
            icon: Zap,
            color: "text-black/40",
            buttonText: "Current Plan",
            current: true
        },
        {
            name: "Sovereign",
            price: "$12/mo",
            description: "Unlimited architectural depth and sovereignty.",
            features: [
                "Unlimited Subjects",
                "Accelerated Neural Syncing",
                "Priority Concept Extraction",
                "Multi-modal Neural Vault",
                "BYOK Governance"
            ],
            icon: Sparkles,
            color: "text-[var(--vidyos-gold)]",
            buttonText: "Ascend to Sovereign",
            current: false,
            highlight: true
        }
    ];

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-3xl" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-white dark:bg-[#111] rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden animate-apple-in border border-black/5 dark:border-white/5">
                {/* Close */}
                <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all z-10">
                    <X className="w-5 h-5 text-black/20 dark:text-white/20" />
                </button>

                <div className="grid md:grid-cols-2">
                    <div className="p-12 md:p-20 bg-black text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--vidyos-teal)]/20 blur-[120px] rounded-full -mr-48 -mt-48" />

                        <div className="relative z-10">
                            <span className="label-caps mb-4 text-[var(--vidyos-teal)]">Architecture Tiers</span>
                            <h2 className="text-5xl font-black mb-6 leading-none">Scale your<br />Intellect.</h2>
                            <p className="text-lg text-white/40 font-bold mb-12 max-w-xs leading-relaxed">
                                Choose the depth of your cognitive foundation. From basic mapping to total architectural sovereignty.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-[var(--vidyos-teal)]" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Private Synapse</h4>
                                        <p className="text-[11px] text-white/30 font-bold">End-to-end encrypted local storage.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-12 md:p-16 flex flex-col gap-10 bg-white dark:bg-[#111]">
                        {tiers.map((tier) => (
                            <div
                                key={tier.name}
                                className={`relative p-8 rounded-[2rem] border transition-all ${tier.highlight
                                    ? 'border-[var(--vidyos-gold)] bg-[var(--vidyos-gold-light)] dark:bg-[var(--vidyos-gold)]/5'
                                    : 'border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl bg-white dark:bg-black shadow-sm ${tier.color}`}>
                                            <tier.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-2xl uppercase tracking-tighter">{tier.name}</h3>
                                            <p className="text-[12px] font-bold opacity-40">{tier.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xl font-black">{tier.price}</span>
                                        {tier.price !== 'Free' && <span className="text-[10px] font-bold opacity-40">billed monthly</span>}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {tier.features.map(f => (
                                        <div key={f} className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                                                <Check className="w-2.5 h-2.5 opacity-40" />
                                            </div>
                                            <span className="text-[11px] font-bold opacity-60">{f}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={tier.current ? undefined : handleUpgrade}
                                    disabled={isProcessing}
                                    className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${tier.current
                                        ? 'bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 cursor-default'
                                        : 'bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-95 shadow-xl disabled:opacity-50'
                                        }`}
                                >
                                    {isProcessing && !tier.current && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {tier.buttonText}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
