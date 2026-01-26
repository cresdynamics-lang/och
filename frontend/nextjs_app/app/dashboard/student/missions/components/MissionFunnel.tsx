'use client'

import { Card } from '@/components/ui/Card'

export interface MissionFunnelData {
  pending: number
  in_review: number
  in_ai_review: number
  in_mentor_review: number
  approved: number
  success_rate: number
  track_name?: string
  cohort_name?: string
}

interface MissionFunnelProps {
  data: MissionFunnelData
}

export function MissionFunnel({ data }: MissionFunnelProps) {
  const totalInReview = data.in_ai_review + data.in_mentor_review

  return (
    <Card className="bg-och-midnight/50 border border-och-steel/20">
      <div className="p-6">
        {/* Funnel Summary Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-och-steel">Pending:</span>
            <span className="px-3 py-1 bg-och-steel/20 text-white rounded-full text-sm font-semibold">
              {data.pending}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-och-steel">In review:</span>
            <span className="px-3 py-1 bg-och-defender/20 text-och-defender rounded-full text-sm font-semibold">
              {totalInReview}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-och-steel">Approved:</span>
            <span className="px-3 py-1 bg-och-mint/20 text-och-mint rounded-full text-sm font-semibold">
              {data.approved}
            </span>
            {data.success_rate > 0 && (
              <span className="text-xs text-och-steel">
                ({data.success_rate}% success)
              </span>
            )}
          </div>
        </div>

        {/* Track/Cohort Label */}
        {(data.track_name || data.cohort_name) && (
          <div className="mb-3">
            <span className="text-sm text-och-steel">
              {data.track_name && data.cohort_name 
                ? `${data.track_name} – ${data.cohort_name}`
                : data.track_name || data.cohort_name}
            </span>
          </div>
        )}

        {/* Readiness Hint */}
        <div className="pt-3 border-t border-och-steel/20">
          <p className="text-xs text-och-steel italic">
            Missions are your main skill evidence into TalentScope.
          </p>
        </div>
      </div>
    </Card>
  )
}

