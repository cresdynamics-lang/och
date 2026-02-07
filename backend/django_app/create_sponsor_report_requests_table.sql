-- Create sponsor_report_requests table (sponsor requests detailed report from director)
-- Run this instead of: python manage.py migrate sponsor_dashboard (for 0003_add_sponsor_report_request)
-- Requires: organizations(id), cohorts(id), users(id) to exist

CREATE TABLE IF NOT EXISTS sponsor_report_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_type VARCHAR(32) NOT NULL DEFAULT 'graduate_breakdown'
        CHECK (request_type IN ('graduate_breakdown', 'roi_projection', 'cohort_analytics', 'custom')),
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
    details TEXT DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'delivered', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivered_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    attachment_url VARCHAR(500) DEFAULT ''
);

-- Indexes for list/filter by org and status
CREATE INDEX IF NOT EXISTS sponsor_report_requests_org_status_idx
    ON sponsor_report_requests(org_id, status);
CREATE INDEX IF NOT EXISTS sponsor_report_requests_status_idx
    ON sponsor_report_requests(status);

COMMENT ON TABLE sponsor_report_requests IS 'Sponsor requests for detailed report from program director; director fulfills and sets delivered_at/attachment_url';
