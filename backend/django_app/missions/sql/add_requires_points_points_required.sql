-- Add points-to-unlock columns to missions table
-- Enables missions to be locked until user attains required points (from curriculum progress)
-- Run with: psql -U <user> -d <database> -f add_requires_points_points_required.sql

BEGIN;

-- requires_points: If TRUE, mission is locked until user attains points_required
ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS requires_points BOOLEAN NOT NULL DEFAULT FALSE;

-- points_required: Minimum points (from progress level) needed to unlock this mission
ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS points_required INTEGER NULL;

COMMIT;
