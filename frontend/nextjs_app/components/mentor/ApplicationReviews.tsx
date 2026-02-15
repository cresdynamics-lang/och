'use client'

import { useState, useEffect, useMemo } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Mail, FileText, Filter } from 'lucide-react'

interface Application {
  id: string
  cohort_id: string
  cohort_name: string
  applicant_type: string
  status: string
  form_data: Record<string, string>
  email: string
  name: string
  notes: string
  created_at: string
  review_status?: string
  review_score?: number | null
  interview_status?: string | null
  interview_score?: number | null
  enrollment_status?: string | null
}

function getStatusLabel(app: Application): string {
  if (app.enrollment_status === 'enrolled') return 'Enrolled'
  if (app.enrollment_status === 'eligible') return 'Interview graded; eligible for enrollment'
  if (app.interview_status === 'failed') return 'Failed interview (did not meet cutoff)'
  if (app.review_status === 'passed') {
    const interviewDone = app.interview_status === 'completed' || app.interview_status === 'passed'
    if (interviewDone) return 'Interview graded; awaiting admin cutoff'
    return 'Passed application; interview marks pending'
  }
  if (app.review_status === 'reviewed') return 'Graded; awaiting admin cutoff'
  if (app.review_status === 'failed') return 'Failed application review'
  return 'Awaiting your review'
}

function getStatusVariant(app: Application): 'defender' | 'orange' | 'steel' {
  if (app.interview_status === 'failed' || app.review_status === 'failed') return 'orange'
  if (app.review_status === 'passed') return 'defender'
  return 'steel'
}

export function ApplicationReviews() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Application | null>(null)
  const [score, setScore] = useState<string>('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [interviewNotes, setInterviewNotes] = useState('')
  const [supportDocuments, setSupportDocuments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cohortFilter, setCohortFilter] = useState('')
  const [reviewStatusFilter, setReviewStatusFilter] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiGateway
      .get<{ applications: Application[] }>('/mentor/applications-to-review/')
      .then((res) => {
        if (!cancelled) setApplications(res?.applications ?? [])
      })
      .catch(() => {
        if (!cancelled) setApplications([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const cohorts = useMemo(() => {
    const seen = new Map<string, string>()
    applications.forEach((a) => {
      if (!seen.has(a.cohort_id)) seen.set(a.cohort_id, a.cohort_name)
    })
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [applications])

  const filtered = useMemo(() => {
    let list = applications
    if (cohortFilter) list = list.filter((a) => a.cohort_id === cohortFilter)
    if (reviewStatusFilter) list = list.filter((a) => (a.review_status || 'pending') === reviewStatusFilter)
    return list
  }, [applications, cohortFilter, reviewStatusFilter])

  const pending = applications.filter((a) => a.review_status === 'pending')
  const reviewed = applications.filter((a) => a.review_status === 'reviewed')
  const passed = applications.filter((a) => a.review_status === 'passed')
  const needsInterview = passed.filter((a) => a.interview_status !== 'completed')

  const handleGrade = async (phase: 'review' | 'interview') => {
    if (!selected) return
    const s = parseFloat(score)
    if (isNaN(s) || s < 0 || s > 100) {
      alert('Score must be between 0 and 100')
      return
    }
    setSubmitting(true)
    try {
      const endpoint = phase === 'review'
        ? `/mentor/applications-to-review/${selected.id}/grade/`
        : `/mentor/applications-to-review/${selected.id}/grade-interview/`
      const body: Record<string, unknown> = { score: s }
      if (phase === 'review' && reviewNotes) body.review_notes = reviewNotes
      if (phase === 'interview') {
        if (interviewNotes) body.interview_notes = interviewNotes
        if (supportDocuments) body.support_documents = supportDocuments.split('\n').filter(Boolean)
      }
      await apiGateway.post(endpoint, body)
      setSelected(null)
      setScore('')
      setReviewNotes('')
      setInterviewNotes('')
      setSupportDocuments('')
      setApplications((prev) =>
        prev.map((a) =>
          a.id === selected.id
            ? {
                ...a,
                review_score: phase === 'review' ? s : a.review_score,
                review_status: phase === 'review' ? 'reviewed' : a.review_status,
                interview_score: phase === 'interview' ? s : a.interview_score,
                interview_status: phase === 'interview' ? 'completed' : a.interview_status,
              }
            : a
        )
      )
    } catch (err: unknown) {
      alert((err as { message?: string })?.message || 'Failed to submit score')
    } finally {
      setSubmitting(false)
    }
  }

  const formEntries = selected?.form_data
    ? Object.entries(selected.form_data).filter(
        ([k, v]) =>
          v != null &&
          String(v).trim() !== '' &&
          !['review_notes', 'interview_notes', 'support_documents'].includes(k)
      )
    : []

  return (
    <Card className="bg-och-midnight border border-och-steel/20 rounded-xl overflow-hidden">
      <div className="p-6 pb-4">
        <h2 className="text-xl font-bold text-white mb-4">Applications to Review</h2>

        {!loading && applications.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-4">
            <span className="text-och-steel">
              <span className="text-och-orange font-medium">{pending.length}</span> awaiting your review
            </span>
            <span className="text-och-steel">
              <span className="text-och-mint font-medium">{reviewed.length}</span> graded, awaiting admin cutoff
            </span>
            <span className="text-och-steel">
              <span className="text-och-defender font-medium">{passed.length}</span> passed application review
            </span>
            <span className="text-och-steel">
              <span className="text-och-mint font-medium">{needsInterview.length}</span> need interview grading
            </span>
          </div>
        )}

        {/* Filters */}
        {!loading && applications.length > 0 && (
          <div className="border border-och-steel/20 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-och-steel" />
              <span className="text-sm font-medium text-white">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-och-steel mb-1">Cohort</label>
                <select
                  value={cohortFilter}
                  onChange={(e) => setCohortFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm"
                >
                  <option value="">All cohorts</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-och-steel mb-1">Stage</label>
                <select
                  value={reviewStatusFilter}
                  onChange={(e) => setReviewStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm"
                >
                  <option value="">All stages</option>
                  <option value="pending">Awaiting your review</option>
                  <option value="reviewed">Graded, awaiting admin cutoff</option>
                  <option value="passed">Passed application review</option>
                  <option value="failed">Failed application review</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setCohortFilter(''); setReviewStatusFilter('') }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-och-steel">Loading applications...</div>
      ) : applications.length === 0 ? (
        <p className="p-6 text-och-steel text-sm">No applications assigned to you for review yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-b border-och-steel/20">
                <th className="text-left py-3 px-4 text-xs font-medium text-och-steel w-12">#</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-och-steel">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-och-steel">Cohort</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-och-steel">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-och-steel">Email</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-och-steel">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-och-steel">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-och-steel text-sm">
                    No applications match the filters.
                  </td>
                </tr>
              ) : filtered.map((app, idx) => (
                <tr
                  key={app.id}
                  className="border-b border-och-steel/10 hover:bg-och-midnight/30"
                >
                  <td className="py-3 px-4 text-sm text-och-steel font-medium">{idx + 1}</td>
                  <td className="py-3 px-4 text-sm text-och-steel">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-white max-w-[180px] truncate">
                    {app.cohort_name}
                  </td>
                  <td className="py-3 px-4 text-sm text-white">{app.name || '-'}</td>
                  <td className="py-3 px-4 text-sm text-och-steel">{app.email || '-'}</td>
                  <td className="py-3 px-4 max-w-[280px]">
                    <Badge variant={getStatusVariant(app)} className="whitespace-normal text-left">
                      {getStatusLabel(app)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {app.review_status === 'passed' && (!app.interview_status || app.interview_status === 'pending') && (
                        <a
                          href={`mailto:${app.email}?subject=Interview%20Invitation%20-%20${encodeURIComponent(app.cohort_name)}&body=Dear%20${encodeURIComponent(app.name || 'Applicant')},%0A%0AYou%20have%20passed%20the%20initial%20review.%20We%20would%20like%20to%20schedule%20an%20interview%20with%20you.%0A%0APlease%20reply%20to%20this%20email%20with%20your%20availability.%0A%0ABest%20regards`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-och-steel/20 text-och-mint rounded hover:bg-och-steel/30"
                        >
                          <Mail className="w-3 h-3" /> Email
                        </a>
                      )}
                      <Button
                        variant="defender"
                        size="sm"
                        onClick={() => {
                          setSelected(app)
                          setScore(app.review_status === 'reviewed' || app.review_status === 'passed' ? String(app.interview_score ?? app.review_score ?? '') : '')
                          setReviewNotes(String(app.form_data?.review_notes ?? ''))
                          setInterviewNotes(String(app.form_data?.interview_notes ?? ''))
                          setSupportDocuments(Array.isArray(app.form_data?.support_documents) ? (app.form_data.support_documents as string[]).join('\n') : String(app.form_data?.support_documents ?? ''))
                        }}
                      >
                        {app.review_status === 'pending' ? 'Grade' : app.review_status === 'passed' && (!app.interview_status || app.interview_status === 'pending') ? 'Grade Interview' : 'View'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col border-och-steel/20 bg-och-midnight">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white">Application: {selected?.name || selected?.email}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-och-steel">Cohort</span>
                  <p className="text-white">{selected.cohort_name}</p>
                </div>
                <div>
                  <span className="text-och-steel">Status</span>
                  <p><Badge variant={getStatusVariant(selected)}>{getStatusLabel(selected)}</Badge></p>
                </div>
              </div>

              {formEntries.length > 0 && (
                <div>
                  <span className="text-och-steel text-xs block mb-2">Form responses</span>
                  <div className="space-y-1 rounded bg-och-midnight/50 p-3 text-sm">
                    {formEntries.map(([key, value]) => (
                      <div key={key}>
                        <span className="text-och-steel">{key.replace(/_/g, ' ')}:</span>{' '}
                        <span className="text-white">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Application progress & your feedback - shown when mentor has submitted any feedback */}
              {(selected.review_status === 'reviewed' || selected.review_status === 'passed') && (
                <div className="space-y-4 border-t border-och-steel/20 pt-4">
                  <h4 className="text-sm font-medium text-white">Application progress & your feedback</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {(selected.review_status === 'reviewed' || selected.review_status === 'passed') && (
                      <div className="rounded-lg bg-och-midnight/50 border border-och-steel/20 p-3">
                        <span className="text-xs text-och-steel block mb-1">Application review</span>
                        <p className="text-white font-medium">
                          Score: {selected.review_score != null ? selected.review_score : '—'}
                        </p>
                        {selected.form_data?.review_notes && (
                          <p className="text-sm text-white mt-2 pt-2 border-t border-och-steel/20 whitespace-pre-wrap">{String(selected.form_data.review_notes)}</p>
                        )}
                      </div>
                    )}
                    {(selected.interview_status === 'completed' || selected.interview_status === 'passed') && (
                      <div className="rounded-lg bg-och-midnight/50 border border-och-steel/20 p-3">
                        <span className="text-xs text-och-steel block mb-1">Interview</span>
                        <p className="text-white font-medium">
                          Score: {selected.interview_score != null ? selected.interview_score : '—'}
                        </p>
                        {selected.form_data?.interview_notes && (
                          <p className="text-sm text-white mt-2 pt-2 border-t border-och-steel/20 whitespace-pre-wrap">{String(selected.form_data.interview_notes)}</p>
                        )}
                        {selected.form_data?.support_documents && (
                          <p className="text-sm text-white mt-2 pt-2 border-t border-och-steel/20 whitespace-pre-wrap">
                            Support docs: {Array.isArray(selected.form_data.support_documents) ? (selected.form_data.support_documents as string[]).join('\n') : String(selected.form_data.support_documents)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {selected.review_status === 'reviewed' && (
                    <p className="text-och-steel text-sm">Awaiting director to set cutoff. Applications above cutoff will move to interview.</p>
                  )}
                  {(selected.interview_status === 'completed' || selected.interview_status === 'passed') && selected.enrollment_status !== 'enrolled' && (
                    <p className="text-och-steel text-sm">Interview graded. Awaiting director to set cutoff and enroll.</p>
                  )}
                  {selected.enrollment_status === 'enrolled' && (
                    <p className="text-och-mint text-sm font-medium">Enrolled</p>
                  )}
                </div>
              )}

              {(selected.review_status === 'pending' || (selected.review_status === 'passed' && (!selected.interview_status || selected.interview_status === 'pending'))) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-och-steel text-sm mb-2">
                      {selected.review_status === 'pending' ? 'Review score (0-100)' : 'Interview score (0-100)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      className="w-24 px-2 py-2 bg-och-midnight border border-och-steel/30 rounded text-white"
                    />
                  </div>
                  {selected.review_status === 'pending' && (
                    <div>
                      <label className="block text-och-steel text-sm mb-2 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Review comment / notes
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add your feedback for the director..."
                        rows={3}
                        className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded text-white text-sm"
                      />
                    </div>
                  )}
                  {selected.review_status === 'passed' && (!selected.interview_status || selected.interview_status === 'pending') && (
                    <>
                      <div>
                        <label className="block text-och-steel text-sm mb-2 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> Interview notes
                        </label>
                        <textarea
                          value={interviewNotes}
                          onChange={(e) => setInterviewNotes(e.target.value)}
                          placeholder="Notes from the interview..."
                          rows={3}
                          className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-och-steel text-sm mb-2">Support documents (URLs, one per line)</label>
                        <textarea
                          value={supportDocuments}
                          onChange={(e) => setSupportDocuments(e.target.value)}
                          placeholder="https://docs.example.com/notes.pdf"
                          rows={2}
                          className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded text-white text-sm"
                        />
                      </div>
                      <a
                        href={`mailto:${selected.email}?subject=Interview%20Invitation%20-%20${encodeURIComponent(selected.cohort_name)}`}
                        className="inline-flex items-center gap-1 text-sm text-och-mint hover:underline"
                      >
                        <Mail className="w-4 h-4" /> Send interview email to student
                      </a>
                    </>
                  )}
                  <Button
                    variant="defender"
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleGrade(selected.review_status === 'pending' ? 'review' : 'interview')}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
