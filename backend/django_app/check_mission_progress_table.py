#!/usr/bin/env python3
"""Check if mission_progress table exists and create if needed."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Checking if mission_progress table exists...")

with connection.cursor() as cursor:
    # Check if table exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'mission_progress'
        );
    """)
    exists = cursor.fetchone()[0]

    if exists:
        print("[OK] mission_progress table already exists")

        # Show count
        cursor.execute("SELECT COUNT(*) FROM mission_progress")
        count = cursor.fetchone()[0]
        print(f"  Records: {count}")
    else:
        print("[NOT FOUND] mission_progress table does NOT exist")
        print("\nCreating mission_progress table...")

        # Create the table
        cursor.execute("""
            CREATE TABLE mission_progress (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                mission_id UUID NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'locked',
                current_subtask INTEGER NOT NULL DEFAULT 1,
                subtasks_progress JSONB DEFAULT '{}'::jsonb,
                started_at TIMESTAMP WITH TIME ZONE,
                submitted_at TIMESTAMP WITH TIME ZONE,
                ai_score DECIMAL(5, 2),
                mentor_score DECIMAL(5, 2),
                final_status VARCHAR(20),
                reflection TEXT DEFAULT '',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(mission_id, user_id)
            );
        """)
        print("[OK] mission_progress table created")

        # Create indexes
        cursor.execute("CREATE INDEX idx_mp_user_status ON mission_progress(user_id, status);")
        cursor.execute("CREATE INDEX idx_mp_mission_status ON mission_progress(mission_id, status);")
        cursor.execute("CREATE INDEX idx_mp_user_mission ON mission_progress(user_id, mission_id);")
        cursor.execute("CREATE INDEX idx_mp_user_final ON mission_progress(user_id, final_status);")
        cursor.execute("CREATE INDEX idx_mp_submitted ON mission_progress(submitted_at);")
        print("[OK] Indexes created")

        # Check mission_files table
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'mission_files'
            );
        """)
        files_exists = cursor.fetchone()[0]

        if not files_exists:
            print("\nCreating mission_files table...")
            cursor.execute("""
                CREATE TABLE mission_files (
                    id UUID PRIMARY KEY,
                    mission_progress_id UUID NOT NULL REFERENCES mission_progress(id) ON DELETE CASCADE,
                    subtask_number INTEGER NOT NULL,
                    file_url VARCHAR(500) NOT NULL,
                    file_type VARCHAR(50) DEFAULT 'other',
                    filename VARCHAR(255) NOT NULL,
                    file_size BIGINT,
                    metadata JSONB DEFAULT '{}'::jsonb,
                    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)
            print("[OK] mission_files table created")

            # Create indexes for mission_files
            cursor.execute("CREATE INDEX idx_mf_progress_subtask ON mission_files(mission_progress_id, subtask_number);")
            cursor.execute("CREATE INDEX idx_mf_progress_uploaded ON mission_files(mission_progress_id, uploaded_at);")
            print("[OK] mission_files indexes created")

print("\n[OK] Database verification complete!")
