#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
get_current_user.sh — fetch the current authenticated user for OCH

Calls: <BASE_URL>/api/v1/auth/me

Usage:
  ./scripts/get_current_user.sh [--base http://localhost:8000] [--token <JWT>] [--cookie-jar <path>] [--raw]

Options:
  --base        Django API base URL (default: http://localhost:8000)
  --token       Access token (JWT). If omitted, uses $ACCESS_TOKEN if set.
  --cookie-jar  Path to a Netscape-format cookie jar file for curl (-b).
               (Optional) If it contains access_token, it will also be used as Bearer.
  --raw         Do not pretty-print JSON.

Examples:
  ACCESS_TOKEN="..." ./scripts/get_current_user.sh
  ./scripts/get_current_user.sh --token "..." --base http://localhost:8000
  ./scripts/get_current_user.sh --cookie-jar /tmp/och.cookies
EOF
}

BASE_URL="http://localhost:8000"
TOKEN="${ACCESS_TOKEN:-}"
COOKIE_JAR=""
RAW=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_URL="${2:-}"; shift 2;;
    --token)
      TOKEN="${2:-}"; shift 2;;
    --cookie-jar)
      COOKIE_JAR="${2:-}"; shift 2;;
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

if [[ -n "$COOKIE_JAR" && ! -f "$COOKIE_JAR" ]]; then
  echo "Cookie jar not found: $COOKIE_JAR" >&2
  exit 2
fi

API_URL="${BASE_URL%/}/api/v1/auth/me"

curl_args=(
  --fail-with-body
  --silent
  --show-error
  --request GET
  "$API_URL"
)

# If cookie jar provided, use it.
if [[ -n "$COOKIE_JAR" ]]; then
  curl_args+=( --cookie "$COOKIE_JAR" )

  # Optional: try to pull access_token from cookie jar if TOKEN not provided.
  if [[ -z "$TOKEN" ]]; then
    extracted="$(
      awk 'BEGIN{t=""} $0 !~ /^#/ && $6=="access_token" {t=$7} END{print t}' "$COOKIE_JAR" 2>/dev/null || true
    )"
    if [[ -n "$extracted" ]]; then
      TOKEN="$extracted"
    fi
  fi
fi

# If token is available, send Authorization header.
if [[ -n "$TOKEN" ]]; then
  curl_args+=( --header "Authorization: Bearer ${TOKEN}" )
fi

resp="$(curl "${curl_args[@]}")"

if [[ $RAW -eq 1 ]]; then
  printf '%s\n' "$resp"
  exit 0
fi

if command -v jq >/dev/null 2>&1; then
  printf '%s\n' "$resp" | jq .
else
  printf '%s\n' "$resp"
fi


