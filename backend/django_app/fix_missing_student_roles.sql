-- Diagnostic: Check if Google SSO users have student role

-- Step 1: Find all active users
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.account_status,
    u.is_active,
    u.created_at
FROM users u
WHERE u.is_active = TRUE
  AND u.account_status = 'active'
ORDER BY u.created_at DESC
LIMIT 20;

-- Step 2: Check which users have student role
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    r.name as role_name,
    ur.is_active as role_active
FROM users u
INNER JOIN user_roles ur ON ur.user_id = u.id
INNER JOIN roles r ON r.id = ur.role_id
WHERE u.is_active = TRUE
  AND u.account_status = 'active'
ORDER BY u.created_at DESC;

-- Step 3: Find users WITHOUT student role (these won't show in director enrollment)
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.account_status,
    u.created_at
FROM users u
WHERE u.is_active = TRUE
  AND u.account_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    INNER JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = u.id
      AND r.name = 'student'
      AND ur.is_active = TRUE
  )
ORDER BY u.created_at DESC;

-- Step 4: FIX - Assign student role to users without any role
INSERT INTO user_roles (user_id, role_id, scope, is_active, assigned_at)
SELECT 
    u.id,
    (SELECT id FROM roles WHERE name = 'student' LIMIT 1),
    'global',
    TRUE,
    NOW()
FROM users u
WHERE u.is_active = TRUE
  AND u.account_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id
      AND ur.is_active = TRUE
  );

-- Step 5: Verify all users now have student role
SELECT 
    u.email,
    r.name as role_name,
    ur.is_active
FROM users u
INNER JOIN user_roles ur ON ur.user_id = u.id
INNER JOIN roles r ON r.id = ur.role_id
WHERE u.is_active = TRUE
  AND u.account_status = 'active'
  AND r.name = 'student'
ORDER BY u.created_at DESC;
