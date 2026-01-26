#!/bin/bash
# Complete test runner for missions module

echo "=== Missions Module Test Suite ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Unit Tests
echo -e "${YELLOW}Running unit tests...${NC}"
cd ../../../../../
npm test -- missions 2>/dev/null || echo -e "${RED}Unit tests failed or not configured${NC}"
echo ""

# Test 2: Mobile Upload Test
echo -e "${YELLOW}Testing mobile upload functionality...${NC}"
cd frontend/nextjs_app/app/dashboard/student/missions/scripts
bash test-mobile-upload.sh
echo ""

# Test 3: Lighthouse Performance Test
echo -e "${YELLOW}Running Lighthouse performance test...${NC}"
if command -v node &> /dev/null; then
    if [ -f "lighthouse-test.js" ]; then
        node lighthouse-test.js || echo -e "${RED}Lighthouse test failed${NC}"
    else
        echo -e "${YELLOW}Lighthouse test script not found${NC}"
    fi
else
    echo -e "${YELLOW}Node.js not found - skipping Lighthouse test${NC}"
    echo "Install Lighthouse CLI: npm install -g lighthouse"
fi
echo ""

echo -e "${GREEN}=== Test Suite Complete ===${NC}"
echo ""
echo "Manual Testing Required:"
echo "  - Test camera upload on iOS device"
echo "  - Test camera upload on Android device"
echo "  - Run Lighthouse on actual mobile device"
echo ""

