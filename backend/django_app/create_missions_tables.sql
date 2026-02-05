-- Create missions tables for director dashboard

-- Missions table
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id VARCHAR(50),
    module_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
    mission_type VARCHAR(20) NOT NULL DEFAULT 'intermediate',
    requires_mentor_review BOOLEAN DEFAULT FALSE,
    requires_lab_integration BOOLEAN DEFAULT FALSE,
    estimated_duration_min INTEGER NOT NULL CHECK (estimated_duration_min >= 1),
    skills_tags JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mission assignments table
CREATE TABLE mission_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    assignment_type VARCHAR(20) NOT NULL,
    cohort_id UUID,
    student_id UUID,
    assigned_by UUID,
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'assigned',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mission submissions table
CREATE TABLE mission_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES mission_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    content TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'draft',
    score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
    feedback TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX missions_track_active_idx ON missions(track_id, is_active);
CREATE INDEX missions_type_difficulty_idx ON missions(mission_type, difficulty);
CREATE INDEX missions_active_idx ON missions(is_active);

CREATE INDEX mission_assignments_cohort_status_idx ON mission_assignments(cohort_id, status);
CREATE INDEX mission_assignments_student_status_idx ON mission_assignments(student_id, status);
CREATE INDEX mission_assignments_mission_status_idx ON mission_assignments(mission_id, status);

CREATE INDEX mission_submissions_assignment_status_idx ON mission_submissions(assignment_id, status);
CREATE INDEX mission_submissions_student_status_idx ON mission_submissions(student_id, status);
CREATE INDEX mission_submissions_status_submitted_idx ON mission_submissions(status, submitted_at);

-- Add foreign key constraints after table creation
ALTER TABLE missions ADD CONSTRAINT missions_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(uuid_id) ON DELETE SET NULL;

ALTER TABLE mission_assignments ADD CONSTRAINT mission_assignments_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES users(uuid_id) ON DELETE CASCADE;

ALTER TABLE mission_assignments ADD CONSTRAINT mission_assignments_assigned_by_fkey 
    FOREIGN KEY (assigned_by) REFERENCES users(uuid_id) ON DELETE SET NULL;

ALTER TABLE mission_submissions ADD CONSTRAINT mission_submissions_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES users(uuid_id) ON DELETE CASCADE;

ALTER TABLE mission_submissions ADD CONSTRAINT mission_submissions_reviewed_by_fkey 
    FOREIGN KEY (reviewed_by) REFERENCES users(uuid_id) ON DELETE SET NULL;