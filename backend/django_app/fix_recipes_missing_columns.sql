-- Add missing columns to recipes table

DO $$
BEGIN
    -- Add track_codes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'track_codes'
    ) THEN
        ALTER TABLE recipes ADD COLUMN track_codes JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column recipes.track_codes';
    END IF;

    -- Add skill_codes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'skill_codes'
    ) THEN
        ALTER TABLE recipes ADD COLUMN skill_codes JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column recipes.skill_codes';
    END IF;

    -- Add tools_used column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'tools_used'
    ) THEN
        ALTER TABLE recipes ADD COLUMN tools_used JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column recipes.tools_used';
    END IF;

    -- Add prerequisites column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'prerequisites'
    ) THEN
        ALTER TABLE recipes ADD COLUMN prerequisites JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column recipes.prerequisites';
    END IF;

    -- Add description column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'description'
    ) THEN
        ALTER TABLE recipes ADD COLUMN description TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added column recipes.description';
    END IF;

    -- Add tools_and_environment column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'tools_and_environment'
    ) THEN
        ALTER TABLE recipes ADD COLUMN tools_and_environment JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column recipes.tools_and_environment';
    END IF;

    -- Add inputs column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'inputs'
    ) THEN
        ALTER TABLE recipes ADD COLUMN inputs JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column recipes.inputs';
    END IF;

    -- Add steps column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'steps'
    ) THEN
        ALTER TABLE recipes ADD COLUMN steps JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column recipes.steps';
    END IF;

    -- Add validation_checks column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'validation_checks'
    ) THEN
        ALTER TABLE recipes ADD COLUMN validation_checks JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column recipes.validation_checks';
    END IF;

    -- Add content column (legacy)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'content'
    ) THEN
        ALTER TABLE recipes ADD COLUMN content JSONB NOT NULL DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added column recipes.content';
    END IF;

    -- Add validation_steps column (legacy)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'validation_steps'
    ) THEN
        ALTER TABLE recipes ADD COLUMN validation_steps JSONB NOT NULL DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added column recipes.validation_steps';
    END IF;

    -- Add thumbnail_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'thumbnail_url'
    ) THEN
        ALTER TABLE recipes ADD COLUMN thumbnail_url VARCHAR(500) NOT NULL DEFAULT '';
        RAISE NOTICE 'Added column recipes.thumbnail_url';
    END IF;

    -- Add mentor_curated column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'mentor_curated'
    ) THEN
        ALTER TABLE recipes ADD COLUMN mentor_curated BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Added column recipes.mentor_curated';
    END IF;

    -- Add is_free_sample column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'is_free_sample'
    ) THEN
        ALTER TABLE recipes ADD COLUMN is_free_sample BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Added column recipes.is_free_sample';
    END IF;

    -- Add usage_count column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'usage_count'
    ) THEN
        ALTER TABLE recipes ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added column recipes.usage_count';
    END IF;

    -- Add avg_rating column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'avg_rating'
    ) THEN
        ALTER TABLE recipes ADD COLUMN avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0.0;
        RAISE NOTICE 'Added column recipes.avg_rating';
    END IF;

    -- Add is_active column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE recipes ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
        RAISE NOTICE 'Added column recipes.is_active';
    END IF;

    -- Add created_by_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'created_by_id'
    ) THEN
        ALTER TABLE recipes ADD COLUMN created_by_id UUID;
        RAISE NOTICE 'Added column recipes.created_by_id';
    END IF;
END $$;
