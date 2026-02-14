-- Create dashboard_update_queue table for Student Dashboard (background refresh queue).
-- Fixes: relation "dashboard_update_queue" does not exist
-- Requires: users table (with id BIGINT primary key) must exist.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'dashboard_update_queue'
    ) THEN
        CREATE TABLE dashboard_update_queue (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL,
            priority VARCHAR(10) NOT NULL DEFAULT 'normal',
            reason VARCHAR(100) NOT NULL,
            queued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            processed_at TIMESTAMP WITH TIME ZONE NULL,
            CONSTRAINT dashboard_update_queue_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT dashboard_update_queue_priority_check
                CHECK (priority IN ('urgent', 'high', 'normal', 'low'))
        );

        CREATE INDEX dashboard_u_user_id_509c47_idx ON dashboard_update_queue (user_id, priority);
        CREATE INDEX dashboard_u_priorit_2403cf_idx ON dashboard_update_queue (priority, queued_at);
        CREATE INDEX dashboard_u_process_376fc3_idx ON dashboard_update_queue (processed_at);

        RAISE NOTICE 'Table dashboard_update_queue created successfully.';
    ELSE
        RAISE NOTICE 'Table dashboard_update_queue already exists.';
    END IF;
END
$$;
