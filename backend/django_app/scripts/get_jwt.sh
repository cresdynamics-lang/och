#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
get_jwt.sh — prompt for credentials and fetch a JWT access token for OCH

Default login endpoint:
  POST <BASE_URL>/api/v1/auth/login

Usage:
  ./scripts/get_jwt.sh [--base http://localhost:8000] [--endpoint /api/v1/auth/login] [--raw]

Options:
  --base       API base URL (default: http://localhost:8000)
  --endpoint   Login endpoint path (default: /api/v1/auth/login)
              If you prefer the Next.js proxy route, use:
                --base http://localhost:3000 --endpoint /api/auth/login
  --raw        Print only the token (no export/help text).

Examples:
  ./scripts/get_jwt.sh
  ./scripts/get_jwt.sh --base http://localhost:3000 --endpoint /api/auth/login

Then:
  export ACCESS_TOKEN="..." && ./scripts/get_current_user.sh
EOF
}

BASE_URL="http://localhost:8000"
ENDPOINT="/api/v1/auth/login"
RAW=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_URL="${2:-}"; shift 2;;
    --endpoint)
      ENDPOINT="${2:-}"; shift 2;;
    --raw)
      RAW=1; shift 1;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [[ -z "${BASE_URL}" || -z "${ENDPOINT}" ]]; then
  usage
  exit 2
fi

LOGIN_URL="${BASE_URL%/}${ENDPOINT}"

read -r -p "Email: " EMAIL
if [[ -z "${EMAIL}" ]]; then
  echo "Email is required." >&2
  exit 2
fi

read -r -s -p "Password: " PASSWORD
echo
if [[ -z "${PASSWORD}" ]]; then
  echo "Password is required." >&2
  exit 2
fi

# Include device fields to match frontend payload (harmless if backend ignores).
DEVICE_FINGERPRINT="cli-$(date +%s)"
DEVICE_NAME="CLI"

payload="$(printf '{"email":"%s","password":"%s","device_fingerprint":"%s","device_name":"%s"}' \
  "$(printf '%s' "$EMAIL" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().rstrip())[1:-1])')" \
  "$(printf '%s' "$PASSWORD" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().rstrip())[1:-1])')" \
  "$DEVICE_FINGERPRINT" \
  "$DEVICE_NAME")"

resp="$(
  curl --fail-with-body --silent --show-error \
    --request POST "$LOGIN_URL" \
    --header "Content-Type: application/json" \
    --data "$payload"
)"

extract_token() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$resp" | jq -r '.access_token // .token // .access // empty'
    return
  fi
  if command -v python3 >/dev/null 2>&1; then
    printf '%s' "$resp" | python3 - <<'PY'
import json,sys
data=json.load(sys.stdin)
print(data.get("access_token") or data.get("token") or data.get("access") or "")
PY
    return
  fi
  # Last resort (fragile):
  printf '%s' "$resp" | sed -n 's/.*"access_token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
}

token="$(extract_token)"

if [[ -z "${token}" ]]; then
  # Helpful hint for MFA flows
  if command -v jq >/dev/null 2>&1 && printf '%s' "$resp" | jq -e '.mfa_required == true' >/dev/null 2>&1; then
    echo "Login requires MFA; no access_token returned." >&2
    echo "$resp" | jq .
    exit 3
  fi
  echo "No access_token found in response." >&2
  if command -v jq >/dev/null 2>&1; then
    echo "$resp" | jq .
  else
    echo "$resp"
  fi
  exit 1
fi

if [[ $RAW -eq 1 ]]; then
  printf '%s\n' "$token"
  exit 0
fi

cat <<EOF
ACCESS TOKEN (JWT):
$token

Copy/paste to use with get_current_user.sh:
export ACCESS_TOKEN="$token"
./scripts/get_current_user.sh --base "${BASE_URL%/}"
EOF


