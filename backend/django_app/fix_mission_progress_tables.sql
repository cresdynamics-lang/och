-- Create mission_progress and mission_files tables if they do not exist.
-- Fixes: ProgrammingError - relation "mission_progress" does not exist
-- Run with: psql -U your_user -d your_db -f fix_mission_progress_tables.sql
-- Or from Django: python manage.py dbshell < fix_mission_progress_tables.sql

-- mission_progress (user_id and mission_id are UUIDs; add FK to users(uuid_id)/missions(id) if desired)
CREATE TABLE IF NOT EXISTS mission_progress (
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

CREATE INDEX IF NOT EXISTS idx_mp_user_status ON mission_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_mp_mission_status ON mission_progress(mission_id, status);
CREATE INDEX IF NOT EXISTS idx_mp_user_mission ON mission_progress(user_id, mission_id);
CREATE INDEX IF NOT EXISTS idx_mp_user_final ON mission_progress(user_id, final_status);
CREATE INDEX IF NOT EXISTS idx_mp_submitted ON mission_progress(submitted_at);

-- mission_files (depends on mission_progress)
CREATE TABLE IF NOT EXISTS mission_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_progress_id UUID NOT NULL REFERENCES mission_progress(id) ON DELETE CASCADE,
    subtask_number INTEGER NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'other',
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mf_progress_subtask ON mission_files(mission_progress_id, subtask_number);
CREATE INDEX IF NOT EXISTS idx_mf_progress_uploaded ON mission_files(mission_progress_id, uploaded_at);
