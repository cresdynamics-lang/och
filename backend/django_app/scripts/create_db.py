#!/usr/bin/env python
"""
Script to create PostgreSQL database for Django.
Run this script before running migrations.
"""
import os
import sys
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    parent_env = BASE_DIR.parent / '.env'
    if parent_env.exists():
        load_dotenv(parent_env)

# Database configuration from environment
DB_NAME = os.environ.get('DB_NAME', 'ongozacyberhub')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'postgres')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '5432')

def create_database():
    """Create the database if it doesn't exist."""
    try:
        # Connect to PostgreSQL server (connect to 'postgres' database)
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database='postgres'  # Connect to default database
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (DB_NAME,)
        )
        
        exists = cursor.fetchone()
        
        if exists:
            print(f"Database '{DB_NAME}' already exists.")
        else:
            # Create database
            cursor.execute(
                sql.SQL("CREATE DATABASE {}").format(
                    sql.Identifier(DB_NAME)
                )
            )
            print(f"Database '{DB_NAME}' created successfully!")
        
        cursor.close()
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"Error connecting to PostgreSQL: {e}")
        print("\nMake sure:")
        print("1. PostgreSQL is running")
        print("2. Database credentials are correct in .env file")
        print("3. User has permission to create databases")
        sys.exit(1)
    except Exception as e:
        print(f"Error creating database: {e}")
        sys.exit(1)

if __name__ == '__main__':
    print(f"Creating database: {DB_NAME}")
    print(f"User: {DB_USER}")
    print(f"Host: {DB_HOST}:{DB_PORT}")
    print("-" * 50)
    create_database()


