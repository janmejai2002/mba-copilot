# 🔧 Fix Deepgram API Error

## ❌ Current Error
```
GET https://y-kappa-weld.vercel.app/api/deepgram-token 500 (Internal Server Error)
Failed to start session: Error: No Deepgram token found.
```

## ✅ Solution: Set Environment Variables in Vercel

### **Option 1: Vercel Dashboard (Easiest)**

1. Go to https://vercel.com/dashboard
2. Click on your project (`y-kappa-weld` or `mba-copilot`)
3. Go to **Settings** → **Environment Variables**
4. Add these three variables:

| Name | Value |
|------|-------|
| `DEEPGRAM_API_KEY` | Your Deepgram API key |
| `GEMINI_API_KEY` | Your Gemini API key |
| `PERPLEXITY_API_KEY` | Your Perplexity API key (optional) |

5. Click **Save**
6. Go to **Deployments** tab
7. Click the **⋯** menu on the latest deployment
8. Click **Redeploy**

---

### **Option 2: Vercel CLI**

```bash
# Install Vercel CLI if you don't have it
npm i -g vercel

# Login
vercel login

# Add environment variables
vercel env add DEEPGRAM_API_KEY
# Paste your key when prompted
# Select: Production, Preview, Development (all)

vercel env add GEMINI_API_KEY
# Paste your key when prompted

vercel env add PERPLEXITY_API_KEY
# Paste your key when prompted (optional)

# Redeploy
vercel --prod
```

---

## 🎯 Why This Happened

The API keys work locally because they're in your `.env` file, but Vercel doesn't have access to that file. You need to set them in Vercel's dashboard so they're available in production.

---

## ✅ After Setting Keys

Once you set the environment variables and redeploy:

1. ✅ Deepgram transcription will work
2. ✅ Gemini AI features will work
3. ✅ Doubt Console will work
4. ✅ Summary generation will work

---

## 🆕 New Feature: Class Scheduler

While you're fixing the API keys, I've added a new feature:

### **Schedule Classes with Calendar**

1. Go to any subject
2. Click the blue **"Schedule"** button
3. Click on dates when you have classes
4. Click **"Create X Sessions"**
5. Session cards are automatically created with the date as the title

**Example:**
- Click: Feb 3, Feb 5, Feb 10
- Creates 3 session cards:
  - "Feb 03, 2026"
  - "Feb 05, 2026"
  - "Feb 10, 2026"

This makes it easy to pre-plan your semester!

---

## 📝 Summary of All Changes

1. ✅ Default MBA subjects
2. ✅ Enhanced Knowledge Graph (D3.js)
3. ✅ Fixed scrolling bugs
4. ✅ Fixed recording indicator
5. ✅ Fixed LaTeX rendering
6. ✅ **NEW: Class Scheduler** 📅

---

**Next Step:** Set the environment variables in Vercel and redeploy! 🚀
