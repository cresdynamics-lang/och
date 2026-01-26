#!/bin/bash
# Complete setup and start script for Django backend
# This script will check prerequisites and guide you through setup

set -e

echo "=========================================="
echo "Django Backend Setup & Start"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "❌ Error: manage.py not found!"
    echo "Please run this script from the backend/django_app directory"
    exit 1
fi

# Check Python version
echo "Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.12+"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ Python version: $(python3 --version)"

# Check for python3-venv
echo ""
echo "Checking for python3-venv..."
if ! python3 -m venv --help &> /dev/null; then
    echo "❌ python3-venv is not installed"
    echo ""
    echo "Please install it with:"
    echo "  sudo apt install python3.12-venv python3-pip"
    echo ""
    echo "Or on Ubuntu/Debian:"
    echo "  sudo apt update"
    echo "  sudo apt install python3-venv python3-pip"
    exit 1
fi

# Check for pip
echo "Checking for pip..."
if ! python3 -m pip --version &> /dev/null; then
    echo "❌ pip is not installed"
    echo ""
    echo "Please install it with:"
    echo "  sudo apt install python3-pip"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Remove old venv if incomplete
if [ -d "venv" ] && [ ! -f "venv/bin/activate" ]; then
    echo "Removing incomplete virtual environment..."
    rm -rf venv
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip --quiet

# Install dependencies
echo "Installing dependencies (this may take a few minutes)..."
pip install -r requirements.txt

echo ""
echo "✅ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Django Settings
DJANGO_SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True

# Database Configuration
DB_NAME=ongozacyberhub
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# FastAPI Communication
FASTAPI_BASE_URL=http://localhost:8001

# CORS - Add your frontend URL
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001

# Frontend URL for email links
FRONTEND_URL=http://localhost:3001
EOF
    echo "✅ .env file created"
    echo "⚠️  Please edit .env with your database credentials if needed"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "Checking database connection..."
if python manage.py check --database default 2>/dev/null; then
    echo "✅ Database connection OK"
else
    echo "⚠️  Database connection check failed"
    echo "   This is OK if the database doesn't exist yet"
    echo "   Run: python manage.py create_db"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Starting Django development server..."
echo "Server will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

# Start the server
python manage.py runserver 0.0.0.0:8000

