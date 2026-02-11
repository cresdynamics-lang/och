-- Fix all sponsor dashboard tables to use UUID for id columns

-- Fix sponsor_cohort_dashboard.id
ALTER TABLE sponsor_cohort_dashboard DROP CONSTRAINT IF EXISTS sponsor_cohort_dashboard_pkey;
ALTER TABLE sponsor_cohort_dashboard ADD COLUMN id_temp UUID DEFAULT gen_random_uuid();
ALTER TABLE sponsor_cohort_dashboard DROP COLUMN id;
ALTER TABLE sponsor_cohort_dashboard RENAME COLUMN id_temp TO id;
ALTER TABLE sponsor_cohort_dashboard ADD PRIMARY KEY (id);

-- Fix sponsor_student_aggregates.id
ALTER TABLE sponsor_student_aggregates DROP CONSTRAINT IF EXISTS sponsor_student_aggregates_pkey;
ALTER TABLE sponsor_student_aggregates ADD COLUMN id_temp UUID DEFAULT gen_random_uuid();
ALTER TABLE sponsor_student_aggregates DROP COLUMN id;
ALTER TABLE sponsor_student_aggregates RENAME COLUMN id_temp TO id;
ALTER TABLE sponsor_student_aggregates ADD PRIMARY KEY (id);
