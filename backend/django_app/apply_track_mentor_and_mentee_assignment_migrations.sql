-- SQL equivalent of:
--   programs/migrations/0015_trackmentorassignment.py
--   mentorship_coordination/migrations/0003_menteementorassignment_track_id_assignment_type.py
--
-- Run with: psql -U your_user -d your_db -f apply_track_mentor_and_mentee_assignment_migrations.sql
-- Or: python manage.py dbshell < apply_track_mentor_and_mentee_assignment_migrations.sql

-- =============================================================================
-- 1. Create track_mentor_assignments (programs 0015_trackmentorassignment)
-- =============================================================================
-- Requires: tracks(id UUID), users(id BIGINT).

CREATE TABLE IF NOT EXISTS track_mentor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    mentor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'support',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(track_id, mentor_id)
);

CREATE INDEX IF NOT EXISTS track_mentor_assignments_track_id_idx ON track_mentor_assignments(track_id);
CREATE INDEX IF NOT EXISTS track_mentor_assignments_mentor_id_idx ON track_mentor_assignments(mentor_id);
CREATE INDEX IF NOT EXISTS track_mentor_assignments_active_idx ON track_mentor_assignments(active);

-- =============================================================================
-- 2. Add track_id and assignment_type to menteementorassignments (mentorship 0003)
-- =============================================================================

ALTER TABLE menteementorassignments
    ADD COLUMN IF NOT EXISTS track_id VARCHAR(100) NULL;

ALTER TABLE menteementorassignments
    ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) NOT NULL DEFAULT 'cohort';

CREATE INDEX IF NOT EXISTS menteementorassignments_track_id_idx ON menteementorassignments(track_id);
CREATE INDEX IF NOT EXISTS menteementorassignments_assignment_type_idx ON menteementorassignments(assignment_type);
