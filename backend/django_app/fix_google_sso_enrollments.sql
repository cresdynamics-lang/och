-- Find users without enrollments (Google SSO users who completed profiling)
-- These users won't appear in the director enrollment view

-- Step 1: See all users without enrollments
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.account_status,
    u.profiling_complete,
    u.track_key,
    u.created_at
FROM users u
LEFT JOIN enrollments e ON e.user_id = u.id
WHERE e.id IS NULL
  AND u.account_status = 'active'
  AND u.is_active = TRUE
ORDER BY u.created_at DESC;

-- Step 2: Check if there are any active cohorts to enroll them in
SELECT 
    c.id,
    c.name,
    t.name as track_name,
    t.key as track_key,
    c.start_date,
    c.end_date,
    c.status,
    c.seat_cap,
    COUNT(e.id) as enrolled_count
FROM cohorts c
INNER JOIN tracks t ON t.id = c.track_id
LEFT JOIN enrollments e ON e.cohort_id = c.id AND e.status = 'active'
WHERE c.status IN ('active', 'running')
GROUP BY c.id, c.name, t.name, t.key, c.start_date, c.end_date, c.status, c.seat_cap
ORDER BY c.start_date DESC;

-- Step 3: OPTIONAL - Auto-enroll users in a default cohort
-- Replace 'YOUR_COHORT_ID_HERE' with an actual cohort UUID from Step 2
-- This will create enrollments for users who don't have any

-- Example: Auto-enroll all users without enrollments into a specific cohort
/*
INSERT INTO enrollments (
    id,
    cohort_id,
    user_id,
    enrollment_type,
    seat_type,
    payment_status,
    status,
    joined_at
)
SELECT 
    gen_random_uuid(),
    'YOUR_COHORT_ID_HERE'::uuid,  -- Replace with actual cohort ID
    u.id,
    'director',  -- Director assigned
    'scholarship',  -- Free seat
    'waived',  -- No payment required
    'active',  -- Active enrollment
    NOW()
FROM users u
LEFT JOIN enrollments e ON e.user_id = u.id
WHERE e.id IS NULL
  AND u.account_status = 'active'
  AND u.is_active = TRUE
  AND u.profiling_complete = TRUE;
*/

-- Step 4: Verify enrollments were created
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    c.name as cohort_name,
    e.status as enrollment_status,
    e.seat_type,
    e.joined_at
FROM users u
INNER JOIN enrollments e ON e.user_id = u.id
INNER JOIN cohorts c ON c.id = e.cohort_id
WHERE u.account_status = 'active'
ORDER BY e.joined_at DESC
LIMIT 20;
