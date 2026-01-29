
/**
 * Payment Protocol (Phase 6)
 * Abstracted interface for Vidyos subscription management.
 */

export interface SubscriptionStatus {
    isSovereign: boolean;
    tier: 'synthesist' | 'sovereign';
    expiresAt?: number;
}

export const paymentService = {
    async getSubscriptionStatus(): Promise<SubscriptionStatus> {
        const stored = localStorage.getItem('vidyos_subscription');
        if (stored) return JSON.parse(stored);
        return { isSovereign: false, tier: 'synthesist' };
    },

    async initiateDodoCheckout(email: string): Promise<string | null> {
        try {
            const response = await fetch('/api/dodo/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerEmail: email })
            });
            const { checkout_url } = await response.json();
            return checkout_url;
        } catch (e) {
            console.error('Dodo handshake failed', e);
            return null;
        }
    },

    async initiateInstamojoCheckout(email: string, name: string): Promise<string | null> {
        try {
            const response = await fetch('/api/instamojo/create-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, buyerName: name })
            });
            const data = await response.json();
            return data.payment_request?.longurl;
        } catch (e) {
            console.error('Instamojo handshake failed', e);
            return null;
        }
    },

    async cancelSubscription(): Promise<void> {
        localStorage.removeItem('vidyos_subscription');
    }
};
