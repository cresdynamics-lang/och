'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { mentorClient } from '@/services/mentorClient'
import { apiGateway } from '@/services/apiGateway'
import type { MissionSubmission } from '@/services/types/mentor'

interface SubmissionQueueProps {
  mentorId: string
  onSubmissionClick: (submission: MissionSubmission) => void
}

type StatusFilter = 'all' | 'pending_review' | 'in_review'

export function SubmissionQueue({ mentorId, onSubmissionClick }: SubmissionQueueProps) {
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending_review')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const response = await mentorClient.getMissionSubmissionQueue(mentorId, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      })
      setSubmissions(response.results || [])
    } catch (err) {
      console.error('Failed to load submissions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubmissions()
  }, [mentorId, statusFilter])

  const handleStatusUpdate = async (submissionId: string, newStatus: string) => {
    setUpdatingStatus(submissionId)
    try {
      await apiGateway.patch(`/mentors/missions/submissions/${submissionId}/status`, {
        status: newStatus,
      })
      await loadSubmissions()
    } catch (err) {
      console.error('Failed to update status:', err)
      alert('Failed to update submission status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'ai_reviewed':
        return 'gold'
      case 'in_mentor_review':
      case 'in_review':
        return 'defender'
      case 'approved':
        return 'mint'
      case 'rejected':
      case 'failed':
        return 'orange'
      default:
        return 'steel'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'pending_review', 'in_review'] as StatusFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  statusFilter === filter
                    ? 'bg-och-defender text-white'
                    : 'bg-och-midnight/50 text-och-steel hover:text-white'
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'pending_review' ? 'Pending Review' : 'In Review'}
              </button>
            ))}
          </div>
          <Button onClick={loadSubmissions} variant="outline" size="sm" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </Card>

      {/* Submissions List */}
      {loading ? (
        <div className="text-center py-12 text-och-steel">Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <p className="text-och-steel">No submissions found for the selected filter.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <Card
              key={submission.id}
              className="glass-card p-4 hover:border-och-mint/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {(submission as any).mission_title || 'Unknown Mission'}
                    </h3>
                    <Badge variant={getStatusColor(submission.status)} className="text-xs">
                      {getStatusLabel(submission.status)}
                    </Badge>
                    {(submission as any).ai_score && (
                      <Badge variant="steel" className="text-xs">
                        AI Score: {(submission as any).ai_score}%
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-och-steel mb-3">
                    <span>
                      <strong className="text-white">Student:</strong> {(submission as any).mentee_name || 'Unknown'}
                    </span>
                    {(submission as any).submitted_at && (
                      <span>
                        <strong className="text-white">Submitted:</strong>{' '}
                        {new Date((submission as any).submitted_at).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3">
                    {submission.status === 'pending_review' ? (
                      <>
                        <Button
                          size="sm"
                          variant="defender"
                          onClick={() => handleStatusUpdate(submission.id, 'in_review')}
                          disabled={updatingStatus === submission.id}
                        >
                          {updatingStatus === submission.id ? 'Updating...' : 'Start Review'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(submission.id, 'in_review')}
                          disabled={updatingStatus === submission.id}
                        >
                          Schedule Review
                        </Button>
                      </>
                    ) : submission.status === 'in_review' ? (
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handleStatusUpdate(submission.id, 'approved')}
                        disabled={updatingStatus === submission.id}
                      >
                        {updatingStatus === submission.id ? 'Updating...' : 'Mark as Reviewed'}
                      </Button>
                    ) : null}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSubmissionClick(submission)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

