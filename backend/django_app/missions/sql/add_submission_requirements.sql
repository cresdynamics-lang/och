-- Add submission_requirements column to missions table
-- Configurable by director: which submission fields are required (notes, files, github, notebook, video)
-- Run with: psql -U <user> -d <database> -f add_submission_requirements.sql

BEGIN;

-- submission_requirements: JSON with {notes_required, notes_min_chars, files_required, github_required, notebook_required, video_required}
ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS submission_requirements JSONB NOT NULL DEFAULT '{"notes_required": true, "notes_min_chars": 20, "files_required": false, "github_required": false, "notebook_required": false, "video_required": false}'::jsonb;

COMMIT;
