-- Fix organizations table missing owner_id column
-- This resolves the "column organizations.owner_id does not exist" error

-- Add missing owner_id column (assuming it references users.id which is BIGINT)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS owner_id BIGINT;

-- Drop constraint if it exists, then add it
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_owner_id_fkey;
ALTER TABLE organizations 
ADD CONSTRAINT organizations_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS organizations_owner_id_idx 
    ON organizations(owner_id);