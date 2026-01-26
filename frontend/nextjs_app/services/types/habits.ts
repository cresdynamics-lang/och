export interface Habit {
  id: string
  name: string
  type: 'learn' | 'practice' | 'reflect'
  completed_today: boolean
  current_streak: number
  longest_streak: number
  last_completed?: string
}

export interface DailyGoal {
  id: string
  title: string
  description: string
  type: 'mission' | 'learning' | 'practice' | 'reflection'
  completed: boolean
  due_date?: string
  priority: 'high' | 'medium' | 'low'
}

export interface HabitReflection {
  id: string
  content: string
  created_at: string
  sentiment?: 'positive' | 'neutral' | 'negative'
}
