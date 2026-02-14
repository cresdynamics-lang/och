-- Create mentorworkqueue table for Mentorship Coordination Engine.
-- Fixes: relation "mentorworkqueue" does not exist
-- Requires: users table (with id BIGINT primary key) must exist.

-- Skip if table already exists (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'mentorworkqueue'
    ) THEN
        CREATE TABLE mentorworkqueue (
            id UUID NOT NULL PRIMARY KEY,
            mentor_id BIGINT NOT NULL,
            mentee_id BIGINT NOT NULL,
            type VARCHAR(20) NOT NULL,
            priority VARCHAR(20) NOT NULL DEFAULT 'normal',
            title VARCHAR(200) NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            reference_id UUID NULL,
            sla_hours INTEGER NOT NULL DEFAULT 48,
            due_at TIMESTAMP WITH TIME ZONE NULL,
            completed_at TIMESTAMP WITH TIME ZONE NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT mentorworkqueue_mentor_id_fkey
                FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT mentorworkqueue_mentee_id_fkey
                FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT mentorworkqueue_type_check
                CHECK (type IN ('mission_review', 'goal_feedback', 'session_notes', 'risk_flag')),
            CONSTRAINT mentorworkqueue_priority_check
                CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
            CONSTRAINT mentorworkqueue_status_check
                CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue'))
        );

        CREATE INDEX mentorworkq_mentor__b7ee6a_idx ON mentorworkqueue (mentor_id, status);
        CREATE INDEX mentorworkq_due_at_2823e8_idx ON mentorworkqueue (due_at);

        RAISE NOTICE 'Table mentorworkqueue created successfully.';
    ELSE
        RAISE NOTICE 'Table mentorworkqueue already exists.';
    END IF;
END
$$;
