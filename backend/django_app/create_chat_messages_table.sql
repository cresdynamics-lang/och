-- Create chat_messages table for mentorship chat functionality
-- This table stores messages between mentees and mentors

DO $$ 
BEGIN
    -- Create chat_messages table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'chat_messages'
    ) THEN
        CREATE TABLE chat_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            mentee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            mentor_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('mentee', 'mentor')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
        
        RAISE NOTICE 'Table chat_messages created successfully';
    ELSE
        RAISE NOTICE 'Table chat_messages already exists, skipping creation';
    END IF;
    
    -- Create indexes if they don't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'chat_messages' 
        AND indexname = 'chat_messages_mentee_id_idx'
    ) THEN
        CREATE INDEX chat_messages_mentee_id_idx ON chat_messages(mentee_id);
        RAISE NOTICE 'Index chat_messages_mentee_id_idx created successfully';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'chat_messages' 
        AND indexname = 'chat_messages_mentor_id_idx'
    ) THEN
        CREATE INDEX chat_messages_mentor_id_idx ON chat_messages(mentor_id);
        RAISE NOTICE 'Index chat_messages_mentor_id_idx created successfully';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'chat_messages' 
        AND indexname = 'chat_messages_sender_type_idx'
    ) THEN
        CREATE INDEX chat_messages_sender_type_idx ON chat_messages(sender_type);
        RAISE NOTICE 'Index chat_messages_sender_type_idx created successfully';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'chat_messages' 
        AND indexname = 'chat_messages_created_at_idx'
    ) THEN
        CREATE INDEX chat_messages_created_at_idx ON chat_messages(created_at);
        RAISE NOTICE 'Index chat_messages_created_at_idx created successfully';
    END IF;
    
    -- Create composite indexes
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'chat_messages' 
        AND indexname = 'chat_messag_mentee__1a6406_idx'
    ) THEN
        CREATE INDEX chat_messag_mentee__1a6406_idx ON chat_messages(mentee_id, created_at);
        RAISE NOTICE 'Composite index chat_messag_mentee__1a6406_idx created successfully';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'chat_messages' 
        AND indexname = 'chat_messag_mentor__3d0b4a_idx'
    ) THEN
        CREATE INDEX chat_messag_mentor__3d0b4a_idx ON chat_messages(mentor_id, created_at);
        RAISE NOTICE 'Composite index chat_messag_mentor__3d0b4a_idx created successfully';
    END IF;
    
END $$;
