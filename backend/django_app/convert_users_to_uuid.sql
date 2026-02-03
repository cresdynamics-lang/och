-- Simple Users Table UUID Conversion
-- This script converts the users table primary key from integer to UUID

-- Step 1: Check current users table structure
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Current users table structure:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %: % (%)', rec.column_name, rec.data_type, 
            CASE WHEN rec.is_nullable = 'YES' THEN 'nullable' ELSE 'not null' END;
    END LOOP;
END $$;

-- Step 2: Convert users table to use UUID primary key
DO $$
BEGIN
    -- Check if id column is still integer
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'integer') THEN
        
        RAISE NOTICE 'Converting users.id from integer to UUID...';
        
        -- Add new UUID column
        ALTER TABLE users ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
        UPDATE users SET new_id = gen_random_uuid() WHERE new_id IS NULL;
        ALTER TABLE users ALTER COLUMN new_id SET NOT NULL;
        
        -- Drop old primary key constraint
        ALTER TABLE users DROP CONSTRAINT users_pkey;
        
        -- Drop old id column
        ALTER TABLE users DROP COLUMN id;
        
        -- Rename new_id to id
        ALTER TABLE users RENAME COLUMN new_id TO id;
        
        -- Add new primary key constraint
        ALTER TABLE users ADD PRIMARY KEY (id);
        
        RAISE NOTICE 'Successfully converted users.id to UUID';
        
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'uuid') THEN
        RAISE NOTICE 'users.id is already UUID - no conversion needed';
    ELSE
        RAISE NOTICE 'users table or id column not found';
    END IF;
END $$;

-- Step 3: Verify the conversion
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Updated users table structure:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %: % (%)', rec.column_name, rec.data_type, 
            CASE WHEN rec.is_nullable = 'YES' THEN 'nullable' ELSE 'not null' END;
    END LOOP;
END $$;

-- Step 4: Create missing tables with UUID references
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    start_ts TIMESTAMP WITH TIME ZONE NOT NULL,
    end_ts TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    location VARCHAR(200) DEFAULT '',
    link TEXT DEFAULT '',
    milestone_id UUID,
    completion_tracked BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing program fields
ALTER TABLE programs ADD COLUMN IF NOT EXISTS outcomes JSONB DEFAULT '[]';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS structure JSONB DEFAULT '{}';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS missions_registry_link TEXT DEFAULT '';

-- Add missing cohort fields  
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS seat_pool JSONB DEFAULT '{}';

-- Fix enrollment status constraint
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_status_check 
CHECK (status IN ('pending_payment', 'active', 'withdrawn', 'completed', 'suspended', 'incomplete'));

-- Final notice
DO $$
BEGIN
    RAISE NOTICE 'Users table UUID conversion completed!';
END $$;