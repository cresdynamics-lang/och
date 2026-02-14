-- Add missing tier columns to curriculum_tracks table

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'curriculum_tracks' 
        AND column_name = 'tier2_mini_missions_required'
    ) THEN
        ALTER TABLE curriculum_tracks ADD COLUMN tier2_mini_missions_required INTEGER DEFAULT 0;
        RAISE NOTICE 'Added column curriculum_tracks.tier2_mini_missions_required';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'curriculum_tracks' 
        AND column_name = 'tier3_mini_missions_required'
    ) THEN
        ALTER TABLE curriculum_tracks ADD COLUMN tier3_mini_missions_required INTEGER DEFAULT 0;
        RAISE NOTICE 'Added column curriculum_tracks.tier3_mini_missions_required';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'curriculum_tracks' 
        AND column_name = 'tier4_mini_missions_required'
    ) THEN
        ALTER TABLE curriculum_tracks ADD COLUMN tier4_mini_missions_required INTEGER DEFAULT 0;
        RAISE NOTICE 'Added column curriculum_tracks.tier4_mini_missions_required';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'curriculum_tracks' 
        AND column_name = 'tier2_require_mentor_approval'
    ) THEN
        ALTER TABLE curriculum_tracks ADD COLUMN tier2_require_mentor_approval BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column curriculum_tracks.tier2_require_mentor_approval';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'curriculum_tracks' 
        AND column_name = 'tier3_require_mentor_approval'
    ) THEN
        ALTER TABLE curriculum_tracks ADD COLUMN tier3_require_mentor_approval BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column curriculum_tracks.tier3_require_mentor_approval';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'curriculum_tracks' 
        AND column_name = 'tier4_require_mentor_approval'
    ) THEN
        ALTER TABLE curriculum_tracks ADD COLUMN tier4_require_mentor_approval BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column curriculum_tracks.tier4_require_mentor_approval';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'curriculum_tracks' 
        AND column_name = 'tier5_mini_missions_required'
    ) THEN
        ALTER TABLE curriculum_tracks ADD COLUMN tier5_mini_missions_required INTEGER DEFAULT 0;
        RAISE NOTICE 'Added column curriculum_tracks.tier5_mini_missions_required';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'curriculum_tracks' 
        AND column_name = 'tier5_require_mentor_approval'
    ) THEN
        ALTER TABLE curriculum_tracks ADD COLUMN tier5_require_mentor_approval BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column curriculum_tracks.tier5_require_mentor_approval';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'curriculum_tracks' 
        AND column_name = 'mastery_completion_rubric_id'
    ) THEN
        ALTER TABLE curriculum_tracks ADD COLUMN mastery_completion_rubric_id UUID;
        RAISE NOTICE 'Added column curriculum_tracks.mastery_completion_rubric_id';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'curriculum_tracks' 
        AND column_name = 'progression_mode'
    ) THEN
        ALTER TABLE curriculum_tracks ADD COLUMN progression_mode VARCHAR(50) DEFAULT 'linear';
        RAISE NOTICE 'Added column curriculum_tracks.progression_mode';
    END IF;
END $$;
