-- Create sessionfeedback table (mentee feedback on mentorship sessions).
-- Run manually if the table is missing: psql -U postgres -d ongozacyberhub -f sessionfeedback.sql
-- Or from Django app dir: psql $DATABASE_URL -f mentorship_coordination/sessionfeedback.sql

CREATE TABLE IF NOT EXISTS sessionfeedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    mentee_id BIGINT NOT NULL,
    mentor_id BIGINT NOT NULL,
    overall_rating INTEGER NOT NULL,
    mentor_engagement INTEGER NOT NULL,
    mentor_preparation INTEGER NOT NULL,
    session_value INTEGER NOT NULL,
    strengths TEXT NOT NULL DEFAULT '',
    areas_for_improvement TEXT NOT NULL DEFAULT '',
    additional_comments TEXT NOT NULL DEFAULT '',
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sessionfeedback_session FOREIGN KEY (session_id) REFERENCES mentorsessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_sessionfeedback_mentee FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sessionfeedback_mentor FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT sessionfeedback_session_mentee_unique UNIQUE (session_id, mentee_id)
);

CREATE INDEX IF NOT EXISTS sessionfeed_session_abce82_idx ON sessionfeedback(session_id, mentee_id);
CREATE INDEX IF NOT EXISTS sessionfeed_mentor__6b6df4_idx ON sessionfeedback(mentor_id);
CREATE INDEX IF NOT EXISTS sessionfeed_submitt_eed67e_idx ON sessionfeedback(submitted_at);
