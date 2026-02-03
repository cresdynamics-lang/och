-- Clear existing data and fix types
-- Run this in your PostgreSQL database

-- Drop foreign key constraint
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_director_id_fkey;

-- Clear existing director_id data (since it has invalid values like "2")
UPDATE tracks SET director_id = NULL;

-- Change director_id to varchar to match users.id
ALTER TABLE tracks ALTER COLUMN director_id TYPE VARCHAR(36);

-- Add foreign key constraint to reference users.id
ALTER TABLE tracks ADD CONSTRAINT tracks_director_id_fkey 
    FOREIGN KEY (director_id) REFERENCES users(id) ON DELETE SET NULL;

-- Verify the fix
SELECT 'Fixed: tracks.director_id now references users.id (varchar)' as status;