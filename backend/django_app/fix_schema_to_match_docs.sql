-- Fix database schema to match documentation

-- Add missing fields to programs table
ALTER TABLE programs ADD COLUMN IF NOT EXISTS outcomes JSONB DEFAULT '[]';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS structure JSONB DEFAULT '{}';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS missions_registry_link TEXT DEFAULT '';

-- Fix cohorts table - add missing fields
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS seat_pool JSONB DEFAULT '{}';
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS coordinator_id INTEGER;

-- Fix enrollments table - update status enum values
-- Note: PostgreSQL doesn't support ALTER TYPE easily, so we'll add a check constraint
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

-- Fix enrollments table user_id type mismatch
-- Convert users table to use UUID primary keys
DO $$
BEGIN
    -- Add UUID column to users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name LIKE '%user%' AND column_name = 'uuid_id') THEN
        -- Find the actual users table name
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auth_user') THEN
            ALTER TABLE auth_user ADD COLUMN uuid_id UUID DEFAULT gen_random_uuid();
            UPDATE auth_user SET uuid_id = gen_random_uuid() WHERE uuid_id IS NULL;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_user') THEN
            ALTER TABLE users_user ADD COLUMN uuid_id UUID DEFAULT gen_random_uuid();
            UPDATE users_user SET uuid_id = gen_random_uuid() WHERE uuid_id IS NULL;
        END IF;
    END IF;
END $$;