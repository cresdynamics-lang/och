#!/bin/bash
set -e

echo "Initializing PostgreSQL vector database with pgvector extension..."

# Create database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable pgvector extension
    CREATE EXTENSION IF NOT EXISTS vector;
    
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
EOSQL

echo "Vector database initialization complete."


