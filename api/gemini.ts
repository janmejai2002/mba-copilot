import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { model, contents, config } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured on server' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const aiModel = genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash-preview-0514' });

        // Convert to the format expected by the SDK
        const result = await aiModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: contents }] }],
            generationConfig: config
        });

        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ text });
    } catch (error) {
        console.error('Gemini API Error:', error);
        return res.status(500).json({ error: 'Failed to call Gemini API' });
    }
}
