export interface ReadinessScore {
  date: string
  score: number
  category: string
}

export interface SkillHeatmapData {
  skill_name: string
  category: string
  mastery_level: number // 0-100
  last_practiced?: string
}

export interface SkillMastery {
  skill_id: string
  skill_name: string
  category: string
  mastery_percentage: number
  hours_practiced: number
  last_updated: string
}

export interface BehavioralTrend {
  date: string
  missions_completed: number
  hours_studied: number
  reflections_count: number
}

export interface AnalyticsFilter {
  track_id?: string
  skill_category?: string
  start_date?: string
  end_date?: string
}

