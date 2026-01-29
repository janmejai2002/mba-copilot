
import React from 'react';
import { Zap, Coins, ArrowUpRight, History } from 'lucide-react';

interface CreditWalletProps {
    credits: number;
    tier: string;
    onRecharge: () => void;
}

const CreditWallet: React.FC<CreditWalletProps> = ({ credits, tier, onRecharge }) => {
    return (
        <div className="vidyos-card p-6 bg-black text-white relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--vidyos-teal)]/20 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-[var(--vidyos-teal)]/40 transition-all duration-700" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="label-caps text-[var(--vidyos-teal)] mb-1 opacity-80">Neural Balance</span>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-black tracking-tighter">{credits}</h3>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Credits</span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5">
                        <Coins className="w-5 h-5 text-[var(--vidyos-teal)]" />
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[var(--vidyos-teal)] to-[var(--vidyos-teal-light)] shadow-[0_0_10px_var(--vidyos-teal-glow)] transition-all duration-1000"
                            style={{ width: `${Math.min((credits / 1000) * 100, 100)}%` }}
                        />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{tier}</span>
                </div>

                <button
                    onClick={onRecharge}
                    className="w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                >
                    <ArrowUpRight className="w-3 h-3" />
                    Recharge Protocol
                </button>
            </div>
        </div>
    );
};

export default CreditWallet;
