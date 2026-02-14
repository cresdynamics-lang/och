-- Add missing columns to mission_progress table
-- Fixes: column mission_progress.reflection_required does not exist (POST .../start/ 500)
-- Run with: psql -U <user> -d <database> -f add_mission_progress_reflection_and_enhancements.sql

BEGIN;

-- Reflection fields (required for mission start and reflection submission)
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS reflection TEXT DEFAULT '';
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS reflection_required BOOLEAN DEFAULT FALSE;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS reflection_submitted BOOLEAN DEFAULT FALSE;

-- MissionProgress enhancements (from 0003_add_mission_enhancements)
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS decision_paths JSONB DEFAULT '{}'::jsonb;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS time_per_stage JSONB DEFAULT '{}'::jsonb;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS hints_used JSONB DEFAULT '[]'::jsonb;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS tools_used JSONB DEFAULT '[]'::jsonb;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS drop_off_stage INTEGER;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS subtask_scores JSONB DEFAULT '{}'::jsonb;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS mentor_recommended_recipes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS mentor_reviewed_at TIMESTAMP WITH TIME ZONE;

-- Mastery enhancements (from 0004_mastery_enhancements)
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS presentation_submitted BOOLEAN DEFAULT FALSE;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS presentation_url VARCHAR(500);
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS mentor_feedback_audio_url VARCHAR(500);
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS mentor_feedback_video_url VARCHAR(500);

COMMIT;
