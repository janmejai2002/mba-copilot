import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const API_KEY = process.env.INSTAMOJO_API_KEY;
    const AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN;
    const { amount, purpose, buyerName, email, phone } = req.body;

    try {
        const response = await fetch('https://www.instamojo.com/api/1.1/payment-requests/', {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY || '',
                'X-Auth-Token': AUTH_TOKEN || '',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                amount: amount || '299',
                purpose: purpose || 'Vidyos Sovereign Access',
                buyer_name: buyerName,
                email: email,
                phone: phone,
                redirect_url: `${req.headers.origin}/nexus?status=success`,
                webhook: `${req.headers.origin}/api/instamojo/webhook`,
                allow_repeated_payments: 'false'
            })
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Instamojo Error:', error);
        return res.status(500).json({ error: 'Failed to create Instamojo request' });
    }
}
