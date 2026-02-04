#!/bin/bash
# =============================================================================
# restore_backup.sh
# Restores a pg_dump (custom format) backup into a target PostgreSQL database.
# Tables that already exist in the target DB are skipped automatically.
# =============================================================================
# Usage:
#   bash restore_backup.sh <backup_file> [options]
#
# Options (override env vars):
#   --host     DB host          (default: env DB_HOST or localhost)
#   --port     DB port          (default: env DB_PORT or 5432)
#   --user     DB user          (default: env DB_USER or postgres)
#   --dbname   DB name          (default: env DB_NAME or ongozacyberhub)
#   --password DB password      (default: env DB_PASSWORD)
#
# Examples:
#   DB_PASSWORD=secret bash restore_backup.sh ./ongozacyberhub
#   bash restore_backup.sh ./ongozacyberhub --host 192.168.1.10 --user postgres --password secret --dbname ongozacyberhub
# =============================================================================

set -e

# ---------- colour helpers ----------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

# ---------- defaults (overridable by env or flags) ----------
HOST="${DB_HOST:-localhost}"
PORT="${DB_PORT:-5432}"
USER="${DB_USER:-postgres}"
DBNAME="${DB_NAME:-ongozacyberhub}"
PASSWORD="${DB_PASSWORD:-}"
BACKUP_FILE=""

# ---------- parse args ----------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)     HOST="$2";     shift 2 ;;
    --port)     PORT="$2";     shift 2 ;;
    --user)     USER="$2";     shift 2 ;;
    --dbname)   DBNAME="$2";   shift 2 ;;
    --password) PASSWORD="$2"; shift 2 ;;
    -*)         echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    *)          BACKUP_FILE="$1"; shift ;;
  esac
done

# ---------- resolve pg tools ----------
# Tries PATH first, then common Windows install paths
resolve_pg_tool() {
  local tool=$1
  if command -v "$tool" &>/dev/null; then
    echo "$tool"; return
  fi
  for ver in 17 16 15 14 13; do
    local p="/c/Program Files/PostgreSQL/$ver/bin/$tool"
    [[ -x "$p" || -f "$p" ]] && { echo "$p"; return; }
  done
  echo -e "${RED}ERROR: $tool not found. Install PostgreSQL client tools or add them to PATH.${NC}" >&2
  exit 1
}

PG_RESTORE=$(resolve_pg_tool pg_restore)
PSQL=$(resolve_pg_tool psql)

# ---------- validation ----------
if [[ -z "$BACKUP_FILE" ]]; then
  echo -e "${RED}Usage: bash restore_backup.sh <backup_file> [--host ...] [--port ...] [--user ...] [--dbname ...] [--password ...]${NC}"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo -e "${RED}Backup file not found: $BACKUP_FILE${NC}"
  exit 1
fi

if [[ -z "$PASSWORD" ]]; then
  echo -e "${YELLOW}No password provided. Set DB_PASSWORD env var or pass --password.${NC}"
  read -rsp "Enter DB password: " PASSWORD
  echo
fi

export PGPASSWORD="$PASSWORD"

# ---------- connectivity check ----------
echo -e "${CYAN}Connecting to ${USER}@${HOST}:${PORT}/${DBNAME} ...${NC}"
if ! "$PSQL" -h "$HOST" -p "$PORT" -U "$USER" -d "$DBNAME" -c "SELECT 1;" &>/dev/null; then
  echo -e "${RED}ERROR: Cannot connect to database. Check credentials and that the database exists.${NC}"
  exit 1
fi
echo -e "${GREEN}Connection OK.${NC}"

# ---------- get table lists ----------
echo -e "${CYAN}Reading tables from backup ...${NC}"
BACKUP_TABLES=$("$PG_RESTORE" --list "$BACKUP_FILE" 2>/dev/null | grep " TABLE public " | awk '{print $6}' | sort)

echo -e "${CYAN}Reading existing tables from database ...${NC}"
LIVE_TABLES=$("$PSQL" -h "$HOST" -p "$PORT" -U "$USER" -d "$DBNAME" -t -c \
  "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" | sed 's/^ *//' | sed '/^$/d' | sort)

# ---------- compute diff ----------
TABLES_TO_IMPORT=$(comm -23 <(echo "$BACKUP_TABLES") <(echo "$LIVE_TABLES"))
TABLES_TO_SKIP=$(comm -12 <(echo "$BACKUP_TABLES") <(echo "$LIVE_TABLES"))

SKIP_COUNT=$(echo "$TABLES_TO_SKIP" | grep -c . || true)
IMPORT_COUNT=$(echo "$TABLES_TO_IMPORT" | grep -c . || true)
# handle blank output
[[ -z "$TABLES_TO_IMPORT" ]] && IMPORT_COUNT=0
[[ -z "$TABLES_TO_SKIP"  ]] && SKIP_COUNT=0

echo ""
echo -e "${GREEN}Tables to import (new):  ${IMPORT_COUNT}${NC}"
echo -e "${YELLOW}Tables to skip (exist):  ${SKIP_COUNT}${NC}"
echo ""

# ---------- nothing to do ----------
if [[ "$IMPORT_COUNT" -eq 0 ]]; then
  echo -e "${YELLOW}All tables already exist in the target database. Nothing to import.${NC}"
  exit 0
fi

# ---------- show what will be imported ----------
echo -e "${CYAN}Tables to import:${NC}"
echo "$TABLES_TO_IMPORT" | while read -r t; do echo -e "  + ${GREEN}${t}${NC}"; done
echo ""

# ---------- build --table flags ----------
TABLE_FLAGS=""
while IFS= read -r t; do
  TABLE_FLAGS+="--table=$t "
done <<< "$TABLES_TO_IMPORT"

# ---------- dry run prompt ----------
read -rp "Proceed with import? [y/N] " CONFIRM
[[ "$CONFIRM" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

# ---------- restore ----------
echo -e "${CYAN}Restoring ...${NC}"
"$PG_RESTORE" \
  -h "$HOST" \
  -p "$PORT" \
  -U "$USER" \
  -d "$DBNAME" \
  --no-owner \
  --no-privileges \
  --no-acl \
  -v \
  $TABLE_FLAGS \
  "$BACKUP_FILE" 2>&1

echo ""
echo -e "${GREEN}Done. ${IMPORT_COUNT} table(s) restored.${NC}"
