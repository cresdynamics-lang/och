#!/bin/bash
# Quick start script for Django app setup

set -e

echo "=========================================="
echo "Ongoza CyberHub - Django App Setup"
echo "=========================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ""
    echo "Creating .env file from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Please edit .env file with your database credentials"
    else
        echo "Warning: .env.example not found. Creating basic .env file..."
        cat > .env << EOF
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

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
EOF
    fi
fi

# Create database
echo ""
echo "Creating database..."
python manage.py create_db || echo "Database creation skipped or failed. Please create manually."

# Run migrations
echo ""
echo "Running migrations..."
python manage.py migrate

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your database credentials"
echo "2. Create superuser: python manage.py createsuperuser"
echo "3. Start server: python manage.py runserver"
echo ""
echo "Access:"
echo "- API: http://localhost:8000/api/v1/"
echo "- Admin: http://localhost:8000/admin"
echo "- API Docs: http://localhost:8000/api/schema/swagger-ui/"
echo ""


