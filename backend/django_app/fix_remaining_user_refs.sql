-- Fix remaining integer columns that reference users
-- Convert any remaining integer user reference columns to varchar

DO $$
DECLARE
    tbl_name TEXT;
    col_name TEXT;
BEGIN
    RAISE NOTICE 'Converting remaining integer user reference columns to varchar...';
    
    -- List of tables and columns that should reference users as strings
    FOR tbl_name, col_name IN VALUES 
        ('tracks', 'director_id'),
        ('cohorts', 'coordinator_id'),
        ('enrollments', 'user_id'),
        ('mentor_assignments', 'mentor_id'),
        ('organizations', 'owner_id'),
        ('organization_members', 'user_id'),
        ('chat_messages', 'mentee_id'),
        ('chat_messages', 'mentor_id'),
        ('waitlist', 'user_id')
    LOOP
        -- Check if column exists and is integer type
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = tbl_name AND column_name = col_name 
                   AND data_type IN ('integer', 'bigint')) THEN
            
            RAISE NOTICE 'Converting %.% from integer to varchar...', tbl_name, col_name;
            
            -- Add new varchar column
            EXECUTE format('ALTER TABLE %I ADD COLUMN %I_str VARCHAR(50)', tbl_name, col_name);
            
            -- Convert integer values to strings
            EXECUTE format('UPDATE %I SET %I_str = %I::text WHERE %I IS NOT NULL', 
                          tbl_name, col_name, col_name, col_name);
            
            -- Drop old integer column
            EXECUTE format('ALTER TABLE %I DROP COLUMN %I', tbl_name, col_name);
            
            -- Rename string column to original name
            EXECUTE format('ALTER TABLE %I RENAME COLUMN %I_str TO %I', tbl_name, col_name, col_name);
            
            RAISE NOTICE 'Successfully converted %.% to varchar', tbl_name, col_name;
            
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = tbl_name AND column_name = col_name 
                      AND data_type = 'uuid') THEN
            
            RAISE NOTICE 'Converting %.% from uuid to varchar...', tbl_name, col_name;
            
            -- Add new varchar column
            EXECUTE format('ALTER TABLE %I ADD COLUMN %I_str VARCHAR(50)', tbl_name, col_name);
            
            -- Convert UUID values to strings
            EXECUTE format('UPDATE %I SET %I_str = %I::text WHERE %I IS NOT NULL', 
                          tbl_name, col_name, col_name, col_name);
            
            -- Drop old UUID column
            EXECUTE format('ALTER TABLE %I DROP COLUMN %I', tbl_name, col_name);
            
            -- Rename string column to original name
            EXECUTE format('ALTER TABLE %I RENAME COLUMN %I_str TO %I', tbl_name, col_name, col_name);
            
            RAISE NOTICE 'Successfully converted %.% from uuid to varchar', tbl_name, col_name;
            
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = tbl_name AND column_name = col_name 
                      AND data_type = 'character varying') THEN
            
            RAISE NOTICE '%.% is already varchar - no conversion needed', tbl_name, col_name;
        ELSE
            RAISE NOTICE '%.% does not exist or has unknown type', tbl_name, col_name;
        END IF;
    END LOOP;
END $$;

-- Now create foreign key constraints for the converted columns
DO $$
DECLARE
    tbl_name TEXT;
    col_name TEXT;
BEGIN
    RAISE NOTICE 'Creating foreign key constraints...';
    
    FOR tbl_name, col_name IN VALUES 
        ('tracks', 'director_id'),
        ('cohorts', 'coordinator_id'),
        ('enrollments', 'user_id'),
        ('mentor_assignments', 'mentor_id'),
        ('organizations', 'owner_id'),
        ('organization_members', 'user_id'),
        ('chat_messages', 'mentee_id'),
        ('chat_messages', 'mentor_id'),
        ('waitlist', 'user_id')
    LOOP
        -- Check if table and column exist and are varchar
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = tbl_name AND column_name = col_name 
                   AND data_type = 'character varying') THEN
            
            BEGIN
                -- Add foreign key constraint
                EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_%I_fkey FOREIGN KEY (%I) REFERENCES users(id)', 
                              tbl_name, tbl_name, col_name, col_name);
                
                RAISE NOTICE 'Added foreign key constraint for %.%', tbl_name, col_name;
            EXCEPTION
                WHEN duplicate_object THEN
                    RAISE NOTICE 'Foreign key constraint for %.% already exists', tbl_name, col_name;
                WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to add foreign key constraint for %.%: %', tbl_name, col_name, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- Final verification
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Verification - User reference columns:';
    FOR rec IN 
        SELECT t.table_name, c.column_name, c.data_type, c.character_maximum_length
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_name IN ('tracks', 'cohorts', 'enrollments', 'mentor_assignments', 'organizations', 'organization_members', 'chat_messages', 'waitlist')
        AND c.column_name IN ('director_id', 'coordinator_id', 'user_id', 'mentor_id', 'owner_id', 'mentee_id', 'mentor_id')
        ORDER BY t.table_name, c.column_name
    LOOP
        RAISE NOTICE '  %.%: % (%)', rec.table_name, rec.column_name, rec.data_type,
            CASE WHEN rec.character_maximum_length IS NOT NULL THEN rec.character_maximum_length::text ELSE 'unlimited' END;
    END LOOP;
    
    RAISE NOTICE 'All user reference columns conversion completed!';
END $$;