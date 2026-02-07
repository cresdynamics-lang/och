#!/usr/bin/env python
"""Add missing fields to ai_feedback table."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Adding missing fields to ai_feedback table...")

with connection.cursor() as cursor:
    # Check existing columns
    cursor.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'ai_feedback';
    """)
    existing_columns = [row[0] for row in cursor.fetchall()]
    print(f"Existing columns: {', '.join(existing_columns)}")

    # Add gaps field if missing
    if 'gaps' not in existing_columns:
        print("\nAdding 'gaps' field...")
        cursor.execute("""
            ALTER TABLE ai_feedback
            ADD COLUMN gaps JSONB DEFAULT '[]'::jsonb;
        """)
        print("  [OK] Added 'gaps' field")

    # Add suggestions field if missing
    if 'suggestions' not in existing_columns:
        print("\nAdding 'suggestions' field...")
        cursor.execute("""
            ALTER TABLE ai_feedback
            ADD COLUMN suggestions JSONB DEFAULT '[]'::jsonb;
        """)
        print("  [OK] Added 'suggestions' field")

    # Add competencies_detected field if missing
    if 'competencies_detected' not in existing_columns:
        print("\nAdding 'competencies_detected' field...")
        cursor.execute("""
            ALTER TABLE ai_feedback
            ADD COLUMN competencies_detected JSONB DEFAULT '[]'::jsonb;
        """)
        print("  [OK] Added 'competencies_detected' field")

    # Add full_feedback field if missing
    if 'full_feedback' not in existing_columns:
        print("\nAdding 'full_feedback' field...")
        cursor.execute("""
            ALTER TABLE ai_feedback
            ADD COLUMN full_feedback JSONB DEFAULT '{}'::jsonb;
        """)
        print("  [OK] Added 'full_feedback' field")

    # Make feedback_text nullable
    print("\nMaking 'feedback_text' nullable...")
    cursor.execute("""
        ALTER TABLE ai_feedback
        ALTER COLUMN feedback_text DROP NOT NULL;
    """)
    print("  [OK] Made 'feedback_text' nullable")

print("\n[DONE] ai_feedback table updated successfully!")
