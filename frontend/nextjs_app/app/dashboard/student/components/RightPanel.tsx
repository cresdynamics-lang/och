'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { apiGateway } from '@/services/apiGateway'
import '../styles/dashboard.css'

interface SubStatus {
  tier: string
  plan_name?: string
  current_period_end?: string
}
interface HabitItem {
  id: string
  name: string
  category?: string
  completed?: boolean
  streak?: number
}
interface LeaderboardEntry {
  rank: number
  user_id: string
  userId?: string
  user_name: string
  userName?: string
  points: number
  is_current_user?: boolean
  isCurrentUser?: boolean
}
interface AICoachNudge {
  message?: string
  recommendation?: string
  action_url?: string
  action_label?: string
}

export function RightPanel() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [subscription, setSubscription] = useState<SubStatus | null>(null)
  const [habits, setHabits] = useState<HabitItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [aiCoachNudge, setAICoachNudge] = useState<AICoachNudge | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [subRes, habitsRes, leaderRes, nudgeRes] = await Promise.allSettled([
          apiGateway.get<SubStatus>('/subscription/status'),
          apiGateway.get<HabitItem[]>('/student/dashboard/habits').catch(() => []),
          apiGateway.get<LeaderboardEntry[]>('/student/dashboard/leaderboard').catch(() => []),
          apiGateway.post<AICoachNudge>('/student/dashboard/ai-coach-nudge').catch(() => null),
        ])
        if (subRes.status === 'fulfilled' && subRes.value) setSubscription(subRes.value)
        if (habitsRes.status === 'fulfilled' && Array.isArray(habitsRes.value)) setHabits(habitsRes.value)
        if (leaderRes.status === 'fulfilled' && Array.isArray(leaderRes.value)) {
          setLeaderboard(leaderRes.value.map((e) => ({
            ...e,
            userId: e.user_id ?? (e as any).userId,
            userName: e.user_name ?? (e as any).userName,
            isCurrentUser: e.is_current_user ?? (e as any).isCurrentUser,
          })))
        }
        if (nudgeRes.status === 'fulfilled' && nudgeRes.value) setAICoachNudge(nudgeRes.value)
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const isPremium = subscription?.tier === 'professional' || subscription?.tier === 'premium'
  const planLabel = subscription?.plan_name?.replace(/_/g, ' ')?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? subscription?.tier ?? 'Free'

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-dashboard-accent text-white p-2 rounded-l-lg"
        aria-label="Show right panel"
      >
        →
      </button>
    )
  }

  return (
    <motion.div
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      className="w-[320px] absolute right-0 top-0 h-full bg-dashboard-card/80 backdrop-blur-md border-l border-white/20 overflow-y-auto p-4 space-y-4 z-10"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Quick Actions</h2>
        <button
          onClick={() => setIsVisible(false)}
          className="text-och-steel hover:text-white"
          aria-label="Hide right panel"
        >
          ×
        </button>
      </div>

      {!loading && aiCoachNudge && (
        <Card className="glass-card p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">AI Coach</h3>
          </div>
          <p className="text-xs text-och-steel mb-2">{aiCoachNudge.message}</p>
          <p className="text-sm text-white mb-3">{aiCoachNudge.recommendation}</p>
          {aiCoachNudge.action_url && (
            <Button
              variant="mint"
              size="sm"
              className="w-full text-xs"
              onClick={() => router.push(aiCoachNudge.action_url!)}
            >
              {aiCoachNudge.action_label || 'Start Lab'}
            </Button>
          )}
        </Card>
      )}

      {!loading && (
        <Card className="glass-card p-4 border-dashboard-warning/50">
          <h3 className="text-sm font-semibold text-white mb-2">
            {isPremium ? 'Current Plan' : 'Unlock Premium'}
          </h3>
          {isPremium ? (
            <p className="text-xs text-och-steel">
              {planLabel} · Active
            </p>
          ) : (
            <>
              <p className="text-xs text-och-steel mb-3">
                Unlock Mentor Reviews + Capstones
              </p>
              <div className="text-sm font-bold text-dashboard-warning mb-3">KSh 7,020/year (Save 10%)</div>
              <Button
                variant="orange"
                size="sm"
                className="w-full text-xs"
                onClick={() => router.push('/dashboard/student/subscription')}
              >
                Upgrade Now
              </Button>
            </>
          )}
        </Card>
      )}

      <div>
        <h3 className="text-sm font-semibold text-och-steel mb-3">Habit Tracker</h3>
        <Card className="glass-card p-3">
          <div className="space-y-2">
            {loading ? (
              <p className="text-xs text-och-steel py-2">Loading...</p>
            ) : habits.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-och-steel mb-2">No habits configured</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => router.push('/dashboard/student/coaching')}
                >
                  Set Up Habits
                </Button>
              </div>
            ) : (
              habits.map((habit) => (
                <div key={habit.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {habit.category === 'learn' ? '📚' : habit.category === 'practice' ? '⚡' : '✍️'}
                    </span>
                    <span className="text-sm text-white">{habit.name}</span>
                  </div>
                  <span className="text-xs text-och-steel">{(habit.streak ?? 0)} 🔥</span>
                </div>
              ))
            )}
          </div>
          <Button
            variant="mint"
            size="sm"
            className="w-full text-xs mt-3"
            onClick={() => router.push('/dashboard/student/coaching')}
          >
            Today's Log
          </Button>
        </Card>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-och-steel mb-3">Leaderboard</h3>
        <Card className="glass-card p-3">
          <div className="space-y-2">
            {loading ? (
              <p className="text-xs text-och-steel py-2">Loading...</p>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-och-steel mb-2">No leaderboard data</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => router.push('/dashboard/student/community')}
                >
                  View Community
                </Button>
              </div>
            ) : (
              leaderboard.map((entry) => (
                <div
                  key={entry.user_id ?? (entry as any).userId ?? entry.rank}
                  className={`flex items-center justify-between p-2 rounded ${
                    entry.isCurrentUser ? 'bg-dashboard-accent/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                    </span>
                    <span className={`text-sm ${entry.isCurrentUser ? 'font-bold text-white' : 'text-och-steel'}`}>
                      {entry.userName ?? entry.user_name}
                    </span>
                  </div>
                  <span className="text-sm text-white font-semibold">{entry.points}</span>
                </div>
              ))
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs mt-3"
            onClick={() => router.push('/dashboard/student/community')}
          >
            View Full
          </Button>
        </Card>
      </div>
    </motion.div>
  )
}

