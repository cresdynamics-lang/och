-- Add missing columns to curriculum_tracks (fix: column curriculum_tracks.slug does not exist)
-- Run with: psql -U your_user -d your_db -f fix_curriculum_tracks_slug.sql
-- Or: python manage.py dbshell < fix_curriculum_tracks_slug.sql

-- Add slug (nullable first, then backfill and set NOT NULL)
ALTER TABLE curriculum_tracks ADD COLUMN IF NOT EXISTS slug VARCHAR(50) NULL;
UPDATE curriculum_tracks SET slug = LOWER(REPLACE(REPLACE(COALESCE(TRIM(code), ''), ' ', '-'), '_', '-')) WHERE slug IS NULL;
UPDATE curriculum_tracks SET slug = 'track-' || REPLACE(id::text, '-', '') WHERE slug IS NULL OR slug = '';
ALTER TABLE curriculum_tracks ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS curriculum_tracks_slug_unique ON curriculum_tracks(slug);

-- Add title (default '')
ALTER TABLE curriculum_tracks ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT '';

-- Add order_number (default 1)
ALTER TABLE curriculum_tracks ADD COLUMN IF NOT EXISTS order_number INTEGER NOT NULL DEFAULT 1;

-- Add thumbnail_url (default '')
ALTER TABLE curriculum_tracks ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(200) NOT NULL DEFAULT '';
