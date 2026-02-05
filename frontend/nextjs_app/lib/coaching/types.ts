/**
 * Coaching OS - TypeScript Type Definitions
 * Complete data models for habits, goals, reflections, and AI coaching
 */

export interface Habit {
  id: string
  userId: string
  name: string // "Learn", "Practice", "Reflect", or custom
  type: 'core' | 'custom'
  frequency: 'daily' | 'weekly'
  streak: number // Current streak days
  longestStreak: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface HabitLog {
  id: string
  habitId: string
  date: string // YYYY-MM-DD
  status: 'completed' | 'skipped' | 'missed'
  notes?: string
  loggedAt?: string
}

export interface Goal {
  id: string
  userId: string
  type: 'daily' | 'weekly' | 'monthly'
  title: string
  description: string
  progress: number // 0-100
  target: number
  current: number
  status: 'active' | 'completed' | 'abandoned'
  mentorFeedback?: string // 7-tier only
  createdAt: string
  dueDate?: string
}

export interface Reflection {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  content: string
  sentiment: 'positive' | 'neutral' | 'negative'
  aiInsights: string
  emotionTags: string[]
  createdAt: string
}

export interface AICoachMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  context?: 'habit' | 'goal' | 'reflection' | 'mission' | 'general'
  metadata?: {
    habitId?: string
    goalId?: string
    reflectionId?: string
  }
}

export interface CoachingMetrics {
  alignmentScore: number // 0-100, Future-You alignment
  totalStreakDays: number
  activeHabits: number
  completedGoals: number
  reflectionCount: number
  lastReflectionDate?: string
}

export interface StreakData {
  current: number
  longest: number
  isAtRisk: boolean // Within 24h of breaking
  nextMilestone: number // 7, 14, 30, 60, 90, etc.
}

export type SentimentEmoji = '😊' | '😐' | '😔'

export interface ReflectionDraft {
  content: string
  sentiment: 'positive' | 'neutral' | 'negative'
  emotionTags: string[]
}


