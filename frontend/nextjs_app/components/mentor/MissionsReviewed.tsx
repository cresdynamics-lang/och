'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useMentorMissions } from '@/hooks/useMentorMissions'
import { useAuth } from '@/hooks/useAuth'
import type { MissionSubmission } from '@/services/types/mentor'

export function MissionsReviewed() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const [page, setPage] = useState(1)
  const pageSize = 10
  const { missions, totalCount, isLoading, error } = useMentorMissions(mentorId, {
    status: 'reviewed',
    limit: pageSize,
    offset: (page - 1) * pageSize,
  })

  return (
    <Card className="mb-6 bg-och-midnight/50 border border-och-steel/20 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-och-steel/20 bg-och-midnight/30">
        <h2 className="text-xl font-bold text-white">Reviewed</h2>
        <p className="text-sm text-och-steel mt-1">
          Missions you have already reviewed ({totalCount} total)
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 text-och-orange text-sm">Error loading reviewed missions: {error}</div>
        )}

        {isLoading && (
          <div className="text-och-steel text-sm">Loading reviewed missions…</div>
        )}

        {!isLoading && !error && missions.length === 0 && (
          <div className="text-och-steel text-sm">No reviewed missions yet.</div>
        )}

        {!isLoading && !error && missions.length > 0 && (
          <div className="space-y-0 divide-y divide-och-steel/20">
            {missions.map((m: MissionSubmission & { reviewed_at?: string; feedback?: string }, index: number) => (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 hover:bg-och-midnight/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-white font-semibold">{m.mission_title}</span>
                    <Badge
                      variant={
                        m.status === 'approved' ? 'mint' :
                        m.status === 'needs_revision' ? 'orange' : 'steel'
                      }
                      className="text-[11px] capitalize"
                    >
                      {m.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs text-och-steel">
                    <span className="text-white font-medium">{m.mentee_name}</span>
                    {m.mentee_email && ` (${m.mentee_email})`} • Submitted:{' '}
                    {m.submitted_at ? new Date(m.submitted_at).toLocaleString() : '—'}
                    {(m as any).reviewed_at && (
                      <span className="ml-2 text-och-mint">
                        • Reviewed: {new Date((m as any).reviewed_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {(m as any).feedback && (
                    <div className="mt-2 p-2 bg-och-midnight/50 border border-och-steel/20 rounded text-xs text-och-steel">
                      <span className="font-medium text-white">Your feedback: </span>
                      <span className="line-clamp-2">{(m as any).feedback}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalCount > pageSize && (
          <div className="flex justify-end gap-2 mt-4 text-xs text-och-steel">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <span className="flex items-center px-2">
              Page {page} of {Math.ceil(totalCount / pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(totalCount / pageSize)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
