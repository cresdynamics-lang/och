-- Create sponsors app tables so GET /api/v1/billing/invoices/ does not fail with
--   relation "sponsors" does not exist
-- Run this if you prefer SQL over: python manage.py migrate sponsors

-- 1. sponsors (required for Sponsor.objects.filter(slug=...))
CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    sponsor_type VARCHAR(20) NOT NULL DEFAULT 'university',
    logo_url VARCHAR(500),
    contact_email VARCHAR(254) NOT NULL,
    website VARCHAR(500),
    country VARCHAR(2),
    city VARCHAR(100),
    region VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS sponsors_slug_idx ON sponsors(slug);
CREATE INDEX IF NOT EXISTS sponsors_sponsor_type_idx ON sponsors(sponsor_type);
CREATE INDEX IF NOT EXISTS sponsors_is_active_idx ON sponsors(is_active);

-- 2. sponsor_cohorts (required for SponsorCohortBilling → sponsor_cohort)
CREATE TABLE IF NOT EXISTS sponsor_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    track_slug VARCHAR(50) NOT NULL,
    target_size INTEGER NOT NULL DEFAULT 100,
    students_enrolled INTEGER NOT NULL DEFAULT 0,
    start_date DATE,
    expected_graduation_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    target_completion_date DATE,
    budget_allocated DECIMAL(12,2) NOT NULL DEFAULT 0,
    ai_interventions_count INTEGER NOT NULL DEFAULT 0,
    placement_goal INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS sponsor_cohorts_sponsor_id_idx ON sponsor_cohorts(sponsor_id);
CREATE INDEX IF NOT EXISTS sponsor_cohorts_status_idx ON sponsor_cohorts(status);
CREATE UNIQUE INDEX IF NOT EXISTS sponsor_cohorts_sponsor_name_unique ON sponsor_cohorts(sponsor_id, name);

-- 3. sponsor_cohort_billing (invoices endpoint reads from this)
CREATE TABLE IF NOT EXISTS sponsor_cohort_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_cohort_id UUID NOT NULL REFERENCES sponsor_cohorts(id) ON DELETE CASCADE,
    billing_month DATE NOT NULL,
    students_active INTEGER NOT NULL DEFAULT 0,
    mentor_sessions INTEGER NOT NULL DEFAULT 0,
    lab_usage_hours INTEGER NOT NULL DEFAULT 0,
    hires INTEGER NOT NULL DEFAULT 0,
    platform_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    mentor_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    lab_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    scholarship_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    revenue_share_kes DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_roi DECIMAL(8,2),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMP WITH TIME ZONE,
    invoice_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS sponsor_cohort_billing_cohort_month_unique
    ON sponsor_cohort_billing(sponsor_cohort_id, billing_month);
CREATE INDEX IF NOT EXISTS sponsor_cohort_billing_payment_status_idx ON sponsor_cohort_billing(payment_status);

COMMENT ON TABLE sponsors IS 'Sponsor organizations; GET /api/v1/billing/invoices/ looks up Sponsor by org slug';
