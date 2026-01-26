export type MissionStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'draft'
  | 'submitted' 
  | 'in_ai_review' 
  | 'ai_reviewed'
  | 'in_mentor_review' 
  | 'mentor_review'
  | 'approved' 
  | 'failed'

export type MissionDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'capstone'

export interface Mission {
  id: string
  code: string
  title: string
  description: string
  difficulty: MissionDifficulty
  type: string
  estimated_time_minutes?: number
  track_key?: string
  competencies: string[]
  created_at: string
  submission?: MissionSubmission
  artifacts?: MissionArtifact[]
  ai_feedback?: AIFeedback
}

export interface MissionSubmission {
  id: string
  mission_id: string
  status: MissionStatus
  ai_score?: number
  mentor_score?: number
  notes?: string
  submitted_at?: string
  ai_reviewed_at?: string
  mentor_reviewed_at?: string
}

export interface MissionArtifact {
  id: string
  kind: 'file' | 'github' | 'notebook' | 'video' | 'screenshot'
  url: string
  filename?: string
  size_bytes?: number
}

export interface AIFeedback {
  id: string
  score: number
  strengths: string[]
  gaps: string[]
  suggestions: string[]
  competencies_detected: Record<string, any>
  created_at: string
}

export interface MissionFunnel {
  not_started: number
  in_progress: number
  draft: number
  submitted: number
  ai_reviewed: number
  mentor_review: number
  approved: number
  failed: number
  approval_rate: number
  priority_missions: Mission[]
}

export interface CurriculumModule {
  id: string
  title: string
  description: string
  is_core: boolean
  order_index: number
  estimated_time_minutes?: number
  competencies: string[]
  status?: 'not_started' | 'in_progress' | 'completed'
  progress_percent?: number
  is_locked: boolean
  lessons: Lesson[]
  missions: MissionLink[]
}

export interface Lesson {
  id: string
  title: string
  description: string
  content_url: string
  order_index: number
  status?: 'not_started' | 'in_progress' | 'completed'
}

export interface MissionLink {
  id: string
  code: string
  title: string
  difficulty: MissionDifficulty
}

export interface Track {
  track_key: string
  track_name: string
  cohort_label?: string
  modules_completed: number
  modules_total: number
  progress_percent: number
  estimated_time_remaining_minutes?: number
  current_module_id?: string
}

export interface Habit {
  id: string
  name: string
  is_core: boolean
  frequency: 'daily' | 'weekly'
  streak_current?: number
  streak_longest?: number
  today_logged: boolean
}

export interface Goal {
  id: string
  title: string
  scope: 'daily' | 'weekly' | 'monthly'
  description?: string
  target_date?: string
  status: 'active' | 'completed' | 'abandoned'
  progress_percent?: number
}

export interface Reflection {
  id: string
  content: string
  ai_sentiment?: 'positive' | 'neutral' | 'negative'
  ai_tags: string[]
  created_at: string
}

export interface CoachingOverview {
  habits: Habit[]
  active_goals: Goal[]
  today_reflection_status?: string
  streaks: Record<string, number>
}

