-- Fix profilersessions table user_id type from VARCHAR to BIGINT

DO $$
BEGIN
    -- Check current data type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'user_id'
        AND data_type = 'character varying'
    ) THEN
        -- Drop foreign key constraint if exists
        ALTER TABLE profilersessions DROP CONSTRAINT IF EXISTS profilersessions_user_id_fkey;
        
        -- Change column type to BIGINT
        ALTER TABLE profilersessions ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint;
        
        -- Add foreign key constraint
        ALTER TABLE profilersessions ADD CONSTRAINT profilersessions_user_id_fkey 
            FOREIGN KEY (user_id) 
            REFERENCES users(id) 
            ON DELETE CASCADE;
        
        RAISE NOTICE 'Fixed profilersessions.user_id type from VARCHAR to BIGINT';
    ELSE
        RAISE NOTICE 'profilersessions.user_id is already BIGINT or does not exist';
    END IF;
END $$;
