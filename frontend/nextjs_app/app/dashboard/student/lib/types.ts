export type SubscriptionTier = 'free' | '$3-enhanced' | '$3-normal' | '$7-premium'

export interface ReadinessData {
  score: number
  maxScore: number
  trend: number
  trendDirection: 'up' | 'down' | 'stable'
  countdownDays: number
  countdownLabel: string
}

export interface CohortProgress {
  percentage: number
  currentModule: string
  totalModules: number
  completedModules: number
  estimatedTimeRemaining: number
  graduationDate?: string
}

export interface PortfolioMetrics {
  total: number
  approved: number
  pending: number
  rejected: number
  percentage: number
}

export interface MentorshipData {
  nextSessionDate: string
  nextSessionTime: string
  mentorName: string
  mentorAvatar?: string
  sessionType: '1-on-1' | 'group' | 'review'
  status: 'scheduled' | 'pending' | 'completed'
}

export interface GamificationData {
  points: number
  streak: number
  badges: number
  rank: string
  level: string
}

export interface EventItem {
  id: string
  title: string
  date: string
  time?: string
  type: 'mission_due' | 'mentor_session' | 'review_meeting' | 'ctf' | 'workshop'
  urgency: 'high' | 'medium' | 'low'
  rsvpRequired: boolean
  rsvpStatus?: 'accepted' | 'declined' | 'pending'
  actionUrl?: string
}

export interface ActionItem {
  id: string
  title: string
  description?: string
  type: 'mission' | 'habit' | 'mentor_call' | 'profiler' | 'upgrade'
  urgency: 'high' | 'medium' | 'low'
  progress?: number
  dueDate?: string
  actionUrl: string
  icon?: string
}

export interface HabitStatus {
  id: string
  name: string
  category: 'learn' | 'practice' | 'reflect'
  completed: boolean
  streak: number
  todayLogged: boolean
}

export interface TrackMilestone {
  id: string
  code: string
  title: string
  progress: number
  status: 'not_started' | 'in_progress' | 'completed'
}

export interface TrackOverview {
  trackName: string
  trackKey: string
  milestones: TrackMilestone[]
  completedMilestones: number
  totalMilestones: number
}

export interface CommunityActivity {
  id: string
  user: string
  action: string
  timestamp: string
  likes: number
  type: 'mission_completed' | 'ctf_launched' | 'badge_earned' | 'milestone_reached'
  actionUrl?: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  points: number
  avatar?: string
  isCurrentUser: boolean
}

export interface AICoachNudge {
  id: string
  message: string
  recommendation: string
  actionUrl?: string
  actionLabel?: string
  dismissible: boolean
}

export interface QuickStats {
  points: number
  streak: number
  badges: number
  mentorRating: number
}

export interface DashboardState {
  readiness: ReadinessData
  cohortProgress: CohortProgress
  portfolio: PortfolioMetrics
  mentorship: MentorshipData
  gamification: GamificationData
  subscription: SubscriptionTier
  subscriptionExpiry?: string
  subscriptionDaysLeft?: number
  nextActions: ActionItem[]
  events: EventItem[]
  habits: HabitStatus[]
  trackOverview: TrackOverview
  communityFeed: CommunityActivity[]
  leaderboard: LeaderboardEntry[]
  aiCoachNudge?: AICoachNudge
  quickStats: QuickStats
  isLoading: boolean
  lastUpdated: string
}

