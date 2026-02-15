-- Fix mfa_codes.user_id: change from bigint (FK to users.id) to uuid (FK to users.uuid_id).
-- Run with: psql -U postgres -d ongozacyberhub -f fix_mfa_codes_user_id_uuid.sql
-- Or from psql: \i path/to/fix_mfa_codes_user_id_uuid.sql

BEGIN;

-- Drop existing FK constraint on user_id
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'mfa_codes'::regclass
        AND contype = 'f'
        AND conname LIKE '%user_id%'
    ) LOOP
        EXECUTE format('ALTER TABLE mfa_codes DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;
END $$;

-- Add temporary UUID column and backfill from users.uuid_id
ALTER TABLE mfa_codes ADD COLUMN IF NOT EXISTS user_id_uuid uuid;

UPDATE mfa_codes mc
SET user_id_uuid = u.uuid_id
FROM users u
WHERE u.id = mc.user_id;

-- Drop old column and rename new one
ALTER TABLE mfa_codes DROP COLUMN user_id;
ALTER TABLE mfa_codes RENAME COLUMN user_id_uuid TO user_id;
ALTER TABLE mfa_codes ALTER COLUMN user_id SET NOT NULL;

-- Re-add FK to users(uuid_id)
ALTER TABLE mfa_codes
ADD CONSTRAINT mfa_codes_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(uuid_id) ON DELETE CASCADE;

COMMIT;
