export interface FutureYou {
  id: string
  persona_name: string
  description: string
  estimated_readiness_date?: string
  confidence_score?: number
}

export interface UserTrack {
  id: string
  name: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration: string
  current_progress: number
}

export interface ReadinessWindow {
  label: string
  estimated_date: string
  confidence: 'high' | 'medium' | 'low'
  category: string
}
