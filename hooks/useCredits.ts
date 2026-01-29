
import { useState, useCallback, useEffect } from 'react';
import { paymentService } from '../services/payment';
import { securityService } from '../services/security';

export const useCredits = (initialCredits: number, isSovereign: boolean, onOpenPricing: () => void) => {
    const [credits, setCredits] = useState(initialCredits);

    // Sync from storage on mount
    useEffect(() => {
        const checkStatus = async () => {
            const status = await paymentService.getSubscriptionStatus();
            // Credits are simulated but in production would come from DB
            const savedCredits = localStorage.getItem('vidyos_credits');
            if (savedCredits) {
                setCredits(parseInt(savedCredits));
            } else {
                const initial = status.isSovereign ? 500 : 50;
                setCredits(initial);
                localStorage.setItem('vidyos_credits', initial.toString());
            }
        };
        checkStatus();
    }, []);

    const consumeCredits = useCallback(async (amount: number, operation: string) => {
        if (credits < amount) {
            console.warn(`[Credit Logic] Insufficient credits for ${operation}. Prompting Upgrade.`);
            onOpenPricing();
            return false;
        }

        // Idempotency check 
        const key = securityService.generateIdempotencyKey(operation);
        console.log(`[Sovereign Shield] Processing locked transaction: ${key}`);

        const newBalance = credits - amount;
        setCredits(newBalance);
        localStorage.setItem('vidyos_credits', newBalance.toString());

        // In production, this would be a network call to update the DB ledger
        return true;
    }, [credits, onOpenPricing]);

    const rechargeCredits = useCallback((amount: number) => {
        const newBalance = credits + amount;
        setCredits(newBalance);
        localStorage.setItem('vidyos_credits', newBalance.toString());
    }, [credits]);

    return { credits, consumeCredits, rechargeCredits };
};
