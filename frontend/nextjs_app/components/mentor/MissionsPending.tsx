'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useMentorMissions } from '@/hooks/useMentorMissions'
import { useAuth } from '@/hooks/useAuth'
import type { MissionSubmission } from '@/services/types/mentor'

interface MissionsPendingProps {
  onReviewClick?: (submission: MissionSubmission) => void
}

export function MissionsPending({ onReviewClick }: MissionsPendingProps) {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const [page, setPage] = useState(1)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced' | 'capstone'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'ai_reviewed'>('all')
  const [search, setSearch] = useState('')
  const pageSize = 10
  const { missions, totalCount, isLoading, error, updateMissionStatus } = useMentorMissions(mentorId, {
    status: 'pending_review',
    limit: pageSize,
    offset: (page - 1) * pageSize,
  })

  // Filter missions by difficulty and status
  const filteredMissions = useMemo(() => {
    const q = search.trim().toLowerCase()
    return missions.filter((m: any) => {
      const missionDifficulty = (m as any).mission_difficulty || 'unknown'
      if (difficultyFilter !== 'all' && missionDifficulty !== difficultyFilter) return false
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      if (q) {
        const hay = `${m.mission_title || ''} ${m.mentee_name || ''} ${m.mentee_email || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [missions, difficultyFilter, statusFilter, search])

  const handleReview = (submission: MissionSubmission) => {
    if (onReviewClick) {
      onReviewClick(submission)
    } else {
      alert(`Open detailed review UI for mission ${submission.id}`)
    }
  }

  const handleApprove = async (submission: MissionSubmission) => {
    if (!updateMissionStatus) return
    
    setProcessingId(submission.id)
    setSuccessMessage(null)
    
    try {
      await updateMissionStatus(submission.id, 'approved')
      setSuccessMessage(`Mission "${submission.mission_title}" approved successfully`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Failed to approve mission:', err)
      alert('Failed to approve mission. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRequestResubmission = async (submission: MissionSubmission) => {
    if (!updateMissionStatus) return
    
    setProcessingId(submission.id)
    setSuccessMessage(null)
    
    try {
      await updateMissionStatus(submission.id, 'needs_revision')
      setSuccessMessage(`Resubmission requested for "${submission.mission_title}"`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Failed to request resubmission:', err)
      alert('Failed to request resubmission. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleBulkApprove = () => {
    alert('Bulk approve selected missions (wire to backend).')
  }

  return (
    <Card className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Mission Review Inbox</h2>
          <p className="text-sm text-och-steel">
            Your submission queue for <strong className="text-white">$7 Premium tier mentees</strong>. Review missions, provide deeper analysis, issue pass/fail grades, tag competencies, and use rubric scoring.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleBulkApprove}>
            Bulk Approve
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-och-steel mb-1">Mission Type</label>
          <select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value as any)
              setPage(1)
            }}
            className="px-3 py-1.5 rounded-lg bg-och-midnight border border-och-steel/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            <option value="all">All Types</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="capstone">Capstone</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-och-steel mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any)
              setPage(1)
            }}
            className="px-3 py-1.5 rounded-lg bg-och-midnight border border-och-steel/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="ai_reviewed">AI Reviewed</option>
          </select>
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs text-och-steel mb-1">Search</label>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search mentee or mission..."
            className="w-full px-3 py-1.5 rounded-lg bg-och-midnight border border-och-steel/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
          />
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-och-defender/20 border border-och-defender/40 rounded-lg text-och-defender text-sm">
          {successMessage}
        </div>
      )}

      {isLoading && (
        <div className="text-och-steel text-sm">Loading missions...</div>
      )}

      {error && !isLoading && (
        <div className="text-och-orange text-sm">Error loading missions: {error}</div>
      )}

      {!isLoading && !error && filteredMissions.length === 0 && missions.length === 0 && (
        <div className="text-och-steel text-sm">No missions pending review.</div>
      )}

      {!isLoading && !error && missions.length > 0 && filteredMissions.length === 0 && (
        <div className="text-och-steel text-sm">No missions match the selected filters.</div>
      )}

      {!isLoading && !error && filteredMissions.length > 0 && (
        <div className="space-y-3">
          {filteredMissions.map((m) => {
            // Count evidence types
            const submissionData = m.submission_data as any
            const evidenceCount = {
              files: m.submission_data?.files?.length || 0,
              github: m.submission_data?.code_repository ? 1 : 0,
              notebook: submissionData?.notebook_link ? 1 : 0,
              video: submissionData?.video_url ? 1 : 0,
              screenshot: submissionData?.screenshots?.length || 0,
            }
            const totalEvidence = Object.values(evidenceCount).reduce((a, b) => a + b, 0)
            const missionDifficulty = (m as any).mission_difficulty || 'unknown'
            const requiresRubric = (m as any).requires_rubric || false
            const rubricId = (m as any).rubric_id
            const aiFeedback = (m as any).ai_feedback

            return (
            <div
              key={m.id}
                className="p-4 bg-och-midnight/50 rounded-lg hover:bg-och-midnight/70 transition-colors border border-och-steel/20"
            >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-white font-semibold">{m.mission_title}</span>
                      <Badge 
                        variant={
                          missionDifficulty === 'capstone' ? 'orange' :
                          missionDifficulty === 'advanced' ? 'defender' :
                          missionDifficulty === 'intermediate' ? 'mint' : 'steel'
                        } 
                        className="text-[11px] capitalize"
                      >
                        {missionDifficulty}
                      </Badge>
                  <Badge 
                    variant={
                      m.status === 'pending_review' ? 'steel' :
                          m.status === 'in_review' ? 'defender' :
                          m.status === 'approved' ? 'mint' :
                          m.status === 'needs_revision' ? 'orange' : 'steel'
                    } 
                    className="text-[11px] capitalize"
                  >
                    {m.status.replace('_', ' ')}
                  </Badge>
                  {m.tier_requirement === 'professional' && (
                    <Badge variant="gold" className="text-[11px]">$7 Premium</Badge>
                      )}
                      {requiresRubric && (
                        <Badge variant="defender" className="text-[11px]">Rubric Required</Badge>
                      )}
                    </div>
                    <div className="text-xs text-och-steel mb-2">
                      <span className="text-white font-medium">{m.mentee_name}</span> • 
                      Submitted: {new Date(m.submitted_at).toLocaleString()}
                      {(m.status === 'in_review' || aiFeedback) && (
                        <span className="ml-2 text-och-mint">✓ AI Review Complete</span>
                      )}
                    </div>
                    {/* Evidence Summary */}
                    {totalEvidence > 0 && (
                      <div className="flex items-center gap-3 text-xs text-och-steel mt-2">
                        <span className="font-medium text-white">Evidence:</span>
                        {evidenceCount.files > 0 && (
                          <span className="flex items-center gap-1">
                            📎 {evidenceCount.files} file{evidenceCount.files !== 1 ? 's' : ''}
                          </span>
                        )}
                        {evidenceCount.github > 0 && (
                          <span className="flex items-center gap-1">
                            🔗 GitHub
                          </span>
                        )}
                        {evidenceCount.notebook > 0 && (
                          <span className="flex items-center gap-1">
                            📓 Notebook
                          </span>
                        )}
                        {evidenceCount.video > 0 && (
                          <span className="flex items-center gap-1">
                            🎥 Video
                          </span>
                        )}
                        {evidenceCount.screenshot > 0 && (
                          <span className="flex items-center gap-1">
                            📸 {evidenceCount.screenshot} screenshot{evidenceCount.screenshot !== 1 ? 's' : ''}
                          </span>
                  )}
                </div>
                    )}
                    {/* AI Feedback Preview */}
                    {aiFeedback && (
                      <div className="mt-2 p-2 bg-och-defender/10 border border-och-defender/30 rounded text-xs">
                        <span className="text-och-steel font-medium">AI Feedback: </span>
                        <span className="text-white">
                          {typeof aiFeedback === 'string' 
                            ? aiFeedback.substring(0, 100) + (aiFeedback.length > 100 ? '...' : '')
                            : (aiFeedback as any)?.summary || 'Available (view in review)'}
                        </span>
                </div>
                    )}
              </div>
                  <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleReview(m)}>
                  Review
                </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filteredMissions.length > 0 && totalCount > 10 && (
        <div className="flex justify-end gap-2 mt-4 text-xs text-och-steel">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={missions.length < 10}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Pagination (backend-driven) */}
      {!isLoading && !error && totalCount > pageSize && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-och-steel/20">
          <div className="text-xs text-och-steel">
            Page {page} of {Math.ceil(totalCount / pageSize)}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(totalCount / pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}


