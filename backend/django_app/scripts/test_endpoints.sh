#!/bin/bash

# API Testing Script for Ongoza CyberHub
# Based on DEV_AUTH_SETUP.md
# Usage: ./scripts/test_endpoints.sh [base_url]

BASE_URL=${1:-http://localhost:8000/api/v1}
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if jq is available
if command -v jq &> /dev/null; then
    HAS_JQ=true
else
    HAS_JQ=false
    echo -e "${YELLOW}Note: jq not found. Using basic JSON parsing. Install jq for better output.${NC}\n"
fi

# Helper function to extract JSON value
extract_json_value() {
    local json="$1"
    local key="$2"
    
    if [ -z "$json" ] || [ "$json" = "" ]; then
        echo ""
        return
    fi
    
    if [ "$HAS_JQ" = true ]; then
        echo "$json" | jq -r ".$key // empty" 2>/dev/null || echo ""
    else
        # Try Python first (usually available)
        if command -v python3 &> /dev/null; then
            echo "$json" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('$key', '') or '')" 2>/dev/null | grep -v "^$" || echo ""
        elif command -v python &> /dev/null; then
            echo "$json" | python -c "import sys, json; data = json.load(sys.stdin); print(data.get('$key', '') or '')" 2>/dev/null | grep -v "^$" || echo ""
        else
            # Fallback: basic extraction using grep/sed
            echo "$json" | grep -o "\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | sed "s/\"$key\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\"/\1/" | head -1
        fi
    fi
}

# Helper function to pretty print JSON
pretty_json() {
    local json="$1"
    
    if [ "$HAS_JQ" = true ]; then
        echo "$json" | jq '.'
    else
        echo "$json"
    fi
}

# Helper function to make API call and handle errors
api_call() {
    local method="$1"
    local url="$2"
    local headers="$3"
    local data="$4"
    local description="$5"
    
    local response
    local status_code
    local http_code
    local curl_cmd
    
    # Build curl command
    if [ -z "$data" ] || [ "$data" = "" ]; then
        curl_cmd="curl -s -w \"\n%{http_code}\" -X \"$method\" \"$url\" $headers"
    else
        curl_cmd="curl -s -w \"\n%{http_code}\" -X \"$method\" \"$url\" $headers -d '$data'"
    fi
    
    response=$(eval $curl_cmd)
    http_code=$(echo "$response" | tail -n1)
    response=$(echo "$response" | sed '$d')
    
    status_code=$http_code
    
    # Handle different HTTP status codes
    case "$status_code" in
        200|201)
            echo "$response"
            return 0
            ;;
        301|302)
            echo -e "${RED}Error: Redirect ($status_code)${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} URL may be missing trailing slash or endpoint moved." >&2
            echo -e "${YELLOW}Fix:${NC} Try adding trailing slash: ${url%/}/" >&2
            echo "$response"
            return 1
            ;;
        400)
            echo -e "${RED}Error: Bad Request ($status_code)${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} Invalid request data or malformed JSON." >&2
            local error_detail=$(extract_json_value "$response" "detail")
            local error_message=$(extract_json_value "$response" "message")
            if [ ! -z "$error_detail" ]; then
                echo -e "${YELLOW}Detail:${NC} $error_detail" >&2
            elif [ ! -z "$error_message" ]; then
                echo -e "${YELLOW}Message:${NC} $error_message" >&2
            fi
            echo -e "${YELLOW}Response:${NC}" >&2
            pretty_json "$response" >&2
            echo "$response"
            return 1
            ;;
        401)
            echo -e "${RED}Error: Unauthorized ($status_code)${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} Authentication required or token invalid/expired." >&2
            local error_detail=$(extract_json_value "$response" "detail")
            if [ ! -z "$error_detail" ]; then
                echo -e "${YELLOW}Detail:${NC} $error_detail" >&2
            fi
            echo -e "${YELLOW}Fix:${NC} Login again to get a new token." >&2
            echo "$response"
            return 1
            ;;
        403)
            echo -e "${RED}Error: Forbidden ($status_code)${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} User doesn't have permission for this action." >&2
            local error_detail=$(extract_json_value "$response" "detail")
            if [ ! -z "$error_detail" ]; then
                echo -e "${YELLOW}Detail:${NC} $error_detail" >&2
            fi
            echo -e "${YELLOW}Fix:${NC} Use an account with appropriate role/permissions." >&2
            echo "$response"
            return 1
            ;;
        404)
            echo -e "${RED}Error: Not Found ($status_code)${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} Endpoint or resource doesn't exist." >&2
            echo -e "${YELLOW}Fix:${NC} Check URL path and ensure endpoint is registered." >&2
            echo "$response"
            return 1
            ;;
        500)
            echo -e "${RED}Error: Internal Server Error ($status_code)${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} Server-side error occurred. This usually indicates a bug in the server code." >&2
            echo ""
            
            # Try to extract error details
            local error_detail=$(extract_json_value "$response" "detail")
            local error_message=$(extract_json_value "$response" "message")
            local error_type=$(extract_json_value "$response" "type")
            local error_trace=$(extract_json_value "$response" "traceback")
            
            if [ ! -z "$error_detail" ] && [ "$error_detail" != "" ]; then
                echo -e "${YELLOW}Error Detail:${NC}" >&2
                echo "$error_detail" >&2
                echo "" >&2
            elif [ ! -z "$error_message" ] && [ "$error_message" != "" ]; then
                echo -e "${YELLOW}Error Message:${NC}" >&2
                echo "$error_message" >&2
                echo "" >&2
            fi
            
            if [ ! -z "$error_type" ] && [ "$error_type" != "" ]; then
                echo -e "${YELLOW}Error Type:${NC} $error_type" >&2
                echo "" >&2
            fi
            
            # Show full response for debugging
            echo -e "${YELLOW}Full Response:${NC}" >&2
            pretty_json "$response" >&2
            echo "" >&2
            
            # Common causes and fixes
            echo -e "${YELLOW}Common Causes:${NC}" >&2
            echo "  • Missing or misconfigured database tables (run migrations)" >&2
            echo "  • Missing environment variables" >&2
            echo "  • Code errors in view/serializer" >&2
            echo "  • Missing dependencies or imports" >&2
            echo "" >&2
            echo -e "${YELLOW}Debugging Steps:${NC}" >&2
            echo "  1. Check Django server logs/console for full traceback" >&2
            echo "  2. Run: python manage.py check" >&2
            echo "  3. Verify migrations: python manage.py migrate" >&2
            echo "  4. Check .env file has all required variables" >&2
            
            echo "$response"
            return 1
            ;;
        0|000)
            echo -e "${RED}Error: Connection Failed${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} Cannot connect to server." >&2
            echo -e "${YELLOW}Fix:${NC} Ensure server is running: python manage.py runserver" >&2
            echo "$response"
            return 1
            ;;
        *)
            echo -e "${RED}Error: HTTP $status_code${NC}" >&2
            echo -e "${YELLOW}Explanation:${NC} Unexpected status code." >&2
            local error_detail=$(extract_json_value "$response" "detail")
            if [ ! -z "$error_detail" ]; then
                echo -e "${YELLOW}Detail:${NC} $error_detail" >&2
            fi
            echo "$response"
            return 1
            ;;
    esac
}

# Helper to extract error messages from response
extract_error_message() {
    local response="$1"
    
    # Try to extract common error fields
    local detail=$(extract_json_value "$response" "detail")
    local message=$(extract_json_value "$response" "message")
    local error=$(extract_json_value "$response" "error")
    local non_field_errors=$(extract_json_value "$response" "non_field_errors")
    
    if [ ! -z "$detail" ] && [ "$detail" != "" ]; then
        echo "$detail"
    elif [ ! -z "$message" ] && [ "$message" != "" ]; then
        echo "$message"
    elif [ ! -z "$error" ] && [ "$error" != "" ]; then
        echo "$error"
    elif [ ! -z "$non_field_errors" ] && [ "$non_field_errors" != "" ]; then
        echo "$non_field_errors"
    else
        echo ""
    fi
}

echo -e "${GREEN}=== Testing Authentication ===${NC}\n"
echo "Base URL: $BASE_URL"

# Check if server is reachable
if ! curl -s -f "$BASE_URL/../health/" > /dev/null 2>&1 && ! curl -s -f "$BASE_URL/roles" > /dev/null 2>&1; then
    echo -e "${RED}Warning: Server may not be running at $BASE_URL${NC}"
    echo -e "${YELLOW}Start server with: python manage.py runserver${NC}\n"
fi
echo ""

# Test 1: Signup
echo -e "${YELLOW}1. Testing signup...${NC}"
SIGNUP_RESPONSE=$(api_call "POST" "$BASE_URL/auth/signup" \
  "-H \"Content-Type: application/json\"" \
  '{
    "email": "test'$(date +%s)'@example.com",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "User"
  }' \
  "signup")
if [ $? -eq 0 ]; then
  pretty_json "$SIGNUP_RESPONSE"
else
  ERROR_MSG=$(extract_error_message "$SIGNUP_RESPONSE")
  if [ ! -z "$ERROR_MSG" ]; then
    echo -e "${RED}Error:${NC} $ERROR_MSG" >&2
  fi
fi
echo ""

# Test 2: Login
echo -e "${YELLOW}2. Testing login...${NC}"
LOGIN_RESPONSE=$(api_call "POST" "$BASE_URL/auth/login" \
  "-H \"Content-Type: application/json\"" \
  '{
    "email": "student@test.com",
    "password": "testpass123",
    "device_fingerprint": "test-device"
  }' \
  "login")

if [ $? -ne 0 ]; then
  ERROR_MSG=$(extract_error_message "$LOGIN_RESPONSE")
  if [ ! -z "$ERROR_MSG" ]; then
    echo -e "${RED}Login Error:${NC} $ERROR_MSG" >&2
  fi
  echo ""
  echo -e "${YELLOW}Troubleshooting:${NC}" >&2
  echo "  1. Verify server is running: python manage.py runserver" >&2
  echo "  2. Create test users: python manage.py create_test_users" >&2
  echo "  3. Check credentials: email=student@test.com, password=testpass123" >&2
  exit 1
fi

pretty_json "$LOGIN_RESPONSE"

ACCESS_TOKEN=$(extract_json_value "$LOGIN_RESPONSE" "access_token")
REFRESH_TOKEN=$(extract_json_value "$LOGIN_RESPONSE" "refresh_token")

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "" ]; then
  echo -e "${RED}Error: Failed to extract access token${NC}" >&2
  echo -e "${YELLOW}Explanation:${NC} Login response doesn't contain access_token field." >&2
  echo -e "${YELLOW}Response received:${NC}" >&2
  pretty_json "$LOGIN_RESPONSE" >&2
  echo ""
  echo -e "${YELLOW}Fix:${NC} Check server logs and verify login endpoint returns tokens." >&2
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "Access Token: ${ACCESS_TOKEN:0:50}..."
echo ""

# Test 3: Get Current User
echo -e "${YELLOW}3. Testing get current user...${NC}"
RESPONSE=$(api_call "GET" "$BASE_URL/auth/me" \
  "-H \"Authorization: Bearer $ACCESS_TOKEN\"" \
  "" \
  "get current user")
if [ $? -eq 0 ]; then
  pretty_json "$RESPONSE"
else
  ERROR_MSG=$(extract_error_message "$RESPONSE")
  if [ ! -z "$ERROR_MSG" ]; then
    echo -e "${RED}Error:${NC} $ERROR_MSG" >&2
  fi
fi
echo ""

# Test 4: List Roles
echo -e "${YELLOW}4. Testing list roles...${NC}"
RESPONSE=$(api_call "GET" "$BASE_URL/roles/" \
  "-H \"Authorization: Bearer $ACCESS_TOKEN\"" \
  "" \
  "list roles")
if [ $? -eq 0 ]; then
  pretty_json "$RESPONSE"
else
  ERROR_MSG=$(extract_error_message "$RESPONSE")
  if [ ! -z "$ERROR_MSG" ]; then
    echo -e "${RED}Error:${NC} $ERROR_MSG" >&2
  fi
fi
echo ""

# Test 5: List Organizations
echo -e "${YELLOW}5. Testing list organizations...${NC}"
RESPONSE=$(api_call "GET" "$BASE_URL/orgs/" \
  "-H \"Authorization: Bearer $ACCESS_TOKEN\"" \
  "" \
  "list organizations")
if [ $? -eq 0 ]; then
  pretty_json "$RESPONSE"
else
  ERROR_MSG=$(extract_error_message "$RESPONSE")
  if [ ! -z "$ERROR_MSG" ]; then
    echo -e "${RED}Error:${NC} $ERROR_MSG" >&2
  fi
fi
echo ""

# Test 6: Create Organization
echo -e "${YELLOW}6. Testing create organization...${NC}"
RESPONSE=$(api_call "POST" "$BASE_URL/orgs/" \
  "-H \"Authorization: Bearer $ACCESS_TOKEN\" -H \"Content-Type: application/json\"" \
  '{
    "name": "Test Organization",
    "slug": "test-org-'$(date +%s)'",
    "org_type": "sponsor"
  }' \
  "create organization")
if [ $? -eq 0 ]; then
  pretty_json "$RESPONSE"
else
  ERROR_MSG=$(extract_error_message "$RESPONSE")
  if [ ! -z "$ERROR_MSG" ]; then
    echo -e "${RED}Error:${NC} $ERROR_MSG" >&2
  fi
fi
echo ""

# Test 7: List Audit Logs
echo -e "${YELLOW}7. Testing list audit logs...${NC}"
RESPONSE=$(api_call "GET" "$BASE_URL/audit-logs/" \
  "-H \"Authorization: Bearer $ACCESS_TOKEN\"" \
  "" \
  "list audit logs")
if [ $? -eq 0 ]; then
  pretty_json "$RESPONSE"
else
  ERROR_MSG=$(extract_error_message "$RESPONSE")
  if [ ! -z "$ERROR_MSG" ]; then
    echo -e "${RED}Error:${NC} $ERROR_MSG" >&2
  fi
fi
echo ""

# Test 8: Get Audit Statistics
echo -e "${YELLOW}8. Testing get audit statistics...${NC}"
RESPONSE=$(api_call "GET" "$BASE_URL/audit-logs/stats/" \
  "-H \"Authorization: Bearer $ACCESS_TOKEN\"" \
  "" \
  "get audit statistics")
if [ $? -eq 0 ]; then
  pretty_json "$RESPONSE"
else
  ERROR_MSG=$(extract_error_message "$RESPONSE")
  if [ ! -z "$ERROR_MSG" ]; then
    echo -e "${RED}Error:${NC} $ERROR_MSG" >&2
  fi
fi
echo ""

# RBAC Testing
echo -e "${GREEN}=== Testing RBAC ===${NC}\n"

# Test Case 1: Student Access
echo -e "${YELLOW}Test Case 1: Student Access${NC}"
STUDENT_LOGIN=$(api_call "POST" "$BASE_URL/auth/login" \
  "-H \"Content-Type: application/json\"" \
  '{"email":"student@test.com","password":"testpass123"}' \
  "student login")
STUDENT_TOKEN=$(extract_json_value "$STUDENT_LOGIN" "access_token")

if [ ! -z "$STUDENT_TOKEN" ]; then
  echo "Testing student access to users endpoint..."
  RESPONSE=$(api_call "GET" "$BASE_URL/users/" \
    "-H \"Authorization: Bearer $STUDENT_TOKEN\"" \
    "" \
    "student access users")
  if [ $? -eq 0 ]; then
    pretty_json "$RESPONSE"
  else
    ERROR_MSG=$(extract_error_message "$RESPONSE")
    if [ ! -z "$ERROR_MSG" ]; then
      echo -e "${YELLOW}Expected:${NC} Student may not have access to list all users (this is normal for RBAC)" >&2
      echo -e "${RED}Error:${NC} $ERROR_MSG" >&2
    fi
  fi
  echo ""
else
  echo -e "${RED}Error: Failed to get student token${NC}" >&2
  echo -e "${YELLOW}Explanation:${NC} Could not authenticate student user." >&2
  ERROR_MSG=$(extract_error_message "$STUDENT_LOGIN")
  if [ ! -z "$ERROR_MSG" ]; then
    echo -e "${RED}Detail:${NC} $ERROR_MSG" >&2
  fi
fi

# Test Case 2: Admin Access
echo -e "${YELLOW}Test Case 2: Admin Access${NC}"
ADMIN_LOGIN=$(api_call "POST" "$BASE_URL/auth/login" \
  "-H \"Content-Type: application/json\"" \
  '{"email":"admin@test.com","password":"testpass123"}' \
  "admin login")
ADMIN_TOKEN=$(extract_json_value "$ADMIN_LOGIN" "access_token")

if [ ! -z "$ADMIN_TOKEN" ]; then
  echo "Testing admin access to users endpoint..."
  RESPONSE=$(api_call "GET" "$BASE_URL/users/" \
    "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
    "" \
    "admin access users")
  if [ $? -eq 0 ]; then
    pretty_json "$RESPONSE"
  else
    ERROR_MSG=$(extract_error_message "$RESPONSE")
    if [ ! -z "$ERROR_MSG" ]; then
      echo -e "${RED}Error:${NC} $ERROR_MSG" >&2
    fi
  fi
  echo ""
  
  echo "Testing admin access to audit logs..."
  RESPONSE=$(api_call "GET" "$BASE_URL/audit-logs/" \
    "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
    "" \
    "admin access audit logs")
  if [ $? -eq 0 ]; then
    if [ "$HAS_JQ" = true ]; then
      echo "$RESPONSE" | jq '. | length'
    else
      echo "$RESPONSE"
    fi
  else
    ERROR_MSG=$(extract_error_message "$RESPONSE")
    if [ ! -z "$ERROR_MSG" ]; then
      echo -e "${RED}Error:${NC} $ERROR_MSG" >&2
    fi
  fi
  echo ""
else
  echo -e "${RED}Error: Failed to get admin token${NC}" >&2
  echo -e "${YELLOW}Explanation:${NC} Could not authenticate admin user." >&2
  ERROR_MSG=$(extract_error_message "$ADMIN_LOGIN")
  if [ ! -z "$ERROR_MSG" ]; then
    echo -e "${RED}Detail:${NC} $ERROR_MSG" >&2
  fi
fi

# Test Case 3: Role Assignment (Admin only)
if [ ! -z "$ADMIN_TOKEN" ] && [ ! -z "$STUDENT_TOKEN" ]; then
  echo -e "${YELLOW}Test Case 3: Role Assignment${NC}"
  echo "Getting student user ID..."
  STUDENT_ME=$(api_call "GET" "$BASE_URL/auth/me" \
    "-H \"Authorization: Bearer $STUDENT_TOKEN\"" \
    "" \
    "get student profile")
  STUDENT_USER=$(extract_json_value "$STUDENT_ME" "id")
  
  if [ ! -z "$STUDENT_USER" ]; then
    echo "Admin assigning mentor role to student (user ID: $STUDENT_USER)..."
    RESPONSE=$(api_call "POST" "$BASE_URL/users/$STUDENT_USER/roles/" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\" -H \"Content-Type: application/json\"" \
      '{
        "role_id": 2,
        "scope": "global"
      }' \
      "assign role")
    if [ $? -eq 0 ]; then
      pretty_json "$RESPONSE"
    else
      ERROR_MSG=$(extract_error_message "$RESPONSE")
      if [ ! -z "$ERROR_MSG" ]; then
        echo -e "${RED}Error:${NC} $ERROR_MSG" >&2
      fi
    fi
    echo ""
    
    echo "Verifying role assignment..."
    RESPONSE=$(api_call "GET" "$BASE_URL/auth/me" \
      "-H \"Authorization: Bearer $STUDENT_TOKEN\"" \
      "" \
      "verify roles")
    if [ $? -eq 0 ]; then
      if [ "$HAS_JQ" = true ]; then
        echo "$RESPONSE" | jq '.roles'
      else
        echo "$RESPONSE" | grep -o '"roles"[^}]*' || echo "$RESPONSE"
      fi
    fi
    echo ""
  else
    echo -e "${RED}Error: Could not get student user ID${NC}" >&2
    echo -e "${YELLOW}Explanation:${NC} Failed to retrieve student profile." >&2
  fi
fi

# Test 9: Refresh Token
echo -e "${YELLOW}9. Testing refresh token...${NC}"
REFRESH_RESPONSE=$(api_call "POST" "$BASE_URL/auth/token/refresh" \
  "-H \"Content-Type: application/json\"" \
  "{\"refresh_token\": \"$REFRESH_TOKEN\"}" \
  "refresh token")
if [ $? -eq 0 ]; then
  pretty_json "$REFRESH_RESPONSE"
  NEW_ACCESS_TOKEN=$(extract_json_value "$REFRESH_RESPONSE" "access_token")
  if [ ! -z "$NEW_ACCESS_TOKEN" ]; then
    ACCESS_TOKEN=$NEW_ACCESS_TOKEN
    echo -e "${GREEN}✓ Token refreshed${NC}"
  fi
else
  ERROR_MSG=$(extract_error_message "$REFRESH_RESPONSE")
  if [ ! -z "$ERROR_MSG" ]; then
    echo -e "${RED}Error:${NC} $ERROR_MSG" >&2
    echo -e "${YELLOW}Explanation:${NC} Refresh token may be invalid or expired." >&2
  fi
fi
echo ""

echo -e "${GREEN}=== Tests Complete ===${NC}"
echo ""
echo "Access Token: ${ACCESS_TOKEN:0:50}..."
echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
echo ""
echo "To test more endpoints, use:"
echo "  export ACCESS_TOKEN=\"$ACCESS_TOKEN\""
echo "  export REFRESH_TOKEN=\"$REFRESH_TOKEN\""
echo ""
echo "Test users (password: testpass123):"
echo "  - admin@test.com (Admin)"
echo "  - student@test.com (Student)"
echo "  - mentor@test.com (Mentor)"
echo "  - director@test.com (Program Director)"

