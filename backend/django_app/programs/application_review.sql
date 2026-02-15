-- Application review workflow: mentor assignment, scoring, interview, enrollment
-- Run against your OCH database (PostgreSQL).

-- 1. Add review/interview/enrollment columns to cohort_public_applications
ALTER TABLE cohort_public_applications
  ADD COLUMN IF NOT EXISTS reviewer_mentor_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_score DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS review_graded_at TIMESTAMP WITH TIME ZONE NULL,
  ADD COLUMN IF NOT EXISTS review_status VARCHAR(30) NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'reviewed', 'failed', 'passed')),
  ADD COLUMN IF NOT EXISTS interview_mentor_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS interview_score DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS interview_graded_at TIMESTAMP WITH TIME ZONE NULL,
  ADD COLUMN IF NOT EXISTS interview_status VARCHAR(30) NULL CHECK (interview_status IN ('pending', 'completed', 'failed', 'passed')),
  ADD COLUMN IF NOT EXISTS enrollment_status VARCHAR(30) NULL DEFAULT 'none' CHECK (enrollment_status IN ('none', 'eligible', 'enrolled')),
  ADD COLUMN IF NOT EXISTS enrollment_id UUID NULL;

-- 2. Add cutoff grades to cohorts (for review and interview pass thresholds)
ALTER TABLE cohorts
  ADD COLUMN IF NOT EXISTS review_cutoff_grade DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS interview_cutoff_grade DECIMAL(5,2) NULL;

-- 3. Indexes for mentor lookups
CREATE INDEX IF NOT EXISTS cohort_pub_reviewer_idx ON cohort_public_applications (reviewer_mentor_id) WHERE reviewer_mentor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS cohort_pub_review_status_idx ON cohort_public_applications (cohort_id, review_status);
CREATE INDEX IF NOT EXISTS cohort_pub_interview_status_idx ON cohort_public_applications (cohort_id, interview_status);
