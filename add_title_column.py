#!/usr/bin/env python3
"""Add title column to curriculum_tracks table"""
import psycopg2
import os
from dotenv import load_dotenv

# Load environment from backend/.env
load_dotenv('backend/django_app/.env')

DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'ochdb'),
    'user': os.getenv('DB_USER', 'och_user'),
    'password': os.getenv('DB_PASSWORD', ''),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}

def main():
    print("\n" + "="*80)
    print("Adding title column to curriculum_tracks table")
    print("="*80 + "\n")
    
    try:
        # Connect to database
        print("[INFO] Connecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("[PASS] Connected to database\n")
        
        # Check if title column already exists
        print("[INFO] Checking if title column exists...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='curriculum_tracks' AND column_name='title'
        """)
        if cur.fetchone():
            print("[INFO] title column already exists. Nothing to do.\n")
            cur.close()
            conn.close()
            return
        
        print("[INFO] title column does not exist. Adding it...\n")
        
        # Add title column (VARCHAR 255, default to name value)
        print("[1] Adding title column...")
        cur.execute("ALTER TABLE curriculum_tracks ADD COLUMN title VARCHAR(255)")
        print("[PASS] title column added\n")
        
        # Set title = name for all existing records
        print("[2] Setting title = name for existing records...")
        cur.execute("UPDATE curriculum_tracks SET title = name WHERE title IS NULL")
        affected = cur.rowcount
        print(f"[PASS] Updated {affected} records\n")
        
        # Make title NOT NULL after populating
        print("[3] Setting title as NOT NULL...")
        cur.execute("ALTER TABLE curriculum_tracks ALTER COLUMN title SET NOT NULL")
        print("[PASS] title column is now NOT NULL\n")
        
        # Commit changes
        conn.commit()
        print("="*80)
        print("[SUCCESS] title column added successfully!")
        print("="*80 + "\n")
        
        # Verify the column exists
        print("[INFO] Verifying column exists...")
        cur.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name='curriculum_tracks' AND column_name IN ('slug', 'name', 'title')
            ORDER BY column_name
        """)
        print("\nCurrent columns:")
        for row in cur.fetchall():
            print(f"  - {row[0]}: {row[1]} (nullable: {row[2]})")
        print()
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"\n[FAIL] Error: {e}\n")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        raise

if __name__ == "__main__":
    main()
