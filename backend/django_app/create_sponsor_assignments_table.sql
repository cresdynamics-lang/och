-- Create sponsor_cohort_assignments table
CREATE TABLE IF NOT EXISTS sponsor_cohort_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_uuid_id UUID REFERENCES users(uuid_id) ON DELETE CASCADE,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'funding',
    seat_allocation INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    funding_agreement_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sponsor_uuid_id, cohort_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS sponsor_cohort_assignments_sponsor_idx 
    ON sponsor_cohort_assignments(sponsor_uuid_id);

CREATE INDEX IF NOT EXISTS sponsor_cohort_assignments_cohort_idx 
    ON sponsor_cohort_assignments(cohort_id);