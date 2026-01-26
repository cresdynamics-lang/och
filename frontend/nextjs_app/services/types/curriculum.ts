/**
 * Curriculum Engine TypeScript Types
 */

// ==================== Track Types ====================

export type TrackLevel = 'entry' | 'intermediate' | 'advanced';

export interface CurriculumTrack {
  id: string;
  code: string;
  name: string;
  description?: string;
  level: TrackLevel;
  tier?: number; // Academic tier (0-9). Tier 2 = Beginner Tracks
  icon?: string;
  color?: string;
  estimated_duration_weeks?: number;
  module_count: number;
  lesson_count: number;
  mission_count: number;
  is_active: boolean;
  user_progress?: UserTrackProgressSummary;
  created_at: string;
  updated_at: string;
}

export interface CurriculumTrackDetail extends CurriculumTrack {
  modules: CurriculumModuleList[];
  recent_activities: CurriculumActivity[];
  next_action?: NextAction;
}

// ==================== Module Types ====================

export type ModuleLevel = 'beginner' | 'intermediate' | 'advanced' | 'capstone';
export type EntitlementTier = 'all' | 'starter_enhanced' | 'starter_normal' | 'professional';

export interface CurriculumModuleList {
  id: string;
  title: string;
  description?: string;
  track_key: string;
  order_index: number;
  level: ModuleLevel;
  entitlement_tier: EntitlementTier;
  is_core: boolean;
  is_required: boolean;
  estimated_time_minutes?: number;
  lesson_count: number;
  mission_count: number;
  completion_percentage: number;
  is_locked: boolean;
}

export interface CurriculumModuleDetail extends CurriculumModuleList {
  track?: string;
  competencies: string[];
  mentor_notes?: string;
  lessons: Lesson[];
  module_missions: ModuleMission[];
  recipe_recommendations: RecipeRecommendation[];
  user_progress?: ModuleProgress;
  created_at: string;
  updated_at: string;
}

// ==================== Lesson Types ====================

export type LessonType = 'video' | 'guide' | 'quiz' | 'assessment' | 'lab' | 'reading';

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content_url?: string;
  lesson_type: LessonType;
  duration_minutes?: number;
  order_index: number;
  is_required: boolean;
  is_completed: boolean;
  user_progress?: LessonProgress;
  created_at: string;
}

// ==================== Mission Types ====================

export interface ModuleMission {
  id: string;
  mission_id: string;
  mission_title?: string;
  mission_difficulty?: string;
  mission_estimated_hours?: number;
  is_required: boolean;
  recommended_order: number;
  user_progress?: MissionProgressSummary;
}

// ==================== Recipe Types ====================

export interface RecipeRecommendation {
  id: string;
  recipe_id: string;
  recipe_title?: string;
  recipe_duration_minutes?: number;
  recipe_difficulty?: string;
  relevance_score: number;
  order_index: number;
}

// ==================== Progress Types ====================

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
export type MissionStatus = 'not_started' | 'in_progress' | 'submitted' | 'completed' | 'failed';

export interface UserTrackProgressSummary {
  completion_percentage: number;
  circle_level: number;
  phase: number;
  current_streak_days: number;
}

export interface UserTrackProgress {
  id: string;
  track: string;
  track_name: string;
  track_code: string;
  current_module?: string;
  current_module_title?: string;
  completion_percentage: number;
  modules_completed: number;
  lessons_completed: number;
  missions_completed: number;
  total_time_spent_minutes: number;
  estimated_completion_date?: string;
  circle_level: number;
  phase: number;
  total_points: number;
  current_streak_days: number;
  longest_streak_days: number;
  total_badges: number;
  university_rank?: number;
  global_rank?: number;
  started_at: string;
  last_activity_at: string;
  completed_at?: string;
}

export interface ModuleProgress {
  status: ProgressStatus;
  completion_percentage: number;
  lessons_completed: number;
  missions_completed: number;
  is_blocked: boolean;
  time_spent_minutes: number;
}

export interface LessonProgress {
  status: ProgressStatus;
  progress_percentage: number;
  time_spent_minutes: number;
  quiz_score?: number;
}

export interface MissionProgressSummary {
  status: MissionStatus;
  score?: number;
  grade?: string;
  attempts: number;
}

// ==================== Activity Types ====================

export type ActivityType = 
  | 'lesson_started'
  | 'lesson_completed'
  | 'module_started'
  | 'module_completed'
  | 'mission_started'
  | 'mission_submitted'
  | 'mission_completed'
  | 'quiz_completed'
  | 'recipe_started'
  | 'recipe_completed'
  | 'track_started'
  | 'track_completed'
  | 'streak_milestone'
  | 'badge_earned';

export interface CurriculumActivity {
  id: string;
  activity_type: ActivityType;
  track?: string;
  track_name?: string;
  module?: string;
  module_title?: string;
  lesson?: string;
  lesson_title?: string;
  metadata?: Record<string, any>;
  points_awarded: number;
  created_at: string;
}

// ==================== Action Types ====================

export type NextActionType = 
  | 'start_module'
  | 'continue_lesson'
  | 'start_mission'
  | 'next_module'
  | 'track_complete';

export interface NextAction {
  type: NextActionType;
  icon: string;
  label: string;
  module_id?: string;
  lesson_id?: string;
  mission_id?: string;
  url: string;
}

// ==================== API Response Types ====================

export interface TrackEnrollResponse {
  status: 'enrolled' | 'already_enrolled';
  message: string;
  progress: UserTrackProgress;
}

export interface MyProgressResponse {
  tracks: UserTrackProgress[];
  recent_activities: CurriculumActivity[];
  stats: {
    total_tracks_enrolled: number;
    total_tracks_completed: number;
    total_points: number;
    total_time_spent_minutes: number;
    current_streak_days: number;
    total_badges: number;
  };
  subscription_tier: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  total_points: number;
  completion_percentage: number;
  circle_level: number;
  current_streak_days: number;
}

export interface TrackLeaderboardResponse {
  track: string;
  leaderboard: LeaderboardEntry[];
}

// ==================== Subscription Types ====================

export type SubscriptionTier = 'free' | 'starter_normal' | 'starter_enhanced' | 'professional';

export function canAccessModule(tier: SubscriptionTier, moduleTier: EntitlementTier): boolean {
  if (moduleTier === 'all') return true;
  if (tier === 'professional') return true;
  if (tier === 'starter_enhanced' && moduleTier !== 'professional') return true;
  if (tier === 'starter_normal' && moduleTier === 'starter_normal') return true;
  return false;
}

export function getTierDisplayName(tier: SubscriptionTier): string {
  switch (tier) {
    case 'free': return 'Free';
    case 'starter_normal': return 'Starter';
    case 'starter_enhanced': return 'Starter Enhanced';
    case 'professional': return 'Professional';
    default: return tier;
  }
}

export function getLevelColor(level: ModuleLevel): string {
  switch (level) {
    case 'beginner': return 'emerald';
    case 'intermediate': return 'amber';
    case 'advanced': return 'orange';
    case 'capstone': return 'purple';
    default: return 'slate';
  }
}

export function getLessonTypeIcon(type: LessonType): string {
  switch (type) {
    case 'video': return '🎬';
    case 'guide': return '📖';
    case 'quiz': return '❓';
    case 'assessment': return '📝';
    case 'lab': return '🔬';
    case 'reading': return '📄';
    default: return '📚';
  }
}

