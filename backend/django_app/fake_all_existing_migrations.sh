#!/bin/bash
# Fake all migrations for tables that already exist in the database

cd "$(dirname "$0")"

echo "=========================================="
echo "Faking Migrations for Existing Tables"
echo "=========================================="
echo ""

# List of apps to fake migrations for
APPS=(
    "admin"
    "auth"
    "contenttypes"
    "sessions"
    "organizations"
    "users"
    "subscriptions"
    "programs"
    "missions"
    "progress"
    "student_dashboard"
    "mentorship"
    "mentorship_coordination"
    "profiler"
    "coaching"
    "talentscope"
    "sponsor_dashboard"
    "director_dashboard"
)

echo "Faking migrations for the following apps:"
for app in "${APPS[@]}"; do
    echo "  - $app"
done
echo ""

# Fake each app's migrations
for app in "${APPS[@]}"; do
    echo -n "Faking $app migrations... "
    if python manage.py migrate "$app" --fake > /dev/null 2>&1; then
        echo "✅"
    else
        echo "⚠️  (may not have migrations or table doesn't exist)"
    fi
done

echo ""
echo "=========================================="
echo "Running Remaining Migrations"
echo "=========================================="
echo ""

# Now run real migrations
if python manage.py migrate; then
    echo ""
    echo "=========================================="
    echo "✅ All migrations completed successfully!"
    echo "=========================================="
else
    echo ""
    echo "=========================================="
    echo "❌ Some migrations failed"
    echo "=========================================="
    echo ""
    echo "Check the error above. You may need to:"
    echo "1. Fake additional app migrations manually"
    echo "2. Check for migration conflicts"
    echo "3. Review the database schema"
    exit 1
fi


















<<<<<<< HEAD
=======


>>>>>>> 2dec75ef9a2e0cb3f6d23cb1cb96026bd538f407
