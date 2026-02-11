#!/bin/bash
# Remote update script - Run this locally to update the DigitalOcean server
# Usage: bash deploy/remote_update.sh [server_user@server_ip]

SERVER="${1:-root@159.223.224.136}"
SCRIPT_PATH="deploy/quick_update.sh"

echo "=========================================="
echo "REMOTE UPDATE - DIGITAL OCEAN SERVER"
echo "=========================================="
echo ""
echo "Server: $SERVER"
echo ""

# Check if SSH key exists
if [ -f ~/.ssh/id_rsa ] || [ -f ~/.ssh/id_ed25519 ]; then
    echo "✅ SSH key found"
else
    echo "⚠️  No SSH key found. You may be prompted for password."
fi

echo ""
echo "Connecting to server and running update script..."
echo ""

# Copy the script to server and execute
ssh -o StrictHostKeyChecking=no "$SERVER" << 'ENDSSH'
cd ~/ongozacyberhub || {
    echo "❌ Project directory not found"
    exit 1
}

# Pull latest code including the update script
git pull origin main || git pull origin master

# Make script executable
chmod +x deploy/quick_update.sh 2>/dev/null || chmod +x deploy/update_and_restart.sh

# Run the update script
if [ -f deploy/quick_update.sh ]; then
    bash deploy/quick_update.sh
elif [ -f deploy/update_and_restart.sh ]; then
    bash deploy/update_and_restart.sh
else
    echo "❌ Update script not found. Running manual update..."
    
    # Manual update steps
    git pull origin main || git pull origin master
    
    # Check for PM2
    if command -v pm2 &> /dev/null && pm2 list | grep -q ongoza; then
        echo "Updating with PM2..."
        cd frontend/nextjs_app
        npm install --quiet
        npm run build
        cd ../..
        pm2 restart all
        pm2 save
    fi
    
    # Check for Docker
    if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
        echo "Updating with Docker..."
        cd backend
        docker compose pull
        docker compose up -d --build
    fi
fi

echo ""
echo "✅ Update complete!"
ENDSSH

echo ""
echo "=========================================="
echo "Remote update command sent"
echo "=========================================="
