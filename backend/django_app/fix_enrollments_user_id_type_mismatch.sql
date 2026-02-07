-- Fix type mismatch: enrollments.user_id (varchar) vs users.id (bigint)
-- This resolves: "operator does not exist: character varying = bigint"

DO $$
DECLARE
    users_id_type TEXT;
    enrollments_user_id_type TEXT;
BEGIN
    -- Get current column types
    SELECT data_type INTO users_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    SELECT data_type INTO enrollments_user_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'user_id';
    
    RAISE NOTICE 'users.id type: %, enrollments.user_id type: %', users_id_type, enrollments_user_id_type;
    
    -- If users.id is bigint and enrollments.user_id is varchar, convert enrollments to bigint
    IF users_id_type = 'bigint' AND enrollments_user_id_type = 'character varying' THEN
        RAISE NOTICE 'Converting enrollments.user_id from varchar to bigint...';
        
        ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;
        ALTER TABLE enrollments ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
        ALTER TABLE enrollments ADD CONSTRAINT enrollments_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Done: enrollments.user_id is now bigint';
    
    -- If users.id is varchar and enrollments.user_id is bigint, convert enrollments to varchar
    ELSIF users_id_type = 'character varying' AND enrollments_user_id_type = 'bigint' THEN
        RAISE NOTICE 'Converting enrollments.user_id from bigint to varchar(36)...';
        
        ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;
        ALTER TABLE enrollments ALTER COLUMN user_id TYPE varchar(36) USING user_id::text;
        ALTER TABLE enrollments ADD CONSTRAINT enrollments_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Done: enrollments.user_id is now varchar(36)';
    ELSE
        RAISE NOTICE 'Types already match or no conversion needed';
    END IF;
END $$;
