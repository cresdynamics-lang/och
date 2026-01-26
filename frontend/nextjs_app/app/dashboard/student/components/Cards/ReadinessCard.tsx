'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { useDashboardStore } from '../../lib/store/dashboardStore'

export function ReadinessCard() {
  const { readiness } = useDashboardStore()

  const data = [
    {
      name: 'Readiness',
      value: readiness.score,
      fill: readiness.score >= 70 ? '#10b981' : readiness.score >= 40 ? '#f59e0b' : '#ef4444',
    },
  ]

  const getTrendIcon = () => {
    if (readiness.trendDirection === 'up') return '↑'
    if (readiness.trendDirection === 'down') return '↓'
    return '→'
  }

  const getTrendColor = () => {
    if (readiness.trendDirection === 'up') return 'text-dashboard-success'
    if (readiness.trendDirection === 'down') return 'text-dashboard-error'
    return 'text-och-steel'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card p-3 md:p-4 hover:glass-hover transition-all">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-och-steel">Readiness</h3>
          <Badge variant={readiness.score >= 70 ? 'mint' : readiness.score >= 40 ? 'orange' : 'defender'} className="text-xs">
            {readiness.score}%
          </Badge>
        </div>

        <div className="relative h-20 mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="60%"
              outerRadius="90%"
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                fill={data[0].fill}
                animationDuration={1500}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{readiness.score}</div>
              <div className="text-[10px] text-och-steel">/{readiness.maxScore}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className={`${getTrendColor()} flex items-center gap-1`}>
            {getTrendIcon()} {Math.abs(readiness.trend)}%
          </span>
          {readiness.countdownDays > 0 && (
            <span className="text-och-steel">
              {readiness.countdownDays} days {readiness.countdownLabel}
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

