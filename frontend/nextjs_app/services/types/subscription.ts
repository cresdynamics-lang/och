export interface Subscription {
  id: string
  tier: 'starter' | 'premium' | 'enterprise'
  status: 'active' | 'cancelled' | 'expired' | 'trial'
  current_period_start: string
  current_period_end: string
  renewal_date?: string
  auto_renew: boolean
  features: SubscriptionFeature[]
  limits: SubscriptionLimits
}

export interface SubscriptionFeature {
  name: string
  enabled: boolean
  description: string
}

export interface SubscriptionLimits {
  portfolio_items: number
  missions_access: number
  ai_coaching_sessions: number
  mentorship_sessions: number
  analytics_access: 'basic' | 'advanced' | 'premium'
}

export interface Usage {
  portfolio_items_used: number
  missions_completed: number
  ai_coaching_sessions_used: number
  mentorship_sessions_used: number
}

