-- Sponsor cohorts and billing only. No "sponsors" table.
-- Sponsors = users with sponsor role / organizations with org_type='sponsor'.
--
-- IMPORTANT: Run the ENTIRE file from top to bottom (same DB as Django).
-- If you see "relation sponsor_cohorts does not exist", run this whole file
-- from the start; the "sponsor_cohorts" table must be created before "sponsor_cohort_billing".
-- Requires: "organizations" table must already exist.

-- ========== 1) Create sponsor_cohorts FIRST ==========
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

-- ========== 2) Then create sponsor_cohort_billing (depends on sponsor_cohorts) ==========
CREATE TABLE IF NOT EXISTS sponsor_cohort_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_cohort_id UUID NOT NULL REFERENCES sponsor_cohorts(id) ON DELETE CASCADE,

    billing_month DATE NOT NULL,

    students_active INTEGER NOT NULL DEFAULT 0,
    mentor_sessions INTEGER NOT NULL DEFAULT 0,
    lab_usage_hours INTEGER NOT NULL DEFAULT 0,
    hires INTEGER NOT NULL DEFAULT 0,

    platform_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    mentor_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    lab_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    scholarship_cost NUMERIC(12,2) NOT NULL DEFAULT 0,

    revenue_share_kes NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_roi NUMERIC(8,2) NULL,

    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMPTZ NULL,
    invoice_generated BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sponsor_cohort_billing_cohort_month_uniq
    ON sponsor_cohort_billing (sponsor_cohort_id, billing_month);
CREATE INDEX IF NOT EXISTS sponsor_coh_sponsor_7b88f4_idx
    ON sponsor_cohort_billing (sponsor_cohort_id, billing_month);
CREATE INDEX IF NOT EXISTS sponsor_coh_billing_ef9845_idx
    ON sponsor_cohort_billing (billing_month, payment_status);
CREATE INDEX IF NOT EXISTS sponsor_coh_payment_4c8113_idx
    ON sponsor_cohort_billing (payment_status);
