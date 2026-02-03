-- Create roles in the roles table
INSERT INTO roles (name, display_name, description, is_system_role, created_at, updated_at)
VALUES 
    ('admin', 'Admin', 'Administrator role', true, NOW(), NOW()),
    ('program_director', 'Program Director', 'Program Director role', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Assign admin role to admin user
INSERT INTO user_roles (user_id, role_id, scope, scope_ref, is_active, assigned_at)
SELECT 
    u.id,
    r.id,
    'global',
    NULL,
    true,
    NOW()
FROM users u, roles r
WHERE u.email = 'wilsonndambuki47@gmail.com' 
AND r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Assign program_director role to director user
INSERT INTO user_roles (user_id, role_id, scope, scope_ref, is_active, assigned_at)
SELECT 
    u.id,
    r.id,
    'global',
    NULL,
    true,
    NOW()
FROM users u, roles r
WHERE u.email = 'director@gmail.com' 
AND r.name = 'program_director'
ON CONFLICT DO NOTHING;

-- Disable MFA for director@example.com
UPDATE users 
SET mfa_enabled = false, 
    mfa_method = NULL 
WHERE email = 'director@example.com';

-- Disable all MFA methods for the user
UPDATE mfa_methods 
SET enabled = false 
WHERE user_id = (SELECT id FROM users WHERE email = 'director@example.com');