-- Create sponsor_cohort_billing table if it does not exist.
-- Use this only if Django migrations cannot be run (e.g. migration state broken).
-- Preferred: run "python manage.py migrate" with your venv activated.

-- Require sponsor_cohorts to exist (from sponsors app)
CREATE TABLE IF NOT EXISTS sponsor_cohort_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    payment_date TIMESTAMP WITH TIME ZONE NULL,
    invoice_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    sponsor_cohort_id UUID NOT NULL REFERENCES sponsor_cohorts(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS sponsor_cohort_billing_cohort_month_uniq
    ON sponsor_cohort_billing (sponsor_cohort_id, billing_month);
CREATE INDEX IF NOT EXISTS sponsor_coh_sponsor_7b88f4_idx
    ON sponsor_cohort_billing (sponsor_cohort_id, billing_month);
CREATE INDEX IF NOT EXISTS sponsor_coh_billing_ef9845_idx
    ON sponsor_cohort_billing (billing_month, payment_status);
CREATE INDEX IF NOT EXISTS sponsor_coh_payment_4c8113_idx
    ON sponsor_cohort_billing (payment_status);
