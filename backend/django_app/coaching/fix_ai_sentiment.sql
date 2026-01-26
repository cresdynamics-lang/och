-- Fix ai_sentiment column issue in coaching_reflections table
-- Run this SQL script directly on your database if migrations fail

-- Check if ai_sentiment column exists and sentiment doesn't
DO $$
BEGIN
    -- Handle ai_sentiment -> sentiment rename
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coaching_reflections' 
        AND column_name = 'ai_sentiment'
        AND table_schema = 'public'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'coaching_reflections' 
            AND column_name = 'sentiment'
            AND table_schema = 'public'
        ) THEN
            -- Rename ai_sentiment to sentiment
            ALTER TABLE coaching_reflections 
            RENAME COLUMN ai_sentiment TO sentiment;
        ELSE
            -- Both exist - copy data and drop ai_sentiment
            UPDATE coaching_reflections 
            SET sentiment = ai_sentiment::text 
            WHERE sentiment IS NULL AND ai_sentiment IS NOT NULL;
            
            ALTER TABLE coaching_reflections 
            DROP COLUMN ai_sentiment;
        END IF;
    END IF;
    
    -- Handle ai_tags -> emotion_tags rename
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coaching_reflections' 
        AND column_name = 'ai_tags'
        AND table_schema = 'public'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'coaching_reflections' 
            AND column_name = 'emotion_tags'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE coaching_reflections 
            RENAME COLUMN ai_tags TO emotion_tags;
        ELSE
            ALTER TABLE coaching_reflections 
            DROP COLUMN ai_tags;
        END IF;
    END IF;
    
    -- Handle response -> content rename
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coaching_reflections' 
        AND column_name = 'response'
        AND table_schema = 'public'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'coaching_reflections' 
            AND column_name = 'content'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE coaching_reflections 
            RENAME COLUMN response TO content;
        ELSE
            ALTER TABLE coaching_reflections 
            DROP COLUMN response;
        END IF;
    END IF;
    
    -- Handle goal fields (due_date and mentor_feedback)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coaching_goals' 
        AND column_name = 'due_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE coaching_goals 
        ADD COLUMN due_date DATE NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coaching_goals' 
        AND column_name = 'mentor_feedback'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE coaching_goals 
        ADD COLUMN mentor_feedback TEXT NULL;
    END IF;
END $$;

