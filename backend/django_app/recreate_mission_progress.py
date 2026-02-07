#!/usr/bin/env python3
"""Recreate mission_progress table with correct foreign key."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import connection

print("Recreating mission_progress table with correct foreign key...")

with connection.cursor() as cursor:
    # Drop the tables if they exist
    print("\n[1] Dropping existing tables...")
    cursor.execute("DROP TABLE IF EXISTS mission_files CASCADE;")
    cursor.execute("DROP TABLE IF EXISTS mission_progress CASCADE;")
    print("    Tables dropped")

    # Create mission_progress with correct UUID foreign key
    print("\n[2] Creating mission_progress table...")
    cursor.execute("""
        CREATE TABLE mission_progress (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(uuid_id) ON DELETE CASCADE,
            mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
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
    print("    mission_progress table created with UUID foreign keys")

    # Create indexes
    print("\n[3] Creating indexes...")
    cursor.execute("CREATE INDEX idx_mp_user_status ON mission_progress(user_id, status);")
    cursor.execute("CREATE INDEX idx_mp_mission_status ON mission_progress(mission_id, status);")
    cursor.execute("CREATE INDEX idx_mp_user_mission ON mission_progress(user_id, mission_id);")
    cursor.execute("CREATE INDEX idx_mp_user_final ON mission_progress(user_id, final_status);")
    cursor.execute("CREATE INDEX idx_mp_submitted ON mission_progress(submitted_at);")
    print("    Indexes created")

    # Create mission_files table
    print("\n[4] Creating mission_files table...")
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
    print("    mission_files table created")

    # Create indexes for mission_files
    print("\n[5] Creating mission_files indexes...")
    cursor.execute("CREATE INDEX idx_mf_progress_subtask ON mission_files(mission_progress_id, subtask_number);")
    cursor.execute("CREATE INDEX idx_mf_progress_uploaded ON mission_files(mission_progress_id, uploaded_at);")
    print("    mission_files indexes created")

print("\n[DONE] Tables recreated successfully with correct foreign keys!")
