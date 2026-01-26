#!/bin/bash
# Reset and recreate all Django migrations

set -e

echo "🔄 Resetting Django migrations..."

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# List of apps to create migrations for (excluding Django built-in apps)
APPS=(
    "users"
    "organizations"
    "progress"
    "student_dashboard"
    "mentorship"
    "profiler"
    "coaching"
    "curriculum"
    "recipes"
    "missions"
    "dashboard"
    "subscriptions"
    "mentorship_coordination"
    "programs"
    "sponsor_dashboard"
    "director_dashboard"
    "community"
    "talentscope"
)

echo "📦 Creating fresh migrations for all apps..."
for app in "${APPS[@]}"; do
    if [ -d "$app" ]; then
        echo "  → Creating migrations for $app..."
        python manage.py makemigrations "$app" || echo "    ⚠️  Warning: Failed to create migrations for $app"
    else
        echo "  ⚠️  App $app not found, skipping..."
    fi
done

echo ""
echo "✅ Fresh migrations created!"
echo ""
echo "📝 Next steps:"
echo "   1. Review the migrations: python manage.py showmigrations"
echo "   2. Apply migrations: python manage.py migrate"
echo "   3. If you have existing tables, you may need to use: python manage.py migrate --fake-initial"



















