-- Fix tracks.director_id to reference users.uuid_id (uuid)
-- Run this in your PostgreSQL database

-- Drop foreign key constraint
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_director_id_fkey;

-- Clear existing invalid data first
UPDATE tracks SET director_id = NULL;

-- Change director_id to uuid to match users.uuid_id
ALTER TABLE tracks ALTER COLUMN director_id TYPE UUID USING CASE 
    WHEN director_id IS NULL THEN NULL 
    ELSE director_id::uuid 
END;

-- Add unique constraint to users.uuid_id if it doesn't exist
ALTER TABLE users ADD CONSTRAINT users_uuid_id_unique UNIQUE (uuid_id);

-- Add foreign key constraint to reference users.uuid_id
ALTER TABLE tracks ADD CONSTRAINT tracks_director_id_fkey 
    FOREIGN KEY (director_id) REFERENCES users(uuid_id) ON DELETE SET NULL;

-- Verify the fix
SELECT 'Tracks director_id now references users.uuid_id' as status;