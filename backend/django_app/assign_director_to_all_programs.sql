-- Assign director to all programs by creating tracks
INSERT INTO tracks (id, program_id, name, key, director_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    p.id,
    p.name || ' Track',
    LOWER(REPLACE(p.name, ' ', '-')) || '-track',
    2, -- director user ID
    NOW(),
    NOW()
FROM programs p 
WHERE NOT EXISTS (
    SELECT 1 FROM tracks t WHERE t.program_id = p.id AND t.director_id = 2
);