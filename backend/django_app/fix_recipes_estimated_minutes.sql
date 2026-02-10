-- Add estimated_minutes column to recipes table if it doesn't exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'estimated_minutes'
    ) THEN
        ALTER TABLE recipes ADD COLUMN estimated_minutes INTEGER NOT NULL DEFAULT 30;
        RAISE NOTICE 'Added column recipes.estimated_minutes';
    ELSE
        RAISE NOTICE 'Column recipes.estimated_minutes already exists';
    END IF;
END $$;
