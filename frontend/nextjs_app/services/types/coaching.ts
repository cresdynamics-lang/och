export interface DailyNudge {
  id: string
  type: 'motivational' | 'reminder' | 'tip' | 'challenge'
  message: string
  priority: 'high' | 'medium' | 'low'
  timestamp: string
  action_url?: string
  action_label?: string
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number // 0-1
  summary: string
  tips: string[]
  confidence: number
}

export interface Reflection {
  id: string
  content: string
  timestamp: string
  sentiment_analysis?: SentimentAnalysis
}

export interface AICoachMessage {
  id: string
  message: string
  type: 'feedback' | 'suggestion' | 'question' | 'encouragement'
  timestamp: string
  actionable: boolean
  next_actions?: string[]
}

export interface LearningPlan {
  id: string
  title: string
  description: string
  goals: string[]
  estimated_duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  created_at: string
}

