-- Create missing mentor_assignments table
CREATE TABLE IF NOT EXISTS mentor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    mentor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_uuid VARCHAR(36),
    role VARCHAR(20) NOT NULL DEFAULT 'support',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    UNIQUE(cohort_id, mentor_id)
);

CREATE INDEX IF NOT EXISTS mentor_assignments_cohort_id_idx ON mentor_assignments(cohort_id);
CREATE INDEX IF NOT EXISTS mentor_assignments_mentor_id_idx ON mentor_assignments(mentor_id);
CREATE INDEX IF NOT EXISTS mentor_assignments_user_uuid_idx ON mentor_assignments(user_uuid);
CREATE INDEX IF NOT EXISTS mentor_assignments_active_idx ON mentor_assignments(active);

-- Create missing mentorship_cycles table
CREATE TABLE IF NOT EXISTS mentorship_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL UNIQUE REFERENCES cohorts(id) ON DELETE CASCADE,
    duration_weeks INTEGER NOT NULL DEFAULT 12,
    frequency VARCHAR(20) NOT NULL DEFAULT 'weekly',
    milestones JSONB DEFAULT '[]',
    goals JSONB DEFAULT '[]',
    program_type VARCHAR(20) NOT NULL DEFAULT 'builders',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mentorship_cycles_cohort_id_idx ON mentorship_cycles(cohort_id);
CREATE INDEX IF NOT EXISTS mentorship_cycles_program_type_idx ON mentorship_cycles(program_type);

SELECT 'Missing tables created successfully' as result;