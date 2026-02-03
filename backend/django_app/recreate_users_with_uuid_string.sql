-- Drop and recreate users table with UUID string primary key
-- This completely rebuilds the users table with proper UUID string ID

-- Step 1: Drop all foreign key constraints that reference users
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE 'Dropping all foreign key constraints that reference users...';
    
    FOR constraint_record IN
        SELECT 
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'id'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                      constraint_record.table_name, constraint_record.constraint_name);
        RAISE NOTICE 'Dropped constraint %s from %s', constraint_record.constraint_name, constraint_record.table_name;
    END LOOP;
END $$;

-- Step 2: Drop the users table completely
DROP TABLE IF EXISTS users CASCADE;

-- Step 3: Recreate users table with UUID string primary key
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_superuser BOOLEAN NOT NULL DEFAULT false,
    username VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(150) NOT NULL DEFAULT '',
    last_name VARCHAR(150) NOT NULL DEFAULT '',
    is_staff BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    date_joined TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    email VARCHAR(254) NOT NULL UNIQUE,
    account_status VARCHAR(20) NOT NULL DEFAULT 'pending_verification',
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    email_verification_token VARCHAR(255),
    email_token_created_at TIMESTAMP WITH TIME ZONE,
    verification_hash VARCHAR(64),
    token_expires_at TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_token_created TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    erased_at TIMESTAMP WITH TIME ZONE,
    cohort_id VARCHAR(100),
    track_key VARCHAR(100),
    country VARCHAR(2),
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    risk_level VARCHAR(20) NOT NULL DEFAULT 'low',
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_method VARCHAR(20),
    password_changed_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    bio TEXT,
    avatar_url VARCHAR(200),
    phone_number VARCHAR(20),
    preferred_learning_style VARCHAR(20),
    career_goals TEXT,
    profile_complete BOOLEAN NOT NULL DEFAULT false,
    onboarding_complete BOOLEAN NOT NULL DEFAULT false,
    profiling_complete BOOLEAN NOT NULL DEFAULT false,
    profiling_completed_at TIMESTAMP WITH TIME ZONE,
    profiling_session_id UUID,
    is_mentor BOOLEAN NOT NULL DEFAULT false,
    mentor_capacity_weekly INTEGER NOT NULL DEFAULT 10,
    mentor_availability JSONB NOT NULL DEFAULT '{}',
    mentor_specialties JSONB NOT NULL DEFAULT '[]',
    cyber_exposure_level VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    org_id_id BIGINT,
    metadata JSONB NOT NULL DEFAULT '{}',
    foundations_complete BOOLEAN DEFAULT false,
    foundations_completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_cohort_id_idx ON users(cohort_id);
CREATE INDEX users_track_key_idx ON users(track_key);
CREATE INDEX users_account_status_idx ON users(account_status);
CREATE INDEX users_email_verified_idx ON users(email_verified);
CREATE INDEX users_mfa_enabled_idx ON users(mfa_enabled);
CREATE INDEX users_profiling_complete_idx ON users(profiling_complete);
CREATE INDEX users_is_mentor_idx ON users(is_mentor);

-- Step 4: Update all user reference columns to VARCHAR(36)
DO $$
DECLARE
    tbl_name TEXT;
    col_name TEXT;
BEGIN
    RAISE NOTICE 'Converting user reference columns to VARCHAR(36)...';
    
    FOR tbl_name, col_name IN VALUES 
        ('tracks', 'director_id'),
        ('cohorts', 'coordinator_id'),
        ('enrollments', 'user_id'),
        ('mentor_assignments', 'mentor_id'),
        ('organizations', 'owner_id'),
        ('organization_members', 'user_id'),
        ('chat_messages', 'mentee_id'),
        ('chat_messages', 'mentor_id'),
        ('waitlist', 'user_id')
    LOOP
        -- Check if table and column exist
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = tbl_name AND column_name = col_name) THEN
            
            RAISE NOTICE 'Converting %.% to VARCHAR(36)...', tbl_name, col_name;
            
            -- Drop the column and recreate as VARCHAR(36)
            EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS %I', tbl_name, col_name);
            EXECUTE format('ALTER TABLE %I ADD COLUMN %I VARCHAR(36)', tbl_name, col_name);
            
            RAISE NOTICE 'Successfully converted %.% to VARCHAR(36)', tbl_name, col_name;
        END IF;
    END LOOP;
END $$;

-- Step 5: Create foreign key constraints
DO $$
DECLARE
    tbl_name TEXT;
    col_name TEXT;
BEGIN
    RAISE NOTICE 'Creating foreign key constraints...';
    
    FOR tbl_name, col_name IN VALUES 
        ('tracks', 'director_id'),
        ('cohorts', 'coordinator_id'),
        ('enrollments', 'user_id'),
        ('mentor_assignments', 'mentor_id'),
        ('organizations', 'owner_id'),
        ('organization_members', 'user_id'),
        ('chat_messages', 'mentee_id'),
        ('chat_messages', 'mentor_id'),
        ('waitlist', 'user_id')
    LOOP
        -- Check if table and column exist
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = tbl_name AND column_name = col_name) THEN
            
            BEGIN
                -- Add foreign key constraint
                EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_%I_fkey FOREIGN KEY (%I) REFERENCES users(id)', 
                              tbl_name, tbl_name, col_name, col_name);
                
                RAISE NOTICE 'Added foreign key constraint for %.%', tbl_name, col_name;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to add foreign key constraint for %.%: %', tbl_name, col_name, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- Step 6: Create Django required tables for users
CREATE TABLE IF NOT EXISTS users_groups (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER
);

CREATE TABLE IF NOT EXISTS users_user_permissions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER
);

RAISE NOTICE 'Users table recreated with UUID string primary key!';