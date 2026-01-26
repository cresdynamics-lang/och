'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { motion } from 'framer-motion'
import { Flame, Trophy, Award } from 'lucide-react'
import { useDashboardStore } from '../../lib/store/dashboardStore'

export function GamificationCard() {
  const { quickStats } = useDashboardStore()
  const gamification = {
    points: quickStats.points,
    streak: quickStats.streak,
    badges: quickStats.badges,
    rank: quickStats.points >= 1000 ? 'Expert' : quickStats.points >= 500 ? 'Advanced' : quickStats.points >= 100 ? 'Intermediate' : 'Beginner',
    level: Math.floor(quickStats.points / 100) + 1,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card className="glass-card p-3 md:p-4 hover:glass-hover transition-all">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-och-steel">Gamification</h3>
          <Badge variant="gold" className="text-[10px]">{gamification.rank || 'Beginner'}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-dashboard-accent/20 rounded-lg">
              <Trophy className="w-4 h-4 text-dashboard-accent" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-och-steel">Points</div>
              <div className="text-base font-bold text-white">{gamification.points}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-dashboard-warning/20 rounded-lg">
              <Flame className="w-4 h-4 text-dashboard-warning" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-och-steel">Streak</div>
              <div className="text-base font-bold text-white">{gamification.streak}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-dashboard-success/20 rounded-lg">
              <Award className="w-4 h-4 text-dashboard-success" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-och-steel">Badges</div>
              <div className="text-base font-bold text-white">{gamification.badges}</div>
            </div>
          </div>
        </div>

        {gamification.level && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs text-och-steel">Level</div>
            <div className="text-sm font-semibold text-white">{gamification.level}</div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

