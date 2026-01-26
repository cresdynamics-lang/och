'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { missionsClient, type MissionTemplate } from '@/services/missionsClient'
import { programsClient, type Program, type Track, type Cohort } from '@/services/programsClient'
import { djangoClient } from '@/services/djangoClient'
import { useProgram, usePrograms, useTracks, useCohorts } from '@/hooks/usePrograms'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import Link from 'next/link'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { apiGateway } from '@/services/apiGateway'

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

interface MissionAnalytics {
  mission: MissionTemplate
  total_submissions: number
  submissions_by_status: Record<string, number>
  average_ai_score: number
  average_mentor_score: number
  approval_rate: number
  submissions: Array<{
    id: string
    user_id: number
    user_email: string
    user_name: string
    status: string
    ai_score?: number
    mentor_score?: number
    mentor_feedback?: string
    submitted_at?: string
    mentor_reviewed_at?: string
    cohort_id?: string
    cohort_name?: string
    mentor_id?: string
    mentor_name?: string
  }>
  cohorts: Array<{
    id: string
    name: string
    submissions_count: number
    average_score: number
  }>
  mentors: Array<{
    id: string
    name: string
    email: string
    reviews_count: number
    average_score: number
  }>
  performance_over_time: Array<{
    date: string
    submissions: number
    approvals: number
    average_score: number
  }>
}

const COLORS = ['#33FFC1', '#FFB020', '#FF6B35', '#00D4FF', '#8B5CF6']

export default function MissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const missionId = params.id as string

  const [analytics, setAnalytics] = useState<MissionAnalytics | null>(null)
  const [mission, setMission] = useState<MissionTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkedTrack, setLinkedTrack] = useState<Track | null>(null)
  const [linkedProgram, setLinkedProgram] = useState<Program | null>(null)
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [missionForm, setMissionForm] = useState<Partial<MissionTemplate>>({})
  
  // Publish dialog state
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const { cohorts, isLoading: cohortsLoading } = useCohorts({ pageSize: 1000 })

  // Track linking (Programs → Tracks)
  const { programs } = usePrograms()
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const { program: selectedProgramDetail, isLoading: programDetailLoading } = useProgram(
    selectedProgramId ? selectedProgramId : ''
  )
  const { tracks: programTracks, isLoading: tracksLoading } = useTracks(
    selectedProgramId ? selectedProgramId : undefined
  )

  const availableTracks = (selectedProgramDetail?.tracks && Array.isArray(selectedProgramDetail.tracks) && selectedProgramDetail.tracks.length > 0)
    ? selectedProgramDetail.tracks
    : programTracks
  
  // Keep program selector in sync with current track_id when possible (best-effort)
  useEffect(() => {
    if (!isEditing) return
    if (!missionForm.track_id) return
    const match = programTracks.find((t: any) => String(t.id) === String(missionForm.track_id))
    if (match?.program) {
      setSelectedProgramId(String(match.program))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  useEffect(() => {
    loadMissionData()
  }, [missionId])

  const loadMissionData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Load mission details first
      const missionData = await missionsClient.getMission(missionId)
      setMission(missionData)

      // Resolve linked track/program for display (best-effort)
      setLinkedTrack(null)
      setLinkedProgram(null)
      if (missionData.track_id) {
        try {
          const t = await programsClient.getTrack(String(missionData.track_id))
          setLinkedTrack(t)
          if (t?.program) {
            const p = await programsClient.getProgram(String(t.program))
            setLinkedProgram(p)
          }
        } catch {
          // ignore; show fallback labels
        }
      }
      
      // Extract OCH Admin fields from requirements
      const reqs = missionData.requirements || {}
      setMissionForm({
        code: missionData.code,
        title: missionData.title,
        description: missionData.description,
        difficulty: missionData.difficulty,
        type: missionData.type,
        track_id: missionData.track_id,
        track_key: missionData.track_key,
        est_hours: missionData.est_hours,
        estimated_time_minutes: missionData.estimated_time_minutes,
        competencies: missionData.competencies || [],
        requirements: reqs,
        // OCH Admin fields
        status: missionData.status || reqs.status || 'draft',
        assessment_mode: missionData.assessment_mode || reqs.assessment_mode || 'hybrid',
        requires_mentor_review: missionData.requires_mentor_review ?? reqs.requires_mentor_review ?? false,
        story_narrative: missionData.story_narrative || reqs.story_narrative || '',
        subtasks: missionData.subtasks || reqs.subtasks || [],
        evidence_upload_schema: missionData.evidence_upload_schema || reqs.evidence_upload_schema || {
          file_types: [],
          max_file_size_mb: 10,
          required_artifacts: [],
        },
        time_constraint_hours: missionData.time_constraint_hours || reqs.time_constraint_hours,
        competency_coverage: missionData.competency_coverage || reqs.competency_coverage || [],
        rubric_id: missionData.rubric_id || reqs.rubric_id,
        module_id: missionData.module_id || reqs.module_id,
      })
      
      // Then load analytics
      await loadMissionAnalytics(missionData)
    } catch (err: any) {
      console.error('Failed to load mission:', err)
      setError(err?.response?.data?.detail || err?.message || 'Failed to load mission')
    } finally {
      setIsLoading(false)
    }
  }, [missionId])

  const handleCancelEdit = () => {
    if (!mission) {
      setIsEditing(false)
      return
    }
    const reqs = mission.requirements || {}
    setMissionForm({
      code: mission.code,
      title: mission.title,
      description: mission.description,
      difficulty: mission.difficulty,
      type: mission.type,
      track_id: mission.track_id,
      track_key: mission.track_key,
      est_hours: mission.est_hours,
      estimated_time_minutes: mission.estimated_time_minutes,
      competencies: mission.competencies || [],
      requirements: reqs,
      status: mission.status || reqs.status || 'draft',
      assessment_mode: mission.assessment_mode || reqs.assessment_mode || 'hybrid',
      requires_mentor_review: mission.requires_mentor_review ?? reqs.requires_mentor_review ?? false,
      story_narrative: mission.story_narrative || reqs.story_narrative || '',
      subtasks: mission.subtasks || reqs.subtasks || [],
      evidence_upload_schema: mission.evidence_upload_schema || reqs.evidence_upload_schema || {
        file_types: [],
        max_file_size_mb: 10,
        required_artifacts: [],
      },
      time_constraint_hours: mission.time_constraint_hours || reqs.time_constraint_hours,
      competency_coverage: mission.competency_coverage || reqs.competency_coverage || [],
      rubric_id: mission.rubric_id || reqs.rubric_id,
      module_id: mission.module_id || reqs.module_id,
    })
    setIsEditing(false)
  }

  const loadMissionAnalytics = async (missionData?: MissionTemplate) => {
    const missionToUse = missionData || mission
    if (!missionToUse) return
    try {
      // Fetch submissions
      const submissionsResponse = (await missionsClient.getMissionSubmissions?.(missionId)) ||
        (await fetch(`/api/v1/missions/${missionId}/submissions/`)
          .then((r) => r.json())
          .catch(() => ({ submissions: [] })))
      
      const submissions = submissionsResponse.submissions || []

      // Enrich submissions with user data
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (sub: any) => {
          try {
            // Get user details
            const user = await djangoClient.users.getUser(sub.user_id).catch(() => null)
            
            return {
              ...sub,
              user_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : sub.user_email,
              cohort_id: sub.cohort_id || null,
              cohort_name: sub.cohort_name || null,
              mentor_id: sub.mentor_id || null,
              mentor_name: sub.mentor_name || null,
            }
          } catch (err) {
            return {
              ...sub,
              user_name: sub.user_email,
            }
          }
        })
      )

      // Calculate statistics
      const totalSubmissions = enrichedSubmissions.length
      const submissionsByStatus: Record<string, number> = {}
      let totalAiScore = 0
      let aiScoreCount = 0
      let totalMentorScore = 0
      let mentorScoreCount = 0
      let approvedCount = 0

      enrichedSubmissions.forEach((sub: any) => {
        submissionsByStatus[sub.status] = (submissionsByStatus[sub.status] || 0) + 1
        if (sub.ai_score !== null && sub.ai_score !== undefined) {
          totalAiScore += sub.ai_score
          aiScoreCount++
        }
        if (sub.mentor_score !== null && sub.mentor_score !== undefined) {
          totalMentorScore += sub.mentor_score
          mentorScoreCount++
        }
        if (sub.status === 'approved') {
          approvedCount++
        }
      })

      const averageAiScore = aiScoreCount > 0 ? totalAiScore / aiScoreCount : 0
      const averageMentorScore = mentorScoreCount > 0 ? totalMentorScore / mentorScoreCount : 0
      const approvalRate = totalSubmissions > 0 ? (approvedCount / totalSubmissions) * 100 : 0

      // Group by cohorts
      const cohortMap = new Map<string, { id: string; name: string; submissions: any[] }>()
      enrichedSubmissions.forEach((sub: any) => {
        if (sub.cohort_id) {
          if (!cohortMap.has(sub.cohort_id)) {
            cohortMap.set(sub.cohort_id, {
              id: sub.cohort_id,
              name: sub.cohort_name || 'Unknown Cohort',
              submissions: [],
            })
          }
          cohortMap.get(sub.cohort_id)!.submissions.push(sub)
        }
      })

      const cohorts = Array.from(cohortMap.values()).map(cohort => {
        const scores = cohort.submissions
          .filter(s => s.ai_score !== null && s.ai_score !== undefined)
          .map(s => s.ai_score)
        const averageScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0
        return {
          id: cohort.id,
          name: cohort.name,
          submissions_count: cohort.submissions.length,
          average_score: averageScore,
        }
      })

      // Group by mentors
      const mentorMap = new Map<string, { id: string; name: string; email: string; reviews: any[] }>()
      enrichedSubmissions
        .filter(sub => sub.mentor_id && sub.mentor_score !== null && sub.mentor_score !== undefined)
        .forEach((sub: any) => {
          if (!mentorMap.has(sub.mentor_id)) {
            mentorMap.set(sub.mentor_id, {
              id: sub.mentor_id,
              name: sub.mentor_name || 'Unknown Mentor',
              email: '',
              reviews: [],
            })
          }
          mentorMap.get(sub.mentor_id)!.reviews.push(sub)
        })

      const mentors = Array.from(mentorMap.values()).map(mentor => {
        const scores = mentor.reviews.map(r => r.mentor_score)
        const averageScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0
        return {
          id: mentor.id,
          name: mentor.name,
          email: mentor.email,
          reviews_count: mentor.reviews.length,
          average_score: averageScore,
        }
      })

      // Performance over time (group by date)
      const dateMap = new Map<string, { submissions: number; approvals: number; scores: number[] }>()
      enrichedSubmissions.forEach((sub: any) => {
        if (sub.submitted_at) {
          const date = new Date(sub.submitted_at).toISOString().split('T')[0]
          if (!dateMap.has(date)) {
            dateMap.set(date, { submissions: 0, approvals: 0, scores: [] })
          }
          const dayData = dateMap.get(date)!
          dayData.submissions++
          if (sub.status === 'approved') {
            dayData.approvals++
          }
          if (sub.ai_score !== null && sub.ai_score !== undefined) {
            dayData.scores.push(sub.ai_score)
          }
        }
      })

      const performanceOverTime = Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          submissions: data.submissions,
          approvals: data.approvals,
          average_score: data.scores.length > 0
            ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
            : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setAnalytics({
        mission: missionToUse,
        total_submissions: totalSubmissions,
        submissions_by_status: submissionsByStatus,
        average_ai_score: averageAiScore,
        average_mentor_score: averageMentorScore,
        approval_rate: approvalRate,
        submissions: enrichedSubmissions || [],
        cohorts: cohorts || [],
        mentors: mentors || [],
        performance_over_time: performanceOverTime || [],
      })
    } catch (err: any) {
      console.error('Failed to load mission analytics:', err)
      // Don't set error here, just log it - analytics failure shouldn't block the page
    }
  }

  const handleSaveMission = async () => {
    if (!missionForm.code || !missionForm.title) {
      alert('Mission code and title are required')
      return
    }

    // Validate competency coverage weights sum to 100
    if (missionForm.competency_coverage && missionForm.competency_coverage.length > 0) {
      const totalWeight = missionForm.competency_coverage.reduce((sum, cov) => sum + (cov.weight_percentage || 0), 0)
      if (Math.abs(totalWeight - 100) > 0.01) {
        alert(`Competency coverage weights must sum to 100%. Current total: ${totalWeight.toFixed(2)}%`)
        return
      }
    }

    setIsSaving(true)
    try {
      // Prepare mission data - store OCH Admin fields in requirements JSON
      const missionData: any = {
        code: missionForm.code.trim(),
        title: missionForm.title.trim(),
        description: missionForm.description || '',
        difficulty: missionForm.difficulty,
        type: missionForm.type,
        track_id: missionForm.track_id || null,
        track_key: missionForm.track_key || '',
        est_hours: missionForm.est_hours,
        estimated_time_minutes: missionForm.estimated_time_minutes,
        competencies: missionForm.competencies || [],
        // Store OCH Admin fields in requirements JSON
        requirements: {
          ...(missionForm.requirements || {}),
          status: missionForm.status || 'draft',
          assessment_mode: missionForm.assessment_mode || 'hybrid',
          requires_mentor_review: missionForm.requires_mentor_review ?? false,
          story_narrative: missionForm.story_narrative || '',
          subtasks: missionForm.subtasks || [],
          evidence_upload_schema: missionForm.evidence_upload_schema || {
            file_types: [],
            max_file_size_mb: 10,
            required_artifacts: [],
          },
          time_constraint_hours: missionForm.time_constraint_hours,
          competency_coverage: missionForm.competency_coverage || [],
          rubric_id: missionForm.rubric_id,
          module_id: missionForm.module_id,
        },
      }

      await missionsClient.updateMission(missionId, missionData)
      setIsEditing(false)
      await loadMissionData()
    } catch (error: any) {
      console.error('Failed to save mission:', error)
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.error || error?.message || 'Failed to save mission'
      alert(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteMission = async () => {
    if (!confirm('Are you sure you want to delete this mission? This action cannot be undone and will affect all submissions.')) {
      return
    }

    try {
      await missionsClient.deleteMission(missionId)
      router.push('/dashboard/director/curriculum/missions')
    } catch (error: any) {
      console.error('Failed to delete mission:', error)
      alert(error?.response?.data?.detail || error?.message || 'Failed to delete mission')
    }
  }

  const handlePublishToCohorts = async () => {
    if (selectedCohorts.length === 0) {
      alert('Please select at least one cohort')
      return
    }

    setIsPublishing(true)
    try {
      // First, ensure mission status is published
      const updatedMission = await missionsClient.updateMission(missionId, {
        ...missionForm,
        status: 'published',
      })

      // Then publish to selected cohorts
      // Note: This assumes a backend endpoint exists. If not, we'll need to create it.
      // For now, we'll make a POST request to publish the mission to cohorts
      await apiGateway.post(`/missions/${missionId}/publish-to-cohorts/`, {
        cohort_ids: selectedCohorts,
      })

      alert(`Mission published to ${selectedCohorts.length} cohort(s) successfully!`)
      setIsPublishDialogOpen(false)
      setSelectedCohorts([])
      await loadMissionData() // Reload to reflect status change
    } catch (error: any) {
      console.error('Failed to publish mission:', error)
      alert(error?.response?.data?.detail || error?.message || 'Failed to publish mission to cohorts')
    } finally {
      setIsPublishing(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'mint'
      case 'intermediate': return 'gold'
      case 'advanced': return 'orange'
      case 'capstone': return 'defender'
      default: return 'steel'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lab': return 'mint'
      case 'scenario': return 'defender'
      case 'project': return 'gold'
      case 'capstone': return 'orange'
      default: return 'steel'
    }
  }

  const statusChartData = analytics
    ? Object.entries(analytics.submissions_by_status).map(([name, value]) => ({ name, value }))
    : []

  const baseMission = mission || analytics?.mission || null

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                <p className="text-och-steel">Loading mission analytics...</p>
              </div>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  // If mission fetch failed, show the error (analytics failure should not block the page)
  if (error && !baseMission) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <Link href="/dashboard/director/curriculum/missions">
                <Button variant="outline">Back to Missions</Button>
              </Link>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (!baseMission) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">Mission not found</p>
              <Link href="/dashboard/director/curriculum/missions">
                <Button variant="outline">Back to Missions</Button>
              </Link>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard/director/curriculum/missions">
              <Button variant="outline" className="mb-4">
                <ArrowLeftIcon />
                <span className="ml-2">Back to Missions</span>
              </Button>
            </Link>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-4xl font-bold text-och-gold">{baseMission.code}</h1>
                  <Badge variant={getDifficultyColor(baseMission.difficulty)}>
                    {baseMission.difficulty}
                  </Badge>
                  <Badge variant={getTypeColor(baseMission.type)}>
                    {baseMission.type}
                  </Badge>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">{baseMission.title}</h2>
                {baseMission.description && (
                  <p className="text-och-steel">{baseMission.description}</p>
                )}

                {/* Linked Program / Track */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-och-steel">Linked:</span>
                  {linkedProgram ? (
                    <button
                      onClick={() => router.push(`/dashboard/director/programs/${linkedProgram.id}`)}
                      className="text-och-defender hover:underline"
                      title="View program"
                    >
                      {linkedProgram.name}
                    </button>
                  ) : (
                    <span className="text-och-steel">No program</span>
                  )}
                  <span className="text-och-steel">/</span>
                  {linkedTrack ? (
                    <button
                      onClick={() => router.push(`/dashboard/director/tracks/${linkedTrack.id}`)}
                      className="text-och-defender hover:underline"
                      title="View track"
                    >
                      {linkedTrack.name}
                    </button>
                  ) : baseMission.track_id || baseMission.track_key ? (
                    <span className="text-och-steel">
                      {baseMission.track_key || String(baseMission.track_id)}
                    </span>
                  ) : (
                    <span className="text-och-steel">Unassigned</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button variant="defender" onClick={handleSaveMission} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="defender" onClick={() => setIsEditing(true)}>
                      <EditIcon />
                      <span className="ml-2">Edit</span>
                    </Button>
                    <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="gold" className="bg-och-gold/20 hover:bg-och-gold/30 text-och-gold border border-och-gold/40">
                          <UsersIcon />
                          <span className="ml-2">Publish to Cohorts</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-och-midnight border-och-steel/20 max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-white">Publish Mission to Cohorts</DialogTitle>
                          <DialogDescription className="text-och-steel">
                            Select one or more cohorts to publish this mission to. The mission will be available to all students in the selected cohorts.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 max-h-96 overflow-y-auto">
                          {cohortsLoading ? (
                            <div className="text-center py-8 text-och-steel">Loading cohorts...</div>
                          ) : cohorts.length === 0 ? (
                            <div className="text-center py-8 text-och-steel">No cohorts available</div>
                          ) : (
                            <div className="space-y-2">
                              {cohorts.map((cohort) => (
                                <label
                                  key={cohort.id}
                                  className="flex items-center gap-3 p-3 rounded-lg border border-och-steel/20 hover:bg-och-midnight/50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedCohorts.includes(cohort.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedCohorts([...selectedCohorts, cohort.id])
                                      } else {
                                        setSelectedCohorts(selectedCohorts.filter(id => id !== cohort.id))
                                      }
                                    }}
                                    className="w-4 h-4 text-och-gold bg-och-midnight border-och-steel/40 rounded focus:ring-och-gold"
                                  />
                                  <div className="flex-1">
                                    <div className="text-white font-medium">{cohort.name}</div>
                                    {cohort.track_name && (
                                      <div className="text-xs text-och-steel">Track: {cohort.track_name}</div>
                                    )}
                                    {cohort.status && (
                                      <Badge variant="steel" className="text-xs mt-1">
                                        {cohort.status}
                                      </Badge>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                        <DialogFooter className="mt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsPublishDialogOpen(false)
                              setSelectedCohorts([])
                            }}
                            disabled={isPublishing}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="gold"
                            onClick={handlePublishToCohorts}
                            disabled={isPublishing || selectedCohorts.length === 0}
                          >
                            {isPublishing ? 'Publishing...' : `Publish to ${selectedCohorts.length} Cohort(s)`}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      onClick={handleDeleteMission}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon />
                      <span className="ml-2">Delete</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mission Management (Edit Form) */}
          {isEditing && (
            <Card className="mb-6 border-och-defender/30">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Mission Management</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Mission Code</label>
                    <input
                      value={missionForm.code || ''}
                      onChange={(e) => setMissionForm({ ...missionForm, code: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Title</label>
                    <input
                      value={missionForm.title || ''}
                      onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-white mb-2">Description</label>
                  <textarea
                    value={missionForm.description || ''}
                    onChange={(e) => setMissionForm({ ...missionForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Difficulty</label>
                    <select
                      value={missionForm.difficulty || 'beginner'}
                      onChange={(e) => setMissionForm({ ...missionForm, difficulty: e.target.value as any })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="capstone">Capstone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Type</label>
                    <select
                      value={missionForm.type || 'lab'}
                      onChange={(e) => setMissionForm({ ...missionForm, type: e.target.value as any })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="lab">Lab</option>
                      <option value="scenario">Scenario</option>
                      <option value="project">Project</option>
                      <option value="capstone">Capstone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Est. Hours</label>
                    <input
                      type="number"
                      min="1"
                      value={missionForm.est_hours ?? ''}
                      onChange={(e) => setMissionForm({ ...missionForm, est_hours: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Est. Minutes</label>
                    <input
                      type="number"
                      min="1"
                      value={missionForm.estimated_time_minutes ?? ''}
                      onChange={(e) => setMissionForm({ ...missionForm, estimated_time_minutes: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                </div>

                {/* Program/Track assignment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-och-steel/20">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Program (filter tracks)</label>
                    <select
                      value={selectedProgramId}
                      onChange={(e) => setSelectedProgramId(e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="">All Programs</option>
                      {programs.map((p: any) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Attach to Track</label>
                    <select
                      value={missionForm.track_id ? String(missionForm.track_id) : ''}
                      onChange={(e) => {
                        const val = e.target.value
                        if (!val) {
                          setMissionForm({ ...missionForm, track_id: '', track_key: '' })
                          return
                        }
                        const t = availableTracks.find((x: any) => String(x.id) === String(val))
                        setMissionForm({
                          ...missionForm,
                          track_id: val,
                          track_key: t?.key || missionForm.track_key || '',
                        })
                      }}
                      disabled={tracksLoading || programDetailLoading}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender disabled:opacity-50"
                    >
                      <option value="">
                        {(tracksLoading || programDetailLoading) ? 'Loading tracks...' : 'Unassigned'}
                      </option>
                      {availableTracks.map((t: any) => (
                        <option key={t.id} value={String(t.id)}>
                          {t.name} ({t.key})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-och-steel mt-1">
                      This will set <span className="text-white">track_id</span> and <span className="text-white">track_key</span> and sync to backend.
                    </p>
                  </div>
                </div>

                {/* OCH Admin Fields */}
                <div className="mt-6 pt-6 border-t border-och-steel/20">
                  <h4 className="text-lg font-bold text-white mb-4">OCH Admin Configuration</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Status</label>
                      <select
                        value={missionForm.status || 'draft'}
                        onChange={(e) => setMissionForm({ ...missionForm, status: e.target.value as any })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="published">Published</option>
                        <option value="retired">Retired</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Assessment Mode</label>
                      <select
                        value={missionForm.assessment_mode || 'hybrid'}
                        onChange={(e) => setMissionForm({ ...missionForm, assessment_mode: e.target.value as any })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="auto">Auto (AI Only)</option>
                        <option value="manual">Manual (Mentor Only)</option>
                        <option value="hybrid">Hybrid (AI + Mentor)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Time Constraint (Hours)</label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={missionForm.time_constraint_hours ?? ''}
                        onChange={(e) => setMissionForm({ ...missionForm, time_constraint_hours: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="e.g., 24, 48, 72"
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                      <input
                        type="checkbox"
                        checked={missionForm.requires_mentor_review ?? false}
                        onChange={(e) => setMissionForm({ ...missionForm, requires_mentor_review: e.target.checked })}
                        className="w-4 h-4 text-och-gold bg-och-midnight border-och-steel/40 rounded focus:ring-och-gold"
                      />
                      Requires Mentor Review
                    </label>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-white mb-2">Story Narrative</label>
                    <textarea
                      value={missionForm.story_narrative || ''}
                      onChange={(e) => setMissionForm({ ...missionForm, story_narrative: e.target.value })}
                      rows={4}
                      placeholder="Enter the mission story/narrative context..."
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-white mb-2">Competencies</label>
                    <textarea
                      value={(missionForm.competencies || []).join(', ')}
                      onChange={(e) => {
                        const competencies = e.target.value.split(',').map(c => c.trim()).filter(c => c.length > 0)
                        setMissionForm({ ...missionForm, competencies })
                      }}
                      rows={2}
                      placeholder="Enter competencies separated by commas..."
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                    <p className="text-xs text-och-steel mt-1">
                      Separate multiple competencies with commas
                    </p>
                  </div>

                  {/* Subtasks Section */}
                  <div className="mt-6 pt-6 border-t border-och-steel/20">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-base font-bold text-white">Subtasks</h5>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSubtask = {
                            id: `subtask-${Date.now()}`,
                            title: '',
                            description: '',
                            order: (missionForm.subtasks || []).length + 1,
                            required: true,
                            dependencies: [],
                          }
                          setMissionForm({
                            ...missionForm,
                            subtasks: [...(missionForm.subtasks || []), newSubtask],
                          })
                        }}
                      >
                        <PlusIcon />
                        <span className="ml-2">Add Subtask</span>
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {(missionForm.subtasks || []).map((subtask, idx) => (
                        <div key={subtask.id || idx} className="p-4 bg-och-midnight/30 rounded-lg border border-och-steel/20">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-och-steel mb-1">Title</label>
                              <input
                                value={subtask.title || ''}
                                onChange={(e) => {
                                  const updated = [...(missionForm.subtasks || [])]
                                  updated[idx] = { ...subtask, title: e.target.value }
                                  setMissionForm({ ...missionForm, subtasks: updated })
                                }}
                                className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-och-steel mb-1">Order</label>
                              <input
                                type="number"
                                min="1"
                                value={subtask.order || idx + 1}
                                onChange={(e) => {
                                  const updated = [...(missionForm.subtasks || [])]
                                  updated[idx] = { ...subtask, order: parseInt(e.target.value) || idx + 1 }
                                  setMissionForm({ ...missionForm, subtasks: updated })
                                }}
                                className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-och-steel mb-1">Description</label>
                            <textarea
                              value={subtask.description || ''}
                              onChange={(e) => {
                                const updated = [...(missionForm.subtasks || [])]
                                updated[idx] = { ...subtask, description: e.target.value }
                                setMissionForm({ ...missionForm, subtasks: updated })
                              }}
                              rows={2}
                              className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs font-medium text-white">
                              <input
                                type="checkbox"
                                checked={subtask.required ?? true}
                                onChange={(e) => {
                                  const updated = [...(missionForm.subtasks || [])]
                                  updated[idx] = { ...subtask, required: e.target.checked }
                                  setMissionForm({ ...missionForm, subtasks: updated })
                                }}
                                className="w-3 h-3 text-och-gold bg-och-midnight border-och-steel/40 rounded focus:ring-och-gold"
                              />
                              Required
                            </label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updated = (missionForm.subtasks || []).filter((_, i) => i !== idx)
                                setMissionForm({ ...missionForm, subtasks: updated })
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              <TrashIcon />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {(!missionForm.subtasks || missionForm.subtasks.length === 0) && (
                        <p className="text-sm text-och-steel text-center py-4">No subtasks added yet</p>
                      )}
                    </div>
                  </div>

                  {/* Evidence Upload Schema */}
                  <div className="mt-6 pt-6 border-t border-och-steel/20">
                    <h5 className="text-base font-bold text-white mb-4">Evidence Upload Configuration</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Max File Size (MB)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={missionForm.evidence_upload_schema?.max_file_size_mb || 10}
                          onChange={(e) => setMissionForm({
                            ...missionForm,
                            evidence_upload_schema: {
                              ...(missionForm.evidence_upload_schema || {}),
                              max_file_size_mb: parseInt(e.target.value) || 10,
                            },
                          })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Allowed File Types</label>
                        <input
                          value={(missionForm.evidence_upload_schema?.file_types || []).join(', ')}
                          onChange={(e) => {
                            const fileTypes = e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0)
                            setMissionForm({
                              ...missionForm,
                              evidence_upload_schema: {
                                ...(missionForm.evidence_upload_schema || {}),
                                file_types: fileTypes,
                              },
                            })
                          }}
                          placeholder="e.g., pdf, zip, jpg, png"
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        />
                        <p className="text-xs text-och-steel mt-1">Separate file types with commas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Analytics unavailable warning */}
          {!analytics && (
            <Card className="mb-6 border-och-orange/50">
              <div className="p-4 text-och-orange">
                Analytics unavailable (submissions endpoint failed or no data). Mission details are still editable.
              </div>
            </Card>
          )}

          {/* Key Metrics */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <div className="p-6">
                  <p className="text-och-steel text-sm mb-1">Total Submissions</p>
                  <p className="text-3xl font-bold text-white">{analytics.total_submissions}</p>
                </div>
              </Card>
              <Card>
                <div className="p-6">
                  <p className="text-och-steel text-sm mb-1">Avg. AI Score</p>
                  <p className="text-3xl font-bold text-white">
                    {analytics.average_ai_score.toFixed(1)}%
                  </p>
                </div>
              </Card>
              <Card>
                <div className="p-6">
                  <p className="text-och-steel text-sm mb-1">Avg. Mentor Score</p>
                  <p className="text-3xl font-bold text-white">
                    {analytics.average_mentor_score.toFixed(1)}%
                  </p>
                </div>
              </Card>
              <Card>
                <div className="p-6">
                  <p className="text-och-steel text-sm mb-1">Approval Rate</p>
                  <p className="text-3xl font-bold text-white">
                    {analytics.approval_rate.toFixed(1)}%
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* Charts */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Status Distribution */}
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Submission Status</h3>
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-och-steel text-center py-12">No submission data available</p>
                )}
              </div>
            </Card>

            {/* Performance Over Time */}
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Performance Over Time</h3>
                {analytics.performance_over_time.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.performance_over_time}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis
                        dataKey="date"
                        stroke="#64748B"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155' }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Area
                        type="monotone"
                        dataKey="average_score"
                        stroke="#33FFC1"
                        fill="#33FFC1"
                        fillOpacity={0.3}
                        name="Avg Score"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-och-steel text-center py-12">No performance data available</p>
                )}
              </div>
            </Card>
          </div>
          )}

          {/* Cohorts and Mentors */}
          {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Cohorts */}
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <UsersIcon />
                  Cohorts ({analytics.cohorts?.length || 0})
                </h3>
                {analytics.cohorts && analytics.cohorts.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.cohorts.map((cohort) => (
                      <div
                        key={cohort.id}
                        className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">{cohort.name}</h4>
                          <Badge variant="mint">{cohort.submissions_count} submissions</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-och-steel">Avg Score:</span>
                          <span className="text-white font-medium">
                            {cohort.average_score.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-och-steel">No cohort data available</p>
                )}
              </div>
            </Card>

            {/* Mentors */}
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Mentor Reviews ({analytics.mentors?.length || 0})</h3>
                {analytics.mentors && analytics.mentors.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.mentors.map((mentor) => (
                      <div
                        key={mentor.id}
                        className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">{mentor.name}</h4>
                          <Badge variant="defender">{mentor.reviews_count} reviews</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-och-steel">Avg Score:</span>
                          <span className="text-white font-medium">
                            {mentor.average_score.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-och-steel">No mentor review data available</p>
                )}
              </div>
            </Card>
          </div>
          )}

          {/* Submissions List */}
          {analytics && (
          <Card>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Submissions ({analytics.submissions?.length || 0})
              </h3>
              {analytics.submissions && analytics.submissions.length > 0 ? (
                <div className="space-y-3">
                  {analytics.submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{submission.user_name}</h4>
                          <p className="text-sm text-och-steel">{submission.user_email}</p>
                          {submission.cohort_name && (
                            <p className="text-xs text-och-steel mt-1">Cohort: {submission.cohort_name}</p>
                          )}
                        </div>
                        <Badge
                          variant={
                            submission.status === 'approved' ? 'mint' :
                            submission.status === 'failed' ? 'orange' :
                            'steel'
                          }
                        >
                          {submission.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        {submission.ai_score !== null && submission.ai_score !== undefined && (
                          <div>
                            <span className="text-och-steel">AI Score:</span>
                            <span className="text-white font-medium ml-2">
                              {submission.ai_score.toFixed(1)}%
                            </span>
                          </div>
                        )}
                        {submission.mentor_score !== null && submission.mentor_score !== undefined && (
                          <div>
                            <span className="text-och-steel">Mentor Score:</span>
                            <span className="text-white font-medium ml-2">
                              {submission.mentor_score.toFixed(1)}%
                            </span>
                          </div>
                        )}
                        {submission.submitted_at && (
                          <div>
                            <span className="text-och-steel">Submitted:</span>
                            <span className="text-white font-medium ml-2">
                              {new Date(submission.submitted_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {submission.mentor_name && (
                          <div>
                            <span className="text-och-steel">Mentor:</span>
                            <span className="text-white font-medium ml-2">
                              {submission.mentor_name}
                            </span>
                          </div>
                        )}
                      </div>
                      {submission.mentor_feedback && (
                        <div className="mt-3 pt-3 border-t border-och-steel/20">
                          <p className="text-xs text-och-steel mb-1">Mentor Feedback:</p>
                          <p className="text-sm text-white">{submission.mentor_feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-och-steel">No submissions yet</p>
              )}
            </div>
          </Card>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
