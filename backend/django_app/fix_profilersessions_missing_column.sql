-- Add missing columns to profilersessions table

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'technical_exposure_score'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN technical_exposure_score DECIMAL(5,2) DEFAULT 0.0;
        RAISE NOTICE 'Added column profilersessions.technical_exposure_score';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'work_style_cluster'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN work_style_cluster VARCHAR(50);
        RAISE NOTICE 'Added column profilersessions.work_style_cluster';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'scenario_choices'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN scenario_choices JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added column profilersessions.scenario_choices';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'difficulty_selection'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN difficulty_selection VARCHAR(50);
        RAISE NOTICE 'Added column profilersessions.difficulty_selection';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'track_alignment_percentages'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN track_alignment_percentages JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added column profilersessions.track_alignment_percentages';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'result_accepted'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN result_accepted BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column profilersessions.result_accepted';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'result_accepted_at'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN result_accepted_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added column profilersessions.result_accepted_at';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'foundations_transition_at'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN foundations_transition_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added column profilersessions.foundations_transition_at';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'time_spent_per_module'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN time_spent_per_module JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added column profilersessions.time_spent_per_module';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'response_times'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN response_times JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column profilersessions.response_times';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'suspicious_patterns'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN suspicious_patterns JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column profilersessions.suspicious_patterns';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'anti_cheat_score'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN anti_cheat_score DECIMAL(5,2) DEFAULT 100.0;
        RAISE NOTICE 'Added column profilersessions.anti_cheat_score';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN ip_address INET;
        RAISE NOTICE 'Added column profilersessions.ip_address';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN user_agent TEXT;
        RAISE NOTICE 'Added column profilersessions.user_agent';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profilersessions' 
        AND column_name = 'device_fingerprint'
    ) THEN
        ALTER TABLE profilersessions ADD COLUMN device_fingerprint VARCHAR(255);
        RAISE NOTICE 'Added column profilersessions.device_fingerprint';
    END IF;
END $$;
