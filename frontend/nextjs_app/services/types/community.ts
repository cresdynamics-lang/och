/**
 * Community Module Types
 * University-centric social layer with gamification
 */

// ==================== University Types ====================

export interface University {
  id: string
  name: string
  code: string
  slug: string
  short_name?: string
  email_domains: string[]
  logo_url?: string
  banner_url?: string
  description?: string
  website?: string
  country?: string
  city?: string
  region?: string
  location?: string
  timezone?: string
  is_verified: boolean
  is_active: boolean
  allow_cross_university_posts: boolean
  member_count: number
  post_count: number
  active_student_count?: number
  events_count?: number
  competitions_participated?: number
  engagement_score?: number
  created_at: string
  updated_at: string
}

export interface UniversityMembership {
  id: string
  university: University
  role: 'student' | 'faculty' | 'staff' | 'alumni' | 'admin'
  status: 'pending' | 'active' | 'suspended' | 'graduated'
  is_primary: boolean
  auto_mapped: boolean
  verified_at?: string
  student_id?: string
  department?: string
  graduation_year?: number
  joined_at: string
  updated_at: string
}

// ==================== User Mini Profile ====================

export interface UserMini {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
  university_name?: string
  current_circle?: string
  badge_count: number
}

// ==================== Post Types ====================

export type PostType = 'text' | 'media' | 'event' | 'achievement' | 'poll' | 'announcement'
export type PostVisibility = 'university' | 'global' | 'private'
export type PostStatus = 'draft' | 'published' | 'hidden' | 'deleted'

export interface MediaAttachment {
  type: 'image' | 'video' | 'link'
  url: string
  thumbnail_url?: string
}

export interface LinkPreview {
  title?: string
  description?: string
  image?: string
}

export interface AchievementData {
  type: 'mission' | 'circle' | 'badge' | 'certification' | 'competition' | string
  circle_level?: number
  phase?: number
  score?: number
  badge_name?: string
  mission_name?: string
  mission_id?: string
  portfolio_item_id?: string
  icon_url?: string
  color?: string
  // Legacy fields for backwards compatibility
  circle?: string
  badge?: string
  mission?: string
  certification?: string
}

export interface PollOption {
  id: string
  label: string
  votes: number
  // Legacy fields
  text?: string
}

export interface EventDetails {
  start_time: string
  end_time?: string
  location?: string
  modality?: 'online' | 'onsite' | 'hybrid'
  registration_url?: string
  max_participants?: number
  rsvp_count?: number
  is_competition?: boolean
  competition_type?: 'ctf' | 'hackathon' | 'quiz' | 'webinar' | 'workshop' | 'other' | string
  prizes?: string[]
}

export interface ReactionCount {
  reaction_type: string
  count: number
}

export interface CommunityPost {
  id: string
  author: UserMini
  university?: University
  post_type: PostType
  title?: string
  content: string
  media_urls: MediaAttachment[]
  link_url?: string
  link_preview: LinkPreview
  visibility: PostVisibility
  status: PostStatus
  is_pinned: boolean
  is_featured: boolean
  tags: string[]
  mentions: string[]
  achievement_type?: string
  achievement_data: AchievementData
  poll_options: PollOption[]
  poll_ends_at?: string
  poll_multiple_choice: boolean
  reaction_count: number
  comment_count: number
  share_count: number
  view_count: number
  reaction_counts: ReactionCount[]
  user_reaction?: string
  top_comments: PostComment[]
  created_at: string
  updated_at: string
  published_at?: string
}

export interface PostListItem {
  id: string
  author: UserMini
  university_name?: string
  university_code?: string
  university_logo?: string
  post_type: PostType
  title?: string
  content: string
  media_urls?: MediaAttachment[]
  visibility: PostVisibility
  is_pinned: boolean
  is_featured: boolean
  pinned_at?: string
  tags: string[]
  // Event fields
  event_details?: EventDetails
  // Achievement fields
  achievement_type?: string
  achievement_data?: AchievementData
  // Poll fields
  poll_options?: PollOption[]
  poll_ends_at?: string
  poll_multiple_choice?: boolean
  poll_total_votes?: number
  user_poll_vote?: string[]
  // Stats
  reaction_count: number
  comment_count: number
  view_count?: number
  user_reaction?: string
  created_at: string
}

export interface CreatePostData {
  community_id?: string
  university?: string
  post_type: PostType
  title?: string
  content: string
  media_urls?: MediaAttachment[]
  link_url?: string
  visibility?: PostVisibility
  tags?: string[]
  mentions?: string[]
  // Event fields
  event_details?: Partial<EventDetails>
  // Achievement fields
  achievement_type?: string
  achievement_data?: Partial<AchievementData>
  // Poll fields
  poll_options?: PollOption[]
  poll_ends_at?: string
  poll_multiple_choice?: boolean
}

// ==================== Comment Types ====================

export interface PostComment {
  id: string
  post: string
  author: UserMini
  parent?: string
  content: string
  mentions: string[]
  is_edited: boolean
  is_deleted: boolean
  reaction_count: number
  reply_count: number
  replies: PostComment[]
  reaction_counts: ReactionCount[]
  user_reaction?: string
  created_at: string
  updated_at: string
}

export interface CreateCommentData {
  post: string
  parent?: string
  content: string
  mentions?: string[]
}

// ==================== Reaction Types ====================

export type ReactionType = 'like' | 'love' | 'celebrate' | 'insightful' | 'curious' | 'fire' | 'clap'

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  celebrate: '🎉',
  insightful: '💡',
  curious: '🤔',
  fire: '🔥',
  clap: '👏',
}

// ==================== Event Types ====================

export type EventType = 'competition' | 'hackathon' | 'webinar' | 'workshop' | 'meetup' | 'ctf' | 'other'
export type EventStatus = 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
export type EventVisibility = 'university' | 'global' | 'invite_only'

export interface EventPrize {
  place: number
  reward: string
  value?: string
}

export interface CommunityEvent {
  id: string
  created_by: UserMini
  university?: University
  title: string
  slug: string
  description: string
  event_type: EventType
  banner_url?: string
  thumbnail_url?: string
  starts_at: string
  ends_at: string
  registration_deadline?: string
  timezone: string
  is_virtual: boolean
  location?: string
  meeting_url?: string
  visibility: EventVisibility
  status: EventStatus
  max_participants?: number
  prizes: EventPrize[]
  badges_awarded: string[]
  participant_count: number
  user_participation?: {
    status: string
    registered_at: string
    placement?: number
  }
  created_at: string
  updated_at: string
}

export interface EventListItem {
  id: string
  title: string
  slug: string
  event_type: EventType
  thumbnail_url?: string
  starts_at: string
  ends_at: string
  is_virtual: boolean
  location?: string
  visibility: EventVisibility
  status: EventStatus
  participant_count: number
  university_name?: string
  is_registered: boolean
}

export interface EventParticipant {
  id: string
  user: UserMini
  status: 'registered' | 'confirmed' | 'attended' | 'no_show' | 'cancelled'
  team_name?: string
  team_role?: string
  placement?: number
  score?: number
  registered_at: string
  checked_in_at?: string
}

// ==================== Badge Types ====================

export type BadgeCategory = 'circle' | 'mission' | 'community' | 'competition' | 'streak' | 'special'
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface Badge {
  id: string
  name: string
  slug: string
  description: string
  icon_url: string
  color: string
  category: BadgeCategory
  rarity: BadgeRarity
  criteria: Record<string, any>
  points: number
  is_active: boolean
  is_secret: boolean
}

export interface UserBadge {
  id: string
  badge: Badge
  earned_at: string
  earned_via?: string
  is_featured: boolean
}

// ==================== Leaderboard Types ====================

export type LeaderboardType = 'overall' | 'missions' | 'community' | 'competitions' | 'university' | 'weekly' | 'monthly'
export type LeaderboardScope = 'global' | 'university' | 'track'

export interface LeaderboardEntry {
  rank: number
  user_id: string
  user_name: string
  user_avatar?: string
  university_name?: string
  score: number
  change: number  // Rank change since last period
}

export interface Leaderboard {
  id: string
  leaderboard_type: LeaderboardType
  scope: LeaderboardScope
  university?: University
  track_key?: string
  period_start: string
  period_end: string
  is_current: boolean
  entries: LeaderboardEntry[]
  generated_at: string
}

// ==================== User Stats Types ====================

export interface UserCommunityStats {
  total_posts: number
  total_comments: number
  total_reactions_given: number
  total_reactions_received: number
  total_badges: number
  total_points: number
  current_streak_days: number
  longest_streak_days: number
  events_attended: number
  competitions_won: number
  global_rank?: number
  university_rank?: number
  last_post_at?: string
  last_activity_at?: string
}

// ==================== Follow Types ====================

export type FollowType = 'user' | 'university' | 'tag'

export interface Follow {
  id: string
  follow_type: FollowType
  followed_user?: UserMini
  followed_university?: University
  followed_tag?: string
  created_at: string
}

// ==================== Feed Types ====================

export type FeedType = 'my-university' | 'university' | 'global' | 'following' | 'competitions' | 'achievements'

export interface FeedQuery {
  feed_type?: FeedType
  post_type?: PostType | 'all'
  university_id?: string
  circle?: number
  phase?: number
  tags?: string[]
  since?: string
  page?: number
  page_size?: number
}

export interface FeedResponse {
  feed_type: FeedType
  posts: PostListItem[]
  page: number
  page_size: number
  total_count?: number
  has_more?: boolean
  user_university?: {
    id: string
    name: string
    code: string
  } | null
}

// ==================== Search Types ====================

export type SearchType = 'posts' | 'users' | 'universities' | 'events' | 'tags'

export interface SearchQuery {
  q: string
  search_type?: SearchType
  university_id?: string
  page?: number
  page_size?: number
}

export interface SearchResponse {
  query: string
  search_type: SearchType
  results: any[]
  page: number
  page_size: number
}

// ==================== Legacy Types (for backwards compatibility) ====================

export interface CommunityGroup {
  id: string
  name: string
  description: string
  member_count: number
  post_count: number
  is_private: boolean
  track_id?: string
  joined: boolean
  role?: 'member' | 'moderator' | 'admin'
}

export interface PostReaction {
  emoji: string
  count: number
  user_reacted: boolean
}

// =============================================================================
// ADVANCED FEATURES - Phase 2 Types
// =============================================================================

// ==================== Channel Types ====================

export type ChannelType = 'track' | 'project' | 'interest' | 'study_group' | 'official'

export interface Channel {
  id: string
  university: University
  name: string
  slug: string
  description?: string
  channel_type: ChannelType
  icon: string
  color: string
  member_limit: number
  is_private: boolean
  is_archived: boolean
  requires_approval: boolean
  track_key?: string
  circle_level?: number
  member_count: number
  post_count: number
  active_today: number
  created_by: UserMini
  is_member: boolean
  user_role?: 'member' | 'moderator' | 'admin'
  reputation_leader?: {
    name: string
    avatar_url?: string
    level: number
    points: number
  }
  created_at: string
  updated_at: string
}

export interface ChannelListItem {
  id: string
  name: string
  slug: string
  channel_type: ChannelType
  icon: string
  color: string
  member_count: number
  member_limit: number
  is_private: boolean
  is_member: boolean
}

export interface ChannelMembership {
  id: string
  channel: ChannelListItem
  user: UserMini
  role: 'member' | 'moderator' | 'admin'
  notifications_enabled: boolean
  muted_until?: string
  last_read_at?: string
  unread_count: number
  joined_at: string
}

export interface CreateChannelData {
  name: string
  description?: string
  channel_type: ChannelType
  icon?: string
  color?: string
  member_limit?: number
  is_private?: boolean
  requires_approval?: boolean
  track_key?: string
  circle_level?: number
}

// ==================== Study Squad Types ====================

export type SquadRole = 'member' | 'leader' | 'co_leader'

export interface StudySquad {
  id: string
  channel?: ChannelListItem
  university: University
  name: string
  description?: string
  goal?: string
  icon: string
  color: string
  circle_level?: number
  track_key?: string
  min_members: number
  max_members: number
  is_open: boolean
  is_active: boolean
  current_mission?: string
  missions_completed: number
  total_points: number
  weekly_streak: number
  member_count: number
  created_by: UserMini
  is_member: boolean
  user_role?: SquadRole
  members_preview: Array<{
    id: string
    name: string
    avatar_url?: string
    role: SquadRole
  }>
  created_at: string
  updated_at: string
}

export interface SquadMembership {
  id: string
  user: UserMini
  role: SquadRole
  missions_contributed: number
  points_contributed: number
  joined_at: string
}

export interface CreateSquadData {
  channel_id?: string
  name: string
  description?: string
  goal?: string
  icon?: string
  color?: string
  circle_level?: number
  track_key?: string
  min_members?: number
  max_members?: number
  is_open?: boolean
}

// ==================== Reputation Types ====================

export interface CommunityReputation {
  id: string
  user: UserMini
  university?: University
  total_points: number
  weekly_points: number
  monthly_points: number
  level: number
  badges: string[]
  titles: string[]
  posts_count: number
  comments_count: number
  reactions_given: number
  reactions_received: number
  helpful_answers: number
  squads_led: number
  next_level_points: number
  updated_at: string
  level_up_at?: string
}

export interface ReputationPublic {
  user_name: string
  user_avatar?: string
  university_name?: string
  total_points: number
  weekly_points: number
  level: number
  badges: string[]
  titles: string[]
  posts_count: number
  reactions_received: number
  helpful_answers: number
  squads_led: number
}

export interface ReputationLeaderboardEntry {
  rank: number
  user_id: string
  user_name: string
  user_avatar?: string
  level: number
  points: number
  badges: string[]
  university_name?: string
}

export interface ReputationLeaderboard {
  scope: 'global' | 'university'
  period: 'all' | 'weekly' | 'monthly'
  entries: ReputationLeaderboardEntry[]
}

// ==================== AI Summary Types ====================

export type AISummaryType = 'thread' | 'daily_digest' | 'weekly_recap'

export interface AISummary {
  id: string
  post?: { id: string; title?: string }
  channel?: { id: string; name: string }
  summary_type: AISummaryType
  summary: string
  key_takeaways: string[]
  source_comment_count: number
  model_used: string
  requested_by?: UserMini
  created_at: string
  expires_at?: string
}

export interface AISummaryRequest {
  post_id?: string
  channel_id?: string
  summary_type?: AISummaryType
}

// ==================== Collab Room Types ====================

export type CollabRoomType = 'ctf' | 'hackathon' | 'project' | 'debate'
export type CollabRoomStatus = 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled'

export interface CollabRoom {
  id: string
  name: string
  slug: string
  description: string
  room_type: CollabRoomType
  status: CollabRoomStatus
  universities: University[]
  mission_id?: string
  event?: EventListItem
  starts_at: string
  ends_at: string
  max_participants_per_uni: number
  is_public: boolean
  participant_count: number
  results?: {
    winner_university_id?: string
    scores?: Record<string, number>
  }
  created_by: UserMini
  is_participant: boolean
  user_university_score?: number
  created_at: string
  updated_at: string
}

export interface CollabRoomListItem {
  id: string
  name: string
  slug: string
  room_type: CollabRoomType
  status: CollabRoomStatus
  starts_at: string
  ends_at: string
  participant_count: number
  university_count: number
  is_public: boolean
}

export interface CollabRoomParticipant {
  id: string
  user: UserMini
  university: University
  is_team_lead: boolean
  team_name?: string
  individual_score: number
  joined_at: string
}

export interface CreateCollabRoomData {
  name: string
  description: string
  room_type: CollabRoomType
  university_ids: string[]
  mission_id?: string
  starts_at: string
  ends_at: string
  max_participants_per_uni?: number
  is_public?: boolean
}

// ==================== Contribution Types ====================

export type ContributionType = 
  | 'accepted_answer' 
  | 'helpful_comment' 
  | 'squad_leader' 
  | 'challenge_win'
  | 'event_host'
  | 'mentor_session'
  | 'content_creation'
  | 'bug_report'
  | 'joined_channel'
  | 'joined_squad'
  | 'created_channel'
  | 'created_squad'

export interface CommunityContribution {
  id: string
  user: UserMini
  contribution_type: ContributionType
  points_awarded: number
  metadata: Record<string, any>
  created_at: string
}

export interface ContributionSummary {
  user_id: string
  total_contributions: number
  total_points: number
  by_type: Array<{
    contribution_type: ContributionType
    count: number
    total_points: number
  }>
}

// ==================== Enterprise Cohort Types ====================

export interface EnterpriseCohort {
  id: string
  name: string
  description?: string
  university?: University
  enterprise_id?: string
  enterprise_name?: string
  member_count: number
  is_active: boolean
  is_private: boolean
  allow_external_view: boolean
  created_at: string
  updated_at: string
}

// ==================== Level Thresholds ====================

export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 300,
  4: 600,
  5: 1000,
  6: 1500,
  7: 2200,
  8: 3000,
  9: 4000,
  10: 5500,
}

export const getLevelProgress = (points: number, level: number): number => {
  const currentThreshold = LEVEL_THRESHOLDS[level] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || currentThreshold
  if (level >= 10) return 100
  const levelRange = nextThreshold - currentThreshold
  const pointsInLevel = points - currentThreshold
  return Math.min(100, Math.round((pointsInLevel / levelRange) * 100))
}
