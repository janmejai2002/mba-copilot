@echo off
SETLOCAL EnableDelayedExpansion

echo 🚀 Preparing MBA Copilot for Hosting...
echo.

:: 1. Install Dependencies
echo 📦 Installing new serverless and AI dependencies...
call npm install @google/generative-ai @vercel/node dexie --save
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies. Make sure Node.js is installed.
    pause
    exit /b %ERRORLEVEL%
)

:: 2. Ensure Directories
echo 📁 Ensuring project structure...
if not exist "public" mkdir public
if not exist "api" mkdir api
if not exist "public\timetable.json" echo [] > public\timetable.json

:: 3. Git Initialization
echo 🌿 Checking Git status...
git rev-parse --is-inside-work-tree >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 🆕 Initializing Git repository...
    git init
    git branch -M main
)

:: 4. Commit Changes
echo 💾 Staging and committing files...
git add .
git commit -m "🚀 Ready for Vercel: Secure API proxies implemented"

:: 5. Summary and Next Steps
cls
echo ✨ PRE-MANUAL STEPS COMPLETE ✨
echo ----------------------------------------------------
echo.
echo Your project is now optimized and secure for hosting.
echo.
echo 🏁 FINAL MANUAL STEPS:
echo.
echo 1. Create a repository on GitHub (https://github.com/new).
echo 2. Run the following command (replace with your repo URL):
echo    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
echo    git push -u origin main
echo.
echo 3. Go to Vercel (https://vercel.com/new) and import your repo.
echo 4. IMPORTANT: Add these Environment Variables in Vercel:
echo    - GEMINI_API_KEY
echo    - PERPLEXITY_API_KEY
echo    - DEEPGRAM_API_KEY
echo.
echo ----------------------------------------------------
echo Done! 🎓 Your friends can now use the student-side features securely.
echo.
pause
