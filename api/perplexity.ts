import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;
    const customKey = req.headers['x-custom-perplexity-key'] as string;
    const apiKey = customKey || process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Perplexity API key not configured. Please provide one in Settings.' });
    }

    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    { role: 'system', content: 'You are an MBA teaching assistant. Analyze transcripts and explain technical business concepts clearly and concisely.' },
                    { role: 'user', content: prompt }
                ]
            })
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Perplexity API Error:', error);
        return res.status(500).json({ error: 'Failed to call Perplexity API' });
    }
}
