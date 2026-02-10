-- Fix marketplace_employers.user_id type mismatch (VARCHAR vs BIGINT)
-- The User model uses id as BigAutoField (bigint), but the table was created with user_id VARCHAR(36).

-- Step 1: Drop existing index if it exists (required before altering column)
DROP INDEX IF EXISTS marketplace_employers_user_id_idx;

-- Step 2: Alter user_id from VARCHAR(36) to BIGINT
-- USING handles existing rows: cast numeric strings to bigint, NULL for invalid/non-numeric
ALTER TABLE marketplace_employers
    ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint;

-- Step 3: Add foreign key to users table
ALTER TABLE marketplace_employers
    DROP CONSTRAINT IF EXISTS fk_marketplace_employers_user;
ALTER TABLE marketplace_employers
    ADD CONSTRAINT fk_marketplace_employers_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 4: Recreate index
CREATE INDEX IF NOT EXISTS marketplace_employers_user_id_idx ON marketplace_employers(user_id);
