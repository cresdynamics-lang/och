#!/bin/bash

# Development Setup Script
# Based on DEV_AUTH_SETUP.md
# Usage: ./scripts/dev_setup.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Ongoza CyberHub Development Setup ===${NC}\n"

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "Error: manage.py not found. Please run this script from backend/django_app directory"
    exit 1
fi

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo -e "${YELLOW}Warning: Virtual environment not activated. Activating recommended.${NC}"
fi

# Step 1: Ensure database is migrated
echo -e "${YELLOW}1. Running migrations...${NC}"
python manage.py migrate
echo ""

# Step 2: Seed roles and permissions
echo -e "${YELLOW}2. Seeding roles and permissions...${NC}"
python manage.py seed_roles_permissions
echo ""

# Step 3: Create test users
echo -e "${YELLOW}3. Creating test users...${NC}"
python manage.py create_test_users
echo ""

echo -e "${GREEN}=== Setup Complete ===${NC}\n"
echo "Test users created with password: testpass123"
echo ""
echo "Users:"
echo "  - admin@test.com (Admin)"
echo "  - student@test.com (Student)"
echo "  - mentor@test.com (Mentor)"
echo "  - director@test.com (Program Director)"
echo "  - sponsor@test.com (Sponsor Admin)"
echo "  - analyst@test.com (Analyst)"
echo ""
echo "To test endpoints, run:"
echo "  ./scripts/test_endpoints.sh"
echo ""
echo "Or start the server:"
echo "  python manage.py runserver"

