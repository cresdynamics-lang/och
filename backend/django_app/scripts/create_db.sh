#!/bin/bash
# Script to create PostgreSQL database for Django

set -e

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_NAME=${DB_NAME:-ongozacyberhub}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "Creating database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST:$DB_PORT"

# Create database using psql
PGPASSWORD=${DB_PASSWORD:-postgres} psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres <<-EOSQL
    SELECT 'CREATE DATABASE $DB_NAME'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
EOSQL

if [ $? -eq 0 ]; then
    echo "Database '$DB_NAME' created successfully!"
else
    echo "Error creating database. Make sure PostgreSQL is running and credentials are correct."
    exit 1
fi


