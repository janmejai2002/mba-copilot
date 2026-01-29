
import React, { useState } from 'react';
import { Sparkles, Shield, Zap, ChevronRight, Check } from 'lucide-react';

interface OnboardingWizardProps {
    onComplete: () => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);

    const steps = [
        {
            title: "Welcome to Vidyos",
            subtitle: "The Fusion OS for Higher Intelligence",
            description: "You're not just using a tool; you're initializing a cognitive mirror. Vidyos grounds AI reasoning in your actual materials—zero hallucination, infinite depth.",
            icon: Sparkles,
            color: "var(--vidyos-teal)"
        },
        {
            title: "Total Sovereignty",
            subtitle: "Bring Your Own Key (BYOK)",
            description: "We don't sell your data. By providing your own AI keys, you maintain absolute control over your intelligence stack and privacy.",
            icon: Shield,
            color: "var(--vidyos-gold)"
        },
        {
            title: "Neural Continuity",
            subtitle: "Local-First with Sync",
            description: "Your knowledge base lives in your browser and syncs via Google Drive. Fast, private, and always yours.",
            icon: Zap,
            color: "#8b5cf6"
        }
    ];

    const currentStep = steps[step - 1];
    const Icon = currentStep.icon;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-white dark:bg-black">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.1),transparent)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent)] animate-pulse" />

            <div className="relative w-full max-w-4xl grid md:grid-cols-2 gap-20 items-center">
                {/* Visual Side */}
                <div className="hidden md:flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 bg-[var(--vidyos-teal)]/10 blur-[120px] rounded-full animate-pulse" />
                    <div className={`w-64 h-64 rounded-[3rem] bg-black dark:bg-white flex items-center justify-center shadow-2xl relative z-10 transition-all duration-700 ${step === 2 ? 'rotate-12 scale-110' : step === 3 ? '-rotate-12 scale-90' : ''}`}>
                        <Icon className="w-32 h-32 text-white dark:text-black" />
                    </div>
                </div>

                {/* Content Side */}
                <div className="flex flex-col">
                    <div className="flex gap-2 mb-12">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1 rounded-full transition-all duration-500 ${s <= step ? 'w-12 bg-black dark:bg-white' : 'w-4 bg-black/10 dark:bg-white/10'}`}
                            />
                        ))}
                    </div>

                    <span className="label-caps mb-4 opacity-50">Step 0{step} of 03</span>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-none">{currentStep.title}</h1>
                    <h2 className="text-2xl font-bold text-black/40 dark:text-white/40 mb-10">{currentStep.subtitle}</h2>
                    <p className="text-xl text-black/60 dark:text-white/60 leading-relaxed font-medium mb-16 max-w-md">
                        {currentStep.description}
                    </p>

                    <div className="flex items-center gap-6">
                        {step < 3 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                className="px-10 py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-[13px] uppercase tracking-widest flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl"
                            >
                                Next Alignment
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={onComplete}
                                className="px-10 py-5 bg-[var(--vidyos-teal)] text-white rounded-2xl font-black text-[13px] uppercase tracking-widest flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[var(--vidyos-teal)]/40"
                            >
                                Initialize Hub
                                <Check className="w-5 h-5" />
                            </button>
                        )}

                        <button
                            onClick={onComplete}
                            className="text-[10px] font-black uppercase tracking-widest opacity-20 hover:opacity-100 transition-all"
                        >
                            Skip Initialization
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingWizard;
