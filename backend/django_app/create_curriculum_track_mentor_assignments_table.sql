-- Create curriculum_track_mentor_assignments table
-- Equivalent to: curriculum/migrations/0015_curriculumtrackmentorassignment.py
-- Allows assigning mentors to curriculum tracks without a program link.
--
-- Requires: curriculum_tracks(id UUID), users(id) — mentor_id type must match users.id (BIGINT).
--
-- Run with: psql -U your_user -d your_db -f create_curriculum_track_mentor_assignments_table.sql
-- Or: python manage.py dbshell < create_curriculum_track_mentor_assignments_table.sql

CREATE TABLE IF NOT EXISTS curriculum_track_mentor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_track_id UUID NOT NULL REFERENCES curriculum_tracks(id) ON DELETE CASCADE,
    mentor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'support',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(curriculum_track_id, mentor_id)
);

CREATE INDEX IF NOT EXISTS curriculum_track_mentor_assignments_curriculum_track_id_idx ON curriculum_track_mentor_assignments(curriculum_track_id);
CREATE INDEX IF NOT EXISTS curriculum_track_mentor_assignments_mentor_id_idx ON curriculum_track_mentor_assignments(mentor_id);
CREATE INDEX IF NOT EXISTS curriculum_track_mentor_assignments_active_idx ON curriculum_track_mentor_assignments(active);
