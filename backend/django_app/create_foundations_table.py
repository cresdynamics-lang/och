#!/usr/bin/env python3
"""Create foundations_progress table"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

def main():
    print("\n" + "="*80)
    print("Creating foundations_progress table")
    print("="*80 + "\n")
    
    with connection.cursor() as cursor:
        print("[1] Creating foundations_progress table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS foundations_progress (
                id UUID PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'not_started',
                completion_percentage DECIMAL(5,2) DEFAULT 0,
                modules_completed JSONB DEFAULT '{}'::jsonb,
                assessment_score DECIMAL(5,2),
                assessment_attempts INTEGER DEFAULT 0,
                goals_reflection TEXT DEFAULT '',
                value_statement TEXT DEFAULT '',
                confirmed_track_key VARCHAR(50) DEFAULT '',
                track_override BOOLEAN DEFAULT FALSE,
                total_time_spent_minutes INTEGER DEFAULT 0,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                transitioned_to_tier2_at TIMESTAMP,
                drop_off_module_id UUID,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        print("[PASS] Table created\n")
        
        print("[2] Creating indexes...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS foundations_progress_user_id_idx 
            ON foundations_progress(user_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS foundations_progress_status_idx 
            ON foundations_progress(status)
        """)
        print("[PASS] Indexes created\n")
        
        print("="*80)
        print("[SUCCESS] foundations_progress table ready!")
        print("="*80 + "\n")

if __name__ == "__main__":
    main()
