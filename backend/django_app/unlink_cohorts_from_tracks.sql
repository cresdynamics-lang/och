-- Unlink all cohorts from their current program tracks
-- This allows directors to manually assign curriculum tracks instead

-- First, make track_id nullable if it isn't already
ALTER TABLE cohorts ALTER COLUMN track_id DROP NOT NULL;

-- Add curriculum_tracks column for multiple curriculum tracks
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS curriculum_tracks JSONB DEFAULT '[]'::jsonb;

-- Unlink all cohorts from tracks
UPDATE cohorts SET track_id = NULL;

-- Verify
SELECT id, name, track_id, curriculum_tracks FROM cohorts;
