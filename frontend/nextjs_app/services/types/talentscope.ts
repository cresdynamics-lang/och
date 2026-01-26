export interface TalentscopeOverview {
  readiness_score: number
  missions_completed: number
  habit_streak: number
  portfolio_count: number
  preview_mode?: boolean
  breakdown?: {
    technical: number
    practical: number
    theoretical: number
  }
}

