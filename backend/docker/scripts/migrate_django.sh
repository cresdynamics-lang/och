#!/bin/bash
set -e

echo "Running Django migrations..."

cd /app/backend/django_app
python manage.py migrate

echo "Migrations complete."


