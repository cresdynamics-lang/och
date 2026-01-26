'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'

export interface Entitlements {
  tier: number
  canStartMissions: boolean
  canAccessMentorReview: boolean
  canAccessAICoach: boolean
  lockedModules: string[]
  lockedMissions: string[]
}

export function useEntitlements() {
  const { user } = useAuth()
  
  return useQuery<Entitlements>({
    queryKey: ['student', 'entitlements', user?.id],
    queryFn: async () => {
      const tier = (user as any)?.subscription_tier || 0
      
      return {
        tier,
        canStartMissions: tier >= 1,
        canAccessMentorReview: tier >= 7,
        canAccessAICoach: tier >= 3,
        lockedModules: tier < 2 ? [] : [],
        lockedMissions: tier < 1 ? [] : [],
      }
    },
    enabled: !!user,
    staleTime: 300000,
  })
}

