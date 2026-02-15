-- Cohort Public Registration
-- Add homepage publish options to cohorts and create public applications table.
-- Run against your OCH database (PostgreSQL).

-- 1. Add columns to cohorts table
ALTER TABLE cohorts
  ADD COLUMN IF NOT EXISTS published_to_homepage BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS profile_image VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS registration_form_fields JSONB DEFAULT '{}';

-- 2. Create cohort_public_applications table
CREATE TABLE IF NOT EXISTS cohort_public_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  applicant_type VARCHAR(20) NOT NULL CHECK (applicant_type IN ('student', 'sponsor')),
  form_data JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS cohort_pub_cohort_app_idx ON cohort_public_applications (cohort_id, applicant_type);
CREATE INDEX IF NOT EXISTS cohort_pub_status_idx ON cohort_public_applications (status);
