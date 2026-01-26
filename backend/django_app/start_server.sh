#!/bin/bash
# Start Django development server

set -e

cd "$(dirname "$0")"

echo "=========================================="
echo "Starting Django Server"
echo "=========================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo ""
    echo "Please run the setup first:"
    echo "  bash quick_start.sh"
    echo ""
    echo "Or create manually:"
    echo "  python3 -m venv venv"
    echo "  source venv/bin/activate"
    echo "  pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Creating basic .env file..."
    cat > .env << EOF
# Django Settings
DJANGO_SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True

# Database Configuration
DB_NAME=ongozacyberhub
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5434

# FastAPI Communication
FASTAPI_BASE_URL=http://localhost:8001

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001
EOF
    echo "✅ Created .env file. Please edit with your database credentials if needed."
fi

# Check database connection
echo "Checking database connection..."
python3 manage.py check --database default 2>/dev/null || {
    echo "⚠️  Database connection check failed. Continuing anyway..."
}

# Check if port 8000 is in use and handle it
PORT=${PORT:-8000}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 || ss -tuln 2>/dev/null | grep -q ":$PORT "; then
    echo ""
    echo "⚠️  Port $PORT is already in use (likely by Docker)!"
    echo ""
    echo "Please choose an option:"
    echo "  1. Stop Docker containers first: cd ../../backend && docker compose down"
    echo "  2. Use a different port: PORT=8001 bash start_server.sh"
    echo ""
    exit 1
fi

echo ""
echo "Starting Django development server on http://localhost:$PORT"
echo "Press Ctrl+C to stop"
echo ""

# Start server
python3 manage.py runserver 0.0.0.0:$PORT

