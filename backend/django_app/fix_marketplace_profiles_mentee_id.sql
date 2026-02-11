-- Fix marketplace_profiles.mentee_id type mismatch (VARCHAR vs BIGINT)
-- The User model uses id as BigAutoField (bigint), but the table was created with mentee_id VARCHAR(36).

-- Step 1: Drop existing index if it exists
DROP INDEX IF EXISTS marketplace_profiles_mentee_id_idx;

-- Step 2: Alter mentee_id from VARCHAR(36) to BIGINT
ALTER TABLE marketplace_profiles
    ALTER COLUMN mentee_id TYPE BIGINT USING mentee_id::bigint;

-- Step 3: Add foreign key to users table
ALTER TABLE marketplace_profiles
    DROP CONSTRAINT IF EXISTS fk_marketplace_profiles_mentee;
ALTER TABLE marketplace_profiles
    ADD CONSTRAINT fk_marketplace_profiles_mentee
    FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 4: Recreate index
CREATE INDEX IF NOT EXISTS marketplace_profiles_mentee_id_idx ON marketplace_profiles(mentee_id);
