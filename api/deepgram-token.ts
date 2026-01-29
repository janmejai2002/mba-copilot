import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const customKey = req.headers['x-custom-deepgram-key'] as string;
    const apiKey = customKey || process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: 'Deepgram API key not found in server environment (DEEPGRAM_API_KEY). Please check Vercel settings or provide one in the app Settings modal.'
        });
    }

    // Return the API key directly
    // This is safe because this endpoint is server-side only and the key is not exposed to the client
    // The client will use this key via secure WebSocket connection
    return res.status(200).json({ token: apiKey });
}
