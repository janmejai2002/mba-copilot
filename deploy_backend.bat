@echo off
echo 🚀 Deploying Vidyos Backend to Google Cloud Run...

set PROJECT_ID=mba-copilot-485805
set REGION=us-central1
set SERVICE_NAME=vidyos-backend

echo 1. Setting gcloud project...
call gcloud config set project %PROJECT_ID%

echo 2. Enabling required services...
call gcloud services enable artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com

echo 2.5 Fixing IAM permissions (New GCP Security Requirement)...
:: Get the project number automatically
for /f "tokens=*" %%i in ('gcloud projects list --filter="projectId=%PROJECT_ID%" --format="value(projectNumber)"') do set PROJECT_NUMBER=%%i
call gcloud projects add-iam-policy-binding %PROJECT_ID% --member="serviceAccount:%PROJECT_NUMBER%-compute@developer.gserviceaccount.com" --role="roles/cloudbuild.builds.builder"
call gcloud projects add-iam-policy-binding %PROJECT_ID% --member="serviceAccount:%PROJECT_NUMBER%-compute@developer.gserviceaccount.com" --role="roles/aiplatform.user"

echo 3. Deploying to Cloud Run...
cd backend
call gcloud run deploy %SERVICE_NAME% --source . --region %REGION% --allow-unauthenticated --set-env-vars GCP_PROJECT=%PROJECT_ID%

echo ✅ Deployment Complete!
pause
