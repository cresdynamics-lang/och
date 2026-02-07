#!/usr/bin/env python
"""Add supporting_recipes column to curriculummodules table."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Adding supporting_recipes column to curriculummodules table...")

with connection.cursor() as cursor:
    try:
        # Check if column exists
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='curriculummodules'
            AND column_name='supporting_recipes';
        """)

        if cursor.fetchone():
            print("[OK] Column 'supporting_recipes' already exists")
        else:
            # Add the column
            cursor.execute("""
                ALTER TABLE curriculummodules
                ADD COLUMN supporting_recipes JSONB DEFAULT '[]'::jsonb NOT NULL;
            """)
            print("[OK] Successfully added 'supporting_recipes' column")

    except Exception as e:
        print(f"[ERROR] {e}")
        raise

print("\nDone!")
