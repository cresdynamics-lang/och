export interface GamificationBadge {
  id: string
  name: string
  description: string
  icon_url?: string
  category: 'achievement' | 'milestone' | 'streak' | 'skill' | 'community'
  earned_at?: string
  progress_to_next?: number // 0-100
  next_badge?: {
    id: string
    name: string
    requirements: string
  }
}

export interface Streak {
  type: 'daily_learning' | 'missions' | 'reflections' | 'community'
  current_streak: number
  longest_streak: number
  last_activity: string
}

export interface GamificationLeaderboardEntry {
  rank: number
  user_id: string
  user_name: string
  user_avatar?: string
  score: number
  badge_count: number
  track_id?: string
  category?: string
}

export interface Points {
  total: number
  by_category: {
    learning: number
    missions: number
    community: number
    achievements: number
  }
  recent_earned: Array<{
    amount: number
    reason: string
    timestamp: string
  }>
}

