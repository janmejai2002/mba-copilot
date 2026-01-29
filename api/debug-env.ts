import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Debug endpoint to check if environment variables are loaded
    const hasDeepgram = !!process.env.DEEPGRAM_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;

    return res.status(200).json({
        environment: process.env.VERCEL_ENV || 'unknown',
        keys: {
            deepgram: hasDeepgram ? '✅ Set' : '❌ Missing',
            gemini: hasGemini ? '✅ Set' : '❌ Missing',
            perplexity: hasPerplexity ? '✅ Set' : '❌ Missing'
        },
        message: hasDeepgram && hasGemini
            ? 'All required keys are set! If you still see errors, try redeploying.'
            : 'Some keys are missing. Add them in Vercel Settings → Environment Variables.'
    });
}
