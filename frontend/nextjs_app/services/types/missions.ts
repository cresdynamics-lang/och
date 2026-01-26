export interface Mission {
  id: string
  title: string
  description: string
  progress_percent: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  status: 'not_started' | 'in_progress' | 'completed'
  estimated_time?: string
  due_date?: string
  track_id?: string
}

export interface RecommendedMission {
  id: string
  title: string
  description: string
  reason: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_time?: string
  match_score: number
}
