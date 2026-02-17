-- Fix audit_logs foreign key constraint to use SET NULL instead of RESTRICT
-- This ensures that when a user is deleted, audit logs are preserved but user_id is set to NULL
-- This matches the Django model definition: on_delete=models.SET_NULL

DO $$ 
BEGIN
    -- Check if the constraint exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'audit_logs' 
        AND constraint_name = 'audit_logs_user_id_752b0e2b_fk_users_id'
    ) THEN
        -- Drop the existing constraint
        ALTER TABLE audit_logs 
        DROP CONSTRAINT audit_logs_user_id_752b0e2b_fk_users_id;
        
        RAISE NOTICE 'Dropped existing constraint audit_logs_user_id_752b0e2b_fk_users_id';
    END IF;
    
    -- Add the constraint with SET NULL (matches Django model: on_delete=models.SET_NULL)
    ALTER TABLE audit_logs 
    ADD CONSTRAINT audit_logs_user_id_fk_users_id 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Added SET NULL constraint for audit_logs.user_id';
    
END $$;
