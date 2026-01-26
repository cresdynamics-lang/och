#!/bin/bash
# Quick fix for organizations migration issue

cd "$(dirname "$0")"

echo "=========================================="
echo "Fixing Organizations Migration"
echo "=========================================="
echo ""

# Check if organizations table exists
echo "Step 1: Checking if organizations table exists..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute(\"\"\"
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'organizations'
        );
    \"\"\")
    exists = cursor.fetchone()[0]
    print('✅ Organizations table exists' if exists else '❌ Organizations table does not exist')
    exit(0 if exists else 1)
"

if [ $? -eq 0 ]; then
    echo ""
    echo "Step 2: Marking organizations migrations as applied (fake)..."
    python manage.py migrate organizations --fake
    
    if [ $? -eq 0 ]; then
        echo "✅ Organizations migrations marked as applied"
        echo ""
        echo "Step 3: Running remaining migrations..."
        python manage.py migrate
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "=========================================="
            echo "✅ All migrations completed successfully!"
            echo "=========================================="
        else
            echo ""
            echo "❌ Some migrations failed. Check the error above."
            exit 1
        fi
    else
        echo "❌ Failed to fake organizations migrations"
        exit 1
    fi
else
    echo "⚠️  Organizations table does not exist. Running normal migrations..."
    python manage.py migrate
fi


















<<<<<<< HEAD
=======


>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
