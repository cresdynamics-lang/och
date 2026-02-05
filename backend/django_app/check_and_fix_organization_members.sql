-- Check and fix organization_members table
-- First, let's see what we're working with

-- Check the data type of users.id
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

-- Check the data type of organizations.id  
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'organizations' AND column_name = 'id';

-- Check current organization_members structure
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'organization_members';

-- Now fix the table based on what we find
-- Add missing columns (run this after checking the above queries)

-- Add missing organization_id column
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS organization_id BIGINT;

-- Add missing user_id column - using VARCHAR(36) to match users.id
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS user_id VARCHAR(36);

-- Add foreign key constraints
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- For user_id, we need to match the exact type of users.id
-- If users.id is VARCHAR(36), use this:
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add unique constraint
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_organization_user_unique 
    UNIQUE (organization_id, user_id);