-- Insert test data into sponsor_student_aggregates table
-- This will create sample sponsored students

INSERT INTO sponsor_student_aggregates (
    id, org_id, cohort_id, student_id, name_anonymized, 
    readiness_score, completion_pct, portfolio_items, 
    consent_employer_share, updated_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM organizations WHERE org_type = 'sponsor' LIMIT 1),
    1,
    (SELECT id FROM users LIMIT 1 OFFSET 0),
    'John Smith',
    85.5, 78.2, 5,
    true,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    (SELECT id FROM organizations WHERE org_type = 'sponsor' LIMIT 1),
    1,
    (SELECT id FROM users LIMIT 1 OFFSET 1),
    'Sarah Johnson',
    92.3, 88.7, 8,
    true,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    (SELECT id FROM organizations WHERE org_type = 'sponsor' LIMIT 1),
    2,
    (SELECT id FROM users LIMIT 1 OFFSET 2),
    'Student #1234',
    76.8, 65.4, 3,
    false,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    (SELECT id FROM organizations WHERE org_type = 'sponsor' LIMIT 1),
    2,
    (SELECT id FROM users LIMIT 1 OFFSET 3),
    'Michael Chen',
    89.1, 82.5, 6,
    true,
    CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    (SELECT id FROM organizations WHERE org_type = 'sponsor' LIMIT 1),
    3,
    (SELECT id FROM users LIMIT 1 OFFSET 4),
    'Student #5678',
    71.2, 58.9, 2,
    false,
    CURRENT_TIMESTAMP
);