-- Fix sponsor_student_aggregates.cohort_id from BIGINT to UUID to match cohorts.id

-- Step 1: Drop foreign key constraint if exists
ALTER TABLE sponsor_student_aggregates DROP CONSTRAINT IF EXISTS sponsor_student_aggregates_cohort_id_fkey;

-- Step 2: Add temporary column
ALTER TABLE sponsor_student_aggregates ADD COLUMN cohort_id_temp UUID;

-- Step 3: Drop old BIGINT column
ALTER TABLE sponsor_student_aggregates DROP COLUMN cohort_id;

-- Step 4: Rename new column
ALTER TABLE sponsor_student_aggregates RENAME COLUMN cohort_id_temp TO cohort_id;

-- Step 5: Add foreign key constraint
ALTER TABLE sponsor_student_aggregates ADD CONSTRAINT sponsor_student_aggregates_cohort_id_fkey 
    FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;

-- Step 6: Create index
CREATE INDEX IF NOT EXISTS sponsor_student_aggregates_cohort_id_idx ON sponsor_student_aggregates(cohort_id);
