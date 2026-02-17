-- =============================================================================
-- Add gender field to users table
-- Run: psql $DATABASE_URL -f backend/django_app/sql/add_gender_field_to_users.sql
-- Or from Django: python manage.py dbshell < backend/django_app/sql/add_gender_field_to_users.sql
-- =============================================================================

BEGIN;

-- Add gender field to users table
-- Gender is optional and can be: male, female, other, prefer_not_to_say
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS gender VARCHAR(20) NULL;

-- Add check constraint for valid gender values
-- Drop constraint if it exists first, then add it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_gender_check' 
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_gender_check;
    END IF;
END $$;

ALTER TABLE users
ADD CONSTRAINT users_gender_check 
CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Add index for gender field (useful for filtering/reporting)
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender) WHERE gender IS NOT NULL;

-- Add comment to document the field
COMMENT ON COLUMN users.gender IS 'User gender: male, female, other, prefer_not_to_say (optional)';

COMMIT;

-- Verify the change
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name = 'gender';
