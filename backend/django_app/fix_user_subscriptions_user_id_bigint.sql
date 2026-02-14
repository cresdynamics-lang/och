-- Fix: user_subscriptions.user_id was VARCHAR (from raw SQL) but users.id is bigint.
-- Error: operator does not exist: character varying = integer
-- PostgreSQL does not allow subqueries in ALTER COLUMN USING, so we use a temp column.

-- Step 1: Add temp column
ALTER TABLE user_subscriptions ADD COLUMN user_id_new BIGINT;

-- Step 2: Populate (subqueries allowed in UPDATE)
UPDATE user_subscriptions us
SET user_id_new = CASE
    WHEN us.user_id::text ~ '^[0-9]+$' THEN us.user_id::text::bigint
    ELSE (
        SELECT u.id FROM users u
        WHERE u.uuid_id::text = us.user_id::text
        OR u.id::text = us.user_id::text
        LIMIT 1
    )
END;

-- Step 3: Drop old column, rename new one
ALTER TABLE user_subscriptions DROP COLUMN user_id;
ALTER TABLE user_subscriptions RENAME COLUMN user_id_new TO user_id;

-- Step 4: Restore NOT NULL and unique if they existed
ALTER TABLE user_subscriptions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_unique UNIQUE (user_id);

-- Step 5: Recreate FK to users(id)
ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_user_id_fk
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
