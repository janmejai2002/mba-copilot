import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { model, contents, config } = req.body;

    // Backend URL (Cloud Run Production is preferred)
    const BACKEND_URL = process.env.VITE_API_URL ||
        process.env.API_URL ||
        'https://vidyos-backend-1066396672407.us-central1.run.app';

    try {
        const response = await fetch(`${BACKEND_URL}/api/gemini`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Custom-Gemini-Key': req.headers['x-custom-gemini-key'] as string || ''
            },
            body: JSON.stringify({
                model: model || 'gemini-1.5-flash',
                contents: contents,
                config: config
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Backend Response Error [${response.status}]:`, errorText);

            // If it's a 401/403, it might mean the Cloud Run IAM policy is too restrictive
            if (response.status === 401 || response.status === 403) {
                return res.status(response.status).json({
                    error: 'Backend Authentication Error',
                    details: 'The Cloud Run backend rejected the request. Please ensure it allows unauthenticated invocations.'
                });
            }

            throw new Error(`Backend Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error: any) {
        console.error('Gemini Proxy Error:', error);
        return res.status(500).json({ error: error.message || 'Failed to call Backend API' });
    }
}
