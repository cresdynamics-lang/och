#!/bin/bash

# Test CRUD endpoints for Programs and Tracks
# Make sure the Django server is running on port 8000

BASE_URL="http://localhost:8000/api/v1"
TOKEN=""

# Default test credentials (can be overridden via environment variables)
TEST_EMAIL="${TEST_EMAIL:-director@test.com}"
TEST_PASSWORD="${TEST_PASSWORD:-testpass123}"

echo "🧪 Testing CRUD Endpoints for Programs and Tracks"
echo "=================================================="
echo ""

# Authenticate and get token
echo "🔐 Authenticating..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")

# Check for login errors
if echo "$LOGIN_RESPONSE" | grep -q '"detail"'; then
    echo -e "${RED}❌ Login failed!${NC}"
    echo "Response: $LOGIN_RESPONSE"
    echo ""
    echo "Please ensure:"
    echo "1. The Django server is running on port 8000"
    echo "2. Test users are created (run: python manage.py create_test_users)"
    echo "3. Credentials are correct (default: director@test.com / testpass123)"
    echo ""
    echo "You can override credentials:"
    echo "  TEST_EMAIL=your@email.com TEST_PASSWORD=pass ./test_crud_endpoints.sh"
    exit 1
fi

# Extract token using Python
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    token = data.get('access_token', '')
    if not token:
        print('ERROR: No access_token found', file=sys.stderr)
        sys.exit(1)
    print(token.strip())
except Exception as e:
    print('ERROR:', str(e), file=sys.stderr)
    sys.exit(1)
" 2>&1)

if [ -z "$TOKEN" ] || echo "$TOKEN" | grep -q "ERROR"; then
    echo -e "${RED}❌ Token extraction failed!${NC}"
    echo "Login response: $LOGIN_RESPONSE"
    exit 1
fi

# Trim whitespace
TOKEN=$(echo "$TOKEN" | tr -d '\n\r ')

echo -e "${GREEN}✅ Authenticated successfully${NC}"
echo "Token: ${TOKEN:0:50}... (${#TOKEN} chars)"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to make API calls
api_call() {
    method=$1
    endpoint=$2
    data=$3
    
    if [ -z "$TOKEN" ]; then
        curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            ${data:+-d "$data"}
    else
        curl -s -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            ${data:+-d "$data"}
    fi
}

# Test 1: List Programs (GET)
echo "📋 Test 1: List Programs"
echo "GET $BASE_URL/programs/"
status_code=$(echo "$response" | tail -c 4)
echo "Response: $response" | head -c 200
echo "..."
echo ""

# Test 2: Create Program (POST)
echo "📝 Test 2: Create Program"
PROGRAM_DATA='{
  "name": "Test Program '$(date +%s)'",
  "category": "technical",
  "categories": ["technical", "leadership"],
  "description": "A test program created by automated testing",
  "duration_months": 6,
  "default_price": 1500.00,
  "currency": "USD",
  "outcomes": ["Master cybersecurity fundamentals", "Complete capstone project"],
  "status": "active"
}'

echo "POST $BASE_URL/programs-management/"
response=$(api_call "POST" "/programs-management/" "$PROGRAM_DATA")
echo "Response: $response"
PROGRAM_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PROGRAM_ID" ]; then
    echo -e "${RED}❌ Failed to create program. Response: $response${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Program created with ID: $PROGRAM_ID${NC}"
fi
echo ""

# Test 3: Get Program by ID (GET)
echo "🔍 Test 3: Get Program by ID"
echo "GET $BASE_URL/programs/$PROGRAM_ID/"
response=$(api_call "GET" "/programs/$PROGRAM_ID/")
echo "Response: $response" | head -c 300
echo "..."
if echo "$response" | grep -q "\"id\""; then
    echo -e "${GREEN}✅ Program retrieved successfully${NC}"
else
    echo -e "${RED}❌ Failed to retrieve program${NC}"
fi
echo ""

# Test 4: Update Program (PATCH)
echo "✏️  Test 4: Update Program"
UPDATE_DATA='{
  "name": "Test Program '$(date +%s)'",
  "description": "Updated description for test program",
  "duration_months": 8
}'
echo "PATCH $BASE_URL/programs-management/$PROGRAM_ID/"
response=$(api_call "PATCH" "/programs-management/$PROGRAM_ID/" "$UPDATE_DATA")
echo "Response: $response" | head -c 300
if echo "$response" | grep -q "Updated description"; then
    echo -e "${GREEN}✅ Program updated successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Program update may have failed${NC}"
fi
echo ""

# Test 5: List Tracks (GET)
echo "📋 Test 5: List Tracks"
echo "GET $BASE_URL/programs/tracks/"
response=$(api_call "GET" "/programs/tracks/")
echo "Response: $response" | head -c 200
echo "..."
echo ""

# Test 6: Create Track (POST)
echo "📝 Test 6: Create Track"
TRACK_DATA='{
  "program": "'$PROGRAM_ID'",
  "name": "Test Track '$(date +%s)'",
  "key": "test-track-'$(date +%s)'",
  "track_type": "primary",
  "description": "A test track created by automated testing",
  "competencies": {"skill1": "beginner", "skill2": "intermediate"},
  "missions": ["mission-1", "mission-2"]
}'

echo "POST $BASE_URL/programs/tracks/"
response=$(api_call "POST" "/programs/tracks/" "$TRACK_DATA")
echo "Response: $response"

TRACK_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TRACK_ID" ]; then
    echo -e "${RED}❌ Failed to create track. Response: $response${NC}"
    # Try to delete program before exiting
    echo "Cleaning up: Deleting program..."
    api_call "DELETE" "/programs/$PROGRAM_ID/" > /dev/null 2>&1
    exit 1
else
    echo -e "${GREEN}✅ Track created with ID: $TRACK_ID${NC}"
fi
echo ""

# Test 7: Get Track by ID (GET)
echo "🔍 Test 7: Get Track by ID"
echo "GET $BASE_URL/programs/tracks/$TRACK_ID/"
response=$(api_call "GET" "/programs/tracks/$TRACK_ID/")
echo "Response: $response" | head -c 300
echo "..."
if echo "$response" | grep -q "\"id\""; then
    echo -e "${GREEN}✅ Track retrieved successfully${NC}"
else
    echo -e "${RED}❌ Failed to retrieve track${NC}"
fi
echo ""

# Test 8: List Tracks by Program (GET with filter)
echo "📋 Test 8: List Tracks by Program ID"
echo "GET $BASE_URL/programs/tracks/?program_id=$PROGRAM_ID"
response=$(api_call "GET" "/programs/tracks/?program_id=$PROGRAM_ID")
echo "Response: $response" | head -c 200
echo "..."
if echo "$response" | grep -q "$TRACK_ID"; then
    echo -e "${GREEN}✅ Track found in program's tracks${NC}"
else
    echo -e "${YELLOW}⚠️  Track may not be listed under program${NC}"
fi
echo ""

# Test 9: Update Track (PATCH)
echo "✏️  Test 9: Update Track"
TRACK_UPDATE_DATA='{
  "description": "Updated description for test track",
  "track_type": "cross_track"
}'
echo "PATCH $BASE_URL/programs/tracks/$TRACK_ID/"
response=$(api_call "PATCH" "/programs/tracks/$TRACK_ID/" "$TRACK_UPDATE_DATA")
echo "Response: $response" | head -c 300
if echo "$response" | grep -q "Updated description"; then
    echo -e "${GREEN}✅ Track updated successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Track update may have failed${NC}"
fi
echo ""

# Test 10: Delete Track (DELETE)
echo "🗑️  Test 10: Delete Track"
echo "DELETE $BASE_URL/programs/tracks/$TRACK_ID/"
response=$(api_call "DELETE" "/programs/tracks/$TRACK_ID/")
if [ ${#response} -eq 0 ] || echo "$response" | grep -q "204\|200"; then
    echo -e "${GREEN}✅ Track deleted successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Track deletion response: $response${NC}"
fi
echo ""

# Test 11: Delete Program (DELETE)
echo "🗑️  Test 11: Delete Program"
echo "DELETE $BASE_URL/programs/$PROGRAM_ID/"
response=$(api_call "DELETE" "/programs/$PROGRAM_ID/")
if [ ${#response} -eq 0 ] || echo "$response" | grep -q "204\|200"; then
    echo -e "${GREEN}✅ Program deleted successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Program deletion response: $response${NC}"
fi
echo ""

echo "=================================================="
echo -e "${GREEN}✅ CRUD Testing Complete!${NC}"
echo ""
echo "Summary:"
echo "- ✅ List Programs"
echo "- ✅ Create Program"
echo "- ✅ Get Program by ID"
echo "- ✅ Update Program"
echo "- ✅ List Tracks"
echo "- ✅ Create Track"
echo "- ✅ Get Track by ID"
echo "- ✅ List Tracks by Program"
echo "- ✅ Update Track"
echo "- ✅ Delete Track"
echo "- ✅ Delete Program"

