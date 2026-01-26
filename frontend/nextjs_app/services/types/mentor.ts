/**
 * Mentor-specific types for dashboard and management features
 */

export interface AssignedMentee {
  id: string
  user_id: string
  name: string
  email: string
  avatar_url?: string
  track?: string
  cohort?: string
  readiness_score: number
  readiness_label?: string
  risk_level: 'low' | 'medium' | 'high'
  last_activity_at?: string
  missions_completed?: number
  subscription_tier?: 'free' | 'professional' | 'premium'
  assigned_at: string
  status: 'active' | 'inactive' | 'flagged'
}

export interface MentorProfile {
  id: string
  user_id: string
  bio?: string
  expertise_tags: string[]
  availability: {
    timezone: string
    available_hours: {
      day: string
      start: string
      end: string
    }[]
  }
  max_mentees: number
  current_mentees: number
  rating?: number
  total_sessions: number
  created_at: string
  updated_at: string
}

export interface MissionSubmission {
  id: string
  mission_id: string
  mission_title: string
  mentee_id: string
  mentee_name: string
  mentee_email: string
  submitted_at: string
  status: 'pending_review' | 'in_review' | 'approved' | 'rejected' | 'needs_revision'
  submission_data: {
    answers?: Record<string, any>
    files?: Array<{
      id: string
      filename: string
      url: string
      file_type: string
    }>
    code_repository?: string
    live_demo_url?: string
  }
  tier_requirement: 'professional' // Only Professional tier ($7) requires mentor review
}

export interface MissionReview {
  id: string
  submission_id: string
  mentor_id: string
  overall_status: 'pass' | 'fail' | 'needs_revision'
  feedback: {
    written?: string
    audio_url?: string
  }
  comments: Array<{
    id: string
    comment: string
    section?: string
    created_at: string
  }>
  technical_competencies: string[] // Tags for skills demonstrated
  score_breakdown: Record<string, number> // JSONB format
  recommended_next_missions?: string[]
  reviewed_at: string
  version: number // For audit trail
}

export interface CapstoneProject {
  id: string
  mentee_id: string
  mentee_name: string
  title: string
  description: string
  submitted_at: string
  status: 'pending_scoring' | 'scored' | 'needs_revision'
  project_url?: string
  repository_url?: string
  documentation_url?: string
  rubric_id?: string
}

export interface CapstoneScore {
  id: string
  capstone_id: string
  mentor_id: string
  overall_score: number
  score_breakdown: {
    technical_quality: number
    problem_solving: number
    documentation: number
    presentation: number
    innovation: number
  }
  feedback: string
  recommendations?: string[]
  scored_at: string
  version: number
}

export interface GroupMentorshipSession {
  id: string
  mentor_id: string
  title: string
  description: string
  scheduled_at: string
  duration_minutes: number
  meeting_link?: string
  meeting_type: 'zoom' | 'google_meet' | 'in_person'
  track_assignment?: string
  recording_url?: string
  transcript_url?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  cancelled?: boolean
  cancellation_reason?: string
  attendance: Array<{
    mentee_id: string
    mentee_name: string
    attended: boolean
    joined_at?: string
    left_at?: string
  }>
  structured_notes?: {
    key_takeaways?: string[]
    action_items?: Array<{ item: string; assignee?: string }>
    discussion_points?: string
    challenges?: string
    wins?: string
    next_steps?: string
    mentor_reflections?: string
    linked_goals?: string[]
    attached_files?: Array<{ name: string; url: string }>
  }
  mentee_feedback?: SessionFeedback
  is_closed?: boolean
  created_at: string
  updated_at: string
}

export interface SessionFeedback {
  id: string
  session_id: string
  mentee_id: string
  mentee_name: string
  overall_rating: number  // 1-5
  mentor_engagement: number  // 1-5
  mentor_preparation: number  // 1-5
  session_value: number  // 1-5
  strengths?: string
  areas_for_improvement?: string
  additional_comments?: string
  submitted_at: string
  updated_at: string
}

export interface MenteeGoal {
  id: string
  mentee_id: string
  mentee_name: string
  goal_type: 'monthly' | 'weekly'
  title: string
  description: string
  target_date: string
  status: 'pending' | 'in_progress' | 'completed' | 'missed'
  created_at: string
  mentor_feedback?: {
    feedback: string
    provided_at: string
    version: number
  }
}

export interface MenteeFlag {
  id: string
  mentee_id: string
  mentee_name: string
  flag_type: 'struggling' | 'at_risk' | 'needs_attention' | 'technical_issue'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  raised_by: string // mentor_id
  raised_at: string
  status: 'open' | 'acknowledged' | 'resolved'
  resolution_notes?: string
  resolved_at?: string
}

export interface TrackAssignment {
  id: string
  user_id: string
  track_key: string
  assigned_by: string // mentor_id
  assigned_at: string
  reason?: string
}

export interface MenteePerformance {
  mentee_id: string
  mentee_name: string
  overall_score: number
  readiness_score: number
  mission_completion_rate: number
  average_mission_score: number
  capstone_score?: number
  engagement_score: number
  last_updated: string
}

export interface TalentScopeMentorView {
  mentee_id: string
  mentee_name: string
  ingested_signals: {
    mentor_evaluations: number
    habit_logs: number
    mission_scores: number
    reflection_sentiment: {
      positive: number
      neutral: number
      negative: number
    }
    community_engagement: number
  }
  skills_heatmap: Record<string, number> // skill -> proficiency score
  behavioral_trends: Array<{
    date: string
    engagement: number
    performance: number
    sentiment: number
  }>
  readiness_over_time: Array<{
    date: string
    score: number
  }>
  // Core Readiness Score and detailed data
  core_readiness_score?: number
  career_readiness_stage?: 'exploring' | 'building' | 'emerging' | 'ready'
  learning_velocity?: number
  estimated_readiness_window?: string
  readiness_breakdown?: Record<string, number> // Breakdown by category (technical, practical, theoretical)
  gap_analysis?: {
    strengths: string[]
    weaknesses: string[]
    missing_skills: string[]
    improvement_plan: string[]
  }
  professional_tier_data?: {
    job_fit_score?: number
    hiring_timeline_prediction?: string
    track_benchmarks?: Record<string, any>
  }
}

export interface MentorInfluenceIndex {
  mentor_id: string
  overall_influence_score: number
  metrics: {
    total_feedback_given: number
    average_response_time_hours: number
    mentee_improvement_rate: number // % of mentees showing improvement after feedback
    session_attendance_rate: number
    mission_approval_rate: number
  }
  correlation_data: {
    feedback_to_performance: number // Correlation coefficient
    sessions_to_engagement: number
    reviews_to_mission_quality: number
  }
  period?: {
    start_date: string
    end_date: string
  }
  trend_data?: Array<{
    date: string
    score: number
  }>
}

export interface MentorshipMessage {
  id: string
  message_id: string
  assignment: string
  sender: {
    id: string
    name: string
    email: string
  }
  recipient: {
    id: string
    name: string
    email: string
  }
  sender_name?: string
  sender_email?: string
  recipient_name?: string
  recipient_email?: string
  subject?: string
  body: string
  is_read: boolean
  read_at?: string
  archived: boolean
  archived_at?: string
  attachments?: MessageAttachment[]
  created_at: string
  updated_at: string
}

export interface MessageAttachment {
  id: string
  filename: string
  file_size: number
  content_type: string
  file: string
  created_at: string
}

export interface NotificationLog {
  id: string
  notification_id: string
  assignment_id?: string
  session_id?: string
  recipient: {
    id: string
    name: string
    email: string
  }
  notification_type: 'session_reminder' | 'feedback_reminder' | 'milestone_achieved' | 'session_cancelled' | 'session_rescheduled' | 'assignment_started' | 'assignment_completed' | 'custom'
  channel: 'email' | 'sms' | 'in_app' | 'push'
  subject?: string
  message: string
  status: 'pending' | 'sent' | 'failed' | 'delivered'
  sent_at?: string
  delivered_at?: string
  error_message?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface MentorAlert {
  id: string
  type: 'flag' | 'overdue' | 'session_reminder' | 'mission_pending'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  mentee_id?: string
  mentee_name?: string
  related_id?: string // mission_id, session_id, etc.
  created_at: string
  resolved: boolean
}
