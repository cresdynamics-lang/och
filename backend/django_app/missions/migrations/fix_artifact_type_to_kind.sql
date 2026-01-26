-- Manual SQL to rename type column to kind in mission_artifacts table
-- Run this if the migration doesn't work

-- Check if type column exists and kind doesn't, then rename
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mission_artifacts' 
    AND column_name = 'type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mission_artifacts' 
    AND column_name = 'kind'
  ) THEN
    ALTER TABLE mission_artifacts RENAME COLUMN type TO kind;
    RAISE NOTICE 'Renamed type column to kind';
  ELSE
    RAISE NOTICE 'Column type does not exist or kind already exists';
  END IF;
END $$;

