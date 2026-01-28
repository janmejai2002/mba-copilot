import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Deepgram API key not configured on server' });
    }

    try {
        // Call Deepgram to get a temporary project key/token
        // Actually, Deepgram has a simpler way: just return the key if you trust the friends,
        // OR use the Deepgram SDK to create a short-lived key.

        // For now, let's just use the simplest "secure-ish" way which is proxying the key request
        // But Deepgram doesn't have a simple "get-token" endpoint that doesn't require the master key.
        // The real way is to use the Deepgram SDK's `manage` API to create a key with a short TTL.

        const response = await fetch('https://api.deepgram.com/v1/projects', {
            headers: { 'Authorization': `Token ${apiKey}` }
        });
        const projects = await response.json();
        const projectId = projects.projects[0].project_id;

        const keyResponse = await fetch(`https://api.deepgram.com/v1/projects/${projectId}/keys`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                comment: 'Temporary session key',
                scopes: ['usage:write'],
                time_to_live_in_seconds: 3600 // 1 hour
            })
        });

        const keyData = await keyResponse.json();
        return res.status(200).json({ token: keyData.key });
    } catch (error) {
        console.error('Deepgram Token Error:', error);
        return res.status(500).json({ error: 'Failed to generate Deepgram token' });
    }
}
