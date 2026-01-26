export interface PortfolioItem {
  id: string
  title: string
  description: string
  skills: string[]
  mission_id?: string
  mission_title?: string
  created_at: string
  updated_at: string
  file_url?: string
  file_type?: string
}

export interface PortfolioCounts {
  total_items: number
  allowed_items: number
  tier_limit: number
  remaining_slots: number
}
