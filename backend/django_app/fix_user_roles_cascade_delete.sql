-- Fix user_roles foreign key constraint to use CASCADE delete
-- This ensures that when a user is deleted, their role assignments are automatically deleted

DO $$ 
BEGIN
    -- Check if the constraint exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'user_roles' 
        AND constraint_name = 'user_roles_user_id_9d9f8dbb_fk_users_id'
    ) THEN
        -- Drop the existing constraint
        ALTER TABLE user_roles 
        DROP CONSTRAINT user_roles_user_id_9d9f8dbb_fk_users_id;
        
        RAISE NOTICE 'Dropped existing constraint user_roles_user_id_9d9f8dbb_fk_users_id';
    END IF;
    
    -- Add the constraint with CASCADE delete
    ALTER TABLE user_roles 
    ADD CONSTRAINT user_roles_user_id_fk_users_id 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Added CASCADE delete constraint for user_roles.user_id';
    
END $$;
