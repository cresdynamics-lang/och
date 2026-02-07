-- Fix "operator does not exist: character varying = bigint" on enrollments JOIN users.
-- Django expects User.id = CharField(36) and Enrollment.user_id = FK to users.id (varchar).
--
-- Option A (recommended): Run the full fix scripts in order:
--   1. fix_users_id_only.sql     -- converts users.id from bigint to varchar(36)
--   2. fix_remaining_user_refs.sql -- converts enrollments.user_id (and other FKs) to varchar
--
-- Option B: If only enrollments.user_id is bigint and users.id is already varchar,
-- run the block below to convert enrollments.user_id to varchar(36).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'user_id'
               AND data_type = 'bigint') THEN
        RAISE NOTICE 'Converting enrollments.user_id from bigint to varchar(36)...';
        ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;
        ALTER TABLE enrollments ALTER COLUMN user_id TYPE varchar(36) USING user_id::text;
        ALTER TABLE enrollments ADD CONSTRAINT enrollments_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'enrollments.user_id is now varchar(36)';
    END IF;
END $$;
