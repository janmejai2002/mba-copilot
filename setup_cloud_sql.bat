@echo off
set PROJECT_ID=mba-copilot-485805
set REGION=us-central1
set INSTANCE_NAME=vidyos-graph-db
set DB_NAME=vidyos_knowledge_graph
set DB_USER=vidyos_admin
set DB_PASS=SecureGraphPass2026!

echo 🚀 Setting up Cloud SQL for GraphRAG...

echo 1. Enabling Cloud SQL Admin API...
call gcloud services enable sqladmin.googleapis.com --quiet

echo 2. Creating Cloud SQL Instance (PostgreSQL 15)...
call gcloud sql instances create %INSTANCE_NAME% --database-version=POSTGRES_15 --cpu=2 --memory=8GiB --region=%REGION% --root-password=%DB_PASS% --quiet

echo 3. Creating Database...
call gcloud sql databases create %DB_NAME% --instance=%INSTANCE_NAME% --quiet

echo 4. Creating User...
call gcloud sql users create %DB_USER% --instance=%INSTANCE_NAME% --password=%DB_PASS% --quiet

echo 5. Installing pgvector Extension...
echo Note: You may need to connect to the DB via Cloud SQL Auth Proxy to run this manually if the gcloud command doesn't support extension installation directly.
echo Connect to your DB and run: CREATE EXTENSION vector;

echo ✅ Cloud SQL Setup Complete!
