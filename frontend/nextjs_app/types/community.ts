/**
 * OCH Community Engine TypeScript Types
 * Types for Supabase community tables
 */

export interface University {
  id: string;
  name: string;
  code: string;
  location_city?: string;
  location_country: string;
  logo_url?: string;
  member_count: number;
  is_active: boolean;
  created_at: string;
}

export interface StudentUniversityMapping {
  user_id: string;
  university_id: string;
  mapped_at: string;
  mapped_method: 'email_domain' | 'manual' | 'admin';
  updated_at: string;
}

export interface Community {
  id: string;
  name: string;
  type: 'university' | 'track' | 'global' | 'competition';
  university_id?: string;
  track_id?: string;
  description?: string;
  member_count: number;
  is_active: boolean;
  created_at: string;
}

export interface CommunityMembership {
  id: string;
  community_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
}

export type PostType = 'text' | 'media' | 'event' | 'achievement' | 'poll';
export type PostStatus = 'draft' | 'published' | 'pinned' | 'archived';

export interface CommunityPost {
  id: string;
  community_id: string;
  user_id: string;
  post_type: PostType;
  title?: string;
  content: string;
  media_urls?: string[];
  event_details?: {
    start_time: string;
    end_time: string;
    location?: string;
    rsvp_count?: number;
    title?: string;
  };
  poll_options?: Array<{ option: string; votes: number }>;
  achievement_data?: {
    circle: string;
    badge: string;
    score: number;
  };
  tags: string[];
  status: PostStatus;
  view_count: number;
  reaction_count: number;
  comment_count: number;
  pinned_by?: string;
  pinned_at?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  user_name?: string;
  user_avatar?: string;
  user_circle?: string;
  university_name?: string;
  university_logo?: string;
  reactions?: Record<string, number>;
}

export interface CommunityReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  parent_id?: string;
  user_id: string;
  content: string;
  reaction_count: number;
  created_at: string;
  
  // Joined data
  user_name?: string;
  user_avatar?: string;
  replies?: CommunityComment[];
}

export interface LeaderboardSnapshot {
  id: string;
  scope: 'university' | 'global' | 'track';
  university_id?: string;
  period: 'daily' | 'weekly' | 'monthly';
  snapshot_date: string;
  rankings: Array<{
    user_id: string;
    score: number;
    posts: number;
    user_name?: string;
    user_avatar?: string;
  }>;
  created_at: string;
}

export interface CreatePostData {
  community_id: string;
  post_type: PostType;
  title?: string;
  content: string;
  media_urls?: string[];
  event_details?: CommunityPost['event_details'];
  poll_options?: CommunityPost['poll_options'];
  achievement_data?: CommunityPost['achievement_data'];
  tags?: string[];
}

