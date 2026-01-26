#!/bin/bash
# Start fullstack application
# This script requires Docker permissions (sudo or docker group membership)

set -e

echo "=========================================="
echo "Starting Ongoza CyberHub Fullstack App"
echo "=========================================="
echo ""

# Kill existing processes on development ports
echo "Killing existing processes on ports 3000, 8000, 8001..."
lsof -ti:3000,8000,8001 2>/dev/null | xargs -r kill -9 2>/dev/null || true
sleep 1

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Start backend services with Docker Compose
echo "Starting backend services (PostgreSQL, Django, FastAPI)..."
if docker compose -f docker-compose.yml -f compose.override.dev.yml up -d 2>&1 | grep -q "permission denied"; then
    echo ""
    echo "⚠️  Docker permission issue detected. Trying with sudo..."
    echo "You may be prompted for your password."
    sudo docker compose -f docker-compose.yml -f compose.override.dev.yml up -d
else
    docker compose -f docker-compose.yml -f compose.override.dev.yml up -d
fi

# Wait for services to be healthy
echo ""
echo "Waiting for backend services to be ready..."
sleep 5

# Check service health
echo "Checking service health..."
if curl -s http://localhost:8000/api/v1/health/ > /dev/null 2>&1; then
    echo "✅ Django API is running on http://localhost:8000"
else
    echo "⚠️  Django API health check failed (may still be starting)"
fi

if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "✅ FastAPI is running on http://localhost:8001"
else
    echo "⚠️  FastAPI health check failed (may still be starting)"
fi

# Navigate to frontend directory
cd "../frontend/nextjs_app"

# Start frontend
echo ""
echo "Starting frontend (Next.js)..."
npm run dev &

# Wait a moment for frontend to start
sleep 3

echo ""
echo "=========================================="
echo "✅ Fullstack application started!"
echo "=========================================="
echo ""
echo "Services running:"
echo "  Frontend (Next.js):  http://localhost:3000"
echo "  Django API:          http://localhost:8000"
echo "  FastAPI:             http://localhost:8001"
echo "  Django Admin:        http://localhost:8000/admin"
echo ""
echo "To stop all services:"
echo "  cd backend && sudo docker compose down"
echo "  pkill -f 'next dev'"
echo ""

