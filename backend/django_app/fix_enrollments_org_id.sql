-- Fix enrollments.org_id from UUID to BIGINT to match organizations.id

-- Step 1: Drop foreign key constraint if exists
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_org_id_fkey;

-- Step 2: Add temporary column
ALTER TABLE enrollments ADD COLUMN org_id_temp BIGINT;

-- Step 3: Drop old UUID column (data will be lost, set to NULL)
ALTER TABLE enrollments DROP COLUMN org_id;

-- Step 4: Rename new column
ALTER TABLE enrollments RENAME COLUMN org_id_temp TO org_id;

-- Step 5: Add foreign key constraint
ALTER TABLE enrollments ADD CONSTRAINT enrollments_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- Step 6: Create index
CREATE INDEX IF NOT EXISTS enrollments_org_id_idx ON enrollments(org_id);
