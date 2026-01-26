#!/bin/bash
set -e

echo "Initializing PostgreSQL database for Django..."

# Create database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Database already created by POSTGRES_DB env var
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
EOSQL

echo "Database initialization complete."


