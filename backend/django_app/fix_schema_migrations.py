#!/usr/bin/env python
"""
One-time script to ensure all schema fixes are applied.
Run this after any database reset to ensure the schema is correct.
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
print("SCHEMA FIX SCRIPT")
print("=" * 70)

fixes = [
    {
        'name': 'tier4_unlocked column',
        'sql': '''
            ALTER TABLE user_track_progress
            ADD COLUMN IF NOT EXISTS tier4_unlocked BOOLEAN DEFAULT FALSE
        '''
    },
    {
        'name': 'tier4_mentor_approval column',
        'sql': '''
            ALTER TABLE user_track_progress
            ADD COLUMN IF NOT EXISTS tier4_mentor_approval BOOLEAN DEFAULT FALSE
        '''
    },
    {
        'name': 'tier4_completion_requirements_met column',
        'sql': '''
            ALTER TABLE user_track_progress
            ADD COLUMN IF NOT EXISTS tier4_completion_requirements_met BOOLEAN DEFAULT FALSE
        '''
    },
    {
        'name': 'tier3_completion_requirements_met column',
        'sql': '''
            ALTER TABLE user_track_progress
            ADD COLUMN IF NOT EXISTS tier3_completion_requirements_met BOOLEAN DEFAULT FALSE
        '''
    },
    {
        'name': 'tier3_mentor_approval column',
        'sql': '''
            ALTER TABLE user_track_progress
            ADD COLUMN IF NOT EXISTS tier3_mentor_approval BOOLEAN DEFAULT FALSE
        '''
    },
    {
        'name': 'missions.competencies column',
        'sql': '''
            ALTER TABLE missions
            ADD COLUMN IF NOT EXISTS competencies JSONB DEFAULT '[]'::jsonb
        '''
    },
    {
        'name': 'readiness_scores table',
        'sql': '''
            CREATE TABLE IF NOT EXISTS readiness_scores (
                id SERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                overall_score INTEGER DEFAULT 0,
                technical_score INTEGER DEFAULT 0,
                experience_score INTEGER DEFAULT 0,
                difficulty_level VARCHAR(20) DEFAULT 'beginner',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user_id)
            )
        '''
    },
]

print("\nApplying fixes...")
print("-" * 70)

with connection.cursor() as cursor:
    success_count = 0
    for fix in fixes:
        try:
            cursor.execute(fix['sql'])
            print(f"[OK] {fix['name']}")
            success_count += 1
        except Exception as e:
            print(f"[ERROR] {fix['name']}: {e}")

print("-" * 70)
print(f"\nCompleted: {success_count}/{len(fixes)} fixes applied successfully")
print("=" * 70)
