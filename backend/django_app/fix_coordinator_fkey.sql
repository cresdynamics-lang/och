-- Fix coordinator_id column to reference uuid_id instead of id
ALTER TABLE cohorts DROP CONSTRAINT IF EXISTS cohorts_coordinator_id_fkey;
ALTER TABLE cohorts ALTER COLUMN coordinator_id TYPE UUID USING coordinator_id::UUID;
ALTER TABLE cohorts ADD CONSTRAINT cohorts_coordinator_id_fkey 
    FOREIGN KEY (coordinator_id) REFERENCES users(uuid_id) ON DELETE SET NULL;