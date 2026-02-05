-- Comprehensive fix for sponsor dashboard tables
-- Based on Django models analysis

-- Fix sponsor_dashboard_cache table
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS org_id BIGINT;
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS seats_total INTEGER DEFAULT 0;
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS seats_used INTEGER DEFAULT 0;
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS seats_at_risk INTEGER DEFAULT 0;
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS budget_total DECIMAL(12,2) DEFAULT 0;
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS budget_used DECIMAL(12,2) DEFAULT 0;
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS budget_used_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS avg_readiness DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS avg_completion_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS graduates_count INTEGER DEFAULT 0;
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS active_cohorts_count INTEGER DEFAULT 0;
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS overdue_invoices_count INTEGER DEFAULT 0;
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS low_utilization_cohorts INTEGER DEFAULT 0;
ALTER TABLE sponsor_dashboard_cache ADD COLUMN IF NOT EXISTS cache_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Fix sponsor_cohort_dashboard table
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS org_id BIGINT;
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS cohort_id BIGINT;
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS cohort_name VARCHAR(200);
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS track_name VARCHAR(200);
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS mode VARCHAR(20);
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS seats_total INTEGER DEFAULT 0;
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS seats_used INTEGER DEFAULT 0;
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS seats_sponsored INTEGER DEFAULT 0;
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS seats_remaining INTEGER DEFAULT 0;
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS avg_readiness DECIMAL(5,2);
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS completion_pct DECIMAL(5,2);
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS portfolio_health_avg DECIMAL(5,2);
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS graduates_count INTEGER DEFAULT 0;
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS at_risk_count INTEGER DEFAULT 0;
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS next_milestone JSONB DEFAULT '{}';
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS upcoming_events JSONB DEFAULT '[]';
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN IF NOT EXISTS flags JSONB DEFAULT '[]';

-- Add foreign key constraints
ALTER TABLE sponsor_dashboard_cache DROP CONSTRAINT IF EXISTS sponsor_dashboard_cache_org_id_fkey;
ALTER TABLE sponsor_dashboard_cache ADD CONSTRAINT sponsor_dashboard_cache_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE sponsor_cohort_dashboard DROP CONSTRAINT IF EXISTS sponsor_cohort_dashboard_org_id_fkey;
ALTER TABLE sponsor_cohort_dashboard ADD CONSTRAINT sponsor_cohort_dashboard_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS sponsor_student_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
    cohort_id BIGINT,
    student_id BIGINT,
    name_anonymized VARCHAR(100),
    readiness_score DECIMAL(5,2),
    completion_pct DECIMAL(5,2),
    portfolio_items INTEGER DEFAULT 0,
    consent_employer_share BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sponsor_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE,
    seats INTEGER,
    value_per_seat DECIMAL(8,2),
    valid_from DATE,
    valid_until DATE,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);