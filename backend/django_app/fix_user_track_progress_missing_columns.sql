-- Add missing tier mentor approval columns to user_track_progress table

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'user_track_progress' 
        AND column_name = 'tier3_mentor_approval'
    ) THEN
        ALTER TABLE user_track_progress ADD COLUMN tier3_mentor_approval BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column user_track_progress.tier3_mentor_approval';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'user_track_progress' 
        AND column_name = 'tier4_mentor_approval'
    ) THEN
        ALTER TABLE user_track_progress ADD COLUMN tier4_mentor_approval BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column user_track_progress.tier4_mentor_approval';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'user_track_progress' 
        AND column_name = 'tier5_mentor_approval'
    ) THEN
        ALTER TABLE user_track_progress ADD COLUMN tier5_mentor_approval BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column user_track_progress.tier5_mentor_approval';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'user_track_progress' 
        AND column_name = 'tier3_completion_requirements_met'
    ) THEN
        ALTER TABLE user_track_progress ADD COLUMN tier3_completion_requirements_met BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column user_track_progress.tier3_completion_requirements_met';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'user_track_progress' 
        AND column_name = 'tier4_completion_requirements_met'
    ) THEN
        ALTER TABLE user_track_progress ADD COLUMN tier4_completion_requirements_met BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column user_track_progress.tier4_completion_requirements_met';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'user_track_progress' 
        AND column_name = 'tier5_completion_requirements_met'
    ) THEN
        ALTER TABLE user_track_progress ADD COLUMN tier5_completion_requirements_met BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column user_track_progress.tier5_completion_requirements_met';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'user_track_progress' 
        AND column_name = 'tier4_unlocked'
    ) THEN
        ALTER TABLE user_track_progress ADD COLUMN tier4_unlocked BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column user_track_progress.tier4_unlocked';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'user_track_progress' 
        AND column_name = 'tier5_unlocked'
    ) THEN
        ALTER TABLE user_track_progress ADD COLUMN tier5_unlocked BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column user_track_progress.tier5_unlocked';
    END IF;
END $$;
