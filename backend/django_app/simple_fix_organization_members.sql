-- Simple fix for organization_members table
-- Handle the data type mismatch issue

-- Add missing organization_id column
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS organization_id BIGINT;

-- Add missing user_id column - try BIGINT first since error suggests users.id is bigint
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- Add foreign key constraints
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add unique constraint
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_organization_user_unique 
    UNIQUE (organization_id, user_id);