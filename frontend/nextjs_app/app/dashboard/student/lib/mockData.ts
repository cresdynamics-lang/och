import type {
  DashboardState,
  ReadinessData,
  CohortProgress,
  PortfolioMetrics,
  MentorshipData,
  GamificationData,
  EventItem,
  ActionItem,
  HabitStatus,
  TrackOverview,
  CommunityActivity,
  LeaderboardEntry,
  AICoachNudge,
  QuickStats,
} from './types'

export const mockReadinessData: ReadinessData = {
  score: 72,
  maxScore: 100,
  trend: 5,
  trendDirection: 'up',
  countdownDays: 3,
  countdownLabel: '3 days to Portfolio Review',
}

export const mockCohortProgress: CohortProgress = {
  percentage: 62,
  currentModule: 'Network Security Fundamentals',
  totalModules: 10,
  completedModules: 6,
  estimatedTimeRemaining: 45,
  graduationDate: '2024-03-15',
}

export const mockPortfolioMetrics: PortfolioMetrics = {
  total: 12,
  approved: 8,
  pending: 3,
  rejected: 1,
  percentage: 67,
}

export const mockMentorshipData: MentorshipData = {
  nextSessionDate: '2024-12-18',
  nextSessionTime: '2:00 PM',
  mentorName: 'Sarah Chen',
  mentorAvatar: '/avatars/sarah.jpg',
  sessionType: '1-on-1',
  status: 'scheduled',
}

export const mockGamificationData: GamificationData = {
  points: 1250,
  streak: 7,
  badges: 5,
  rank: 'Builder',
  level: 'Intermediate',
}

export const mockEvents: EventItem[] = [
  {
    id: '1',
    title: 'Mission NET-01 Due',
    date: '2024-12-17',
    time: '11:59 PM',
    type: 'mission_due',
    urgency: 'high',
    rsvpRequired: false,
    actionUrl: '/dashboard/student/missions',
  },
  {
    id: '2',
    title: 'Mentor Session',
    date: '2024-12-18',
    time: '2:00 PM',
    type: 'mentor_session',
    urgency: 'medium',
    rsvpRequired: true,
    rsvpStatus: 'accepted',
    actionUrl: '/dashboard/student/mentorship',
  },
  {
    id: '3',
    title: 'Review Meeting',
    date: '2024-12-20',
    time: '10:00 AM',
    type: 'review_meeting',
    urgency: 'low',
    rsvpRequired: true,
    rsvpStatus: 'pending',
    actionUrl: '/dashboard/student/portfolio',
  },
]

export const mockNextActions: ActionItem[] = [
  {
    id: '1',
    title: 'Submit Mission NET-01',
    description: 'Complete and submit for AI review',
    type: 'mission',
    urgency: 'high',
    progress: 85,
    dueDate: '2024-12-17',
    actionUrl: '/dashboard/student/missions?mission=NET-01',
  },
  {
    id: '2',
    title: 'Log Today\'s Habits',
    description: 'Track Learn, Practice, Reflect',
    type: 'habit',
    urgency: 'medium',
    progress: 66,
    actionUrl: '/dashboard/student/coaching',
  },
  {
    id: '3',
    title: 'Join Mentor Call',
    description: 'Dec 18, 2:00 PM',
    type: 'mentor_call',
    urgency: 'medium',
    actionUrl: '/dashboard/student/mentorship',
  },
  {
    id: '4',
    title: 'Complete Profiler',
    description: 'Update your career profile',
    type: 'profiler',
    urgency: 'low',
    progress: 40,
    actionUrl: '/dashboard/student/settings/profile',
  },
  {
    id: '5',
    title: 'Upgrade to Premium',
    description: 'Unlock mentor reviews + capstones',
    type: 'upgrade',
    urgency: 'low',
    actionUrl: '/dashboard/student/subscription',
  },
]

export const mockHabits: HabitStatus[] = [
  {
    id: '1',
    name: 'Learn',
    category: 'learn',
    completed: true,
    streak: 12,
    todayLogged: true,
  },
  {
    id: '2',
    name: 'Practice',
    category: 'practice',
    completed: false,
    streak: 7,
    todayLogged: false,
  },
  {
    id: '3',
    name: 'Reflect',
    category: 'reflect',
    completed: true,
    streak: 9,
    todayLogged: true,
  },
]

export const mockTrackOverview: TrackOverview = {
  trackName: 'Cyber Builders Track',
  trackKey: 'builder',
  milestones: [
    {
      id: '1',
      code: 'NET-01',
      title: 'Network Security Fundamentals',
      progress: 85,
      status: 'in_progress',
    },
    {
      id: '2',
      code: 'DFIR-02',
      title: 'Digital Forensics & Incident Response',
      progress: 45,
      status: 'in_progress',
    },
    {
      id: '3',
      code: 'SEC-03',
      title: 'Security Operations',
      progress: 0,
      status: 'not_started',
    },
  ],
  completedMilestones: 3,
  totalMilestones: 5,
}

export const mockCommunityFeed: CommunityActivity[] = [
  {
    id: '1',
    user: 'Martin',
    action: 'completed Mission NET-01',
    timestamp: '2 hours ago',
    likes: 12,
    type: 'mission_completed',
    actionUrl: '/dashboard/student/missions',
  },
  {
    id: '2',
    user: 'OCH Team',
    action: 'New CTF challenge launched',
    timestamp: '5 hours ago',
    likes: 45,
    type: 'ctf_launched',
    actionUrl: '/dashboard/student/community',
  },
  {
    id: '3',
    user: 'Alex',
    action: 'earned Security Analyst badge',
    timestamp: '1 day ago',
    likes: 8,
    type: 'badge_earned',
    actionUrl: '/dashboard/student/portfolio',
  },
]

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'sarah-123',
    userName: 'Sarah',
    points: 2450,
    avatar: '/avatars/sarah.jpg',
    isCurrentUser: false,
  },
  {
    rank: 2,
    userId: 'jamal-456',
    userName: 'Jamal',
    points: 1890,
    avatar: '/avatars/jamal.jpg',
    isCurrentUser: false,
  },
  {
    rank: 3,
    userId: 'current-user',
    userName: 'YOU',
    points: 1250,
    avatar: '/avatars/user.jpg',
    isCurrentUser: true,
  },
]

export const mockAICoachNudge: AICoachNudge = {
  id: '1',
  message: 'DFIR gap 25%',
  recommendation: 'Try THM SOC Room L1?',
  actionUrl: '/dashboard/student/curriculum?module=dfir-advanced',
  actionLabel: 'Start Lab',
  dismissible: true,
}

export const mockQuickStats: QuickStats = {
  points: 1250,
  streak: 7,
  badges: 5,
  mentorRating: 4.8,
}

export const mockDashboardState: DashboardState = {
  readiness: mockReadinessData,
  cohortProgress: mockCohortProgress,
  portfolio: mockPortfolioMetrics,
  mentorship: mockMentorshipData,
  gamification: mockGamificationData,
  subscription: '$3-enhanced',
  subscriptionExpiry: '2025-01-30',
  subscriptionDaysLeft: 45,
  nextActions: mockNextActions,
  events: mockEvents,
  habits: mockHabits,
  trackOverview: mockTrackOverview,
  communityFeed: mockCommunityFeed,
  leaderboard: mockLeaderboard,
  aiCoachNudge: mockAICoachNudge,
  quickStats: mockQuickStats,
  isLoading: false,
  lastUpdated: new Date().toISOString(),
}

export const mockLowReadinessState: DashboardState = {
  ...mockDashboardState,
  readiness: {
    score: 35,
    maxScore: 100,
    trend: -2,
    trendDirection: 'down',
    countdownDays: 10,
    countdownLabel: '10 days to Portfolio Review',
  },
}

export const mockExpiredSubscriptionState: DashboardState = {
  ...mockDashboardState,
  subscription: 'free',
  subscriptionExpiry: undefined,
  subscriptionDaysLeft: 0,
}

export const mockNoStreakState: DashboardState = {
  ...mockDashboardState,
  gamification: {
    ...mockGamificationData,
    streak: 0,
  },
  habits: mockHabits.map(h => ({ ...h, streak: 0 })),
}

export const mockEmptyState: DashboardState = {
  ...mockDashboardState,
  nextActions: [],
  events: [],
  communityFeed: [],
  habits: [],
}

