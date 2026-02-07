import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDashboardStore } from '../store/dashboardStore'
import { mockDashboardState } from '../mockData'
import type { DashboardState } from '../types'
import { apiGateway } from '@/services/apiGateway'

const STAGGER_DELAY = 2000

const fetchWithDelay = async <T,>(data: T, delay: number): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, delay))
  return data
}

export function useDashboardOverview() {
  const { setReadiness, setCohortProgress, setSubscription, setQuickStats, setLoading } = useDashboardStore()

  const query = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      setLoading(true)
      try {
        const data = await apiGateway.get<any>('/student/dashboard/overview')
        setReadiness(data.readiness)
        setCohortProgress(data.cohort_progress)
        setSubscription(data.subscription.tier, data.subscription.expiry, data.subscription.days_left)
        setQuickStats(data.quick_stats)
        return data
      } catch (error) {
        const data = await fetchWithDelay(mockDashboardState, 0)
        setReadiness(data.readiness)
        setCohortProgress(data.cohortProgress)
        setSubscription(data.subscription, data.subscriptionExpiry, data.subscriptionDaysLeft)
        setQuickStats(data.quickStats)
        return data
      }
    },
    staleTime: 30000,
    retry: 2,
  })

  useEffect(() => {
    if (query.isSuccess || query.isError) {
      setLoading(false)
    }
  }, [query.isSuccess, query.isError, setLoading])

  return query
}

export function useDashboardMetrics() {
  const { setPortfolio, setMentorship, setGamification } = useDashboardStore()

  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      try {
        const data = await apiGateway.get<any>('/student/dashboard/metrics')
        setPortfolio(data.portfolio)
        setMentorship(data.mentorship)
        setGamification(data.gamification)
        return data
      } catch (error) {
        const fallbackData = await fetchWithDelay(mockDashboardState, STAGGER_DELAY * 0.5)
        setPortfolio(fallbackData.portfolio)
        setMentorship(fallbackData.mentorship)
        setGamification(fallbackData.gamification)
        return {
          portfolio: fallbackData.portfolio,
          mentorship: fallbackData.mentorship,
          gamification: fallbackData.gamification,
        }
      }
    },
    staleTime: 30000,
    retry: 2,
  })
}

export function useNextActions() {
  const { setNextActions } = useDashboardStore()

  return useQuery({
    queryKey: ['dashboard', 'next-actions'],
    queryFn: async () => {
      try {
        const data = await apiGateway.get<any[]>('/student/dashboard/next-actions')
        setNextActions(data)
        return data
      } catch (error) {
        const fallbackData = await fetchWithDelay(mockDashboardState, STAGGER_DELAY * 1)
        setNextActions(fallbackData.nextActions)
        return fallbackData.nextActions
      }
    },
    staleTime: 60000,
    retry: 2,
  })
}

export function useDashboardEvents() {
  const { setEvents } = useDashboardStore()

  return useQuery({
    queryKey: ['dashboard', 'events'],
    queryFn: async () => {
      try {
        const data = await apiGateway.get<any[]>('/student/dashboard/events')
        setEvents(data)
        return data
      } catch (error) {
        const fallbackData = await fetchWithDelay(mockDashboardState, STAGGER_DELAY * 1.5)
        setEvents(fallbackData.events)
        return fallbackData.events
      }
    },
    staleTime: 60000,
    retry: 2,
  })
}

export function useTrackOverview() {
  const { setTrackOverview } = useDashboardStore()

  return useQuery({
    queryKey: ['dashboard', 'track-overview'],
    queryFn: async () => {
      try {
        const data = await apiGateway.get<any>('/student/dashboard/track-overview')
        setTrackOverview(data)
        return data
      } catch (error) {
        const fallbackData = await fetchWithDelay(mockDashboardState, STAGGER_DELAY * 2)
        setTrackOverview(fallbackData.trackOverview)
        return fallbackData.trackOverview
      }
    },
    staleTime: 300000,
    retry: 2,
  })
}

export function useCommunityFeed() {
  const { setCommunityFeed } = useDashboardStore()

  return useQuery({
    queryKey: ['dashboard', 'community-feed'],
    queryFn: async () => {
      try {
        const data = await apiGateway.get<any[]>('/student/dashboard/community-feed')
        setCommunityFeed(data)
        return data
      } catch (error) {
        const fallbackData = await fetchWithDelay(mockDashboardState, STAGGER_DELAY * 2.5)
        setCommunityFeed(fallbackData.communityFeed)
        return fallbackData.communityFeed
      }
    },
    staleTime: 120000,
    retry: 2,
  })
}

export function useLeaderboard() {
  const { setLeaderboard } = useDashboardStore()

  return useQuery({
    queryKey: ['dashboard', 'leaderboard'],
    queryFn: async () => {
      try {
        const data = await apiGateway.get<any[]>('/student/dashboard/leaderboard')
        setLeaderboard(data)
        return data
      } catch (error) {
        const fallbackData = await fetchWithDelay(mockDashboardState, STAGGER_DELAY * 3)
        setLeaderboard(fallbackData.leaderboard)
        return fallbackData.leaderboard
      }
    },
    staleTime: 300000,
    retry: 2,
  })
}

export function useHabits() {
  const { setHabits } = useDashboardStore()

  return useQuery({
    queryKey: ['dashboard', 'habits'],
    queryFn: async () => {
      try {
        const data = await apiGateway.get<any[]>('/student/dashboard/habits')
        setHabits(data)
        return data
      } catch (error) {
        const fallbackData = await fetchWithDelay(mockDashboardState, STAGGER_DELAY * 0.3)
        setHabits(fallbackData.habits)
        return fallbackData.habits
      }
    },
    staleTime: 60000,
    retry: 2,
  })
}

export function useAICoachNudge() {
  const { setAICoachNudge } = useDashboardStore()

  return useQuery({
    queryKey: ['dashboard', 'ai-coach-nudge'],
    queryFn: async () => {
      try {
        const data = await apiGateway.post<any>('/student/dashboard/ai-coach-nudge')
        setAICoachNudge(data)
        return data
      } catch (error) {
        const fallbackData = await fetchWithDelay(mockDashboardState, STAGGER_DELAY * 0.7)
        setAICoachNudge(fallbackData.aiCoachNudge)
        return fallbackData.aiCoachNudge
      }
    },
    staleTime: 300000,
    retry: 2,
  })
}

export function useDismissAICoachNudge() {
  const queryClient = useQueryClient()
  const { setAICoachNudge } = useDashboardStore()

  const mutation = useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setAICoachNudge(undefined)
    },
  })

  useEffect(() => {
    if (mutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'ai-coach-nudge'] })
    }
  }, [mutation.isSuccess, queryClient])

  return mutation
}

export function useLogHabit() {
  const queryClient = useQueryClient()
  const { habits, setHabits, updateStreak } = useDashboardStore()

  const mutation = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: string; completed: boolean }) => {
      try {
        const response = await apiGateway.post<{ streak?: number }>(`/student/coaching/habits/${habitId}/log`, {
          log_date: new Date().toISOString().split('T')[0],
          status: completed ? 'done' : 'skipped',
        })
        
        const updatedHabits = habits.map((h) =>
          h.id === habitId ? { ...h, completed, todayLogged: true, streak: response?.streak || h.streak } : h
        )
        setHabits(updatedHabits)
        
        if (completed) {
          updateStreak(1)
        }
        
        return updatedHabits
      } catch (error) {
        const updatedHabits = habits.map((h) =>
          h.id === habitId ? { ...h, completed, todayLogged: true } : h
        )
        setHabits(updatedHabits)
        
        if (completed) {
          updateStreak(1)
        }
        
        return updatedHabits
      }
    },
  })

  useEffect(() => {
    if (mutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'habits'] })
      queryClient.invalidateQueries({ queryKey: ['studentCoachingOverview'] })
    }
  }, [mutation.isSuccess, queryClient])

  return mutation
}

export function useRSVPEvent() {
  const queryClient = useQueryClient()
  const { events, setEvents } = useDashboardStore()

  const mutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: 'accepted' | 'declined' }) => {
      try {
        await apiGateway.post(`/student/events/${eventId}/rsvp`, { status })
        
        const updatedEvents = events.map((e) =>
          e.id === eventId ? { ...e, rsvpStatus: status } : e
        )
        setEvents(updatedEvents)
        
        return updatedEvents
      } catch (error) {
        const updatedEvents = events.map((e) =>
          e.id === eventId ? { ...e, rsvpStatus: status } : e
        )
        setEvents(updatedEvents)
        
        return updatedEvents
      }
    },
  })

  useEffect(() => {
    if (mutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'events'] })
    }
  }, [mutation.isSuccess, queryClient])

  return mutation
}

