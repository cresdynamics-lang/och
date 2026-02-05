-- Add sponsor_id column to users table
-- This column will reference the uuid_id of a sponsor user

ALTER TABLE users ADD COLUMN sponsor_id UUID;

-- Add foreign key constraint
ALTER TABLE users ADD CONSTRAINT users_sponsor_id_fkey 
FOREIGN KEY (sponsor_id) REFERENCES users(uuid_id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX users_sponsor_id_idx ON users(sponsor_id);