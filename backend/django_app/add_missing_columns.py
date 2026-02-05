#!/usr/bin/env python3
"""Add missing columns to curriculum_tracks"""
import os
import sys
import django

# Add the django_app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Setup Django
django.setup()

from django.db import connection

def main():
    print("\n" + "="*80)
    print("Adding missing columns to curriculum_tracks")
    print("="*80 + "\n")
    
    with connection.cursor() as cursor:
        # Add thumbnail_url column
        print("[1] Adding thumbnail_url column...")
        cursor.execute("""
            ALTER TABLE curriculum_tracks 
            ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(200) DEFAULT ''
        """)
        print("[PASS] thumbnail_url column added\n")
        
        # Add order_number column
        print("[2] Adding order_number column...")
        cursor.execute("""
            ALTER TABLE curriculum_tracks 
            ADD COLUMN IF NOT EXISTS order_number INTEGER DEFAULT 1
        """)
        print("[PASS] order_number column added\n")
        
        print("="*80)
        print("[SUCCESS] All missing columns added!")
        print("="*80 + "\n")
        
        # Verify columns
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name='curriculum_tracks'
            ORDER BY column_name
        """)
        
        print("Current curriculum_tracks columns:")
        for row in cursor.fetchall():
            print(f"  - {row[0]}: {row[1]}")
        print()

if __name__ == "__main__":
    main()
