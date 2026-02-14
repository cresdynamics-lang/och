-- Add missing columns to missions table

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS competencies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS templates JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ideal_path JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS presentation_required BOOLEAN DEFAULT FALSE;
