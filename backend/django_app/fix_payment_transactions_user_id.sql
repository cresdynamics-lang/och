-- Fix payment_transactions.user_id column type mismatch
-- users.id is BIGINT (auto-increment primary key)
-- user_id should be BIGINT to match

-- Drop existing foreign key constraint if it exists
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_user_id_fkey;

-- Change the column type to BIGINT to match users.id
ALTER TABLE payment_transactions ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT;

-- Add the foreign key constraint back
ALTER TABLE payment_transactions 
ADD CONSTRAINT payment_transactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS payment_transactions_user_id_idx 
    ON payment_transactions(user_id);