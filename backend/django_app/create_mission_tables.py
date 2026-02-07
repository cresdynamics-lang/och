#!/usr/bin/env python3
"""Create mission_artifacts and ai_feedback tables"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Creating mission tables...")

with connection.cursor() as cursor:
    # Create mission_artifacts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mission_artifacts (
            id UUID PRIMARY KEY,
            submission_id UUID NOT NULL REFERENCES mission_submissions(id) ON DELETE CASCADE,
            file_url VARCHAR(500) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_type VARCHAR(50) DEFAULT 'other',
            file_size INTEGER,
            uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    print("[OK] mission_artifacts table created")

    # Create ai_feedback table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_feedback (
            id UUID PRIMARY KEY,
            submission_id UUID NOT NULL REFERENCES mission_submissions(id) ON DELETE CASCADE,
            feedback_text TEXT NOT NULL,
            score DECIMAL(5, 2),
            strengths JSONB DEFAULT '[]'::jsonb,
            improvements JSONB DEFAULT '[]'::jsonb,
            generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            model_version VARCHAR(50) DEFAULT ''
        )
    """)
    print("[OK] ai_feedback table created")

    # Create indexes
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_artifacts_submission
        ON mission_artifacts(submission_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_ai_feedback_submission
        ON ai_feedback(submission_id)
    """)
    print("[OK] Indexes created")

print("\n[DONE] Mission tables ready!")
