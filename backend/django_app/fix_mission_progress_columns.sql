-- Add missing columns to mission_progress table
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS reflection_required BOOLEAN DEFAULT FALSE;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS reflection_submitted BOOLEAN DEFAULT FALSE;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS decision_paths JSONB DEFAULT '{}'::jsonb;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS time_per_stage JSONB DEFAULT '{}'::jsonb;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS hints_used JSONB DEFAULT '[]'::jsonb;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS tools_used JSONB DEFAULT '[]'::jsonb;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS drop_off_stage INTEGER;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS subtask_scores JSONB DEFAULT '{}'::jsonb;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS mentor_recommended_recipes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE mission_progress ADD COLUMN IF NOT EXISTS mentor_reviewed_at TIMESTAMP WITH TIME ZONE;
