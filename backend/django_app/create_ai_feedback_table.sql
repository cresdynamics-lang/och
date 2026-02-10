-- Create the missing ai_feedback table used for AI mission review feedback.
-- Fixes: ProgrammingError - relation "ai_feedback" does not exist
-- Run with (PostgreSQL):
--   psql -U your_user -d your_db -f create_ai_feedback_table.sql
-- Or from Django:
--   python manage.py dbshell < backend/django_app/create_ai_feedback_table.sql

CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL,
    feedback_text TEXT NOT NULL DEFAULT '',
    score NUMERIC(5, 2),
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
    improvements JSONB NOT NULL DEFAULT '[]'::jsonb,
    competencies_detected JSONB NOT NULL DEFAULT '[]'::jsonb,
    full_feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    model_version VARCHAR(50) NOT NULL DEFAULT '',
    CONSTRAINT fk_ai_feedback_submission
        FOREIGN KEY (submission_id)
        REFERENCES mission_submissions(id)
        ON DELETE CASCADE
);

-- Helpful indexes for common query patterns
CREATE INDEX IF NOT EXISTS ai_feedback_submission_id_idx
    ON ai_feedback(submission_id);

CREATE INDEX IF NOT EXISTS ai_feedback_score_idx
    ON ai_feedback(score);

