-- Check actual data types to determine the correct fix

-- Check users.id data type
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

-- Check payment_transactions.user_id data type
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' AND column_name = 'user_id';

-- If users.id is VARCHAR(36), use this fix:
-- ALTER TABLE payment_transactions ALTER COLUMN user_id TYPE VARCHAR(36);

-- If users.id is BIGINT, use this fix instead:
-- ALTER TABLE payment_transactions ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT;