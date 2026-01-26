'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useGamification } from '@/hooks/useGamification'
import { useAuth } from '@/hooks/useAuth'

export function StreaksDisplay() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const { streaks, isLoading } = useGamification(menteeId)

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-och-steel">Loading streaks...</div>
      </Card>
    )
  }

  const getStreakIcon = (type: string) => {
    switch (type) {
      case 'daily_learning':
        return '📚'
      case 'missions':
        return '🚀'
      case 'reflections':
        return '✍️'
      case 'community':
        return '💬'
      default:
        return '🔥'
    }
  }

  const getStreakLabel = (type: string) => {
    switch (type) {
      case 'daily_learning':
        return 'Daily Learning'
      case 'missions':
        return 'Missions'
      case 'reflections':
        return 'Reflections'
      case 'community':
        return 'Community'
      default:
        return type
    }
  }

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-4 text-white">Streaks</h3>
        {streaks.length === 0 ? (
          <div className="text-center text-och-steel py-8">
            <div className="text-4xl mb-2">🔥</div>
            <div>Start a streak today!</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {streaks.map((streak) => (
              <div
                key={streak.type}
                className="p-4 bg-och-midnight/50 rounded-lg border-2 border-och-defender/30"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{getStreakIcon(streak.type)}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{getStreakLabel(streak.type)}</div>
                    <div className="text-sm text-och-steel">
                      Last activity: {new Date(streak.last_activity).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-och-mint">{streak.current_streak}</div>
                    <div className="text-xs text-och-steel">Current Streak</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-och-gold">{streak.longest_streak}</div>
                    <div className="text-xs text-och-steel">Longest</div>
                  </div>
                </div>
                {streak.current_streak > 0 && (
                  <div className="mt-3 pt-3 border-t border-och-steel/20">
                    <Badge variant="mint" className="text-xs">
                      🔥 {streak.current_streak} day streak!
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

