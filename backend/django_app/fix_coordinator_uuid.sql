-- Fix coordinator_id column type mismatch in cohorts table
-- This resolves the "operator does not exist: character varying = uuid" error

-- Remove the old foreign key constraint
ALTER TABLE cohorts DROP CONSTRAINT IF EXISTS cohorts_coordinator_id_fkey;

-- Change the column type from VARCHAR to UUID
ALTER TABLE cohorts ALTER COLUMN coordinator_id TYPE UUID USING coordinator_id::UUID;

-- Add the foreign key back with correct reference to users.uuid_id
ALTER TABLE cohorts ADD CONSTRAINT cohorts_coordinator_id_fkey 
    FOREIGN KEY (coordinator_id) REFERENCES users(uuid_id) ON DELETE SET NULL;