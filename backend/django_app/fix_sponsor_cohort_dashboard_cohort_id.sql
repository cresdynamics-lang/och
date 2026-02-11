-- Fix sponsor_cohort_dashboard.cohort_id from BIGINT to UUID to match cohorts.id

-- Step 1: Drop foreign key constraint if exists
ALTER TABLE sponsor_cohort_dashboard DROP CONSTRAINT IF EXISTS sponsor_cohort_dashboard_cohort_id_fkey;

-- Step 2: Add temporary column
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN cohort_id_temp UUID;

-- Step 3: Drop old BIGINT column
ALTER TABLE sponsor_cohort_dashboard DROP COLUMN cohort_id;

-- Step 4: Rename new column
ALTER TABLE sponsor_cohort_dashboard RENAME COLUMN cohort_id_temp TO cohort_id;

-- Step 5: Add foreign key constraint
ALTER TABLE sponsor_cohort_dashboard ADD CONSTRAINT sponsor_cohort_dashboard_cohort_id_fkey 
    FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;

-- Step 6: Create index
CREATE INDEX IF NOT EXISTS sponsor_cohort_dashboard_cohort_id_idx ON sponsor_cohort_dashboard(cohort_id);
