#!/bin/bash
# Script to fix the users migration dependency issue

set -e

echo "=========================================="
echo "Fixing Users Migration Dependency"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# Step 1: Create users migration
echo "Step 1: Creating users migration..."
python manage.py makemigrations users

if [ $? -eq 0 ]; then
    echo "✅ Users migration created successfully"
else
    echo "❌ Failed to create users migration"
    echo ""
    echo "If you get errors, try:"
    echo "  python manage.py makemigrations users --name initial"
    exit 1
fi

# Step 2: Create subscriptions migration (if needed)
echo ""
echo "Step 2: Creating subscriptions migration..."
python manage.py makemigrations subscriptions

if [ $? -eq 0 ]; then
    echo "✅ Subscriptions migration created/updated"
else
    echo "⚠️  Subscriptions migration may already exist or have issues"
fi

# Step 3: Run migrations
echo ""
echo "Step 3: Running all migrations..."
python manage.py migrate

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ All migrations completed successfully!"
    echo "=========================================="
else
    echo ""
    echo "=========================================="
    echo "❌ Migrations failed"
    echo "=========================================="
    echo ""
    echo "Troubleshooting:"
    echo "1. Check database connection"
    echo "2. Ensure all dependencies are installed"
    echo "3. Check for circular dependencies"
    exit 1
fi
