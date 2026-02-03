-- Check current column types first
SELECT 
    table_name, 
    column_name, 
    data_type, 
    character_maximum_length 
FROM information_schema.columns 
WHERE (table_name = 'users' AND column_name = 'id') 
   OR (table_name = 'tracks' AND column_name = 'director_id')
ORDER BY table_name, column_name;

-- The users.id is bigint, so we need to change tracks.director_id to bigint
-- Drop foreign key constraint if exists
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_director_id_fkey;

-- Change director_id to bigint to match users.id
ALTER TABLE tracks ALTER COLUMN director_id TYPE BIGINT USING director_id::bigint;

-- Add foreign key constraint back
ALTER TABLE tracks ADD CONSTRAINT tracks_director_id_fkey 
    FOREIGN KEY (director_id) REFERENCES users(id) ON DELETE SET NULL;

SELECT 'Fixed: tracks.director_id now matches users.id type' as status;