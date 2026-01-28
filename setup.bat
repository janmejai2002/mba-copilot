@echo off
echo [MBA Copilot] - Starting System Setup...
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b
)

echo [1/3] Cleaning up old dependencies...
if exist node_modules (
    echo Removing existing node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    del /f package-lock.json
)

echo [2/3] Installing dependencies from package.json...
call npm install

echo [3/3] Verifying installation...
call npm list @deepgram/sdk @google/genai

echo.
echo ======================================================
echo Setup Complete!
echo.
echo 1. Check your .env.local file and add your API keys.
echo 2. Run 'npm run dev' to start the application.
echo ======================================================
pause
