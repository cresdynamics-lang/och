-- Run this FIRST if you get "relation sponsor_cohorts does not exist".
-- Creates only sponsor_cohorts (requires "organizations" table).
-- Then run create_sponsor_tables_no_sponsors.sql for billing, or run the full file.

CREATE TABLE IF NOT EXISTS sponsor_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    track_slug VARCHAR(50) NOT NULL,

    target_size INTEGER NOT NULL DEFAULT 100,
    students_enrolled INTEGER NOT NULL DEFAULT 0,

    start_date DATE NULL,
    expected_graduation_date DATE NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,

    target_completion_date DATE NULL,
    budget_allocated NUMERIC(12,2) NOT NULL DEFAULT 0,
    ai_interventions_count INTEGER NOT NULL DEFAULT 0,
    placement_goal INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sponsor_cohorts_org_name_uniq
    ON sponsor_cohorts (organization_id, name);
CREATE INDEX IF NOT EXISTS sponsor_cohorts_org_active_idx
    ON sponsor_cohorts (organization_id, is_active);
CREATE INDEX IF NOT EXISTS sponsor_cohorts_org_status_idx
    ON sponsor_cohorts (organization_id, status);
CREATE INDEX IF NOT EXISTS sponsor_cohorts_track_slug_idx
    ON sponsor_cohorts (track_slug);
CREATE INDEX IF NOT EXISTS sponsor_cohorts_status_idx
    ON sponsor_cohorts (status);
CREATE INDEX IF NOT EXISTS sponsor_cohorts_start_date_idx
    ON sponsor_cohorts (start_date);
CREATE INDEX IF NOT EXISTS sponsor_cohorts_target_completion_idx
    ON sponsor_cohorts (target_completion_date);
