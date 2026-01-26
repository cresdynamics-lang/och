#!/bin/bash
# Script to fix migration order issues

set -e

echo "=========================================="
echo "Fixing Migration Order"
echo "=========================================="
echo ""

cd "$(dirname "$0")/.."

# Step 1: Create organizations migrations first
echo "Step 1: Creating organizations migrations..."
python manage.py makemigrations organizations --name initial

if [ $? -eq 0 ]; then
    echo "✅ Organizations migrations created"
else
    echo "❌ Failed to create organizations migrations"
    exit 1
fi

# Step 2: Create progress migrations
echo ""
echo "Step 2: Creating progress migrations..."
python manage.py makemigrations progress --name initial

if [ $? -eq 0 ]; then
    echo "✅ Progress migrations created"
else
    echo "⚠️  Progress migrations failed (may not have models)"
fi

# Step 3: Check if users migrations need to be regenerated
echo ""
echo "Step 3: Checking users migrations..."
if [ -f "users/migrations/0001_initial.py" ]; then
    echo "Users migrations already exist"
    echo "Checking if organizations dependency is correct..."
    
    # Check if dependency exists
    if grep -q "('organizations'," users/migrations/0001_initial.py; then
        echo "✅ Users migration has organizations dependency"
    else
        echo "⚠️  Users migration missing organizations dependency"
        echo "You may need to delete and recreate users migrations:"
        echo "  rm users/migrations/0001_initial.py"
        echo "  python manage.py makemigrations users"
    fi
fi

# Step 4: Run migrations
echo ""
echo "Step 4: Running migrations..."
python manage.py migrate

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Migrations completed successfully!"
    echo "=========================================="
else
    echo ""
    echo "=========================================="
    echo "❌ Migrations failed"
    echo "=========================================="
    echo ""
    echo "Troubleshooting:"
    echo "1. Ensure PostgreSQL is running"
    echo "2. Check database credentials in .env"
    echo "3. Ensure database exists: python manage.py create_db"
    exit 1
fi


