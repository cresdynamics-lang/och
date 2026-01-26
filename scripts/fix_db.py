#!/usr/bin/env python3
"""
Fix database schema for mentor_feedback field
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, '/home/fidel-ochieng-ogola/FIDEL OGOLA PERSONAL FOLDER/Ongoza /ongozaCyberHub/backend/django_app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

def fix_mentor_feedback():
    with connection.cursor() as cursor:
        try:
            # Alter the column to allow null values
            cursor.execute("""
                ALTER TABLE coaching_goals
                ALTER COLUMN mentor_feedback DROP NOT NULL
            """)
            print("✅ Successfully altered mentor_feedback column to allow NULL values")
        except Exception as e:
            print(f"❌ Error altering column: {e}")

if __name__ == '__main__':
    fix_mentor_feedback()
