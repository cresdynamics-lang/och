-- Convert Users Table ID from Integer to String
-- This script converts the users table primary key from bigint to varchar and updates all references

-- Step 1: Drop the uuid_id column we created earlier
ALTER TABLE users DROP COLUMN IF EXISTS uuid_id;

-- Step 2: Find all tables that reference users.id
DO $$
DECLARE
    ref_table TEXT;
    ref_column TEXT;
    constraint_name TEXT;
BEGIN
    RAISE NOTICE 'Finding all foreign key references to users.id...';
    
    FOR ref_table, ref_column, constraint_name IN
        SELECT 
            tc.table_name,
            kcu.column_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'id'
    LOOP
        RAISE NOTICE 'Found reference: %.% (constraint: %)', ref_table, ref_column, constraint_name;
        
        -- Drop the foreign key constraint
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', ref_table, constraint_name);
        
        -- Add string column for the new reference
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I_str VARCHAR(50)', ref_table, ref_column);
        
        -- Convert integer values to strings
        EXECUTE format('UPDATE %I SET %I_str = %I::text WHERE %I IS NOT NULL', 
                      ref_table, ref_column, ref_column, ref_column);
        
        -- Drop old integer column
        EXECUTE format('ALTER TABLE %I DROP COLUMN %I', ref_table, ref_column);
        
        -- Rename string column to original name
        EXECUTE format('ALTER TABLE %I RENAME COLUMN %I_str TO %I', ref_table, ref_column, ref_column);
        
        RAISE NOTICE 'Updated %.% to string', ref_table, ref_column;
    END LOOP;
END $$;

-- Step 3: Convert users.id from bigint to varchar
DO $$
BEGIN
    RAISE NOTICE 'Converting users.id from bigint to varchar...';
    
    -- Add new string id column
    ALTER TABLE users ADD COLUMN id_str VARCHAR(50);
    
    -- Convert existing integer IDs to strings
    UPDATE users SET id_str = id::text;
    
    -- Drop primary key constraint
    ALTER TABLE users DROP CONSTRAINT users_pkey;
    
    -- Drop old integer id column
    ALTER TABLE users DROP COLUMN id;
    
    -- Rename string column to id
    ALTER TABLE users RENAME COLUMN id_str TO id;
    
    -- Make it not null
    ALTER TABLE users ALTER COLUMN id SET NOT NULL;
    
    -- Add new primary key constraint
    ALTER TABLE users ADD PRIMARY KEY (id);
    
    RAISE NOTICE 'Successfully converted users.id to varchar';
END $$;

-- Step 4: Re-create foreign key constraints with string references
DO $$
DECLARE
    ref_table TEXT;
    ref_column TEXT;
BEGIN
    RAISE NOTICE 'Re-creating foreign key constraints...';
    
    -- List of known tables that should reference users
    FOR ref_table, ref_column IN VALUES 
        ('tracks', 'director_id'),
        ('cohorts', 'coordinator_id'),
        ('enrollments', 'user_id'),
        ('mentor_assignments', 'mentor_id'),
        ('organizations', 'owner_id'),
        ('organization_members', 'user_id'),
        ('chat_messages', 'mentee_id'),
        ('chat_messages', 'mentor_id'),
        ('user_roles', 'user_id'),
        ('user_roles', 'assigned_by_id'),
        ('consent_scopes', 'user_id'),
        ('entitlements', 'user_id')
    LOOP
        -- Check if table and column exist
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = ref_table AND column_name = ref_column) THEN
            
            -- Add foreign key constraint
            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_%I_fkey FOREIGN KEY (%I) REFERENCES users(id)', 
                          ref_table, ref_table, ref_column, ref_column);
            
            RAISE NOTICE 'Added foreign key constraint for %.%', ref_table, ref_column;
        END IF;
    END LOOP;
END $$;

-- Step 5: Verify the conversion
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Updated users table structure:';
    FOR rec IN 
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %: % (%)', rec.column_name, 
            CASE 
                WHEN rec.data_type = 'character varying' THEN 
                    rec.data_type || '(' || COALESCE(rec.character_maximum_length::text, 'unlimited') || ')'
                ELSE rec.data_type 
            END,
            CASE WHEN rec.is_nullable = 'YES' THEN 'nullable' ELSE 'not null' END;
    END LOOP;
END $$;

-- Final notice
DO $$
BEGIN
    RAISE NOTICE 'Users table ID conversion to string completed!';
END $$;