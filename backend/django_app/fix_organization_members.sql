-- Fix organization_members table missing columns and constraints
-- This resolves the "column organization_members.organization_id does not exist" error

-- Drop incorrectly typed user_id column if it exists
ALTER TABLE organization_members DROP COLUMN IF EXISTS user_id;

-- Add missing organization_id column
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS organization_id BIGINT;

-- Add missing user_id column with correct type (BIGINT to match users.id)
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- Drop existing constraints if they exist
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_organization_id_fkey;
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_organization_user_unique;

-- Add foreign key constraint for organization_id
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Add foreign key constraint for user_id (users.id is BIGINT)
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add unique constraint for organization and user combination
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_organization_user_unique 
    UNIQUE (organization_id, user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS organization_members_organization_id_idx 
    ON organization_members(organization_id);

CREATE INDEX IF NOT EXISTS organization_members_user_id_idx 
    ON organization_members(user_id);