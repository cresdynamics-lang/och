-- Drop all foreign key constraints, convert users.id, then recreate constraints

-- Step 1: Drop all foreign key constraints that reference users.id
DROP CONSTRAINT IF EXISTS users_groups_user_id_f500bee5_fk_users_id;
DROP CONSTRAINT IF EXISTS users_user_permissions_user_id_92473840_fk_users_id;

-- Drop all other foreign key constraints to users
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'id'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                      constraint_record.table_name, constraint_record.constraint_name);
    END LOOP;
END $$;

-- Step 2: Convert users.id to UUID string
ALTER TABLE users ADD COLUMN id_uuid VARCHAR(36) DEFAULT gen_random_uuid()::text;
UPDATE users SET id_uuid = gen_random_uuid()::text;
ALTER TABLE users DROP CONSTRAINT users_pkey;
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users RENAME COLUMN id_uuid TO id;
ALTER TABLE users ALTER COLUMN id SET NOT NULL;
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE users ADD PRIMARY KEY (id);

-- Step 3: Recreate Django's required foreign key constraints
ALTER TABLE users_groups ADD CONSTRAINT users_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE users_user_permissions ADD CONSTRAINT users_user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

SELECT 'users.id converted to UUID string successfully' as result;