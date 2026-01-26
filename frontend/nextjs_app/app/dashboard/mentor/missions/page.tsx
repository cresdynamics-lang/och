'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useCallback, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MissionsPending } from '@/components/mentor/MissionsPending'
import { MissionReviewForm } from '@/components/mentor/MissionReviewForm'
import { CapstoneScoringForm } from '@/components/mentor/CapstoneScoringForm'
import { mentorClient } from '@/services/mentorClient'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { MissionSubmission, CapstoneProject } from '@/services/types/mentor'

function MissionsPageInner() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedSubmission, setSelectedSubmission] = useState<MissionSubmission | null>(null)
  const [selectedCapstone, setSelectedCapstone] = useState<CapstoneProject | null>(null)
  const [capstones, setCapstones] = useState<CapstoneProject[]>([])
  const [loadingCapstones, setLoadingCapstones] = useState(false)
  const [loadingSubmission, setLoadingSubmission] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  
  // Cohort missions state
  const [cohortMissions, setCohortMissions] = useState<any[]>([])
  const [loadingMissions, setLoadingMissions] = useState(false)
  const [missionsError, setMissionsError] = useState<string | null>(null)
  const [missionsFilters, setMissionsFilters] = useState({
    difficulty: 'all',
    track: 'all',
    search: '',
  })
  const [missionsPagination, setMissionsPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0,
    has_next: false,
    has_previous: false,
  })

  const loadCapstones = useCallback(async () => {
    if (!mentorId) return
    setLoadingCapstones(true)
    try {
      const data = await mentorClient.getCapstoneProjects(mentorId, { status: 'pending_scoring' })
      setCapstones(data)
    } catch (err) {
      console.error('Failed to load capstones:', err)
    } finally {
      setLoadingCapstones(false)
    }
  }, [mentorId])

  useEffect(() => {
    loadCapstones()
  }, [loadCapstones])

  const loadCohortMissions = useCallback(async () => {
    if (!mentorId) return
    setLoadingMissions(true)
    setMissionsError(null)
    try {
      const params: any = {
        page: missionsPagination.page,
        page_size: missionsPagination.page_size,
      }
      if (missionsFilters.difficulty !== 'all') {
        params.difficulty = missionsFilters.difficulty
      }
      if (missionsFilters.track !== 'all') {
        params.track = missionsFilters.track
      }
      if (missionsFilters.search) {
        params.search = missionsFilters.search
      }
      
      const data = await mentorClient.getCohortMissions(mentorId, params)
      setCohortMissions(data.results || [])
      setMissionsPagination({
        page: data.page || 1,
        page_size: data.page_size || 20,
        total: data.total || data.count || 0,
        has_next: data.has_next || false,
        has_previous: data.has_previous || false,
      })
    } catch (err: any) {
      console.error('Failed to load cohort missions:', err)
      setMissionsError(err?.message || 'Failed to load missions')
    } finally {
      setLoadingMissions(false)
    }
  }, [mentorId, missionsPagination.page, missionsFilters])

  useEffect(() => {
    loadCohortMissions()
  }, [loadCohortMissions])

  // If a submission id is provided (e.g. from the dashboard "Review now" button), open it directly.
  useEffect(() => {
    const submissionId = searchParams.get('submission')
    if (!submissionId) return
    if (selectedSubmission?.id === submissionId) return

    let cancelled = false
    setLoadingSubmission(true)
    setSubmissionError(null)

    mentorClient
      .getMissionSubmission(submissionId)
      .then((data) => {
        if (cancelled) return
        setSelectedSubmission(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Failed to load submission')
        setSubmissionError(message)
      })
      .finally(() => {
        if (cancelled) return
        setLoadingSubmission(false)
      })

    return () => {
      cancelled = true
    }
  }, [searchParams, selectedSubmission?.id])

  if (loadingSubmission && !selectedSubmission) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <div className="text-och-steel text-sm">Loading submission…</div>
      </div>
    )
  }

  if (submissionError && !selectedSubmission) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <div className="text-och-orange text-sm">Error: {submissionError}</div>
      </div>
    )
  }

  if (selectedSubmission) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <MissionReviewForm
          submission={selectedSubmission}
          onReviewComplete={() => setSelectedSubmission(null)}
        />
      </div>
    )
  }

  if (selectedCapstone) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <CapstoneScoringForm
          capstone={selectedCapstone}
          onScoringComplete={() => {
            setSelectedCapstone(null)
            loadCapstones()
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Mission Review</h1>
        <p className="text-och-steel mb-4">
          As an OCH Mentor, your responsibility in Mission Review is critical. You perform human-in-the-loop validation 
          for mentees on the $7 Premium tier, confirming skill mastery and guiding development according to the core 
          philosophy: <span className="text-och-mint font-semibold">"We guide the transformation"</span>.
        </p>
          </div>
          <Button
            variant="defender"
            onClick={() => router.push('/dashboard/mentor/missions/hall')}
            className="flex items-center gap-2 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Mission Hall
          </Button>
        </div>
        <div className="bg-och-midnight/50 border border-och-steel/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Your Mission Review Responsibilities:</h3>
          <ul className="text-xs text-och-steel space-y-1 list-disc list-inside">
            <li>Review submissions for <strong className="text-white">Professional tier ($7 Premium) mentees</strong> completing Intermediate, Advanced, Mastery, and Capstone missions</li>
            <li>Provide <strong className="text-white">deeper analysis</strong> complementing AI feedback, issue pass/fail grades, and add written feedback</li>
            <li><strong className="text-white">Tag technical competencies</strong> proven or missed to update mentee skill profiles (TalentScope Analytics)</li>
            <li>Use <strong className="text-white">rubric-based scoring</strong> for Capstones and Advanced/Mastery missions</li>
            <li>Recommend <strong className="text-white">next missions or recipes</strong> based on skill gaps detected</li>
            <li>All actions are logged in the <strong className="text-white">immutable Activity Audit Trail</strong></li>
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        <MissionsPending onReviewClick={(submission) => setSelectedSubmission(submission)} />
        
        {/* Cohort Missions - Read-Only View */}
        <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Cohort Missions</h2>
              <p className="text-sm text-och-steel">
                View missions from your assigned cohorts. This is a read-only view of missions assigned by program directors.
              </p>
            </div>
            <button
              onClick={loadCohortMissions}
              className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-opacity-90 text-sm"
            >
              {loadingMissions ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Filters */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">Difficulty</label>
              <select
                value={missionsFilters.difficulty}
                onChange={(e) => {
                  setMissionsFilters({ ...missionsFilters, difficulty: e.target.value })
                  setMissionsPagination({ ...missionsPagination, page: 1 })
                }}
                className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="capstone">Capstone</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">Track</label>
              <select
                value={missionsFilters.track}
                onChange={(e) => {
                  setMissionsFilters({ ...missionsFilters, track: e.target.value })
                  setMissionsPagination({ ...missionsPagination, page: 1 })
                }}
                className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
              >
                <option value="all">All Tracks</option>
                <option value="defender">Defender</option>
                <option value="builder">Builder</option>
                <option value="analyst">Analyst</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">Search</label>
              <input
                type="text"
                value={missionsFilters.search}
                onChange={(e) => {
                  setMissionsFilters({ ...missionsFilters, search: e.target.value })
                  setMissionsPagination({ ...missionsPagination, page: 1 })
                }}
                placeholder="Search missions..."
                className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
          </div>

          {missionsError && (
            <div className="mb-4 p-3 bg-och-orange/10 border border-och-orange/50 rounded-lg text-och-orange text-sm">
              {missionsError}
            </div>
          )}

          {loadingMissions && cohortMissions.length === 0 ? (
            <div className="text-och-steel text-sm">Loading missions...</div>
          ) : cohortMissions.length === 0 ? (
            <div className="text-och-steel text-sm">No missions found in your assigned cohorts.</div>
          ) : (
            <>
              <div className="mb-4 text-sm text-och-steel">
                Showing {cohortMissions.length} of {missionsPagination.total} missions
              </div>
              <div className="space-y-3">
                {cohortMissions.map((mission: any) => (
                  <Card
                    key={mission.id}
                    className="bg-och-midnight/50 border border-och-steel/20 hover:border-och-defender/40 transition-all"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-white">{mission.title}</h3>
                            <Badge variant={mission.difficulty === 'beginner' ? 'mint' : mission.difficulty === 'intermediate' ? 'defender' : mission.difficulty === 'advanced' ? 'orange' : 'gold'} className="text-xs capitalize">
                              {mission.difficulty}
                            </Badge>
                            {mission.code && (
                              <span className="text-sm text-och-steel font-mono bg-och-midnight px-2 py-1 rounded">
                                {mission.code}
                              </span>
                            )}
                          </div>
                          {mission.description && (
                            <p className="text-sm text-och-steel mb-3 line-clamp-2">{mission.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-och-steel">
                            {mission.type && <span className="capitalize">{mission.type}</span>}
                            {mission.estimated_time_minutes && (
                              <span>⏱ {mission.estimated_time_minutes < 60 ? `${mission.estimated_time_minutes} min` : `${Math.floor(mission.estimated_time_minutes / 60)}h ${mission.estimated_time_minutes % 60}m`}</span>
                            )}
                            {mission.track_name && (
                              <span>Track: {mission.track_name}</span>
                            )}
                            {mission.program_name && (
                              <span>Program: {mission.program_name}</span>
                            )}
                          </div>
                          {mission.competencies && mission.competencies.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {mission.competencies.slice(0, 5).map((tag: string, idx: number) => (
                                <Badge key={idx} variant="steel" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {mission.competencies.length > 5 && (
                                <Badge variant="steel" className="text-xs">
                                  +{mission.competencies.length - 5} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {/* Pagination */}
              {missionsPagination.total > missionsPagination.page_size && (
                <div className="flex items-center justify-between pt-4 border-t border-och-steel/20 mt-4">
                  <div className="text-sm text-och-steel">
                    Page {missionsPagination.page} of {Math.ceil(missionsPagination.total / missionsPagination.page_size)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMissionsPagination({ ...missionsPagination, page: missionsPagination.page - 1 })}
                      disabled={!missionsPagination.has_previous || loadingMissions}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMissionsPagination({ ...missionsPagination, page: missionsPagination.page + 1 })}
                      disabled={!missionsPagination.has_next || loadingMissions}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Capstone Projects</h2>
              <p className="text-sm text-och-steel">
                Score capstone projects using assigned rubrics. Capstones are complex projects required in the $7 Premium tier and Mastery Tracks.
              </p>
            </div>
            <button
              onClick={loadCapstones}
              className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-opacity-90 text-sm"
            >
              {loadingCapstones ? 'Loading...' : 'Refresh Capstones'}
            </button>
          </div>

          {capstones.length === 0 && !loadingCapstones && (
            <div className="text-och-steel text-sm">No capstones pending scoring.</div>
          )}

          {capstones.length > 0 && (
            <div className="space-y-3">
              {capstones.map((capstone) => (
                <div
                  key={capstone.id}
                  className="p-4 bg-och-midnight/50 rounded-lg flex justify-between items-center hover:bg-och-midnight/70 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{capstone.title}</h3>
                      <span className="px-2 py-1 bg-och-orange/20 text-och-orange text-xs rounded">Capstone</span>
                    </div>
                    <p className="text-sm text-och-steel mt-1">
                      <span className="text-white font-medium">{capstone.mentee_name}</span> • 
                      Submitted: {new Date(capstone.submitted_at).toLocaleString()}
                    </p>
                    {capstone.rubric_id && (
                      <p className="text-xs text-och-mint mt-1">
                        ✓ Rubric assigned for scoring
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCapstone(capstone)}
                    className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-opacity-90 text-sm shrink-0"
                  >
                    Score with Rubric
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MissionsPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8 text-och-steel">Loading missions…</div>}>
      <MissionsPageInner />
    </Suspense>
  )
}


