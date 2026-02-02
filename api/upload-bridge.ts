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
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <title>Vidyos Neural Bridge</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;600;900&display=swap" rel="stylesheet">
                <style>
                    :root { --teal: #14b8a6; --bg: #fcfcfd; }
                    body { font-family: 'Outfit', sans-serif; background: var(--bg); display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #09090b; overflow: hidden; }
                    .mesh { position: fixed; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.05) 0%, transparent 70%); z-index: -1; }
                    .card { background: white; padding: 2.5rem; border-radius: 2.5rem; box-shadow: 0 20px 50px -10px rgba(0,0,0,0.1); text-align: center; width: 85%; max-width: 320px; border: 1px solid rgba(0,0,0,0.03); animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
                    @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    h1 { font-weight: 900; letter-spacing: -0.05em; font-size: 2rem; margin: 0 0 0.5rem 0; background: linear-gradient(to bottom, #000, #666); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                    p { font-size: 0.8rem; font-weight: 600; color: #71717a; margin-bottom: 2.5rem; text-transform: uppercase; letter-spacing: 0.1em; }
                    .upload-btn { display: inline-block; background: #000; color: white; padding: 1.25rem 2rem; border-radius: 1.25rem; cursor: pointer; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.75rem; transition: all 0.3s; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.2); }
                    .upload-btn:active { transform: scale(0.95); }
                    input[type="file"] { display: none; }
                    .status { margin-top: 1.5rem; font-size: 0.7rem; font-weight: 900; color: var(--teal); opacity: 0; transition: opacity 0.3s; text-transform: uppercase; letter-spacing: 0.2em; }
                </style>
            </head>
            <body>
                <div class="mesh"></div>
                <div class="card" id="mainCard">
                    <h1>Neural Bridge</h1>
                    <p>Inject Slide into Session</p>
                    <label class="upload-btn">
                        Open Camera
                        <input type="file" accept="image/*" capture="environment" onchange="upload(this)">
                    </label>
                    <div id="status" class="status">Syncing Link...</div>
                </div>
                <script>
                    async function upload(input) {
                        const file = input.files[0];
                        if (!file) return;
                        
                        const status = document.getElementById('status');
                        const card = document.getElementById('mainCard');
                        status.style.opacity = '1';
                        status.innerText = 'Compressing...';
                        
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('sessionId', '${sessionId}');
                        
                        setTimeout(() => {
                            status.innerText = 'Neural Injection Active...';
                            setTimeout(() => {
                                card.innerHTML = '<div style="font-size: 3rem; margin-bottom: 1rem;">✨</div><h1 style="font-size: 1.5rem;">Injection Successful</h1><p style="margin-bottom: 0;">Node archived to session</p>';
                            }, 1500);
                        }, 1000);

                        // In production, this POSTs to the same URL (req.method === 'POST')
                        await fetch(window.location.href, { method: 'POST', body: formData });
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
