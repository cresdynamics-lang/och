'use client'

import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { motion } from 'framer-motion'
import { useDashboardStore } from '../../lib/store/dashboardStore'

export function CohortCard() {
  const { trackOverview } = useDashboardStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="glass-card p-3 md:p-4 hover:glass-hover transition-all">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-och-steel">Cohort</h3>
          <span className="text-[10px] text-och-steel">
            {trackOverview?.completedMilestones || 0}/{trackOverview?.totalMilestones || 0}
          </span>
        </div>

        <div className="mb-2">
          <ProgressBar
            value={trackOverview?.totalMilestones ? (trackOverview.completedMilestones / trackOverview.totalMilestones) * 100 : 0}
            max={100}
            variant="mint"
            showLabel
            className="h-2"
          />
        </div>

        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-och-steel">Track:</span>
            <span className="text-white font-medium">{trackOverview?.trackName || 'None'}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

