'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboardStore } from '../lib/store/dashboardStore'
import { useDismissAICoachNudge, useLogHabit } from '../lib/hooks/useDashboard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useRouter } from 'next/navigation'
import '../styles/dashboard.css'

export function RightPanel() {
  const { aiCoachNudge, subscription, subscriptionDaysLeft, habits, leaderboard } = useDashboardStore()
  const [isVisible, setIsVisible] = useState(true)
  const dismissNudge = useDismissAICoachNudge()
  const logHabit = useLogHabit()
  const router = useRouter()

  const handleDismissNudge = async () => {
    await dismissNudge.mutateAsync()
  }

  const handleLogHabit = async (habitId: string, completed: boolean) => {
    await logHabit.mutateAsync({ habitId, completed })
  }

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

      {aiCoachNudge && (
        <Card className="glass-card p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">AI Coach</h3>
            <button
              onClick={handleDismissNudge}
              className="text-och-steel hover:text-white text-xs"
              aria-label="Dismiss AI coach nudge"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-och-steel mb-2">{aiCoachNudge.message}</p>
          <p className="text-sm text-white mb-3">{aiCoachNudge.recommendation}</p>
          {aiCoachNudge.actionUrl && (
            <Button
              variant="mint"
              size="sm"
              className="w-full text-xs"
              onClick={() => router.push(aiCoachNudge.actionUrl!)}
            >
              {aiCoachNudge.actionLabel || 'Start Lab'}
            </Button>
          )}
        </Card>
      )}

      {subscription !== '$7-premium' && (
        <Card className="glass-card p-4 border-dashboard-warning/50">
          <h3 className="text-sm font-semibold text-white mb-2">Unlock Premium</h3>
          <p className="text-xs text-och-steel mb-3">
            Unlock Mentor Reviews + Capstones
          </p>
          <div className="text-sm font-bold text-dashboard-warning mb-3">$7/mo (Save 20%)</div>
          <Button
            variant="orange"
            size="sm"
            className="w-full text-xs"
            onClick={() => router.push('/dashboard/student/subscription')}
          >
            Upgrade Now
          </Button>
        </Card>
      )}

      <div>
        <h3 className="text-sm font-semibold text-och-steel mb-3">Habit Tracker</h3>
        <Card className="glass-card p-3">
          <div className="space-y-2">
            {(!habits || habits.length === 0) ? (
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
              (habits || []).map((habit) => (
                <div key={habit.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {habit.category === 'learn' ? '📚' : habit.category === 'practice' ? '⚡' : '✍️'}
                    </span>
                    <span className="text-sm text-white">{habit.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-och-steel">{habit.streak} 🔥</span>
                    <button
                      onClick={() => handleLogHabit(habit.id, !habit.completed)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        habit.completed
                          ? 'bg-dashboard-success border-dashboard-success'
                          : 'border-och-steel'
                      }`}
                      aria-label={`${habit.completed ? 'Unmark' : 'Mark'} ${habit.name} as complete`}
                    >
                      {habit.completed && <span className="text-white text-xs">✓</span>}
                    </button>
                  </div>
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
            {(!leaderboard || leaderboard.length === 0) ? (
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
              (leaderboard || []).map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-2 rounded ${
                    entry.isCurrentUser ? 'bg-dashboard-accent/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                    </span>
                    <span className={`text-sm ${entry.isCurrentUser ? 'font-bold text-white' : 'text-och-steel'}`}>
                      {entry.userName}
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

