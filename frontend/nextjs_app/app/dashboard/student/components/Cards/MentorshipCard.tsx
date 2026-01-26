'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import { Calendar, User } from 'lucide-react'
import { useDashboardStore } from '../../lib/store/dashboardStore'

export function MentorshipCard() {
  const { mentorship } = useDashboardStore()

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBD'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    >
      <Card className="glass-card p-3 md:p-4 hover:glass-hover transition-all">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-och-steel">Mentorship</h3>
          <Badge variant={(mentorship?.status || 'none') === 'scheduled' ? 'mint' : 'orange'} className="text-[10px]">
            {mentorship?.status || 'none'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-och-steel" />
            <span className="text-sm text-white">{mentorship?.mentorName || 'TBD'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-och-steel" />
            <div className="flex-1">
              <div className="text-sm text-white">
                {formatDate(mentorship?.nextSessionDate || '')}
              </div>
              {mentorship?.nextSessionTime && (
                <div className="text-xs text-och-steel">{mentorship.nextSessionTime}</div>
              )}
            </div>
          </div>

          {mentorship?.sessionType && (
            <div className="text-xs text-och-steel">
              Type: <span className="text-white">{mentorship.sessionType}</span>
            </div>
          )}
        </div>

        {mentorship?.status === 'scheduled' && (
          <Button
            variant="mint"
            size="sm"
            className="w-full mt-4"
            onClick={() => window.location.href = '/dashboard/student/mentorship'}
          >
            View Session
          </Button>
        )}
      </Card>
    </motion.div>
  )
}

