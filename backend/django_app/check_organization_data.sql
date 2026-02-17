-- Script to check organization data in the database
-- This shows where organizations are stored and how they're linked to users and enrollments

-- 1. Check organizations table
SELECT 
    '=== ORGANIZATIONS TABLE ===' as section;
    
SELECT 
    id,
    name,
    slug,
    org_type,
    status,
    owner_id,
    created_at,
    updated_at
FROM organizations
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check users with organization assignments (users.org_id_id - Django ForeignKey naming)
SELECT 
    '=== USERS WITH ORGANIZATION (users.org_id_id) ===' as section;
    
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.org_id_id,
    o.name as organization_name,
    o.org_type,
    u.created_at as user_created_at
FROM users u
LEFT JOIN organizations o ON u.org_id_id = o.id
WHERE u.org_id_id IS NOT NULL
ORDER BY u.created_at DESC
LIMIT 20;

-- 3. Check enrollments with organization assignments (enrollments.org)
SELECT 
    '=== ENROLLMENTS WITH ORGANIZATION (enrollments.org) ===' as section;
    
SELECT 
    e.id as enrollment_id,
    e.user_id,
    u.email as user_email,
    u.first_name,
    u.last_name,
    e.cohort_id,
    c.name as cohort_name,
    e.org as org_id,
    o.name as organization_name,
    e.enrollment_type,
    e.status,
    e.joined_at
FROM enrollments e
LEFT JOIN users u ON e.user_id = u.id
LEFT JOIN cohorts c ON e.cohort_id = c.id
LEFT JOIN organizations o ON e.org = o.id
WHERE e.org IS NOT NULL
ORDER BY e.joined_at DESC
LIMIT 20;

-- 4. Summary: Count organizations by type
SELECT 
    '=== ORGANIZATION SUMMARY ===' as section;
    
SELECT 
    org_type,
    COUNT(*) as count
FROM organizations
GROUP BY org_type
ORDER BY count DESC;

-- 5. Summary: Count users with organizations
SELECT 
    '=== USER ORGANIZATION SUMMARY ===' as section;
    
SELECT 
    COUNT(*) FILTER (WHERE org_id_id IS NOT NULL) as users_with_org,
    COUNT(*) FILTER (WHERE org_id_id IS NULL) as users_without_org,
    COUNT(*) as total_users
FROM users;

-- 6. Summary: Count enrollments with organizations
SELECT 
    '=== ENROLLMENT ORGANIZATION SUMMARY ===' as section;
    
SELECT 
    COUNT(*) FILTER (WHERE org IS NOT NULL) as enrollments_with_org,
    COUNT(*) FILTER (WHERE org IS NULL) as enrollments_without_org,
    COUNT(*) as total_enrollments
FROM enrollments;

-- 7. Check specific user (replace 'dan@gmail.com' with the email you want to check)
SELECT 
    '=== CHECK SPECIFIC USER ===' as section;
    
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.org_id_id as user_org_id,
    o1.name as user_org_name,
    e.id as enrollment_id,
    e.org as enrollment_org_id,
    o2.name as enrollment_org_name,
    e.cohort_id,
    c.name as cohort_name,
    e.enrollment_type,
    e.status
FROM users u
LEFT JOIN organizations o1 ON u.org_id_id = o1.id
LEFT JOIN enrollments e ON e.user_id = u.id
LEFT JOIN cohorts c ON e.cohort_id = c.id
LEFT JOIN organizations o2 ON e.org = o2.id
WHERE u.email = 'dan@gmail.com';

-- 8. Check if organization with ID 1 exists
SELECT 
    '=== CHECK ORGANIZATION ID 1 ===' as section;
    
SELECT 
    id,
    name,
    slug,
    org_type,
    status,
    owner_id,
    created_at
FROM organizations
WHERE id = 1;

-- 9. List all organization IDs (to see what IDs are available)
SELECT 
    '=== ALL ORGANIZATION IDs ===' as section;
    
SELECT 
    id,
    name,
    slug,
    org_type,
    status
FROM organizations
ORDER BY id;
