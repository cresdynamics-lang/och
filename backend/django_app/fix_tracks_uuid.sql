-- Fix tracks.director_id to use users.id (UUID string) instead of integer

-- Drop the existing foreign key constraint
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_director_id_fkey;

-- Change director_id to VARCHAR(36) to match users.id
ALTER TABLE tracks ALTER COLUMN director_id TYPE VARCHAR(36);

-- Add the foreign key constraint back
ALTER TABLE tracks ADD CONSTRAINT tracks_director_id_fkey 
    FOREIGN KEY (director_id) REFERENCES users(id) ON DELETE SET NULL;

SELECT 'Fixed tracks.director_id to use UUID' as result;