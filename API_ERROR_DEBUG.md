# 🔧 Deepgram API Error - Troubleshooting Guide

## ❌ Current Error
```
GET https://y-kappa-weld.vercel.app/api/deepgram-token 500 (Internal Server Error)
Failed to start session: Error: No Deepgram token found.
```

## 🔍 Diagnosis

You've added the environment variables in Vercel, but the serverless functions are still returning 500 errors. This means either:

1. **The deployment hasn't picked up the new env vars** (most likely)
2. **The env vars are set for the wrong environment** (Production vs Preview)
3. **The API key itself is invalid**

---

## ✅ Solution Steps

### **Step 1: Verify Environment Variables**

Visit this URL after deploying:
```
https://y-kappa-weld.vercel.app/api/debug-env
```

This will show you if the keys are loaded. You should see:
```json
{
  "environment": "production",
  "keys": {
    "deepgram": "✅ Set",
    "gemini": "✅ Set",
    "perplexity": "✅ Set"
  }
}
```

If you see "❌ Missing", the env vars aren't loaded yet.

---

### **Step 2: Force Redeploy**

The environment variables only apply to **new deployments**. You must redeploy:

#### **Option A: Git Push (Recommended)**
```bash
git add .
git commit -m "fix: Add debug endpoint and force redeploy"
git push
```

#### **Option B: Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Deployments** tab
4. Click **⋯** on the latest deployment
5. Click **Redeploy** → **Use existing Build Cache: NO**

---

### **Step 3: Check Environment Variable Scope**

In Vercel Dashboard → Settings → Environment Variables:

Make sure each variable is checked for:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

If only "Production" is checked, preview deployments won't have the keys.

---

### **Step 4: Verify API Key Format**

Your Deepgram API key should look like:
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**NOT:**
- `Token xxxxxx` (remove "Token" prefix)
- With quotes `"xxxxxx"` (remove quotes)
- With spaces

---

## 🎯 Quick Test

After redeploying, test the debug endpoint:

```bash
curl https://y-kappa-weld.vercel.app/api/debug-env
```

If you see "✅ Set" for all keys, then try starting a recording again.

---

## 🔄 Alternative: Use Custom API Key

If Vercel env vars still don't work, you can provide the key through the app:

1. Click **Settings** icon in the app
2. Enter your Deepgram API key
3. Click Save

This bypasses Vercel env vars and sends the key via headers.

---

## 📝 Deployment Checklist

- [ ] Environment variables added in Vercel
- [ ] All three scopes checked (Production, Preview, Development)
- [ ] No quotes or "Token" prefix in the key
- [ ] Redeployed (not just saved env vars)
- [ ] Visited `/api/debug-env` to verify
- [ ] Cleared browser cache and refreshed

---

## 🆘 If Still Not Working

Share the output of:
```
https://y-kappa-weld.vercel.app/api/debug-env
```

And I'll help debug further!

---

**TL;DR:** 
1. Add the debug endpoint: `git add . && git commit -m "Add debug" && git push`
2. Wait for deployment
3. Visit `https://y-kappa-weld.vercel.app/api/debug-env`
4. If keys show "❌ Missing", check Vercel settings and redeploy again
