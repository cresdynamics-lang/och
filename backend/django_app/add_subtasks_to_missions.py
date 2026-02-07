#!/usr/bin/env python3
"""Add subtasks field to missions table."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Adding subtasks field to missions table...")

with connection.cursor() as cursor:
    # Check if column exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'missions'
            AND column_name = 'subtasks'
        );
    """)
    exists = cursor.fetchone()[0]

    if exists:
        print("[OK] subtasks field already exists")
    else:
        # Add subtasks column
        cursor.execute("""
            ALTER TABLE missions
            ADD COLUMN subtasks JSONB DEFAULT '[]'::jsonb;
        """)
        print("[OK] subtasks field added")

        # Create index for JSONB queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_missions_subtasks
            ON missions USING GIN (subtasks);
        """)
        print("[OK] JSONB index created")

print("\n[DONE] Migrations complete!")
