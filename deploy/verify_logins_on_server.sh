#!/bin/bash
# Script to verify login functionality on Digital Ocean production server
# Run this script on the server: bash deploy/verify_logins_on_server.sh

echo "=========================================="
echo "LOGIN SYSTEM VERIFICATION - PRODUCTION"
echo "=========================================="
echo ""

# Check if Django is running
echo "1. Checking Django Service:"
if command -v pm2 &> /dev/null; then
    echo "   PM2 Status:"
    pm2 list | grep -E "ongoza-django|ongoza-nextjs" || echo "   ⚠️  PM2 processes not found"
elif docker compose ps &> /dev/null; then
    echo "   Docker Status:"
    docker compose ps | grep django || echo "   ⚠️  Django container not running"
else
    echo "   ⚠️  Neither PM2 nor Docker found"
fi
echo ""

# Test health endpoint
echo "2. Testing Health Endpoint:"
HEALTH_RESPONSE=$(curl -s http://localhost:8000/api/v1/health/ 2>&1)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "   ✅ Django health endpoint: OK"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "   ❌ Django health endpoint: FAILED"
    echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

# Test login endpoint validation
echo "3. Testing Login Endpoint Validation:"
LOGIN_VALIDATION=$(curl -s -X POST http://localhost:8000/api/v1/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"email":"","password":"test"}' 2>&1)
if echo "$LOGIN_VALIDATION" | grep -q "email\|This field"; then
    echo "   ✅ Login validation: Working"
    echo "$LOGIN_VALIDATION" | python3 -m json.tool 2>/dev/null | head -3 || echo "$LOGIN_VALIDATION" | head -3
else
    echo "   ❌ Login validation: FAILED"
    echo "   Response: $LOGIN_VALIDATION"
fi
echo ""

# Test Google OAuth
echo "4. Testing Google OAuth Initiate:"
OAUTH_RESPONSE=$(curl -s "http://localhost:8000/api/v1/auth/google/initiate?role=student" 2>&1)
if echo "$OAUTH_RESPONSE" | grep -q "auth_url"; then
    echo "   ✅ Google OAuth initiate: Working"
    echo "$OAUTH_RESPONSE" | python3 -m json.tool 2>/dev/null | head -2 || echo "$OAUTH_RESPONSE" | head -2
else
    echo "   ❌ Google OAuth initiate: FAILED"
    echo "   Response: $OAUTH_RESPONSE"
fi
echo ""

# Check recent login logs
echo "5. Recent Login Activity (last 50 lines):"
if command -v pm2 &> /dev/null; then
    echo "   PM2 Logs:"
    pm2 logs ongoza-django --lines 50 --nostream 2>/dev/null | grep -i "login\|auth\|oauth" | tail -10 || echo "   No login activity found"
elif docker compose logs django --tail 50 2>/dev/null | grep -qi "login\|auth"; then
    echo "   Docker Logs:"
    docker compose logs django --tail 50 2>/dev/null | grep -i "login\|auth\|oauth" | tail -10
else
    echo "   ⚠️  Cannot access logs"
fi
echo ""

# Check active users
echo "6. Active Users in Database:"
cd ~/ongozacyberhub/backend/django_app 2>/dev/null || cd backend/django_app 2>/dev/null || echo "   ⚠️  Cannot find Django app directory"
if [ -f manage.py ]; then
    python3 manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
active_count = User.objects.filter(is_active=True).count()
print(f'   Total active users: {active_count}')
" 2>/dev/null || echo "   ⚠️  Cannot query database"
else
    echo "   ⚠️  manage.py not found"
fi
echo ""

# Check Nginx status
echo "7. Nginx Status:"
if command -v nginx &> /dev/null; then
    sudo nginx -t 2>&1 | grep -q "successful" && echo "   ✅ Nginx configuration: Valid" || echo "   ❌ Nginx configuration: Invalid"
    sudo systemctl is-active nginx &>/dev/null && echo "   ✅ Nginx service: Running" || echo "   ❌ Nginx service: Not running"
else
    echo "   ⚠️  Nginx not installed"
fi
echo ""

echo "=========================================="
echo "VERIFICATION COMPLETE"
echo "=========================================="
echo ""
echo "If any tests failed, check:"
echo "  1. Services are running (pm2 list or docker compose ps)"
echo "  2. Ports are open (sudo ufw status)"
echo "  3. Nginx is configured correctly (sudo nginx -t)"
echo "  4. Database is accessible"
echo ""
