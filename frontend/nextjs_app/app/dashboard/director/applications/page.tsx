'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'
import { programsClient } from '@/services/programsClient'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Link from 'next/link'
import { GraduationCap, Users, Filter, ExternalLink, Eye, UserPlus, Award, UserCheck } from 'lucide-react'

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
  reviewer_mentor_id?: number | null
  reviewer_mentor_name?: string | null
  review_score?: number | null
  review_status?: string
  interview_score?: number | null
  interview_status?: string | null
  enrollment_status?: string
}

interface MentorAssignment {
  id: string
  mentor: number | { id: number; email: string; first_name?: string; last_name?: string }
  mentor_email?: string
  mentor_name?: string
}

interface Cohort {
  id: string
  name: string
}

function ApplicationDetailsModal({
  application,
  open,
  onOpenChange,
  getStatusVariant,
  getApplicationStatusLabel,
}: {
  application: Application | null
  open: boolean
  onOpenChange: (open: boolean) => void
  getStatusVariant: (s: string) => 'defender' | 'orange' | 'steel'
  getApplicationStatusLabel: (s: string) => string
}) {
  if (!application) return null

  const formEntries = application.form_data
    ? Object.entries(application.form_data).filter(([, v]) => v != null && String(v).trim() !== '')
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-och-steel/20 bg-och-midnight">
        <DialogHeader>
          <DialogTitle className="text-white">
            {application.applicant_type === 'student' ? 'Student' : 'Sponsor'} Application Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-och-steel">Name</span>
              <p className="text-white font-medium">{application.name || '-'}</p>
            </div>
            <div>
              <span className="text-och-steel">Email</span>
              <p className="text-white font-medium">{application.email || '-'}</p>
            </div>
            <div>
              <span className="text-och-steel">Cohort</span>
              <p className="text-white font-medium truncate">{application.cohort_name}</p>
            </div>
            <div>
              <span className="text-och-steel">Application status</span>
              <p>
                <Badge variant={getStatusVariant(application.status)}>{getApplicationStatusLabel(application.status)}</Badge>
              </p>
            </div>
            <div>
              <span className="text-och-steel">Applied</span>
              <p className="text-white">
                {new Date(application.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {formEntries.length > 0 && (
            <div>
              <span className="text-och-steel block mb-2">Form responses</span>
              <div className="space-y-2 rounded-lg bg-och-midnight/50 border border-och-steel/20 p-4">
                {formEntries.map(([key, value]) => (
                  <div key={key}>
                    <span className="text-och-steel text-xs block">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                    <p className="text-white">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {application.notes && (
            <div>
              <span className="text-och-steel block mb-1">Notes</span>
              <p className="text-white rounded-lg bg-och-midnight/50 border border-och-steel/20 p-3">{application.notes}</p>
            </div>
          )}

          <Link
            href={`/dashboard/director/cohorts/${application.cohort_id}`}
            className="inline-flex items-center gap-1 text-och-mint hover:underline text-sm"
          >
            View cohort <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AssignToMentorModal({
  open,
  onOpenChange,
  mentors,
  selectedCount,
  cohortName,
  onAssign,
  assigning,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mentors: MentorAssignment[]
  selectedCount: number
  cohortName: string
  onAssign: (mentorId: number) => Promise<void>
  assigning: boolean
}) {
  const [selectedMentorId, setSelectedMentorId] = useState<number | ''>('')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-och-steel/20 bg-och-midnight">
        <DialogHeader>
          <DialogTitle className="text-white">Assign to mentor for review</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-och-steel">
            Assign <span className="text-white font-medium">{selectedCount}</span> student(s) to a mentor. Select a mentor assigned to <span className="text-och-mint">{cohortName}</span>:
          </p>
          {mentors.length === 0 ? (
            <p className="text-och-orange">No mentors assigned to this cohort. Assign mentors in the cohort page first.</p>
          ) : (
            <select
              value={selectedMentorId}
              onChange={(e) => setSelectedMentorId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white"
            >
              <option value="">Select mentor</option>
              {mentors.map((m) => {
                const mentorId = typeof m.mentor === 'object' ? m.mentor?.id : m.mentor
                const name = m.mentor_name || (typeof m.mentor === 'object' ? (m.mentor?.first_name || m.mentor?.last_name ? `${m.mentor.first_name || ''} ${m.mentor.last_name || ''}`.trim() : m.mentor?.email) : m.mentor_email)
                return (
                  <option key={m.id} value={mentorId}>{name || m.mentor_email || String(mentorId)}</option>
                )
              })}
            </select>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant="defender"
              disabled={!selectedMentorId || mentors.length === 0 || assigning}
              onClick={() => selectedMentorId && onAssign(selectedMentorId)}
            >
              {assigning ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ApplicationsPage() {
  const searchParams = useSearchParams()
  const [applications, setApplications] = useState<Application[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [cohortFilter, setCohortFilter] = useState<string>('')
  const [applicantTypeFilter, setApplicantTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('')
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState<string>('')
  const [mentorFilter, setMentorFilter] = useState<string>('')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [selectedAnchorIdx, setSelectedAnchorIdx] = useState<number | null>(null)
  const [selectCount, setSelectCount] = useState<string>('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [mentors, setMentors] = useState<MentorAssignment[]>([])
  const [assigning, setAssigning] = useState(false)
  const [showCutoffModal, setShowCutoffModal] = useState<'review' | 'interview' | null>(null)
  const [cutoffGrade, setCutoffGrade] = useState('')
  const [settingCutoff, setSettingCutoff] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    const cohortId = searchParams.get('cohort_id') || ''
    setCohortFilter(cohortId)
  }, [searchParams])

  useEffect(() => {
    fetchCohorts()
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [cohortFilter, applicantTypeFilter, statusFilter, reviewStatusFilter, enrollmentStatusFilter, mentorFilter])

  const studentApps = useMemo(() => applications.filter((a) => a.applicant_type === 'student'), [applications])
  const mentorOptions = useMemo(() => {
    if (mentors.length > 0) return mentors
    const seen = new Map<number, MentorAssignment>()
    studentApps.forEach((a) => {
      const id = (a as Application).reviewer_mentor_id
      if (id != null && !seen.has(id)) {
        const name = (a as Application).reviewer_mentor_name || `Mentor ${id}`
        seen.set(id, { id: String(id), mentor: id, mentor_name: name } as MentorAssignment)
      }
    })
    return Array.from(seen.values())
  }, [mentors, studentApps])

  useEffect(() => {
    if (cohortFilter) fetchMentors(cohortFilter)
    else setMentors([])
  }, [cohortFilter])
  const kpis = useMemo(() => ({
    total: studentApps.length,
    pending: studentApps.filter((a) => (a as Application).review_status === 'pending' || !(a as Application).review_status).length,
    reviewed: studentApps.filter((a) => (a as Application).review_status === 'reviewed').length,
    passed: studentApps.filter((a) => (a as Application).review_status === 'passed').length,
    failed: studentApps.filter((a) => (a as Application).review_status === 'failed').length,
    eligible: studentApps.filter((a) => (a as Application).enrollment_status === 'eligible').length,
  }), [studentApps])
  const unassignedStudentApps = useMemo(() => studentApps.filter((a) => !(a as any).reviewer_mentor_id), [studentApps])
  const selectedIds = useMemo(() => {
    if (selectedAnchorIdx == null || !selectCount) return []
    const n = Math.max(1, parseInt(selectCount, 10) || 1)
    const start = Math.min(selectedAnchorIdx, studentApps.length - 1)
    const end = Math.min(start + n, studentApps.length)
    return studentApps.slice(start, end).map((a) => a.id)
  }, [selectedAnchorIdx, selectCount, studentApps])

  const fetchMentors = async (cohortId: string) => {
    try {
      const list = await programsClient.getCohortMentors(cohortId)
      setMentors(Array.isArray(list) ? list : [])
    } catch {
      setMentors([])
    }
  }

  const fetchCohorts = async () => {
    try {
      const res = await apiGateway.get<{ data?: Cohort[]; results?: Cohort[] }>('/cohorts/')
      const data = res as any
      const list = data?.data ?? data?.results ?? data ?? []
      setCohorts(Array.isArray(list) ? list : [])
    } catch {
      setCohorts([])
    }
  }

  const fetchApplications = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const params: Record<string, string> = {}
      if (cohortFilter) params.cohort_id = cohortFilter
      if (applicantTypeFilter) params.applicant_type = applicantTypeFilter
      if (statusFilter) params.status = statusFilter
      if (reviewStatusFilter) params.review_status = reviewStatusFilter
      if (enrollmentStatusFilter) params.enrollment_status = enrollmentStatusFilter
      if (mentorFilter) params.reviewer_mentor_id = mentorFilter
      const res = await apiGateway.get<{ applications: Application[] }>(
        '/director/public-applications/',
        { params }
      )
      const data = res as any
      setApplications(data?.applications ?? [])
    } catch (err: unknown) {
      setApplications([])
      const status = (err as { status?: number })?.status
      const msg = (err as { message?: string })?.message
      if (status === 403) {
        setFetchError('You do not have permission to view applications. Directors and admins only.')
      } else if (status === 404) {
        setFetchError('Applications endpoint not found. Please ensure the backend is up to date.')
      } else {
        setFetchError(msg ? `Failed to load: ${msg}` : 'Failed to load applications. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusVariant = (s: string) => {
    if (s === 'approved' || s === 'converted') return 'defender'
    if (s === 'rejected') return 'orange'
    return 'steel'
  }
  const getApplicationStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: 'Submitted',
      approved: 'Approved',
      rejected: 'Rejected',
      converted: 'Converted',
    }
    return map[s] || s
  }

  const handleOpenAssignModal = () => {
    const cohortId = cohortFilter || (selectedIds.length ? (applications.find((a) => a.id === selectedIds[0])?.cohort_id) : null)
    if (cohortId) fetchMentors(cohortId)
    setShowAssignModal(true)
  }

  const handleAssign = async (mentorId: number) => {
    setAssigning(true)
    try {
      await apiGateway.post('/director/public-applications/assign-to-mentor/', {
        application_ids: selectedIds,
        mentor_id: mentorId,
      })
      setSelectedAnchorIdx(null)
      setSelectCount('')
      setShowAssignModal(false)
      fetchApplications()
    } catch (err: unknown) {
      console.error(err)
      alert((err as { message?: string })?.message || 'Failed to assign')
    } finally {
      setAssigning(false)
    }
  }

  const cohortName = cohortFilter ? (cohorts.find((c) => c.id === cohortFilter)?.name || 'cohort') : (applications[0]?.cohort_name || 'cohort')

  const eligibleToEnroll = useMemo(
    () => studentApps.filter((a) => (a as Application).enrollment_status === 'eligible'),
    [studentApps]
  )

  const handleSetCutoff = async (phase: 'review' | 'interview') => {
    const cohortId = cohortFilter || applications[0]?.cohort_id
    if (!cohortId) return
    const val = parseFloat(cutoffGrade)
    if (isNaN(val) || val < 0 || val > 100) {
      alert('Grade must be 0-100')
      return
    }
    setSettingCutoff(true)
    try {
      const endpoint = phase === 'review' ? '/director/public-applications/set-review-cutoff/' : '/director/public-applications/set-interview-cutoff/'
      await apiGateway.post(endpoint, { cohort_id: cohortId, cutoff_grade: val })
      setShowCutoffModal(null)
      setCutoffGrade('')
      fetchApplications()
    } catch (err: unknown) {
      alert((err as { message?: string })?.message || 'Failed')
    } finally {
      setSettingCutoff(false)
    }
  }

  const handleEnroll = async () => {
    const ids = eligibleToEnroll.map((a) => a.id)
    if (!ids.length) return
    setEnrolling(true)
    try {
      await apiGateway.post('/director/public-applications/enroll/', { application_ids: ids })
      setShowEnrollModal(false)
      fetchApplications()
    } catch (err: unknown) {
      alert((err as { message?: string })?.message || 'Failed to enroll')
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <RouteGuard requiredRoles={['program_director', 'admin']}>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Applications</h1>
            <p className="text-och-steel">
              Student and sponsor applications from the homepage. Filter by cohort, mentor, applicant type, or status.
            </p>
          </div>

          {/* KPI Cards */}
          {!loading && studentApps.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <Card className="p-4 border-och-steel/20">
                <p className="text-xs text-och-steel mb-1">Total applications</p>
                <p className="text-2xl font-bold text-white">{kpis.total}</p>
              </Card>
              <Card className="p-4 border-och-steel/20">
                <p className="text-xs text-och-steel mb-1">Awaiting mentor review</p>
                <p className="text-sm text-och-steel/80 mb-0.5">Not yet graded</p>
                <p className="text-2xl font-bold text-och-orange">{kpis.pending}</p>
              </Card>
              <Card className="p-4 border-och-steel/20">
                <p className="text-xs text-och-steel mb-1">Mentor graded</p>
                <p className="text-sm text-och-steel/80 mb-0.5">Awaiting your review cutoff</p>
                <p className="text-2xl font-bold text-och-steel">{kpis.reviewed}</p>
              </Card>
              <Card className="p-4 border-och-steel/20">
                <p className="text-xs text-och-steel mb-1">Passed application review</p>
                <p className="text-sm text-och-steel/80 mb-0.5">Above cutoff, in or after interview</p>
                <p className="text-2xl font-bold text-och-defender">{kpis.passed}</p>
              </Card>
              <Card className="p-4 border-och-steel/20">
                <p className="text-xs text-och-steel mb-1">Failed application review</p>
                <p className="text-sm text-och-steel/80 mb-0.5">Below review cutoff</p>
                <p className="text-2xl font-bold text-och-orange">{kpis.failed}</p>
              </Card>
              <Card className="p-4 border-och-steel/20">
                <p className="text-xs text-och-steel mb-1">Ready to enroll</p>
                <p className="text-sm text-och-steel/80 mb-0.5">Passed interview, above cutoff</p>
                <p className="text-2xl font-bold text-och-mint">{kpis.eligible}</p>
              </Card>
            </div>
          )}

          {/* Cutoff & Enroll Actions - always visible when applications exist */}
          {!loading && studentApps.length > 0 && (
            <Card className="mb-6 border-och-mint/30 bg-och-midnight/50 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-och-steel text-sm font-medium">
                  Set cohort grade cutoffs {cohortFilter ? `(${cohortName})` : '— select cohort in filters first'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => { setShowCutoffModal('review'); setCutoffGrade('') }}
                  disabled={!cohortFilter}
                >
                  <Award className="w-3.5 h-3.5" /> Set review cutoff
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => { setShowCutoffModal('interview'); setCutoffGrade('') }}
                  disabled={!cohortFilter}
                >
                  <Award className="w-3.5 h-3.5" /> Set interview cutoff
                </Button>
                <Button
                  variant="defender"
                  size="sm"
                  className="gap-1"
                  disabled={eligibleToEnroll.length === 0}
                  onClick={() => setShowEnrollModal(true)}
                >
                  <UserCheck className="w-3.5 h-3.5" /> Enroll ({eligibleToEnroll.length} eligible)
                </Button>
              </div>
            </Card>
          )}

          {/* Filters */}
          <Card className="mb-6 border-och-steel/20">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-och-steel" />
                <span className="text-sm font-medium text-white">Filters</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
                  <label className="block text-xs text-och-steel mb-1">Type</label>
                  <select
                    value={applicantTypeFilter}
                    onChange={(e) => setApplicantTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm"
                  >
                    <option value="">All (Students & Sponsors)</option>
                    <option value="student">Students</option>
                    <option value="sponsor">Sponsors</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-och-steel mb-1">Application status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm"
                  >
                    <option value="">All</option>
                    <option value="pending">Submitted (pending)</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="converted">Converted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-och-steel mb-1">Review status</label>
                  <select
                    value={reviewStatusFilter}
                    onChange={(e) => setReviewStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm"
                  >
                    <option value="">All</option>
                    <option value="pending">Awaiting mentor review</option>
                    <option value="reviewed">Mentor graded, awaiting cutoff</option>
                    <option value="passed">Passed application review</option>
                    <option value="failed">Failed application review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-och-steel mb-1">Enrollment</label>
                  <select
                    value={enrollmentStatusFilter}
                    onChange={(e) => setEnrollmentStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm"
                  >
                    <option value="">All</option>
                    <option value="eligible">Ready to enroll</option>
                    <option value="enrolled">Enrolled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-och-steel mb-1">Mentor</label>
                  <select
                    value={mentorFilter}
                    onChange={(e) => setMentorFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm"
                  >
                    <option value="">All mentors</option>
                    {mentorOptions.map((m) => {
                      const mentorId = typeof m.mentor === 'object' ? (m.mentor as any)?.id : m.mentor
                      const name = m.mentor_name || m.mentor_email || String(mentorId)
                      return <option key={m.id} value={mentorId}>{name}</option>
                    })}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCohortFilter('')
                      setApplicantTypeFilter('')
                      setStatusFilter('')
                      setReviewStatusFilter('')
                      setEnrollmentStatusFilter('')
                      setMentorFilter('')
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card className="border-och-steel/20 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-och-defender mx-auto mb-4" />
                <p className="text-och-steel">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center">
                {fetchError ? (
                  <p className="text-och-orange mb-2">{fetchError}</p>
                ) : (
                  <p className="text-och-steel">No applications found. Applications appear here when students or sponsors apply from the homepage.</p>
                )}
                <Link href="/" className="text-och-mint hover:underline mt-2 inline-block">View homepage</Link>
              </div>
            ) : (
              <>
              {studentApps.length > 0 && (
                <div className="p-4 border-b border-och-steel/20 bg-och-midnight/30 flex flex-wrap items-center gap-4">
                  <span className="text-och-steel text-sm">Bulk assign students to mentor:</span>
                  <input
                    type="number"
                    min={1}
                    placeholder="Count"
                    value={selectCount}
                    onChange={(e) => setSelectCount(e.target.value)}
                    className="w-20 px-2 py-1.5 bg-och-midnight border border-och-steel/30 rounded text-white text-sm"
                  />
                  <span className="text-och-steel text-xs">
                    {selectedAnchorIdx != null
                      ? `Select from row ${selectedAnchorIdx + 1}: ${selectedIds.length} selected`
                      : 'Click a student row to anchor selection'}
                  </span>
                  <Button
                    variant="defender"
                    size="sm"
                    className="gap-1"
                    disabled={selectedIds.length === 0}
                    onClick={handleOpenAssignModal}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Assign {selectedIds.length > 0 ? selectedIds.length : ''} to mentor
                  </Button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-och-steel/20">
                      <th className="text-left py-3 px-4 text-xs font-medium text-och-steel w-12">#</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-och-steel">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-och-steel">Cohort</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-och-steel">Type</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-och-steel">Name</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-och-steel">Email</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-och-steel">Review by</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-och-steel">Status</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-och-steel">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app, idx) => {
                      const isStudent = app.applicant_type === 'student'
                      const studentIdx = isStudent ? studentApps.findIndex((s) => s.id === app.id) : -1
                      const isSelected = isStudent && selectedIds.includes(app.id)
                      const isAnchor = isStudent && studentIdx === selectedAnchorIdx
                      return (
                      <tr
                        key={app.id}
                        className={`border-b border-och-steel/10 hover:bg-och-midnight/30 ${isSelected ? 'bg-och-defender/20' : ''} ${isAnchor ? 'ring-1 ring-och-mint' : ''}`}
                        onClick={() => isStudent && setSelectedAnchorIdx(studentIdx >= 0 ? studentIdx : null)}
                      >
                        <td className="py-3 px-4 text-sm text-och-steel font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 text-sm text-och-steel">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-white max-w-[180px] truncate">
                          {app.cohort_name}
                        </td>
                        <td className="py-3 px-4">
                          {app.applicant_type === 'student' ? (
                            <Badge variant="defender" className="gap-1">
                              <GraduationCap className="w-3 h-3" /> Student
                            </Badge>
                          ) : (
                            <Badge variant="gold" className="gap-1">
                              <Users className="w-3 h-3" /> Sponsor
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-white">{app.name || '-'}</td>
                        <td className="py-3 px-4 text-sm text-och-steel">{app.email || '-'}</td>
                        <td className="py-3 px-4 text-sm text-och-steel">
                          {(app as Application).reviewer_mentor_name || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusVariant(app.status)} title={app.status}>
                            {getApplicationStatusLabel(app.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-och-mint hover:text-och-mint/80 gap-1"
                              onClick={() => setSelectedApp(app)}
                            >
                              <Eye className="w-3.5 h-3.5" /> View details
                            </Button>
                            <Link
                              href={`/dashboard/director/cohorts/${app.cohort_id}`}
                              className="text-och-steel hover:text-och-mint text-sm inline-flex items-center gap-1"
                            >
                              Cohort <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              <ApplicationDetailsModal
                application={selectedApp}
                open={!!selectedApp}
                onOpenChange={(open) => !open && setSelectedApp(null)}
                getStatusVariant={getStatusVariant}
                getApplicationStatusLabel={getApplicationStatusLabel}
              />
              <AssignToMentorModal
                open={showAssignModal}
                onOpenChange={setShowAssignModal}
                mentors={mentors}
                selectedCount={selectedIds.length}
                cohortName={cohortName}
                onAssign={handleAssign}
                assigning={assigning}
              />
              {showCutoffModal && (
                <Dialog open={!!showCutoffModal} onOpenChange={(o) => !o && setShowCutoffModal(null)}>
                  <DialogContent className="max-w-sm border-och-steel/20 bg-och-midnight">
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        Set {showCutoffModal} cutoff grade
                      </DialogTitle>
                    </DialogHeader>
                    <p className="text-och-steel text-sm mb-2">Applications with score ≥ cutoff pass.</p>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="0-100"
                      value={cutoffGrade}
                      onChange={(e) => setCutoffGrade(e.target.value)}
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded text-white"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setShowCutoffModal(null)}>Cancel</Button>
                      <Button variant="defender" disabled={settingCutoff} onClick={() => handleSetCutoff(showCutoffModal)}>
                        {settingCutoff ? 'Setting...' : 'Set cutoff'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {showEnrollModal && (
                <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
                  <DialogContent className="max-w-sm border-och-steel/20 bg-och-midnight">
                    <DialogHeader>
                      <DialogTitle className="text-white">Enroll eligible applicants</DialogTitle>
                    </DialogHeader>
                    <p className="text-och-steel text-sm">
                      Enroll {eligibleToEnroll.length} applicant(s) who passed the interview? User accounts will be created if needed.
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setShowEnrollModal(false)}>Cancel</Button>
                      <Button variant="defender" disabled={enrolling} onClick={handleEnroll}>
                        {enrolling ? 'Enrolling...' : 'Enroll'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              </>
            )}
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
