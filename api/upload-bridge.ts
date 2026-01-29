import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Multi-Device Bridge API
 * Handles mobile uploads triggered via QR code scanning
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        const { sessionId } = req.query;
        // Return a simple HTML page for the mobile user to upload
        return res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Vidyos Image Bridge</title>
                <style>
                    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0fdf4; }
                    .card { background: white; padding: 2rem; border-radius: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; }
                    h1 { color: #14b8a6; margin-bottom: 0.5rem; }
                    p { font-size: 0.9rem; color: #666; margin-bottom: 2rem; }
                    .upload-btn { background: #14b8a6; color: white; padding: 1rem 2rem; border-radius: 1rem; cursor: pointer; font-weight: bold; border: none; }
                    input[type="file"] { display: none; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Vidyos Bridge</h1>
                    <p>Snap a photo of the slide or whiteboard</p>
                    <label class="upload-btn">
                        Capture & Upload
                        <input type="file" accept="image/*" capture="environment" onchange="upload(this)">
                    </label>
                </div>
                <script>
                    async function upload(input) {
                        const file = input.files[0];
                        if (!file) return;
                        
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('sessionId', '${sessionId}');
                        
                        document.body.innerHTML = '<h1>Uploading...</h1>';
                        
                        // In a real app, this would POST to another endpoint or Supabase/S3
                        // For MVP, we use the local storage bridge if on same network, or a cloud relay
                        alert('In production, this would upload to session ${sessionId}');
                        document.body.innerHTML = '<h1>Success!</h1><p>Check your laptop.</p>';
                    }
                </script>
            </body>
            </html>
        `);
    }

    if (req.method === 'POST') {
        // Handle the actual file upload logic here (e.g., relay to Pusher or Socket)
        return res.status(200).json({ success: true });
    }
}
