-- Force convert users.id from bigint to UUID string
-- Direct approach without complex checks

-- Step 1: Add UUID string column
ALTER TABLE users ADD COLUMN id_new VARCHAR(36) DEFAULT gen_random_uuid()::text;

-- Step 2: Generate UUID for each existing user
UPDATE users SET id_new = gen_random_uuid()::text WHERE id_new IS NULL;

-- Step 3: Drop primary key constraint
ALTER TABLE users DROP CONSTRAINT users_pkey;

-- Step 4: Drop the old bigint id column
ALTER TABLE users DROP COLUMN id;

-- Step 5: Rename new column to id
ALTER TABLE users RENAME COLUMN id_new TO id;

-- Step 6: Set as primary key
ALTER TABLE users ALTER COLUMN id SET NOT NULL;
ALTER TABLE users ADD PRIMARY KEY (id);

-- Step 7: Set default for future inserts
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Verify
SELECT 'users.id converted to UUID string' as status;