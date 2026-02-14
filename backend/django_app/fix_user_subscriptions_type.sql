-- Fix user_subscriptions user_id to handle UUID comparisons
-- Drop and recreate with proper type or add cast index

-- Option 1: Add a functional index that casts user_id to UUID for comparisons
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_uuid_idx ON user_subscriptions(CAST(user_id AS UUID));

-- Option 2: If the above doesn't work, you may need to alter the column type
-- But this requires the data to be valid UUIDs first
-- ALTER TABLE user_subscriptions ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
