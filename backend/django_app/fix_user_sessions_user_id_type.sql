-- Fix user_sessions table user_id type mismatch
-- The users table has bigint id, but user_sessions.user_id is UUID

DO $$
BEGIN
    -- Check if user_id column exists and is UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'user_sessions' 
        AND column_name = 'user_id'
        AND data_type = 'uuid'
    ) THEN
        -- Drop the column and recreate with correct type
        ALTER TABLE user_sessions DROP COLUMN user_id;
        ALTER TABLE user_sessions ADD COLUMN user_id BIGINT NOT NULL;
        
        -- Add foreign key constraint
        ALTER TABLE user_sessions ADD CONSTRAINT fk_user_sessions_user 
            FOREIGN KEY (user_id) 
            REFERENCES users(id) 
            ON DELETE CASCADE;
        
        -- Add index
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
        
        RAISE NOTICE 'Fixed user_sessions.user_id type from UUID to BIGINT';
    ELSE
        RAISE NOTICE 'user_sessions.user_id is already BIGINT or does not exist';
    END IF;
END $$;
