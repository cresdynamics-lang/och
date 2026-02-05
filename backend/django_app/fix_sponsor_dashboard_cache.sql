-- Fix sponsor_dashboard_cache table and create sponsor_cohort_dashboard table
-- This resolves missing table and column errors

-- Add missing org_id column to existing sponsor_dashboard_cache table
ALTER TABLE sponsor_dashboard_cache 
ADD COLUMN IF NOT EXISTS org_id BIGINT;

-- Add missing seats_total column
ALTER TABLE sponsor_dashboard_cache 
ADD COLUMN IF NOT EXISTS seats_total INTEGER;

-- Add missing seats_used column
ALTER TABLE sponsor_dashboard_cache 
ADD COLUMN IF NOT EXISTS seats_used INTEGER;

-- Add missing seats_at_risk column
ALTER TABLE sponsor_dashboard_cache 
ADD COLUMN IF NOT EXISTS seats_at_risk INTEGER;

-- Add missing budget_total column
ALTER TABLE sponsor_dashboard_cache 
ADD COLUMN IF NOT EXISTS budget_total DECIMAL(10,2);

-- Add foreign key constraint
ALTER TABLE sponsor_dashboard_cache DROP CONSTRAINT IF EXISTS sponsor_dashboard_cache_org_id_fkey;
ALTER TABLE sponsor_dashboard_cache 
ADD CONSTRAINT sponsor_dashboard_cache_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Add missing org_id column to existing sponsor_cohort_dashboard table
ALTER TABLE sponsor_cohort_dashboard 
ADD COLUMN IF NOT EXISTS org_id BIGINT;

-- Add foreign key constraint for sponsor_cohort_dashboard
ALTER TABLE sponsor_cohort_dashboard DROP CONSTRAINT IF EXISTS sponsor_cohort_dashboard_org_id_fkey;
ALTER TABLE sponsor_cohort_dashboard 
ADD CONSTRAINT sponsor_cohort_dashboard_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Create sponsor_cohort_dashboard table
CREATE TABLE IF NOT EXISTS sponsor_cohort_dashboard (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);