#!/bin/bash
# Update and restart the Ongoza CyberHub application on DigitalOcean
# Run this script on the server: bash deploy/update_and_restart.sh

set -e

echo "=========================================="
echo "ONGOZA CYBERHUB - UPDATE & RESTART"
echo "=========================================="
echo ""

# Navigate to project directory
cd ~/ongozacyberhub || {
    echo "❌ Project directory not found. Cloning repository..."
    git clone https://github.com/strivego254/ongozacyberhub.git ~/ongozacyberhub
    cd ~/ongozacyberhub
}

echo "1. Pulling latest code..."
git pull origin main || git pull origin master || {
    echo "⚠️  Git pull failed, continuing with existing code..."
}
echo "✅ Code updated"
echo ""

# Check if using Docker or PM2
USE_DOCKER=false
if [ -f "docker-compose.yml" ] && command -v docker &> /dev/null; then
    USE_DOCKER=true
    echo "2. Detected Docker setup"
elif command -v pm2 &> /dev/null; then
    echo "2. Detected PM2 setup"
else
    echo "❌ Neither Docker nor PM2 found. Please install one."
    exit 1
fi

if [ "$USE_DOCKER" = true ]; then
    echo ""
    echo "3. Updating Docker services..."
    cd backend || cd . 2>/dev/null
    
    # Stop services
    echo "   Stopping services..."
    docker compose down 2>/dev/null || true
    
    # Pull latest images if using them
    echo "   Pulling latest images..."
    docker compose pull 2>/dev/null || true
    
    # Build and start
    echo "   Building and starting services..."
    docker compose up -d --build
    
    echo "   Waiting for services to be healthy..."
    sleep 10
    
    # Check status
    echo ""
    echo "4. Service Status:"
    docker compose ps
    
    echo ""
    echo "5. Testing endpoints..."
    sleep 5
    HEALTH=$(curl -s http://localhost:8000/api/v1/health/ 2>&1)
    if echo "$HEALTH" | grep -q "healthy"; then
        echo "   ✅ Django health: OK"
    else
        echo "   ⚠️  Django health check failed"
        echo "   Response: $HEALTH"
    fi
    
    OAUTH=$(curl -s "http://localhost:8000/api/v1/auth/google/initiate?role=student" 2>&1)
    if echo "$OAUTH" | grep -q "auth_url"; then
        echo "   ✅ Google OAuth: OK"
    else
        echo "   ⚠️  Google OAuth check failed"
    fi
    
else
    # PM2 setup
    echo ""
    echo "3. Updating frontend dependencies..."
    cd frontend/nextjs_app
    npm install --production=false
    echo "✅ Frontend dependencies updated"
    
    echo ""
    echo "4. Building frontend..."
    npm run build
    echo "✅ Frontend built"
    
    echo ""
    echo "5. Updating backend dependencies..."
    cd ../../backend/django_app
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt --quiet
        echo "✅ Backend dependencies updated"
    fi
    
    echo ""
    echo "6. Running database migrations..."
    python3 manage.py migrate --noinput 2>/dev/null || echo "⚠️  Migrations skipped or failed"
    
    echo ""
    echo "7. Restarting services with PM2..."
    cd ~/ongozacyberhub
    pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
    pm2 save
    
    echo ""
    echo "8. Service Status:"
    pm2 list
    
    echo ""
    echo "9. Testing endpoints..."
    sleep 5
    HEALTH=$(curl -s http://localhost:8000/api/v1/health/ 2>&1)
    if echo "$HEALTH" | grep -q "healthy"; then
        echo "   ✅ Django health: OK"
    else
        echo "   ⚠️  Django health check failed"
        echo "   Response: $HEALTH"
    fi
    
    OAUTH=$(curl -s "http://localhost:8000/api/v1/auth/google/initiate?role=student" 2>&1)
    if echo "$OAUTH" | grep -q "auth_url"; then
        echo "   ✅ Google OAuth: OK"
    else
        echo "   ⚠️  Google OAuth check failed"
    fi
fi

echo ""
echo "10. Checking Nginx..."
if command -v nginx &> /dev/null; then
    sudo nginx -t && echo "   ✅ Nginx config: Valid" || echo "   ❌ Nginx config: Invalid"
    sudo systemctl restart nginx 2>/dev/null && echo "   ✅ Nginx restarted" || echo "   ⚠️  Nginx restart failed"
else
    echo "   ⚠️  Nginx not found"
fi

echo ""
echo "=========================================="
echo "✅ UPDATE & RESTART COMPLETE"
echo "=========================================="
echo ""
echo "Services should now be running with latest code."
echo ""
echo "To check logs:"
if [ "$USE_DOCKER" = true ]; then
    echo "  docker compose logs -f django"
    echo "  docker compose logs -f nextjs"
else
    echo "  pm2 logs ongoza-django"
    echo "  pm2 logs ongoza-nextjs"
fi
echo ""
