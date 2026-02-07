-- Portfolio Engine Database Schema
-- Supabase PostgreSQL schema for portfolio_items, portfolio_reviews, and marketplace_profiles

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Portfolio Items Table
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  type TEXT NOT NULL CHECK (type IN ('mission', 'reflection', 'certification', 'github', 'thm', 'external', 'marketplace')),
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'published')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'marketplace_preview', 'public')),
  skill_tags TEXT[] DEFAULT '{}',
  competency_scores JSONB DEFAULT '{}',
  evidence_files JSONB DEFAULT '[]',
  external_providers JSONB DEFAULT '{}',
  mentor_feedback TEXT,
  marketplace_views INTEGER DEFAULT 0,
  employer_contacts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
);

-- Portfolio Reviews Table
CREATE TABLE IF NOT EXISTS portfolio_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id UUID NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rubric_scores JSONB NOT NULL,
  total_score DECIMAL(3,1) NOT NULL CHECK (total_score >= 0 AND total_score <= 10),
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Profiles Table
CREATE TABLE IF NOT EXISTS marketplace_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username TEXT UNIQUE NOT NULL,
  headline TEXT,
  bio TEXT,
  avatar_url TEXT,
  readiness_score INTEGER DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
  portfolio_health DECIMAL(3,1) DEFAULT 0 CHECK (portfolio_health >= 0 AND portfolio_health <= 10),
  is_contact_enabled BOOLEAN DEFAULT false,
  profile_status TEXT DEFAULT 'foundation' CHECK (profile_status IN ('foundation', 'emerging', 'job_ready')),
  featured_item_ids UUID[] DEFAULT '{}',
  total_views INTEGER DEFAULT 0,
  weekly_rank_change INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_portfolio_items_user_id ON portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_status ON portfolio_items(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_visibility ON portfolio_items(visibility);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_marketplace_views ON portfolio_items(marketplace_views DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_mission_id ON portfolio_items(mission_id) WHERE mission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portfolio_items_created_at ON portfolio_items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_reviews_item_id ON portfolio_reviews(portfolio_item_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_reviews_reviewer_id ON portfolio_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_reviews_status ON portfolio_reviews(status);

CREATE INDEX IF NOT EXISTS idx_marketplace_profiles_username ON marketplace_profiles(username);
CREATE INDEX IF NOT EXISTS idx_marketplace_profiles_readiness ON marketplace_profiles(readiness_score DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_profiles_status ON marketplace_profiles(profile_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_profiles_total_views ON marketplace_profiles(total_views DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_profiles ENABLE ROW LEVEL SECURITY;

-- Portfolio Items Policies
CREATE POLICY "Users can view their own portfolio items"
  ON portfolio_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public portfolio items"
  ON portfolio_items FOR SELECT
  USING (visibility = 'public' OR visibility = 'marketplace_preview');

CREATE POLICY "Users can create their own portfolio items"
  ON portfolio_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio items"
  ON portfolio_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio items"
  ON portfolio_items FOR DELETE
  USING (auth.uid() = user_id);

-- Portfolio Reviews Policies
CREATE POLICY "Users can view reviews for their portfolio items"
  ON portfolio_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_items
      WHERE portfolio_items.id = portfolio_reviews.portfolio_item_id
      AND portfolio_items.user_id = auth.uid()
    )
  );

CREATE POLICY "Mentors can create reviews"
  ON portfolio_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update their own reviews"
  ON portfolio_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- Marketplace Profiles Policies
CREATE POLICY "Anyone can view marketplace profiles"
  ON marketplace_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own marketplace profile"
  ON marketplace_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own marketplace profile"
  ON marketplace_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Functions for Incrementing Views
CREATE OR REPLACE FUNCTION increment_portfolio_views(item_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE portfolio_items
  SET marketplace_views = marketplace_views + 1
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_marketplace_views(profile_username TEXT)
RETURNS void AS $$
BEGIN
  UPDATE marketplace_profiles
  SET total_views = total_views + 1
  WHERE username = profile_username;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_reviews_updated_at
  BEFORE UPDATE ON portfolio_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_profiles_updated_at
  BEFORE UPDATE ON marketplace_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MISSION AUTO-IMPORT TRIGGER (85% missions → portfolio)
-- ============================================================================

-- Function to auto-import completed missions as portfolio items
CREATE OR REPLACE FUNCTION auto_portfolio_from_mission()
RETURNS TRIGGER AS $$
DECLARE
  mission_title TEXT;
  mission_skill_tags TEXT[];
  mission_files JSONB;
  ai_score_val NUMERIC;
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get mission details (handle both table name variations)
  SELECT 
    COALESCE(
      (SELECT title FROM missions WHERE id = NEW.mission_id),
      (SELECT title FROM mission WHERE id = NEW.mission_id),
      'Untitled Mission'
    ) INTO mission_title;

  -- Get skill tags from mission (if available)
  SELECT 
    COALESCE(
      (SELECT skill_tags FROM missions WHERE id = NEW.mission_id),
      (SELECT skill_tags FROM mission WHERE id = NEW.mission_id),
      ARRAY[]::TEXT[]
    ) INTO mission_skill_tags;

  -- Get files/artifacts from submission
  SELECT 
    COALESCE(
      NEW.files,
      NEW.artifacts,
      '[]'::JSONB
    ) INTO mission_files;

  -- Get AI score (if available)
  SELECT 
    COALESCE(
      NEW.ai_score,
      NEW.score,
      0
    ) INTO ai_score_val;

  -- Only import if score >= 85% (85% threshold)
  IF ai_score_val >= 85 THEN
    INSERT INTO portfolio_items (
      user_id,
      title,
      type,
      mission_id,
      status,
      skill_tags,
      evidence_files,
      visibility,
      summary
    ) VALUES (
      NEW.user_id,
      'Mission: ' || mission_title,
      'mission',
      NEW.mission_id,
      CASE 
        WHEN ai_score_val >= 90 THEN 'approved'
        ELSE 'draft'
      END,
      COALESCE(mission_skill_tags, ARRAY[]::TEXT[]),
      COALESCE(mission_files, '[]'::JSONB),
      'private',
      'Auto-imported from completed mission submission'
    )
    ON CONFLICT DO NOTHING; -- Prevent duplicates
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on mission_submissions (standard table name)
DROP TRIGGER IF EXISTS mission_portfolio_trigger ON mission_submissions;
CREATE TRIGGER mission_portfolio_trigger
  AFTER UPDATE OF status ON mission_submissions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_portfolio_from_mission();

-- Also create trigger on missionsubmissions (legacy table name, if exists)
-- This will fail gracefully if table doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'missionsubmissions'
  ) THEN
    DROP TRIGGER IF EXISTS mission_portfolio_trigger_legacy ON missionsubmissions;
    EXECUTE '
      CREATE TRIGGER mission_portfolio_trigger_legacy
        AFTER UPDATE OF status ON missionsubmissions
        FOR EACH ROW
        WHEN (NEW.status = ''completed'')
        EXECUTE FUNCTION auto_portfolio_from_mission()
    ';
  END IF;
END $$;

