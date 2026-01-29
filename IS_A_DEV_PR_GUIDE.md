# 🚀 How to Submit PR for is-a.dev Domain

## ✅ You've Already Forked the Repo

Now follow these steps:

---

## Step 1: Clone Your Fork

```bash
# Clone your forked repo
git clone https://github.com/YOUR_GITHUB_USERNAME/register.git
cd register
```

---

## Step 2: Create Your Domain File

```bash
# Create the domains directory if it doesn't exist
mkdir -p domains

# Create your domain file
# Replace 'mbacopilot' with your desired subdomain
```

Create a file: `domains/mbacopilot.json`

**Content:**
```json
{
  "description": "MBA Copilot - AI-powered study companion for MBA students",
  "repo": "https://github.com/YOUR_GITHUB_USERNAME/mba-copilot",
  "owner": {
    "username": "YOUR_GITHUB_USERNAME",
    "email": "your-email@example.com"
  },
  "record": {
    "CNAME": "cname.vercel-dns.com"
  }
}
```

**Important:** Replace:
- `YOUR_GITHUB_USERNAME` with your actual GitHub username
- `your-email@example.com` with your email
- `mbacopilot` with your desired subdomain (lowercase, no spaces)

---

## Step 3: Commit and Push

```bash
# Add the file
git add domains/mbacopilot.json

# Commit
git commit -m "feat: add mbacopilot.is-a.dev"

# Push to your fork
git push origin main
```

---

## Step 4: Create Pull Request

### **Option A: Via GitHub Website (Easiest)**

1. Go to your forked repo: `https://github.com/YOUR_USERNAME/register`
2. You'll see a yellow banner: **"This branch is 1 commit ahead of is-a-dev:main"**
3. Click **"Contribute"** → **"Open pull request"**
4. Title: `feat: add mbacopilot.is-a.dev`
5. Description:
```
Adding mbacopilot.is-a.dev for MBA Copilot - an AI-powered study companion for MBA students.

- Domain: mbacopilot.is-a.dev
- Target: cname.vercel-dns.com
- Repo: https://github.com/YOUR_USERNAME/mba-copilot
```
6. Click **"Create pull request"**

### **Option B: Via GitHub CLI**

```bash
# Install GitHub CLI if you don't have it
# Windows: winget install GitHub.cli

# Login
gh auth login

# Create PR
gh pr create --title "feat: add mbacopilot.is-a.dev" --body "Adding mbacopilot.is-a.dev for MBA Copilot"
```

---

## Step 5: Wait for Approval

- ⏱️ **Approval time:** Usually 24-48 hours
- 🔔 You'll get a GitHub notification when approved
- ✅ Once merged, your domain will be active within 1 hour

---

## Step 6: Add Domain to Vercel (After Approval)

Once your PR is merged:

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click **"Add Domain"**
3. Enter: `mbacopilot.is-a.dev`
4. Vercel will verify automatically (since DNS is already set)
5. Wait ~5 minutes for SSL certificate
6. **Done!** ✅

---

## 🎯 Quick Reference

### **Your Domain File Template:**

```json
{
  "description": "MBA Copilot - AI-powered study companion for MBA students",
  "repo": "https://github.com/janmejai2002/mba-copilot",
  "owner": {
    "username": "janmejai2002",
    "email": "your-email@example.com"
  },
  "record": {
    "CNAME": "cname.vercel-dns.com"
  }
}
```

### **Commands Summary:**

```bash
# 1. Clone your fork
git clone https://github.com/YOUR_USERNAME/register.git
cd register

# 2. Create domain file
# Create domains/mbacopilot.json with content above

# 3. Commit and push
git add domains/mbacopilot.json
git commit -m "feat: add mbacopilot.is-a.dev"
git push origin main

# 4. Create PR on GitHub
# Go to your repo and click "Contribute" → "Open pull request"
```

---

## 📝 PR Checklist

Before submitting, make sure:

- [ ] File is named correctly: `domains/yourname.json` (lowercase)
- [ ] JSON is valid (no syntax errors)
- [ ] Email is correct
- [ ] GitHub username is correct
- [ ] CNAME points to `cname.vercel-dns.com`
- [ ] Commit message follows format: `feat: add yourname.is-a.dev`

---

## ⚠️ Common Issues

### **Issue 1: Domain Already Taken**
**Error:** "Domain already exists"
**Solution:** Try a different subdomain:
- `mba-copilot.is-a.dev`
- `mbaai.is-a.dev`
- `studymba.is-a.dev`

### **Issue 2: Invalid JSON**
**Error:** "JSON syntax error"
**Solution:** Validate your JSON at https://jsonlint.com/

### **Issue 3: PR Rejected**
**Reasons:**
- Domain name violates guidelines (offensive, trademarked)
- Invalid CNAME record
- Duplicate domain

**Solution:** Read rejection comment and fix the issue

---

## 🎯 Alternative: Use GitHub Web Editor (No Git Required)

If you don't want to use command line:

1. Go to your forked repo on GitHub
2. Click **"Add file"** → **"Create new file"**
3. Name: `domains/mbacopilot.json`
4. Paste the JSON content
5. Scroll down → **"Commit new file"**
6. Go to original repo: https://github.com/is-a-dev/register
7. Click **"Pull requests"** → **"New pull request"**
8. Click **"compare across forks"**
9. Select your fork
10. Click **"Create pull request"**

---

## ✅ After Your Domain is Live

Update your app to use the new domain:

1. **Update README.md:**
```markdown
🌐 Live Demo: https://mbacopilot.is-a.dev
```

2. **Update Social Links:**
- LinkedIn
- Twitter
- Email signature

3. **Update Google OAuth:**
- Add new domain to authorized origins
- Google Cloud Console → APIs & Services → Credentials

4. **Update Environment Variables:**
If you have any hardcoded URLs in your app

---

## 🎉 Success!

Once approved, you'll have:
```
https://mbacopilot.is-a.dev
```

**Free forever** with:
- ✅ SSL certificate
- ✅ Professional look
- ✅ Easy to remember
- ✅ No .vercel.app suffix

---

**Need help?** Drop a comment on your PR or check the is-a.dev Discord: https://discord.gg/is-a-dev
