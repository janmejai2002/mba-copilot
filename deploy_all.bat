@echo off
SETLOCAL EnableDelayedExpansion

echo ============================================================
echo   VIDYOS FULL DEPLOY - Backend (Cloud Run) + Frontend (Vercel)
echo   %date% %time%
echo ============================================================
echo.

set PROJECT_ID=mba-copilot-485805
set REGION=us-central1
set SERVICE_NAME=vidyos-backend

:: ============================================================
:: STEP 1: Enable required GCP APIs
:: ============================================================
echo [1/6] Enabling GCP APIs (Speech, Run, Build, AI Platform)...
call gcloud config set project %PROJECT_ID%
call gcloud services enable speech.googleapis.com
call gcloud services enable artifactregistry.googleapis.com
call gcloud services enable run.googleapis.com
call gcloud services enable cloudbuild.googleapis.com
call gcloud services enable aiplatform.googleapis.com
echo      Done.
echo.

:: ============================================================
:: STEP 2: Fix IAM Permissions
:: ============================================================
echo [2/6] Setting IAM permissions...
for /f "tokens=*" %%i in ('gcloud projects list --filter="projectId=%PROJECT_ID%" --format="value(projectNumber)"') do set PROJECT_NUMBER=%%i
echo      Project Number: %PROJECT_NUMBER%
call gcloud projects add-iam-policy-binding %PROJECT_ID% --member="serviceAccount:%PROJECT_NUMBER%-compute@developer.gserviceaccount.com" --role="roles/cloudbuild.builds.builder" >nul 2>&1
call gcloud projects add-iam-policy-binding %PROJECT_ID% --member="serviceAccount:%PROJECT_NUMBER%-compute@developer.gserviceaccount.com" --role="roles/aiplatform.user" >nul 2>&1
echo      Done.
echo.

:: ============================================================
:: STEP 3: Deploy Backend to Cloud Run
:: ============================================================
echo [3/6] Deploying Backend to Cloud Run...
echo      This may take 3-5 minutes...
cd backend
call gcloud run deploy %SERVICE_NAME% --source . --region %REGION% --allow-unauthenticated --set-env-vars GCP_PROJECT=%PROJECT_ID%,GCP_LOCATION=%REGION%,GOOGLE_GENAI_USE_VERTEXAI=True --memory=1Gi --timeout=300
if %ERRORLEVEL% NEQ 0 (
    echo      ERROR: Backend deployment failed!
    cd ..
    pause
    exit /b 1
)
cd ..

:: Get the deployed service URL
echo [3b] Getting deployed backend URL...
for /f "tokens=*" %%u in ('gcloud run services describe %SERVICE_NAME% --region %REGION% --format="value(status.url)"') do set BACKEND_URL=%%u
echo      Backend URL: %BACKEND_URL%
echo.

:: ============================================================
:: STEP 4: Update Vercel rewrites with new backend URL
:: ============================================================
echo [4/6] Updating vercel.json with backend URL...
(
echo {
echo     "rewrites": [
echo         {
echo             "source": "/api/agent/:path*",
echo             "destination": "%BACKEND_URL%/api/agent/:path*"
echo         },
echo         {
echo             "source": "/api/gemini",
echo             "destination": "%BACKEND_URL%/api/gemini"
echo         },
echo         {
echo             "source": "/(.*)",
echo             "destination": "/index.html"
echo         }
echo     ]
echo }
) > vercel.json
echo      vercel.json updated.
echo.

:: ============================================================
:: STEP 5: Build Frontend
:: ============================================================
echo [5/6] Building frontend (Vite)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo      ERROR: Frontend build failed!
    pause
    exit /b 1
)
echo      Frontend built successfully.
echo.

:: ============================================================
:: STEP 6: Git commit and push (triggers Vercel deploy)
:: ============================================================
echo [6/6] Committing and pushing to Git...
git add -A
git commit -m "deploy: backend + frontend with Google Chirp STT, LiveContextPanel, enhanced QAConsole"
git push
echo.

:: ============================================================
:: DONE
:: ============================================================
echo ============================================================
echo   DEPLOYMENT COMPLETE!
echo ============================================================
echo.
echo   Backend:  %BACKEND_URL%
echo   Frontend: https://www.vidyos.space (via Vercel)
echo.
echo   New Features Deployed:
echo     - Google Chirp STT (Speech-to-Text V2)
echo     - Live Context Panel (auto keyword extraction)
echo     - Enhanced QA Console (live questions + agent guide)
echo     - Live Knowledge Graph auto-population
echo     - STT provider switch (Deepgram / Google Chirp)
echo.
echo   To test Chirp locally:
echo     cd backend ^&^& python test_chirp.py
echo.
pause
