-- Manual Finance Invoices table (Finance create-invoice)
-- Run this script on your database instead of using Django migration.
-- Compatible with PostgreSQL.

-- Drop if you need to recreate (optional)
-- DROP TABLE IF EXISTS manual_finance_invoices;

CREATE TABLE IF NOT EXISTS manual_finance_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sponsor_name VARCHAR(255) NOT NULL,
    amount_kes NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'KES',
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'waived')),
    line_items JSONB NOT NULL DEFAULT '[]',
    due_date DATE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE manual_finance_invoices IS 'Manually created invoices by Finance role; returned with billing invoices in GET /api/v1/billing/invoices/ for platform finance.';
COMMENT ON COLUMN manual_finance_invoices.sponsor_name IS 'Client / sponsor name';
COMMENT ON COLUMN manual_finance_invoices.line_items IS 'JSON array of {description, quantity, rate, amount}';

-- Optional: index for listing by created_at (ordering)
CREATE INDEX IF NOT EXISTS idx_manual_finance_invoices_created_at
    ON manual_finance_invoices (created_at DESC);

-- Optional: index for filtering by creator
CREATE INDEX IF NOT EXISTS idx_manual_finance_invoices_created_by_id
    ON manual_finance_invoices (created_by_id);
