-- Create missing director_dashboard_cache table
CREATE TABLE IF NOT EXISTS director_dashboard_cache (
    director_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    active_programs_count INTEGER DEFAULT 0,
    active_cohorts_count INTEGER DEFAULT 0,
    total_seats INTEGER DEFAULT 0,
    seats_used INTEGER DEFAULT 0,
    seats_pending INTEGER DEFAULT 0,
    avg_readiness_score DECIMAL(5,2) DEFAULT 0,
    avg_completion_rate DECIMAL(5,2) DEFAULT 0,
    avg_portfolio_health DECIMAL(5,2) DEFAULT 0,
    avg_mission_approval_time_minutes INTEGER,
    mentor_coverage_pct DECIMAL(5,2) DEFAULT 0,
    mentor_session_completion_pct DECIMAL(5,2) DEFAULT 0,
    mentors_over_capacity_count INTEGER DEFAULT 0,
    mentee_at_risk_count INTEGER DEFAULT 0,
    cohorts_flagged_count INTEGER DEFAULT 0,
    mentors_flagged_count INTEGER DEFAULT 0,
    missions_bottlenecked_count INTEGER DEFAULT 0,
    payments_overdue_count INTEGER DEFAULT 0,
    cache_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS director_dashboard_cache_updated_idx ON director_dashboard_cache(cache_updated_at);

-- Create missing director_cohort_dashboard table
CREATE TABLE IF NOT EXISTS director_cohort_dashboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    director_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    cohort_name VARCHAR(200) NOT NULL,
    track_name VARCHAR(200) NOT NULL,
    start_date DATE,
    end_date DATE,
    mode VARCHAR(20) DEFAULT 'virtual',
    seats_total INTEGER DEFAULT 0,
    seats_used INTEGER DEFAULT 0,
    seats_scholarship INTEGER DEFAULT 0,
    seats_sponsored INTEGER DEFAULT 0,
    enrollment_status JSONB DEFAULT '{}',
    readiness_avg DECIMAL(5,2) DEFAULT 0,
    completion_pct DECIMAL(5,2) DEFAULT 0,
    mentor_coverage_pct DECIMAL(5,2) DEFAULT 0,
    mentor_session_completion_pct DECIMAL(5,2) DEFAULT 0,
    mission_approval_time_avg INTEGER,
    portfolio_health_avg DECIMAL(5,2) DEFAULT 0,
    at_risk_mentees INTEGER DEFAULT 0,
    milestones_upcoming JSONB DEFAULT '[]',
    calendar_events JSONB DEFAULT '[]',
    flags_active JSONB DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(director_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS idx_director_cohort ON director_cohort_dashboard(director_id, cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_dashboard_updated ON director_cohort_dashboard(updated_at);
CREATE INDEX IF NOT EXISTS director_cohort_dashboard_director_idx ON director_cohort_dashboard(director_id);
CREATE INDEX IF NOT EXISTS director_cohort_dashboard_cohort_idx ON director_cohort_dashboard(cohort_id);

SELECT 'Director dashboard tables created successfully' as result;