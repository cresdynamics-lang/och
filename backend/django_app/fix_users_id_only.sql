-- Simple fix: Convert users.id from varchar(50) to UUID string with proper default
-- Keep all existing data and foreign keys intact

DO $$
BEGIN
    -- Check current users.id type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'character varying') THEN
        
        RAISE NOTICE 'Converting users.id to proper UUID string format...';
        
        -- Drop primary key constraint temporarily
        ALTER TABLE users DROP CONSTRAINT users_pkey;
        
        -- Change column to VARCHAR(36) with UUID default
        ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(36);
        ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
        
        -- Update any existing non-UUID values to proper UUIDs
        UPDATE users SET id = gen_random_uuid()::text WHERE LENGTH(id) != 36 OR id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        -- Recreate primary key constraint
        ALTER TABLE users ADD PRIMARY KEY (id);
        
        RAISE NOTICE 'Successfully converted users.id to UUID string format';
        
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'bigint') THEN
        
        RAISE NOTICE 'Converting users.id from bigint to UUID string...';
        
        -- Add new UUID column
        ALTER TABLE users ADD COLUMN id_uuid VARCHAR(36) DEFAULT gen_random_uuid()::text;
        
        -- Generate UUIDs for all existing users
        UPDATE users SET id_uuid = gen_random_uuid()::text;
        
        -- Drop primary key constraint
        ALTER TABLE users DROP CONSTRAINT users_pkey;
        
        -- Drop old id column
        ALTER TABLE users DROP COLUMN id;
        
        -- Rename UUID column to id
        ALTER TABLE users RENAME COLUMN id_uuid TO id;
        
        -- Make it not null and add primary key
        ALTER TABLE users ALTER COLUMN id SET NOT NULL;
        ALTER TABLE users ADD PRIMARY KEY (id);
        
        RAISE NOTICE 'Successfully converted users.id from bigint to UUID string';
        
    ELSE
        RAISE NOTICE 'users.id already has correct format or unknown type';
    END IF;
END $$;

-- Verify the result
DO $$
DECLARE
    id_type TEXT;
    id_length INTEGER;
BEGIN
    SELECT data_type, character_maximum_length 
    INTO id_type, id_length
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    RAISE NOTICE 'users.id is now: % (%)', id_type, 
        CASE WHEN id_length IS NOT NULL THEN id_length::text ELSE 'unlimited' END;
END $$;