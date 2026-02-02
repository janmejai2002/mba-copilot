
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
        try {
            const userStr = localStorage.getItem('vidyos_user');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            const response = await fetch(`/api/verify-subscription?userId=${user.id}`);
            if (response.ok) {
                const status = await response.json();
                // If server has credits, sync them
                if (status.credits !== undefined) {
                    set({ credits: status.credits });
                    localStorage.setItem('vidyos_credits', status.credits.toString());
                    return;
                }
            }
        } catch (e) {
            console.error('Failed to sync credits from server', e);
        }

        // Fallback to local
        const savedCredits = localStorage.getItem('vidyos_credits');
        if (savedCredits) {
            set({ credits: parseInt(savedCredits) });
        }
    },
    consumeCredits: async (amount, operation, onInsufficient) => {
        const { credits } = get();
        if (credits < amount) {
            onInsufficient?.();
            return false;
        }

        const key = securityService.generateIdempotencyKey(operation);

        // In a real app, we'd send this to the server to decrement properly
        // For now, we simulate the server handshake
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
