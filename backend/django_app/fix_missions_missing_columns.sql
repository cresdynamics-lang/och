-- Add missing columns to missions table

DO $$
BEGIN
    -- Add code column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'code'
    ) THEN
        ALTER TABLE missions ADD COLUMN code VARCHAR(50) UNIQUE;
        RAISE NOTICE 'Added column missions.code';
    END IF;

    -- Add track column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'track'
    ) THEN
        ALTER TABLE missions ADD COLUMN track VARCHAR(20);
        RAISE NOTICE 'Added column missions.track';
    END IF;

    -- Add tier column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'tier'
    ) THEN
        ALTER TABLE missions ADD COLUMN tier VARCHAR(20);
        RAISE NOTICE 'Added column missions.tier';
    END IF;

    -- Add story column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'story'
    ) THEN
        ALTER TABLE missions ADD COLUMN story TEXT;
        RAISE NOTICE 'Added column missions.story';
    END IF;

    -- Add story_narrative column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'story_narrative'
    ) THEN
        ALTER TABLE missions ADD COLUMN story_narrative TEXT;
        RAISE NOTICE 'Added column missions.story_narrative';
    END IF;

    -- Add objectives column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'objectives'
    ) THEN
        ALTER TABLE missions ADD COLUMN objectives JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column missions.objectives';
    END IF;

    -- Add time_constraint_hours column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'time_constraint_hours'
    ) THEN
        ALTER TABLE missions ADD COLUMN time_constraint_hours INTEGER;
        RAISE NOTICE 'Added column missions.time_constraint_hours';
    END IF;

    -- Add recipe_recommendations column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'recipe_recommendations'
    ) THEN
        ALTER TABLE missions ADD COLUMN recipe_recommendations JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column missions.recipe_recommendations';
    END IF;

    -- Add success_criteria column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'success_criteria'
    ) THEN
        ALTER TABLE missions ADD COLUMN success_criteria JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added column missions.success_criteria';
    END IF;

    -- Add rubric_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'rubric_id'
    ) THEN
        ALTER TABLE missions ADD COLUMN rubric_id UUID;
        RAISE NOTICE 'Added column missions.rubric_id';
    END IF;

    -- Add branching_paths column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'branching_paths'
    ) THEN
        ALTER TABLE missions ADD COLUMN branching_paths JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added column missions.branching_paths';
    END IF;

    -- Add hints column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'hints'
    ) THEN
        ALTER TABLE missions ADD COLUMN hints JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column missions.hints';
    END IF;
END $$;
