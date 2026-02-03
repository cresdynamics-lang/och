-- Comprehensive User ID Migration from Integer to UUID
-- This script converts all user references across the database

-- Step 1: Find the actual users table name and add UUID column
DO $$
DECLARE
    users_table_name TEXT;
BEGIN
    -- Find the users table (could be 'users', 'auth_user', or 'users_user')
    SELECT table_name INTO users_table_name
    FROM information_schema.tables 
    WHERE table_name IN ('users', 'auth_user', 'users_user')
    ORDER BY CASE 
        WHEN table_name = 'users' THEN 1
        WHEN table_name = 'auth_user' THEN 2
        ELSE 3
    END
    LIMIT 1;
    
    IF users_table_name IS NOT NULL THEN
        -- Add UUID column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = users_table_name AND column_name = 'uuid_id') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN uuid_id UUID DEFAULT gen_random_uuid()', users_table_name);
            EXECUTE format('UPDATE %I SET uuid_id = gen_random_uuid() WHERE uuid_id IS NULL', users_table_name);
            EXECUTE format('ALTER TABLE %I ALTER COLUMN uuid_id SET NOT NULL', users_table_name);
        END IF;
        
        RAISE NOTICE 'Added UUID column to table: %', users_table_name;
    ELSE
        RAISE NOTICE 'No users table found';
    END IF;
END $$;

-- Step 2: Create mapping table for user ID conversion
CREATE TABLE IF NOT EXISTS temp_user_id_mapping (
    old_id INTEGER,
    new_uuid UUID,
    PRIMARY KEY (old_id)
);

-- Step 3: Populate mapping table
DO $$
DECLARE
    users_table_name TEXT;
BEGIN
    SELECT table_name INTO users_table_name
    FROM information_schema.tables 
    WHERE table_name IN ('users', 'auth_user', 'users_user')
    ORDER BY CASE 
        WHEN table_name = 'users' THEN 1
        WHEN table_name = 'auth_user' THEN 2
        ELSE 3
    END
    LIMIT 1;
    
    IF users_table_name IS NOT NULL THEN
        EXECUTE format('
            INSERT INTO temp_user_id_mapping (old_id, new_uuid)
            SELECT id, uuid_id FROM %I
            ON CONFLICT (old_id) DO UPDATE SET new_uuid = EXCLUDED.new_uuid
        ', users_table_name);
        
        RAISE NOTICE 'Populated user ID mapping from table: %', users_table_name;
    END IF;
END $$;

-- Step 4: Update all tables with user foreign keys
-- Programs related tables
DO $$
BEGIN
    -- tracks.director_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'director_id' AND data_type = 'integer') THEN
        ALTER TABLE tracks ADD COLUMN IF NOT EXISTS director_uuid UUID;
        UPDATE tracks SET director_uuid = m.new_uuid 
        FROM temp_user_id_mapping m 
        WHERE tracks.director_id = m.old_id;
        RAISE NOTICE 'Updated tracks.director_id';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'director_id' AND data_type = 'uuid') THEN
        RAISE NOTICE 'tracks.director_id is already UUID';
    END IF;
    
    -- cohorts.coordinator_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cohorts' AND column_name = 'coordinator_id' AND data_type = 'integer') THEN
        ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS coordinator_uuid UUID;
        UPDATE cohorts SET coordinator_uuid = m.new_uuid 
        FROM temp_user_id_mapping m 
        WHERE cohorts.coordinator_id = m.old_id;
        RAISE NOTICE 'Updated cohorts.coordinator_id';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cohorts' AND column_name = 'coordinator_id' AND data_type = 'uuid') THEN
        RAISE NOTICE 'cohorts.coordinator_id is already UUID';
    END IF;
    
    -- enrollments.user_id (already UUID, but may need data sync)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'user_id' AND data_type = 'uuid') THEN
        RAISE NOTICE 'enrollments.user_id is already UUID';
    END IF;
    
    -- mentor_assignments.mentor_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_assignments' AND column_name = 'mentor_id' AND data_type = 'integer') THEN
        ALTER TABLE mentor_assignments ADD COLUMN IF NOT EXISTS mentor_uuid UUID;
        UPDATE mentor_assignments SET mentor_uuid = m.new_uuid 
        FROM temp_user_id_mapping m 
        WHERE mentor_assignments.mentor_id = m.old_id;
        RAISE NOTICE 'Updated mentor_assignments.mentor_id';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_assignments' AND column_name = 'mentor_id' AND data_type = 'uuid') THEN
        RAISE NOTICE 'mentor_assignments.mentor_id is already UUID';
    END IF;
END $$;

-- Step 5: Update organization related tables
DO $$
BEGIN
    -- organizations.owner_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'owner_id' AND data_type = 'integer') THEN
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_uuid UUID;
        UPDATE organizations SET owner_uuid = m.new_uuid 
        FROM temp_user_id_mapping m 
        WHERE organizations.owner_id = m.old_id;
        RAISE NOTICE 'Updated organizations.owner_id';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'owner_id' AND data_type = 'uuid') THEN
        RAISE NOTICE 'organizations.owner_id is already UUID';
    END IF;
    
    -- organization_members.user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_members' AND column_name = 'user_id' AND data_type = 'integer') THEN
        ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS user_uuid UUID;
        UPDATE organization_members SET user_uuid = m.new_uuid 
        FROM temp_user_id_mapping m 
        WHERE organization_members.user_id = m.old_id;
        RAISE NOTICE 'Updated organization_members.user_id';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_members' AND column_name = 'user_id' AND data_type = 'uuid') THEN
        RAISE NOTICE 'organization_members.user_id is already UUID';
    END IF;
END $$;

-- Step 6: Update mentorship related tables
DO $$
BEGIN
    -- chat_messages.mentee_id and mentor_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'mentee_id') THEN
        ALTER TABLE chat_messages ADD COLUMN mentee_uuid UUID;
        ALTER TABLE chat_messages ADD COLUMN mentor_uuid UUID;
        
        UPDATE chat_messages SET mentee_uuid = m.new_uuid 
        FROM temp_user_id_mapping m 
        WHERE chat_messages.mentee_id = m.old_id;
        
        UPDATE chat_messages SET mentor_uuid = m.new_uuid 
        FROM temp_user_id_mapping m 
        WHERE chat_messages.mentor_id = m.old_id;
        
        RAISE NOTICE 'Updated chat_messages user references';
    END IF;
END $$;

-- Step 7: Update user roles and permissions
DO $$
BEGIN
    -- user_roles.user_id and assigned_by_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'user_id') THEN
        ALTER TABLE user_roles ADD COLUMN user_uuid UUID;
        ALTER TABLE user_roles ADD COLUMN assigned_by_uuid UUID;
        
        UPDATE user_roles SET user_uuid = m.new_uuid 
        FROM temp_user_id_mapping m 
        WHERE user_roles.user_id = m.old_id;
        
        UPDATE user_roles SET assigned_by_uuid = m.new_uuid 
        FROM temp_user_id_mapping m 
        WHERE user_roles.assigned_by_id = m.old_id;
        
        RAISE NOTICE 'Updated user_roles user references';
    END IF;
    
    -- consent_scopes.user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consent_scopes' AND column_name = 'user_id') THEN
        ALTER TABLE consent_scopes ADD COLUMN user_uuid UUID;
        UPDATE consent_scopes SET user_uuid = m.new_uuid 
        FROM temp_user_id_mapping m 
        WHERE consent_scopes.user_id = m.old_id;
        RAISE NOTICE 'Updated consent_scopes.user_id';
    END IF;
    
    -- entitlements.user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entitlements' AND column_name = 'user_id') THEN
        ALTER TABLE entitlements ADD COLUMN user_uuid UUID;
        UPDATE entitlements SET user_uuid = m.new_uuid 
        FROM temp_user_id_mapping m 
        WHERE entitlements.user_id = m.old_id;
        RAISE NOTICE 'Updated entitlements.user_id';
    END IF;
END $$;

-- Step 8: Update other common user references
DO $$
BEGIN
    -- Update any other tables that might reference users
    -- This is a generic approach for tables we might have missed
    
    -- waitlist.user_id (already UUID in our schema)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waitlist' AND column_name = 'user_id' AND data_type = 'uuid') THEN
        RAISE NOTICE 'waitlist.user_id is already UUID';
    END IF;
    
    -- audit_logs.actor_id (already UUID in our schema)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'actor_id' AND data_type = 'uuid') THEN
        RAISE NOTICE 'audit_logs.actor_id is already UUID';
    END IF;
END $$;

-- Step 9: Create the missing tables with proper UUID references
-- (This is from the original script)

-- Add missing fields to programs table
ALTER TABLE programs ADD COLUMN IF NOT EXISTS outcomes JSONB DEFAULT '[]';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS structure JSONB DEFAULT '{}';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS missions_registry_link TEXT DEFAULT '';

-- Fix cohorts table - add missing fields
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS seat_pool JSONB DEFAULT '{}';

-- Fix enrollments table - update status enum values
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_status_check 
CHECK (status IN ('pending_payment', 'active', 'withdrawn', 'completed', 'suspended', 'incomplete'));

-- Fix calendar_events table - update type enum (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
        ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_type_check;
        ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_type_check 
        CHECK (type IN ('orientation', 'session', 'submission', 'holiday', 'closure', 'mentorship', 'project_review'));
    END IF;
END $$;

-- Create program_rules table if not exists
CREATE TABLE IF NOT EXISTS program_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    rule JSONB NOT NULL DEFAULT '{}',
    version INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    meta JSONB DEFAULT '{}',
    at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waitlist table if not exists
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    org_id UUID,
    position INTEGER NOT NULL,
    seat_type VARCHAR(20) DEFAULT 'paid',
    enrollment_type VARCHAR(20) DEFAULT 'self',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified_at TIMESTAMP WITH TIME ZONE,
    promoted_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true
);

-- Create calendar_events table if not exists
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

-- Step 10: Summary and cleanup instructions
DO $$
BEGIN
    RAISE NOTICE '=== USER UUID MIGRATION SUMMARY ===';
    RAISE NOTICE 'Migration completed. Next steps:';
    RAISE NOTICE '1. Run Django migrations to update model definitions';
    RAISE NOTICE '2. Update foreign key constraints to use UUID columns';
    RAISE NOTICE '3. Drop old integer columns after verification';
    RAISE NOTICE '4. Drop temp_user_id_mapping table when done';
    RAISE NOTICE '=====================================';
END $$;

-- Note: After Django migrations are applied and verified, run:
-- DROP TABLE temp_user_id_mapping;