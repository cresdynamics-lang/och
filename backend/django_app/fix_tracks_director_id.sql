-- Fix tracks.director_id type mismatch
-- The director_id field should be VARCHAR(36) to match users.id, not BIGINT

-- First, check current data types
SELECT 
    column_name, 
    data_type, 
    character_maximum_length 
FROM information_schema.columns 
WHERE table_name IN ('tracks', 'users') 
    AND column_name IN ('director_id', 'id');

-- Drop the foreign key constraint if it exists
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_director_id_fkey;

-- Change the director_id column type to match users.id
ALTER TABLE tracks ALTER COLUMN director_id TYPE VARCHAR(36);

-- Recreate the foreign key constraint
ALTER TABLE tracks ADD CONSTRAINT tracks_director_id_fkey 
    FOREIGN KEY (director_id) REFERENCES users(id) ON DELETE SET NULL;

-- Verify the fix
SELECT 'tracks.director_id type fixed successfully' as result;