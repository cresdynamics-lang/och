-- Add coaching fields to coaching_student_analytics table
ALTER TABLE coaching_student_analytics 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weak_areas JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS next_goals JSONB DEFAULT '[]'::jsonb;

-- Update existing records to have default values
UPDATE coaching_student_analytics 
SET current_streak = 0 
WHERE current_streak IS NULL;

UPDATE coaching_student_analytics 
SET weak_areas = '[]'::jsonb 
WHERE weak_areas IS NULL;

UPDATE coaching_student_analytics 
SET next_goals = '[]'::jsonb 
WHERE next_goals IS NULL;
