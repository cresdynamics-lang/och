-- OCH Community Engine Database Schema
-- Supabase PostgreSQL Migration

-- 1. UNIVERSITIES
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- "UON", "STRATH"
  location_city TEXT,
  location_country TEXT DEFAULT 'Kenya',
  logo_url TEXT,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. AUTO-MAP STUDENTS TO UNIVERSITIES
CREATE TABLE IF NOT EXISTS student_university_mapping (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id),
  mapped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mapped_method TEXT CHECK (mapped_method IN ('email_domain', 'manual', 'admin')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. COMMUNITIES (University + Track-based)
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('university', 'track', 'global', 'competition')) NOT NULL,
  university_id UUID REFERENCES universities(id),
  track_id UUID, -- FK to tracks table (optional)
  description TEXT,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. AUTO-JOIN MEMBERSHIPS
CREATE TABLE IF NOT EXISTS community_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('member', 'moderator', 'admin')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- 5. POSTS (5 Types)
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  post_type TEXT CHECK (post_type IN ('text', 'media', 'event', 'achievement', 'poll')) NOT NULL,
  title TEXT,
  content TEXT, -- Markdown supported
  media_urls TEXT[], -- Image/video URLs
  event_details JSONB, -- {start_time, end_time, location, rsvp_count, title}
  poll_options JSONB, -- [{option: "Yes", votes: 0}]
  achievement_data JSONB, -- {circle: "3", badge: "DFIR", score: 9.2}
  tags TEXT[],
  status TEXT CHECK (status IN ('draft', 'published', 'pinned', 'archived')) DEFAULT 'published',
  view_count INTEGER DEFAULT 0,
  reaction_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  pinned_by UUID REFERENCES auth.users(id),
  pinned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. EMOJI REACTIONS
CREATE TABLE IF NOT EXISTS community_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  reaction_type TEXT NOT NULL, -- "🔥", "💯", "👏", "❤️", "😂"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- 7. THREADED COMMENTS
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES community_comments(id), -- Self-referential
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  reaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. LEADERBOARDS (Snapshots)
CREATE TABLE IF NOT EXISTS leaderboards_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT CHECK (scope IN ('university', 'global', 'track')) NOT NULL,
  university_id UUID REFERENCES universities(id),
  period TEXT CHECK (period IN ('daily', 'weekly', 'monthly')) NOT NULL,
  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL,
  rankings JSONB NOT NULL, -- [{"user_id": "...", "score": 125, "posts": 12}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_status ON community_posts(status);
CREATE INDEX IF NOT EXISTS idx_community_reactions_post_id ON community_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_memberships_user_id ON community_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_student_university_mapping_user_id ON student_university_mapping(user_id);

-- Enable Row Level Security
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Students can post in communities they're members of
CREATE POLICY "University members can post" ON community_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_memberships cm
      JOIN communities c ON cm.community_id = c.id
      WHERE c.id = community_posts.community_id 
      AND cm.user_id = auth.uid()
      AND cm.role IN ('member', 'moderator', 'admin')
    )
    OR user_id = auth.uid()
  );

-- Anyone can read published posts
CREATE POLICY "Public read access" ON community_posts
  FOR SELECT USING (status = 'published' OR user_id = auth.uid());

-- Faculty/moderators can moderate own university
CREATE POLICY "Faculty moderate own uni" ON community_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM community_memberships cm
      JOIN communities c ON cm.community_id = c.id
      WHERE c.id = community_posts.community_id 
      AND cm.user_id = auth.uid()
      AND cm.role IN ('moderator', 'admin')
    )
  );

-- Users can read their own comments
CREATE POLICY "Users read own comments" ON community_comments
  FOR SELECT USING (true);

-- Users can create comments on posts
CREATE POLICY "Users can comment" ON community_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can react to posts
CREATE POLICY "Users can react" ON community_reactions
  FOR ALL USING (user_id = auth.uid());

-- Users can see memberships they're part of
CREATE POLICY "Users see own memberships" ON community_memberships
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM community_memberships cm2
    WHERE cm2.community_id = community_memberships.community_id
    AND cm2.user_id = auth.uid()
  ));

-- Functions for updating counts
CREATE OR REPLACE FUNCTION update_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts
  SET reaction_count = (
    SELECT COUNT(*) FROM community_reactions
    WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_reaction_count
  AFTER INSERT OR UPDATE OR DELETE ON community_reactions
  FOR EACH ROW EXECUTE FUNCTION update_post_reaction_count();

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts
  SET comment_count = (
    SELECT COUNT(*) FROM community_comments
    WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comment_count
  AFTER INSERT OR UPDATE OR DELETE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Enable Realtime for posts, reactions, and comments
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE community_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;

