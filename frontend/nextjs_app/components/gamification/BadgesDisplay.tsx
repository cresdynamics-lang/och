'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { gamificationClient } from '@/services/gamificationClient'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import type { GamificationBadge as BadgeType } from '@/services/types/gamification'

export function BadgesDisplay() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null)

  useEffect(() => {
    if (menteeId) {
      gamificationClient.getBadges(menteeId)
        .then(setBadges)
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [menteeId])

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-och-steel">Loading badges...</div>
      </Card>
    )
  }

  const earnedBadges = badges.filter(b => b.earned_at)
  const inProgressBadges = badges.filter(b => !b.earned_at && b.progress_to_next)

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-4 text-white">Badges & Achievements</h3>
        
        {earnedBadges.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-och-steel mb-3">Earned ({earnedBadges.length})</h4>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="relative group cursor-pointer"
                  onMouseEnter={() => setHoveredBadge(badge.id)}
                  onMouseLeave={() => setHoveredBadge(null)}
                >
                  <div className="w-16 h-16 bg-och-gold/20 rounded-full flex items-center justify-center text-3xl border-2 border-och-gold animate-pulse">
                    {badge.icon_url ? (
                      <img src={badge.icon_url} alt={badge.name} className="w-full h-full rounded-full" />
                    ) : (
                      <span>🏆</span>
                    )}
                  </div>
                  {hoveredBadge === badge.id && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-och-midnight border border-och-steel/20 rounded-lg shadow-lg z-10">
                      <div className="font-semibold text-white text-sm mb-1">{badge.name}</div>
                      <div className="text-xs text-och-steel">{badge.description}</div>
                      {badge.earned_at && (
                        <div className="text-xs text-och-mint mt-1">
                          Earned: {new Date(badge.earned_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {inProgressBadges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-och-steel mb-3">In Progress</h4>
            <div className="space-y-3">
              {inProgressBadges.map((badge) => (
                <div key={badge.id} className="p-3 bg-och-midnight/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-och-steel/20 rounded-full flex items-center justify-center text-xl">
                      {badge.icon_url ? (
                        <img src={badge.icon_url} alt={badge.name} className="w-full h-full rounded-full" />
                      ) : (
                        <span>🎯</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{badge.name}</div>
                      <div className="text-xs text-och-steel">{badge.description}</div>
                    </div>
                    <Badge variant="defender" className="text-xs">
                      {badge.progress_to_next}%
                    </Badge>
                  </div>
                  <ProgressBar value={badge.progress_to_next || 0} variant="defender" />
                  {badge.next_badge && (
                    <div className="text-xs text-och-steel mt-2">
                      Next: <span className="text-och-mint">{badge.next_badge.name}</span>
                      <div className="text-xs mt-1">{badge.next_badge.requirements}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {badges.length === 0 && (
          <div className="text-center text-och-steel py-8">
            <div className="text-4xl mb-2">🎯</div>
            <div>No badges yet. Start learning to earn your first badge!</div>
          </div>
        )}
      </div>
    </Card>
  )
}

