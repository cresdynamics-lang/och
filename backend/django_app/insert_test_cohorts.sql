-- Insert test data into sponsor_cohort_dashboard table
-- This will create sample cohorts for the sponsor dashboard

-- First, get the sponsor organization ID (assuming it exists)
-- Insert sample cohort data
INSERT INTO sponsor_cohort_dashboard (
    id, org_id, cohort_id, cohort_name, track_name, start_date, end_date, mode,
    seats_total, seats_used, seats_sponsored, seats_remaining,
    avg_readiness, completion_pct, portfolio_health_avg,
    graduates_count, at_risk_count, next_milestone, upcoming_events, flags,
    updated_at, created_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM organizations WHERE org_type = 'sponsor' LIMIT 1),
    1,
    'Full Stack Development Cohort 2024-Q1',
    'Full Stack Development',
    '2024-01-15',
    '2024-04-15',
    'hybrid',
    25, 20, 15, 5,
    85.5, 78.2, 82.1,
    3, 2,
    '{"title": "Final Project Presentations", "date": "2024-04-10", "type": "milestone"}',
    '[{"title": "Career Fair", "date": "2024-04-05", "type": "event"}]',
    '["high_performance"]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    (SELECT id FROM organizations WHERE org_type = 'sponsor' LIMIT 1),
    2,
    'Data Science Bootcamp 2024-Q1',
    'Data Science',
    '2024-02-01',
    '2024-05-01',
    'virtual',
    30, 28, 20, 2,
    92.3, 88.7, 90.1,
    5, 1,
    '{"title": "Capstone Project Due", "date": "2024-04-25", "type": "milestone"}',
    '[{"title": "Industry Panel", "date": "2024-04-20", "type": "event"}]',
    '[]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    (SELECT id FROM organizations WHERE org_type = 'sponsor' LIMIT 1),
    3,
    'DevOps Engineering Track 2024-Q2',
    'DevOps Engineering',
    '2024-03-01',
    '2024-06-01',
    'onsite',
    20, 18, 12, 2,
    76.8, 65.4, 71.2,
    0, 4,
    '{"title": "AWS Certification Exam", "date": "2024-05-15", "type": "milestone"}',
    '[{"title": "Tech Talk: Kubernetes", "date": "2024-04-12", "type": "event"}]',
    '["low_completion", "at_risk"]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);