/**
 * Coaching Metrics Component
 * Key behavioral metrics display
 */
'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Calendar, Award, Target } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useCoachingStore } from '@/lib/coaching/store'

export function CoachingMetrics() {
  const { metrics } = useCoachingStore()
  
  const metricCards = [
    {
      icon: TrendingUp,
      label: 'Alignment Score',
      value: `${metrics?.alignmentScore ?? 0}%`,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30',
    },
    {
      icon: Calendar,
      label: 'Total Streak',
      value: `${metrics?.totalStreakDays ?? (metrics as any)?.habits_streak ?? 0} days`,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
    },
    {
      icon: Target,
      label: 'Active Habits',
      value: metrics?.activeHabits ?? 0,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
    {
      icon: Award,
      label: 'Completed Goals',
      value: (metrics as any)?.goals_completed ?? 0,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
  ]
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metricCards.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`${metric.bgColor} border ${metric.borderColor} glass-card`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">{metric.label}</p>
                <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
              </div>
              <metric.icon className={`w-8 h-8 ${metric.color} opacity-50`} />
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

