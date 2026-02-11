-- Add missing columns to curriculummodules (fix: column curriculummodules.supporting_recipes does not exist)
-- Run with: psql -U your_user -d your_db -f fix_curriculummodules_columns.sql
-- Or: python manage.py dbshell < fix_curriculummodules_columns.sql

ALTER TABLE curriculummodules ADD COLUMN IF NOT EXISTS supporting_recipes JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE curriculummodules ADD COLUMN IF NOT EXISTS slug VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE curriculummodules ADD COLUMN IF NOT EXISTS is_locked_by_default BOOLEAN NOT NULL DEFAULT true;
