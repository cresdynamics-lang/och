-- Add onboarded_email_status column to users table
-- Status values: null (not sent), 'sent' (sent but not opened), 'sent_and_seen' (sent and opened)
-- This script is idempotent and can be run multiple times safely

DO $$ 
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'onboarded_email_status'
    ) THEN
        -- Add the column
        ALTER TABLE users 
        ADD COLUMN onboarded_email_status VARCHAR(20) DEFAULT NULL;
        
        RAISE NOTICE 'Column onboarded_email_status added successfully';
    ELSE
        RAISE NOTICE 'Column onboarded_email_status already exists, skipping column creation';
    END IF;
    
    -- Add check constraint for valid values (drop first if exists to avoid conflicts)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name = 'users_onboarded_email_status_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_onboarded_email_status_check;
    END IF;
    
    ALTER TABLE users 
    ADD CONSTRAINT users_onboarded_email_status_check 
    CHECK (onboarded_email_status IS NULL OR onboarded_email_status IN ('sent', 'sent_and_seen'));
    
    -- Add index for faster queries (IF NOT EXISTS for PostgreSQL 9.5+)
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'users' 
        AND indexname = 'idx_users_onboarded_email_status'
    ) THEN
        CREATE INDEX idx_users_onboarded_email_status ON users(onboarded_email_status);
        RAISE NOTICE 'Index idx_users_onboarded_email_status created successfully';
    ELSE
        RAISE NOTICE 'Index idx_users_onboarded_email_status already exists, skipping index creation';
    END IF;
END $$;
