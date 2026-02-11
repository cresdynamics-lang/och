-- Fix enrollments.user_id from VARCHAR to BIGINT to match users.id

-- Step 1: Drop foreign key constraint if exists
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;

-- Step 2: Add temporary column
ALTER TABLE enrollments ADD COLUMN user_id_temp BIGINT;

-- Step 3: Drop old VARCHAR column
ALTER TABLE enrollments DROP COLUMN user_id;

-- Step 4: Rename new column
ALTER TABLE enrollments RENAME COLUMN user_id_temp TO user_id;

-- Step 5: Add foreign key constraint
ALTER TABLE enrollments ADD CONSTRAINT enrollments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 6: Create index
CREATE INDEX IF NOT EXISTS enrollments_user_id_idx ON enrollments(user_id);
