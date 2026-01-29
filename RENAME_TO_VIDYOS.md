# 🎉 Renaming to Vidyos - Complete Guide

## ✅ What I've Done So Far

1. ✅ **package.json** - Changed name to "vidyos"
2. ✅ **index.html** - Changed title to "Vidyos | Knowledge, Reimagined"
3. ✅ **Layout.tsx** - Changed header to "Vidyos"

---

## 📋 Remaining Files to Update

### **Manual Updates Needed:**

1. **components/LandingPage.tsx** (2 places)
   - Line 307: `MBA COPILOT` → `VIDYOS`
   - Line 414: `MBA COPILOT — 2026` → `VIDYOS — 2026`

2. **components/Auth.tsx** (1 place)
   - Line 53: `MBA Copilot` → `Vidyos`

3. **components/TermsOfService.tsx** (2 places)
   - Line 13: `MBA Copilot` → `Vidyos`
   - Line 32: `MBA Copilot` → `Vidyos`

4. **components/PrivacyPolicy.tsx** (1 place)
   - Line 13: `MBA Copilot` → `Vidyos`

5. **components/Layout.tsx** (1 place - footer)
   - Find the footer copyright line and update

---

## 🔍 Search & Replace Commands

### **Option 1: VS Code (Easiest)**
1. Press `Ctrl+Shift+H` (Find and Replace in Files)
2. Find: `MBA Copilot`
3. Replace: `Vidyos`
4. Click "Replace All"

### **Option 2: Command Line**
```bash
# Windows PowerShell
Get-ChildItem -Recurse -Include *.tsx,*.ts,*.jsx,*.js | ForEach-Object {
    (Get-Content $_.FullName) -replace 'MBA Copilot', 'Vidyos' | Set-Content $_.FullName
}

# Also replace uppercase version
Get-ChildItem -Recurse -Include *.tsx,*.ts,*.jsx,*.js | ForEach-Object {
    (Get-Content $_.FullName) -replace 'MBA COPILOT', 'VIDYOS' | Set-Content $_.FullName
}
```

---

## 🎨 Branding Updates

### **Logo Icon Update (Optional)**
Current logo shows "MBA" - you might want to update to "V" or a custom icon:

In `Layout.tsx` line 22-24:
```tsx
// Current:
<span className="text-[var(--card-bg)] font-bold text-[10px]">MBA</span>

// Change to:
<span className="text-[var(--card-bg)] font-bold text-lg">V</span>
```

---

## 📝 README.md Update

Create/update README.md:

```markdown
# Vidyos

**Knowledge, Reimagined**

Vidyos is a universal learning platform that transforms any lecture, meeting, or session into structured knowledge using AI.

## Features
- 🎙️ Live transcription with Deepgram
- 🧠 AI-powered insights with Gemini
- 🕸️ Interactive knowledge graphs
- 📅 Class scheduling
- 📚 Session management
- ☁️ Google Drive sync

## Tech Stack
- React + TypeScript + Vite
- Deepgram for transcription
- Google Gemini for AI
- D3.js for visualizations
- IndexedDB for local storage

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`

## Deployment
Deployed on Vercel: https://vidyos.vercel.app

---

**Vidyos** - Where ancient wisdom (Vidya) meets modern learning
```

---

## 🚀 Deployment Updates

### **1. Vercel Project Rename**
1. Go to Vercel Dashboard
2. Settings → General → Project Name
3. Change to: `vidyos`
4. New URL: `https://vidyos.vercel.app`

### **2. Git Repository Rename (Optional)**
```bash
# Rename local folder
cd ..
mv mba-copilot vidyos
cd vidyos

# Update git remote (if you want to rename GitHub repo)
# First rename repo on GitHub, then:
git remote set-url origin https://github.com/YOUR_USERNAME/vidyos.git
```

---

## 🌐 Domain Setup

### **Free Domain Options:**

1. **is-a.dev** (Free forever)
   - Register: `vidyos.is-a.dev`
   - Follow the PR guide I created earlier

2. **Vercel subdomain** (Instant)
   - Rename project → `vidyos.vercel.app`

3. **Buy domain** (~$10/year)
   - `vidyos.app` (recommended)
   - `vidyos.io`
   - `vidyos.com`

---

## ✅ Final Checklist

- [ ] All code files updated (MBA Copilot → Vidyos)
- [ ] package.json renamed
- [ ] index.html title updated
- [ ] Logo icon updated (optional)
- [ ] README.md created/updated
- [ ] Vercel project renamed
- [ ] Git repository renamed (optional)
- [ ] Domain registered (optional)
- [ ] Environment variables checked
- [ ] Test build locally: `npm run build`
- [ ] Deploy to Vercel

---

## 🎯 Quick Commands

```bash
# Test locally
npm run dev

# Build for production
npm run build

# Deploy
git add .
git commit -m "Rebrand to Vidyos"
git push
```

---

## 🎨 Brand Assets Needed (Future)

1. **Logo** - Design a "V" icon or Vidyos wordmark
2. **Favicon** - 16x16, 32x32, 192x192 icons
3. **Social Cards** - Open Graph images for sharing
4. **Color Palette** - Define brand colors
5. **Typography** - Already using Inter (good choice!)

---

**Ready to complete the rename!** Use VS Code's Find & Replace to update all remaining files, then deploy! 🚀
