-- Check current programs and tracks
SELECT p.id, p.name, t.id as track_id, t.name as track_name, t.director_id 
FROM programs p 
LEFT JOIN tracks t ON p.id = t.program_id;

-- Check users and their roles
SELECT u.id, u.email, ur.role_id, r.name as role_name
FROM users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'director@gmail.com';

-- Create a test track with director assignment
INSERT INTO tracks (id, program_id, name, key, director_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    p.id,
    'Test Track',
    'test-track',
    u.id,
    NOW(),
    NOW()
FROM programs p, users u 
WHERE u.email = 'director@gmail.com'
LIMIT 1;