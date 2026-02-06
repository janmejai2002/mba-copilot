
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Handles mobile uploads triggered via QR code scanning.
 * Currently simulates the bridge for the MVP/Demo.
 * In production (GCP), this will upload to Cloud Storage -> Firestore.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // POST: Handle File Upload (Mock)
    if (req.method === 'POST') {
        // In a real scenario, we would parse the multipart form data here
        // and upload to Supabase or GCP Storage.
        // For now, we return success to simulated the experience.
        return res.status(200).json({ success: true, message: "File bridged successfully (Simulated)" });
    }

    // GET: Serve Bridge UI
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Vidyos Neural Bridge</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; background: #000; color: white; }
            .scan-line {
                width: 100%;
                height: 2px;
                background: #22c55e;
                position: absolute;
                top: 0;
                animation: scan 2s infinite linear;
                opacity: 0.5;
            }
            @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
        </style>
    </head>
    <body class="h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        
        <div class="relative z-10 w-full max-w-md text-center space-y-8">
            <div class="flex justify-center mb-8">
                <div class="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-xl">
                    <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
            </div>

            <h1 class="text-3xl font-black tracking-tighter">Neural Bridge <span class="text-green-500">.</span></h1>
            <p class="text-white/50 text-sm font-medium leading-relaxed">
                Securely inject physical documents or images directly into your live Vidyos session.
            </p>

            <form id="uploadForm" class="space-y-4">
                <label class="block w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-white/10 hover:border-green-500/50 transition-all bg-white/5 flex flex-col items-center justify-center cursor-pointer group overflow-hidden relative">
                    <input type="file" id="fileInput" class="hidden" accept="image/*,.pdf,.txt" onchange="handleFileSelect(this)">
                    <div id="previewArea" class="absolute inset-0 bg-cover bg-center hidden"></div>
                    <div id="emptyState" class="flex flex-col items-center p-6">
                        <div class="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg class="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <span class="text-xs font-bold uppercase tracking-widest text-white/40">Tap to Select</span>
                    </div>
                </label>

                <button type="submit" id="submitBtn" disabled class="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] transform active:scale-95 transition-all opacity-50 disabled:cursor-not-allowed">
                    Inject to Stream
                </button>
            </form>

            <div id="status" class="h-6 text-[10px] font-mono text-green-400 opacity-0 transition-opacity">
                > ESTABLISHING UPLINK...
            </div>
        </div>

        <script>
            const form = document.getElementById('uploadForm');
            const fileInput = document.getElementById('fileInput');
            const submitBtn = document.getElementById('submitBtn');
            const status = document.getElementById('status');
            const previewArea = document.getElementById('previewArea');
            const emptyState = document.getElementById('emptyState');

            function handleFileSelect(input) {
                if (input.files && input.files[0]) {
                    const file = input.files[0];
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-50');
                    
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            previewArea.style.backgroundImage = 'url(' + e.target.result + ')';
                            previewArea.classList.remove('hidden');
                            emptyState.classList.add('opacity-0');
                        };
                        reader.readAsDataURL(file);
                    } else {
                        previewArea.classList.add('hidden');
                        emptyState.classList.remove('opacity-0');
                        emptyState.querySelector('span').textContent = file.name;
                    }
                }
            }

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!fileInput.files[0]) return;
                
                status.textContent = '> ENCRYPTING PACKET...';
                status.classList.remove('opacity-0');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Transmitting...';

                try {
                    // Simulating upload delay
                    await new Promise(r => setTimeout(r, 1500));
                    
                    // Actually call the endpoint (it returns mock success)
                    await fetch('/api/upload-bridge', { method: 'POST', body: 'mock' });

                    status.textContent = '> UPLOAD COMPLETE';
                    status.classList.add('text-green-400');
                    
                    submitBtn.style.backgroundColor = '#22c55e';
                    submitBtn.style.color = 'white';
                    submitBtn.textContent = 'SUCCESS';
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);

                } catch (err) {
                    console.error(err);
                    status.textContent = '> CONNECTION FAILED';
                    status.classList.add('text-red-500');
                    submitBtn.textContent = 'RETRY';
                    submitBtn.disabled = false;
                }
            });
        </script>
    </body>
    </html>
    `;

    return res.status(200).send(html);
}
