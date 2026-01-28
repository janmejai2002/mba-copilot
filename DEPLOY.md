# 🚀 Hosting MBA Copilot for Friends

This project is now ready to be hosted on **Vercel**. I have refactored the architecture to use **Secure API Proxies**, meaning your API keys will stay safe on the server and won't be exposed to your friends' browsers.

## 🛠️ Step-by-Step Deployment

### 1. Push to GitHub
If you haven't already, initialize a git repo and push your code to GitHub:
```bash
git init
git add .
git commit -m "Prepare for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mba-copilot.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [Vercel](https://vercel.com) and click **"Add New" -> "Project"**.
2. Import your `mba-copilot` repository.
3. In the **Environment Variables** section, add the following:
   - `GEMINI_API_KEY`: Your Google AI Studio key.
   - `PERPLEXITY_API_KEY`: Your Perplexity API key.
   - `DEEPGRAM_API_KEY`: Your Deepgram API key.
4. Click **Deploy**.

## 🔒 Security Features Added
- **Serverless Proxies**: Created `/api/gemini`, `/api/perplexity`, and `/api/deepgram-token`.
- **Key Safety**: Removed API keys from the frontend bundle.
- **Short-lived Tokens**: Deepgram now uses 1-hour temporary tokens instead of your master key.

## 📅 Updating the Timetable
The **Import Timetable** feature uses `public/timetable.json`. To update it:
1. Run `node scripts/fetch_timetable.js` locally.
2. Commit and push the updated `public/timetable.json` to GitHub.
3. Vercel will automatically redeploy the new data.

## 📱 Local-First Data
The app uses **IndexedDB (Dexie)**. This means:
- Every friend who uses the link will have their **own private database** in their browser.
- Their recordings and notes are **not shared** with you or others.
- If they clear their browser cache, they lose their local data (unless they export it).

Enjoy sharing the tool! 🎓
