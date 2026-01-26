'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useGamification } from '@/hooks/useGamification'
import { useAuth } from '@/hooks/useAuth'

export function PointsDisplay() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const { points, isLoading } = useGamification(menteeId)

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-och-steel">Loading points...</div>
      </Card>
    )
  }

  if (!points) {
    return (
      <Card className="p-4">
        <div className="text-och-steel">No points data available</div>
      </Card>
    )
  }

  return (
    <Card className="bg-defender-gradient">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Total Points</h3>
            <div className="text-4xl font-bold text-och-mint">{points.total.toLocaleString()}</div>
          </div>
          <div className="text-5xl">⭐</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-och-midnight/50 p-3 rounded-lg">
            <div className="text-xs text-och-steel mb-1">Learning</div>
            <div className="text-xl font-bold text-white">{points.by_category.learning}</div>
          </div>
          <div className="bg-och-midnight/50 p-3 rounded-lg">
            <div className="text-xs text-och-steel mb-1">Missions</div>
            <div className="text-xl font-bold text-white">{points.by_category.missions}</div>
          </div>
          <div className="bg-och-midnight/50 p-3 rounded-lg">
            <div className="text-xs text-och-steel mb-1">Community</div>
            <div className="text-xl font-bold text-white">{points.by_category.community}</div>
          </div>
          <div className="bg-och-midnight/50 p-3 rounded-lg">
            <div className="text-xs text-och-steel mb-1">Achievements</div>
            <div className="text-xl font-bold text-white">{points.by_category.achievements}</div>
          </div>
        </div>

        {points.recent_earned.length > 0 && (
          <div className="border-t border-white/20 pt-4">
            <h4 className="text-sm font-semibold text-white mb-2">Recent Points</h4>
            <div className="space-y-2">
              {points.recent_earned.slice(0, 5).map((earned, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-och-steel">{earned.reason}</span>
                  <Badge variant="mint" className="text-xs">
                    +{earned.amount}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

