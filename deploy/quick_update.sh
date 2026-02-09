#!/bin/bash
# Quick update script - minimal steps to update and restart
# Run: bash deploy/quick_update.sh

set -e

cd ~/ongozacyberhub

echo "🔄 Updating code..."
git pull origin main || git pull origin master

echo "🔄 Restarting services..."

# Check for PM2
if command -v pm2 &> /dev/null && pm2 list | grep -q ongoza; then
    echo "Using PM2..."
    cd frontend/nextjs_app
    npm install --quiet
    npm run build
    cd ../..
    pm2 restart all
    pm2 save
    echo "✅ Services restarted"
    
# Check for Docker
elif command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo "Using Docker..."
    cd backend
    docker compose pull
    docker compose up -d --build
    echo "✅ Services restarted"
else
    echo "❌ No service manager found"
    exit 1
fi

echo ""
echo "✅ Update complete!"
echo "Testing health endpoint..."
sleep 3
curl -s http://localhost:8000/api/v1/health/ | grep -q "healthy" && echo "✅ Django is healthy" || echo "⚠️  Django health check failed"
