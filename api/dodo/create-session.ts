import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
    const { productId, customerEmail } = req.body;

    try {
        const response = await fetch('https://api.dodopayments.com/v1/checkout-sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DODO_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId || 'p_sovereign_monthly',
                customer_email: customerEmail,
                success_url: `${req.headers.origin}/nexus?status=success`,
                cancel_url: `${req.headers.origin}/pricing?status=cancel`,
                mode: 'subscription'
            })
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Dodo Error:', error);
        return res.status(500).json({ error: 'Failed to create Dodo session' });
    }
}
