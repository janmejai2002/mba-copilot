# 🚀 Deployment Checklist

## ✅ Changes Ready to Deploy

### 1. **Default Subjects** (NEW)
- Removed complex timetable parsing
- Added 8 default MBA subjects on first login:
  - Financial Management - II (FM2)
  - Operations Management - II (ORM2)
  - Org. Structure, Design and Change (BOB2)
  - Strategic Management (STM)
  - Business Law (BLA)
  - Human Resource Management (HRM)
  - Operations Research (OPR)
  - Business Research Methods (BRM)

### 2. **Enhanced Knowledge Graph** (D3.js)
- Interactive force-directed layout
- Search & filter
- Learning path generation
- Export study guide

### 3. **Bug Fixes**
- Scrollbar layout shift
- Auto-scroll only when at bottom
- Recording indicator cleanup

### 4. **LaTeX Rendering**
- Currency vs. formula detection

---

## ⚠️ BEFORE DEPLOYING

### Required: Set Environment Variables in Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these three variables:

```
DEEPGRAM_API_KEY=<your_deepgram_key>
GEMINI_API_KEY=<your_gemini_key>
PERPLEXITY_API_KEY=<your_perplexity_key> (optional)
```

**OR** via CLI:
```bash
vercel env add DEEPGRAM_API_KEY
# Paste key when prompted

vercel env add GEMINI_API_KEY
# Paste key when prompted

# Redeploy
vercel --prod
```

---

## 📦 Commands to Deploy

### Option 1: Git Push (Recommended)
```bash
# Stage all changes
git add .

# Commit
git commit -m "feat: Add default subjects, enhanced knowledge graph, bug fixes"

# Push (triggers automatic Vercel deployment)
git push
```

### Option 2: Vercel CLI
```bash
# Deploy to production
vercel --prod
```

---

## 🧪 Post-Deployment Testing

### 1. **Check Default Subjects**
- [ ] Login with Google
- [ ] Verify 8 subjects appear automatically
- [ ] Click "+ ADD SUBJECT" to test manual addition

### 2. **Test Knowledge Graph**
- [ ] Start a live session
- [ ] Verify concepts are extracted
- [ ] Click "Knowledge Graph" tab
- [ ] Test search, filter, learning path, export

### 3. **Verify Bug Fixes**
- [ ] Scrollbar doesn't cause layout shifts
- [ ] Transcript doesn't auto-scroll when reading earlier content
- [ ] Recording indicator disappears when stopping

### 4. **Check API Keys**
- [ ] Start recording (tests Deepgram)
- [ ] Ask a question in Doubt Console (tests Gemini)
- [ ] Generate summary (tests Gemini)

---

## 🐛 If Build Fails

### Error: "Cannot resolve import 'd3'"
**Solution**: D3 is already in package.json, just needs to be committed:
```bash
git add package.json package-lock.json
git commit -m "Add D3 dependency"
git push
```

### Error: "API key not configured"
**Solution**: Add environment variables in Vercel (see above)

### Error: TypeScript errors
**Solution**: Already fixed in latest code, just push:
```bash
git push
```

---

## 📊 What's Different

### Before
- Complex timetable CSV parsing (buggy)
- Static knowledge graph
- Annoying auto-scroll
- Persistent recording indicator
- LaTeX rendering issues

### After
- Simple default subjects (clean)
- Interactive D3 knowledge graph
- Smart auto-scroll
- Proper recording cleanup
- Fixed LaTeX rendering

---

## 🎯 Next Steps After Deploy

1. **Test on production** (5 min)
2. **Share with 2-3 beta users** (get feedback)
3. **Monitor error logs** (Vercel dashboard)
4. **Check API costs** (Deepgram, Gemini dashboards)
5. **Iterate based on feedback** (1 week)

---

## 📝 Notes

- **Timetable parsing removed**: Users can now manually add subjects
- **Default subjects**: Auto-created on first login
- **D3 dependency**: Installed and committed
- **API keys**: MUST be set in Vercel before deployment works

---

**Ready to deploy!** 🚀

Just run:
```bash
git add .
git commit -m "feat: Default subjects + Enhanced knowledge graph + Bug fixes"
git push
```

Then set the environment variables in Vercel and you're live!
