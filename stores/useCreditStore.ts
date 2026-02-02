
import { create } from 'zustand';
import { paymentService } from '../services/payment';
import { securityService } from '../services/security';

interface CreditState {
    credits: number;
    setCredits: (credits: number) => void;
    loadCredits: () => Promise<void>;
    consumeCredits: (amount: number, operation: string, onInsufficient?: () => void) => Promise<boolean>;
    rechargeCredits: (amount: number) => void;
}

export const useCreditStore = create<CreditState>((set, get) => ({
    credits: 0,
    setCredits: (credits) => set({ credits }),
    loadCredits: async () => {
        const status = await paymentService.getSubscriptionStatus();
        const savedCredits = localStorage.getItem('vidyos_credits');
        if (savedCredits) {
            set({ credits: parseInt(savedCredits) });
        } else {
            const initial = status.isSovereign ? 500 : 50;
            set({ credits: initial });
            localStorage.setItem('vidyos_credits', initial.toString());
        }
    },
    consumeCredits: async (amount, operation, onInsufficient) => {
        const { credits } = get();
        if (credits < amount) {
            console.warn(`[Credit Logic] Insufficient credits for ${operation}.`);
            onInsufficient?.();
            return false;
        }

        const key = securityService.generateIdempotencyKey(operation);
        console.log(`[Sovereign Shield] Processing locked transaction: ${key}`);

        const newBalance = credits - amount;
        set({ credits: newBalance });
        localStorage.setItem('vidyos_credits', newBalance.toString());
        return true;
    },
    rechargeCredits: (amount) => {
        const newBalance = get().credits + amount;
        set({ credits: newBalance });
        localStorage.setItem('vidyos_credits', newBalance.toString());
    },
}));
