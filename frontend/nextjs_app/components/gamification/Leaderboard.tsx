'use client'

import { useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useGamification } from '@/hooks/useGamification'
import { useAuth } from '@/hooks/useAuth'

interface LeaderboardProps {
  trackId?: string
  category?: string
}

export function Leaderboard({ trackId, category }: LeaderboardProps) {
  const { user } = useAuth()
  const { leaderboard, isLoading, loadLeaderboard } = useGamification(undefined)

  useEffect(() => {
    loadLeaderboard(trackId, category)
  }, [trackId, category, loadLeaderboard])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-och-steel">Loading leaderboard...</div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-4 text-white">Leaderboard</h3>
        {leaderboard.length === 0 ? (
          <div className="text-center text-och-steel py-8">
            <div>No leaderboard data available</div>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => {
              const isCurrentUser = entry.user_id === user?.id?.toString()
              return (
                <div
                  key={entry.user_id}
                  className={`p-3 rounded-lg flex items-center gap-3 ${
                    isCurrentUser ? 'bg-och-defender/30 border-2 border-och-mint' : 'bg-och-midnight/50'
                  }`}
                >
                  <div className="text-2xl font-bold text-och-mint w-12 text-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {entry.user_name}
                        {isCurrentUser && ' (You)'}
                      </span>
                      {isCurrentUser && <Badge variant="mint" className="text-xs">You</Badge>}
                    </div>
                    <div className="text-xs text-och-steel">
                      {entry.badge_count} badges • {entry.score} points
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-och-mint">{entry.score}</div>
                    <div className="text-xs text-och-steel">points</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}

