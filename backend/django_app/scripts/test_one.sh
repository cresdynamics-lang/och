#!/bin/bash

BASE_URL="http://localhost:8000/api/v1"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Ongoza CyberHub Endpoint Testing ===${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}1. Health Check...${NC}"
curl -s "$BASE_URL/../health/" | jq '.' || echo "Failed"
echo ""

# Test 2: Signup
echo -e "${YELLOW}2. Testing Signup...${NC}"
curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "User"
  }' | jq '.'
echo ""

# Test 3: Login as Student
echo -e "${YELLOW}3. Testing Login (Student)...${NC}"
STUDENT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"testpass123"}')

STUDENT_TOKEN=$(echo $STUDENT_RESPONSE | jq -r '.access_token // empty')
if [ -z "$STUDENT_TOKEN" ]; then
  echo -e "${RED}Login failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Student login successful${NC}"
echo ""

# Test 4: Get Current User
echo -e "${YELLOW}4. Testing Get Current User...${NC}"
curl -s "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.roles'
echo ""

# Test 5: List Roles
echo -e "${YELLOW}5. Testing List Roles...${NC}"
curl -s "$BASE_URL/roles" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.results | length'
echo ""

# Test 6: Login as Admin
echo -e "${YELLOW}6. Testing Login (Admin)...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"testpass123"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.access_token // empty')
if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}Admin login failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Admin login successful${NC}"
echo ""

# Test 7: List Users (Admin)
echo -e "${YELLOW}7. Testing List Users (Admin)...${NC}"
curl -s "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.results | length'
echo ""

# Test 8: Audit Logs (Admin)
echo -e "${YELLOW}8. Testing Audit Logs (Admin)...${NC}"
curl -s "$BASE_URL/audit-logs/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

echo -e "${GREEN}=== Testing Complete ===${NC}"
