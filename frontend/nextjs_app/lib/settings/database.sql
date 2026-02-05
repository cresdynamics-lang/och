-- Settings Engine - Master Database Schema
-- Controls ALL platform coordination

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USER SETTINGS TABLE (Master Control)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- PROFILE COMPLETENESS (Blocks Marketplace)
  profile_completeness INTEGER DEFAULT 0 CHECK (profile_completeness >= 0 AND profile_completeness <= 100),
  name TEXT,
  headline TEXT,
  location TEXT,
  track TEXT CHECK (track IN ('defender', 'attacker', 'analyst', 'architect', 'manager')),
  avatar_uploaded BOOLEAN DEFAULT false,
  linkedin_linked BOOLEAN DEFAULT false,
  bio_completed BOOLEAN DEFAULT false,
  timezone_set TEXT DEFAULT 'Africa/Nairobi',
  language_preference TEXT DEFAULT 'en',
  
  -- PRIVACY & VISIBILITY (Controls Portfolio/Marketplace)
  portfolio_visibility TEXT DEFAULT 'private' CHECK (portfolio_visibility IN ('private', 'unlisted', 'marketplace_preview', 'public')),
  marketplace_contact_enabled BOOLEAN DEFAULT false,
  data_sharing_consent JSONB DEFAULT '{}',
  
  -- NOTIFICATION PREFERENCES (Drives Retention)
  notifications_email BOOLEAN DEFAULT true,
  notifications_push BOOLEAN DEFAULT true,
  notifications_categories JSONB DEFAULT '{"missions": true, "coaching": true, "mentor": false, "marketplace": false}',
  
  -- COACHING PREFERENCES
  ai_coach_style TEXT DEFAULT 'motivational' CHECK (ai_coach_style IN ('motivational', 'direct', 'analytical')),
  habit_frequency TEXT DEFAULT 'daily',
  reflection_prompt_style TEXT DEFAULT 'guided',
  
  -- INTEGRATION STATE
  integrations JSONB DEFAULT '{}',
  
  -- SECURITY
  two_factor_enabled BOOLEAN DEFAULT false,
  active_sessions JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENTITLEMENTS VIEW (Computed from subscription + settings)
-- Note: If subscriptions table doesn't exist, create a placeholder or use API
CREATE OR REPLACE VIEW user_entitlements AS
SELECT 
  u.id as user_id,
  COALESCE(s.profile_completeness, 0) as profile_completeness,
  COALESCE(
    (SELECT tier FROM subscriptions WHERE user_id = u.id AND status = 'active' LIMIT 1),
    'free'
  ) as tier,
  COALESCE(
    (SELECT status FROM subscriptions WHERE user_id = u.id AND status = 'active' LIMIT 1),
    'inactive'
  ) as subscription_status,
  (SELECT enhanced_access_until FROM subscriptions WHERE user_id = u.id AND status = 'active' LIMIT 1) as enhanced_access_until,
  
  -- Marketplace Full Access
  CASE 
    WHEN COALESCE(s.portfolio_visibility, 'private') IN ('marketplace_preview', 'public') 
     AND COALESCE(s.profile_completeness, 0) >= 80 
     AND COALESCE(
       (SELECT tier FROM subscriptions WHERE user_id = u.id AND status = 'active' LIMIT 1),
       'free'
     ) = 'professional'
    THEN true 
    ELSE false 
  END as marketplace_full_access,
  
  -- AI Coach Full Access
  CASE 
    WHEN COALESCE(
      (SELECT tier FROM subscriptions WHERE user_id = u.id AND status = 'active' LIMIT 1),
      'free'
    ) = 'professional' 
     OR (COALESCE(
       (SELECT tier FROM subscriptions WHERE user_id = u.id AND status = 'active' LIMIT 1),
       'free'
     ) = 'starter' AND COALESCE(
       (SELECT enhanced_access_until FROM subscriptions WHERE user_id = u.id AND status = 'active' LIMIT 1),
       '1970-01-01'::timestamptz
     ) > NOW())
    THEN true 
    ELSE false 
  END as ai_coach_full_access,
  
  -- Mentor Access
  CASE
    WHEN COALESCE(
      (SELECT tier FROM subscriptions WHERE user_id = u.id AND status = 'active' LIMIT 1),
      'free'
    ) IN ('professional', 'starter')
    THEN true
    ELSE false
  END as mentor_access,
  
  -- Portfolio Export
  CASE
    WHEN COALESCE(
      (SELECT tier FROM subscriptions WHERE user_id = u.id AND status = 'active' LIMIT 1),
      'free'
    ) IN ('professional', 'starter')
    THEN true
    ELSE false
  END as portfolio_export_enabled

FROM auth.users u
LEFT JOIN user_settings s ON s.user_id = u.id;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_profile_completeness ON user_settings(profile_completeness);

-- TRIGGER 1: Profile completeness → Marketplace eligibility
CREATE OR REPLACE FUNCTION update_marketplace_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_profiles 
  SET 
    profile_status = CASE 
      WHEN NEW.profile_completeness >= 90 THEN 'job_ready'
      WHEN NEW.profile_completeness >= 70 THEN 'emerging'
      ELSE 'foundation'
    END,
    is_contact_enabled = NEW.marketplace_contact_enabled
  WHERE user_id = NEW.user_id;
  
  PERFORM pg_notify('settings_changed', json_build_object(
    'user_id', NEW.user_id, 
    'type', 'profile',
    'completeness', NEW.profile_completeness
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_profile_trigger
  AFTER UPDATE OF profile_completeness, marketplace_contact_enabled ON user_settings
  FOR EACH ROW 
  WHEN (OLD.profile_completeness IS DISTINCT FROM NEW.profile_completeness 
        OR OLD.marketplace_contact_enabled IS DISTINCT FROM NEW.marketplace_contact_enabled)
  EXECUTE FUNCTION update_marketplace_eligibility();

-- TRIGGER 2: Privacy → Portfolio visibility
CREATE OR REPLACE FUNCTION sync_portfolio_visibility()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE portfolio_items 
  SET visibility = NEW.portfolio_visibility
  WHERE user_id = NEW.user_id AND status = 'approved';
  
  PERFORM pg_notify('settings_changed', json_build_object(
    'user_id', NEW.user_id,
    'type', 'privacy',
    'visibility', NEW.portfolio_visibility
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_portfolio_trigger
  AFTER UPDATE OF portfolio_visibility ON user_settings
  FOR EACH ROW
  WHEN (OLD.portfolio_visibility IS DISTINCT FROM NEW.portfolio_visibility)
  EXECUTE FUNCTION sync_portfolio_visibility();

-- TRIGGER 3: Auto-update profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness()
RETURNS TRIGGER AS $$
DECLARE
  completeness INTEGER := 0;
BEGIN
  -- Calculate based on completed fields
  IF NEW.avatar_uploaded THEN completeness := completeness + 20; END IF;
  IF NEW.linkedin_linked THEN completeness := completeness + 15; END IF;
  IF NEW.bio_completed THEN completeness := completeness + 25; END IF;
  IF NEW.timezone_set IS NOT NULL AND NEW.timezone_set != '' THEN completeness := completeness + 10; END IF;
  IF NEW.portfolio_visibility IN ('marketplace_preview', 'public') THEN completeness := completeness + 15; END IF;
  IF (SELECT COUNT(*) FROM portfolio_items WHERE user_id = NEW.user_id AND status = 'approved') > 0 THEN completeness := completeness + 15; END IF;
  
  NEW.profile_completeness := LEAST(completeness, 100);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_completeness_trigger
  BEFORE INSERT OR UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_profile_completeness();

-- TRIGGER 4: Update timestamp
CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_timestamp_trigger
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_timestamp();

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

