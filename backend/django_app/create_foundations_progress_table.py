#!/usr/bin/env python
"""
Create foundations_progress table
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

print("=" * 70)
print("CREATE FOUNDATIONS_PROGRESS TABLE")
print("=" * 70)

sql = """
CREATE TABLE IF NOT EXISTS foundations_progress (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'not_started' NOT NULL,
    completion_percentage DECIMAL(5,2) DEFAULT 0 NOT NULL,
    modules_completed JSONB DEFAULT '{}'::jsonb NOT NULL,
    assessment_score DECIMAL(5,2),
    assessment_attempts INTEGER DEFAULT 0 NOT NULL,
    goals_reflection TEXT DEFAULT '',
    value_statement TEXT DEFAULT '',
    confirmed_track_key VARCHAR(50) DEFAULT '',
    track_override BOOLEAN DEFAULT FALSE NOT NULL,
    total_time_spent_minutes INTEGER DEFAULT 0 NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    transitioned_to_tier2_at TIMESTAMP WITH TIME ZONE,
    drop_off_module_id UUID,
    last_accessed_module_id UUID,
    interactions JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS foundations_progress_user_id_idx ON foundations_progress(user_id);
CREATE INDEX IF NOT EXISTS foundations_progress_status_idx ON foundations_progress(status);
"""

try:
    with connection.cursor() as cursor:
        cursor.execute(sql)
    print("[OK] foundations_progress table created successfully")
except Exception as e:
    print(f"[ERROR] Error creating table: {e}")
    sys.exit(1)

print("=" * 70)
