-- Add missing columns to missions table
-- Fixes: column missions.escalation_events does not exist (GET /api/v1/missions/ 500)
-- Run with: psql -U <user> -d <database> -f add_escalation_events_environmental_cues.sql

BEGIN;

-- escalation_events: Mastery-level escalation events (JSON array)
ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS escalation_events JSONB NOT NULL DEFAULT '[]';

-- environmental_cues: Mastery-level environmental cues (JSON array)
ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS environmental_cues JSONB NOT NULL DEFAULT '[]';

COMMIT;
