import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const customKey = req.headers['x-custom-deepgram-key'] as string;
    const apiKey = customKey || process.env.DEEPGRAM_API_KEY;

    if (customKey) {
        // If a custom key is provided, we can return it directly (or a session token if we wanted more complexity)
        // Since Deepgram keys can be used directly in the browser via headers/ws, we return it.
        return res.status(200).json({ token: customKey });
    }

    if (!apiKey) {
        return res.status(500).json({
            error: 'Deepgram API key not found in server environment (DEEPGRAM_API_KEY). Please check Vercel settings or provide one in the app Settings modal.'
        });
    }

    try {
        // Attempt to create a short-lived temporary key (Best Practice)
        const response = await fetch('https://api.deepgram.com/v1/projects', {
            headers: { 'Authorization': `Token ${apiKey}` },
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) throw new Error('Failed to fetch projects');

        const data = await response.json();
        const projectId = data.projects?.[0]?.project_id;

        if (projectId) {
            const keyResponse = await fetch(`https://api.deepgram.com/v1/projects/${projectId}/keys`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    comment: 'Temporary session key',
                    scopes: ['usage:write'],
                    time_to_live_in_seconds: 3600
                })
            });

            if (keyResponse.ok) {
                const keyData = await keyResponse.json();
                if (keyData.key) {
                    return res.status(200).json({ token: keyData.key });
                }
            }
        }

        // Fallback: If project-based key creation fails (e.g. insufficient permissions),
        // we should NOT return the master key to the client for security reasons.
        console.error('Failed to create temporary Deepgram key. Please ensure your API key has "usage:write" permissions.');
        return res.status(500).json({ error: 'Failed to create temporary session token.' });

    } catch (error) {
        console.error('Deepgram API Error:', error);
        return res.status(500).json({ error: 'Deepgram API connection failed.' });
    }
}
