#!/bin/bash
# deploy.sh

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Prepare deployment directory
rm -rf deployment
mkdir -p deployment/backend deployment/frontend

# Copy backend files
cp -r backend/ config/ requirements.txt deployment/backend/
mkdir -p deployment/backend/data/cache deployment/backend/data/backup

# Copy frontend files
cp -r frontend/build/* deployment/frontend/

# Upload to server (using sftp, rsync, or similar)
echo "Uploading files to server..."
rsync -avz deployment/backend/ user@yourserver.com:/path/to/backend/
rsync -avz deployment/frontend/ user@yourserver.com:/path/to/frontend/

# Restart backend service
ssh user@yourserver.com "cd /path/to/backend && source venv/bin/activate && pip install -r requirements.txt && systemctl restart robo-advisor"

echo "Deployment completed!"
