'use client'


import { useCallback, useEffect, useState } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { mentorClient } from '@/services/mentorClient'
import { profilerClient } from '@/services/profilerClient'

import { mentorshipClient } from '@/services/mentorshipClient'
import { coachingClient } from '@/services/coachingClient'
import { habitsClient } from '@/services/habitsClient'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MentorshipChat } from '@/components/mentorship/MentorshipChat'
import { ReflectionWithSentiment } from '@/components/coaching/ReflectionWithSentiment'
import type {
  MenteeGoal,
  MenteeFlag,
  TalentScopeMentorView,
  MenteePerformance,
  AssignedMentee,

  MentorInfluenceIndex,
} from '@/services/types/mentor'
import type { MentorshipSession } from '@/services/types/mentorship'
import type { LearningPlan } from '@/services/types/coaching'
import type { HabitReflection } from '@/services/types/habits'

type MenteeTab = 'overview' | 'goals' | 'performance' | 'missions' | 'sessions' | 'chat' | 'flags'
type FutureYouProfile = {
  persona?: string
  recommended_track?: string
  mission_difficulty?: string
  [k: string]: unknown
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message
    if (typeof msg === 'string') return msg
  }
  return 'Unknown error'
}

function isMenteeTab(v: string): v is MenteeTab {
  return v === 'overview' || v === 'goals' || v === 'performance' || v === 'missions' || v === 'sessions' || v === 'chat' || v === 'flags'
}

export default function MenteeDetailPage() {
  const params = useParams()
  const router = useRouter()

  const searchParams = useSearchParams()
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const menteeId = params.id as string

  const [menteeData, setMenteeData] = useState<AssignedMentee | null>(null)

  const [profilerData, setProfilerData] = useState<FutureYouProfile | null>(null)
  const [talentscopeData, setTalentscopeData] = useState<TalentScopeMentorView | null>(null)
  const [performanceData, setPerformanceData] = useState<MenteePerformance | null>(null)
  const [goals, setGoals] = useState<MenteeGoal[]>([])
  const [flags, setFlags] = useState<MenteeFlag[]>([])
  const [sessions, setSessions] = useState<MentorshipSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState<string | null>(null)
  const [latestReflection, setLatestReflection] = useState<HabitReflection | null>(null)
  const [reflectionLoading, setReflectionLoading] = useState(false)
  const [reflectionError, setReflectionError] = useState<string | null>(null)
  const [profilerDenied, setProfilerDenied] = useState(false)
  const [aiPlan, setAiPlan] = useState<LearningPlan | null>(null)
  const [aiNextActions, setAiNextActions] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [influence, setInfluence] = useState<MentorInfluenceIndex | null>(null)
  const [influenceLoading, setInfluenceLoading] = useState(false)
  const [influenceError, setInfluenceError] = useState<string | null>(null)
  const [updatingFlagId, setUpdatingFlagId] = useState<string | null>(null)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolveFlagId, setResolveFlagId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<MenteeTab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [submittingFlag, setSubmittingFlag] = useState(false)
  const [flagFormData, setFlagFormData] = useState({
    flag_type: 'needs_attention' as 'struggling' | 'at_risk' | 'needs_attention' | 'technical_issue',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    description: '',
  })


  // Allow deep-linking to a specific tab (e.g. from the mentees flag inbox)
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (!tab) return
    if (isMenteeTab(tab)) setActiveTab(tab)
  }, [searchParams])

  const isApiError = (err: unknown): err is { status: number } => {
    return !!err && typeof err === 'object' && 'status' in err && typeof (err as { status?: unknown }).status === 'number'
  }

  // Load mentee data via mentor assignments (RBAC-safe + efficient)
  useEffect(() => {
    const loadMenteeData = async () => {
      if (!mentorId || !menteeId) {
        setLoading(false)
        return
      }


      setLoading(true)
      setError(null)
      setProfilerDenied(false)

      try {
        const directMentees = await mentorClient.getAssignedMentees(mentorId)
        const foundMentee =
          directMentees.find((m: AssignedMentee) => String(m.user_id || m.id) === String(menteeId)) || null

        if (!foundMentee) {
          setError('Mentee not found or not assigned to you (RBAC).')
          return
        }

        setMenteeData(foundMentee)


        const [performance, profilerResult, talentscope] = await Promise.all([
          mentorClient.getMenteePerformance(mentorId, menteeId).catch(() => null),
          profilerClient.getFutureYou(menteeId).catch((e) => e as unknown),
          mentorClient.getTalentScopeView(mentorId, menteeId).catch(() => null),
        ])

        setPerformanceData(performance)
        setTalentscopeData(talentscope)

        if (isApiError(profilerResult) && profilerResult.status === 403) {
          // Consent-gated profiler data
          setProfilerDenied(true)
          setProfilerData(null)
        } else {
          setProfilerData((profilerResult as FutureYouProfile) || null)
        }
      } catch (err: unknown) {
        console.error('[MenteeDetail] Failed to load mentee data:', err)
        setError(getErrorMessage(err) || 'Failed to load mentee data')
      } finally {
        setLoading(false)
      }
    }

    loadMenteeData()

  }, [mentorId, menteeId])

  const loadGoals = useCallback(async () => {
    if (!mentorId) return
    try {
      const data = await mentorClient.getMenteeGoals(mentorId, { mentee_id: menteeId })
      setGoals(data.filter((g: MenteeGoal) => g.mentee_id === menteeId))
    } catch (err) {
      console.error('Failed to load goals:', err)
    }
  }, [mentorId, menteeId])

  // Load goals when goals tab is active
  useEffect(() => {
    if (activeTab === 'goals' && mentorId) {

      loadGoals()
    }
  }, [activeTab, mentorId, loadGoals])

  const loadSessions = useCallback(async () => {
    if (!menteeId) return
    setSessionsLoading(true)
    setSessionsError(null)
    try {
      const data = await mentorshipClient.getUpcomingSessions(menteeId)
      setSessions(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      setSessionsError(getErrorMessage(err) || 'Failed to load sessions')
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }, [menteeId])

  useEffect(() => {
    if (activeTab === 'sessions') {
      loadSessions()
    }
  }, [activeTab, loadSessions])

  const refreshAiRecommendations = useCallback(async () => {
    if (!menteeId) return
    setAiLoading(true)
    setAiError(null)
    try {
      const data = await coachingClient.refreshRecommendations(menteeId)
      setAiPlan(data.learning_plan || null)
      setAiNextActions(data.next_actions || [])
    } catch (err: unknown) {
      setAiError(getErrorMessage(err) || 'Failed to refresh recommendations')
      setAiPlan(null)
      setAiNextActions([])
    } finally {
      setAiLoading(false)
    }
  }, [menteeId])

  const loadInfluence = useCallback(async () => {
    if (!mentorId) return
    setInfluenceLoading(true)
    setInfluenceError(null)
    try {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 30)
      const data = await mentorClient.getInfluenceIndex(mentorId, {
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
      })
      setInfluence(data)
    } catch (err: unknown) {
      setInfluenceError(getErrorMessage(err) || 'Failed to load mentor influence')
      setInfluence(null)
    } finally {
      setInfluenceLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    if (activeTab === 'performance') {
      loadInfluence()
    }
  }, [activeTab, loadInfluence])

  const loadLatestReflection = useCallback(async () => {
    if (!menteeId) return
    setReflectionLoading(true)
    setReflectionError(null)
    try {
      const data = await habitsClient.getLatestReflection(menteeId)
      setLatestReflection(data)
    } catch (err: unknown) {
      setReflectionError(getErrorMessage(err) || 'Failed to load reflection')
      setLatestReflection(null)
    } finally {
      setReflectionLoading(false)
    }
  }, [menteeId])

  useEffect(() => {
    if (activeTab === 'overview') {
      loadLatestReflection()
    }
  }, [activeTab, loadLatestReflection])

  // Load flags when flags tab is active
  const loadFlags = useCallback(async () => {
    if (!mentorId) return
    try {
      const data = await mentorClient.getMenteeFlags(mentorId)
      setFlags(data.filter((f: MenteeFlag) => f.mentee_id === menteeId))
    } catch (err) {
      console.error('Failed to load flags:', err)
    }

  }, [mentorId, menteeId])

  const acknowledge = useCallback(async (flagId: string) => {
    if (!mentorId) return
    setUpdatingFlagId(flagId)
    try {
      await mentorClient.updateMenteeFlag(flagId, { status: 'acknowledged' })
      await loadFlags()
    } finally {
      setUpdatingFlagId(null)
    }
  }, [mentorId, loadFlags])

  const openResolve = (flagId: string) => {
    setResolveFlagId(flagId)
    setResolveNotes('')
    setResolveModalOpen(true)
  }

  const resolve = useCallback(async () => {
    if (!mentorId) return
    if (!resolveFlagId) return
    setUpdatingFlagId(resolveFlagId)
    try {
      await mentorClient.updateMenteeFlag(resolveFlagId, { status: 'resolved', resolution_notes: resolveNotes.trim() || undefined })
      await loadFlags()
      setResolveModalOpen(false)
      setResolveFlagId('')
      setResolveNotes('')
    } finally {
      setUpdatingFlagId(null)
    }
  }, [mentorId, resolveFlagId, resolveNotes, loadFlags])

  useEffect(() => {
    if (activeTab === 'flags' && mentorId) {
      loadFlags()
    }

  }, [activeTab, mentorId, loadFlags])

  // Handle flag submission
  const handleRaiseFlag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mentorId || !menteeId || !flagFormData.description.trim()) {
      setError('Please provide a description for the flag')
      return
    }

    setSubmittingFlag(true)
    setError(null)

    try {

      await mentorClient.flagMentee(mentorId, {
        mentee_id: menteeId,
        flag_type: flagFormData.flag_type,
        severity: flagFormData.severity,
        description: flagFormData.description.trim(),
      })


      // Re-fetch flags from backend for canonical status (sync)
      await loadFlags()

      // Reset form and close modal
      setFlagFormData({
        flag_type: 'needs_attention',
        severity: 'medium',
        description: '',
      })
      setShowFlagModal(false)

      // Optionally switch to flags tab
      if (activeTab !== 'flags') {
        setActiveTab('flags')
      }

    } catch (err: unknown) {
      console.error('Failed to raise flag:', err)
      setError(getErrorMessage(err) || 'Failed to raise flag. Please try again.')
    } finally {
      setSubmittingFlag(false)
    }
  }

  if (loading) {
    return (
      <RouteGuard>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          <div className="text-center py-12">
            <div className="text-och-steel">Loading mentee details...</div>
          </div>
        </div>
      </RouteGuard>
    )
  }

  if (error || !menteeData) {
    return (
      <RouteGuard>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          <Card className="p-6">
            <div className="text-och-orange mb-4">
              {error || 'Mentee not found'}
            </div>
            <Link href="/dashboard/mentor/mentees">
              <Button variant="outline">← Back to Mentees</Button>
            </Link>
          </Card>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/mentor/mentees">
            <Button variant="outline" size="sm" className="mb-4">
              ← Back to Mentees
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-mint">{menteeData.name}</h1>
              <p className="text-och-steel">{menteeData.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {menteeData.track && (

                  <Badge variant="outline">{menteeData.track}</Badge>
                )}
                {menteeData.cohort && (
                  <Badge variant="outline">{menteeData.cohort}</Badge>
                )}
                {menteeData.subscription_tier === 'professional' && (
                  <Badge variant="defender">$7 Professional</Badge>
                )}
                <Badge variant={menteeData.risk_level === 'high' ? 'orange' : menteeData.risk_level === 'medium' ? 'gold' : 'mint'}>
                  {menteeData.risk_level || 'low'} risk
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-och-steel/20">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-och-defender text-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'goals'
                  ? 'border-b-2 border-och-defender text-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Goals
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'performance'
                  ? 'border-b-2 border-och-defender text-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => {
                router.push('/dashboard/mentor/missions')
              }}
              className="px-4 py-2 text-sm font-medium text-och-steel hover:text-white transition-colors"
            >
              Missions
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'sessions'
                  ? 'border-b-2 border-och-defender text-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Sessions
            </button>
            <button

              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'border-b-2 border-och-defender text-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('flags')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'flags'
                  ? 'border-b-2 border-och-defender text-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Flags
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Profiler Data */}

            {profilerDenied && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Profiler Results</h3>
                  <p className="text-sm text-och-steel">
                    Profiler details are consent-gated. This mentee hasn’t granted the required scope (e.g.{' '}
                    <span className="text-white">profiling.share_with_mentor</span>).
                  </p>
                </div>
              </Card>
            )}
            {profilerData && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Profiler Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-och-steel mb-1">Future-You Persona</div>
                      <div className="text-white font-medium">{profilerData.persona || 'Not available'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-och-steel mb-1">Track Recommendation</div>
                      <div className="text-white font-medium">{profilerData.recommended_track || 'Not available'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-och-steel mb-1">Mission Difficulty</div>
                      <div className="text-white font-medium">{profilerData.mission_difficulty || 'Not available'}</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}


            {/* Reflection Review */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">Latest Reflection</h3>
                  <Button variant="outline" size="sm" onClick={loadLatestReflection} disabled={reflectionLoading}>
                    {reflectionLoading ? 'Loading…' : 'Refresh'}
                  </Button>
                </div>
                <p className="text-sm text-och-steel mb-4">
                  Use reflections to guide professional identity and unblock stalled progress (without doing the work for the mentee).
                </p>

                {reflectionError && <div className="text-sm text-och-orange mb-3">{reflectionError}</div>}

                {reflectionLoading ? (
                  <div className="text-sm text-och-steel">Loading reflection…</div>
                ) : !latestReflection ? (
                  <div className="text-sm text-och-steel">No reflection submitted yet.</div>
                ) : (
                  <ReflectionWithSentiment
                    reflectionId={latestReflection.id}
                    content={latestReflection.content}
                    timestamp={latestReflection.created_at}
                  />
                )}
              </div>
            </Card>

            {/* TalentScope Baseline */}
            {talentscopeData && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">TalentScope Analytics</h3>
                  {talentscopeData.ingested_signals && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-white mb-2">Ingested Signals</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-och-steel">Mission Scores</div>
                          <div className="text-white font-medium">{talentscopeData.ingested_signals.mission_scores}</div>
                        </div>
                        <div>
                          <div className="text-och-steel">Habit Logs</div>
                          <div className="text-white font-medium">{talentscopeData.ingested_signals.habit_logs}</div>
                        </div>
                        <div>
                          <div className="text-och-steel">Mentor Evaluations</div>
                          <div className="text-white font-medium">{talentscopeData.ingested_signals.mentor_evaluations}</div>
                        </div>
                        <div>
                          <div className="text-och-steel">Community Engagement</div>
                          <div className="text-white font-medium">{talentscopeData.ingested_signals.community_engagement}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {talentscopeData.skills_heatmap && Object.keys(talentscopeData.skills_heatmap).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Skills Heatmap</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">

                        {Object.entries(talentscopeData.skills_heatmap).map(([skill, score]: [string, number]) => (
                          <div key={skill} className="flex items-center justify-between text-xs p-2 bg-och-midnight/50 rounded">
                            <span className="text-och-steel">{skill}</span>
                            <span className="text-white font-medium">{score}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Performance Summary */}
            {performanceData && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-och-steel">Overall Score</div>
                      <div className="text-2xl font-bold text-och-mint">{performanceData.overall_score || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-och-steel">Readiness Score</div>
                      <div className="text-2xl font-bold text-och-mint">{performanceData.readiness_score || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-och-steel">Mission Completion</div>
                      <div className="text-2xl font-bold text-och-mint">{performanceData.mission_completion_rate || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-och-steel">Engagement</div>
                      <div className="text-2xl font-bold text-och-mint">{performanceData.engagement_score || 0}%</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Goals</h3>

                  <Button variant="outline" size="sm" onClick={loadGoals}>
                    Refresh
                  </Button>
                </div>
                <p className="text-sm text-och-steel mb-4">
                  Mentees own their goals (“mentees do the work”). Your role is to review status, add feedback, and intervene early when progress stalls.
                </p>
                {goals.length === 0 ? (
                  <div className="text-center py-8 text-och-steel">
                    <p>No goals found for this mentee.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <Card key={goal.id} className="border border-och-steel/20">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="text-white font-semibold">{goal.title}</h4>
                              <p className="text-sm text-och-steel mt-1">{goal.description}</p>
                            </div>
                            <Badge variant={goal.status === 'completed' ? 'mint' : goal.status === 'in_progress' ? 'defender' : 'orange'}>
                              {goal.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-och-steel mb-3">
                            <span>Type: {goal.goal_type}</span>
                            <span>Due: {new Date(goal.target_date).toLocaleDateString()}</span>
                          </div>
                          {goal.mentor_feedback && (
                            <div className="mt-3 p-3 bg-och-midnight/50 rounded">
                              <div className="text-xs text-och-steel mb-1">Your Feedback:</div>
                              <div className="text-sm text-white">{goal.mentor_feedback.feedback}</div>
                            </div>
                          )}

                          {(menteeData.subscription_tier === 'professional' || menteeData.subscription_tier === 'premium') && (
                            <Button
                              variant="defender"
                              size="sm"
                              className="mt-3"
                              onClick={async () => {
                                if (!mentorId) return
                                const feedback = window.prompt('Enter goal feedback (saved to backend):', goal.mentor_feedback?.feedback || '')
                                if (!feedback || !feedback.trim()) return
                                await mentorClient.provideGoalFeedback(goal.id, { feedback: feedback.trim() })
                                await loadGoals()
                              }}
                            >
                              Provide Feedback
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Tracking</h3>
                <p className="text-sm text-och-steel mb-4">
                  Track mentee performance using TalentScope analytics, mission scores, and engagement metrics.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={refreshAiRecommendations} disabled={aiLoading}>
                    {aiLoading ? 'Generating…' : 'Recommend recipes / next actions'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadInfluence} disabled={influenceLoading}>
                    {influenceLoading ? 'Loading…' : 'Refresh Mentor Influence (30d)'}
                  </Button>
                </div>

                {aiError && <div className="text-sm text-och-orange mb-3">{aiError}</div>}
                {(aiPlan || aiNextActions.length > 0) && (
                  <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                    <div className="text-white font-semibold mb-1">{aiPlan?.title || 'Recommended next actions'}</div>
                    {aiPlan?.description && <div className="text-sm text-och-steel mb-2">{aiPlan.description}</div>}
                    {aiNextActions.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-white space-y-1">
                        {aiNextActions.slice(0, 8).map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {influenceError && <div className="text-sm text-och-orange mb-3">{influenceError}</div>}
                {influence && (
                  <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                    <div className="text-white font-semibold mb-2">Mentor Influence Index (last 30 days)</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-och-steel">Influence score</div>
                        <div className="text-white font-semibold">{influence.overall_influence_score}</div>
                      </div>
                      <div>
                        <div className="text-och-steel">Feedback given</div>
                        <div className="text-white font-semibold">{influence.metrics.total_feedback_given}</div>
                      </div>
                      <div>
                        <div className="text-och-steel">Avg response (hrs)</div>
                        <div className="text-white font-semibold">{influence.metrics.average_response_time_hours}</div>
                      </div>
                      <div>
                        <div className="text-och-steel">Approval rate</div>
                        <div className="text-white font-semibold">{influence.metrics.mission_approval_rate}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Sessions</h3>
                <p className="text-sm text-och-steel mb-4">
                  Manage mentorship sessions with this mentee. Schedule sessions, take notes, and track outcomes.
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Link href="/dashboard/mentor/sessions">
                    <Button variant="defender" size="sm">Open Session Manager</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={loadSessions} disabled={sessionsLoading}>
                    {sessionsLoading ? 'Refreshing…' : 'Refresh'}
                  </Button>
                </div>

                {sessionsError && <div className="text-sm text-och-orange mb-3">{sessionsError}</div>}

                {sessionsLoading ? (
                  <div className="text-sm text-och-steel">Loading sessions…</div>
                ) : sessions.length === 0 ? (
                  <div className="text-sm text-och-steel">No upcoming sessions found.</div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((s) => (
                      <div key={s.id} className="p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-white font-semibold">{s.topic}</div>
                            <div className="text-xs text-och-steel mt-1">
                              {new Date(s.scheduled_at).toLocaleString()} • {s.duration_minutes}m • {s.meeting_type}
                            </div>
                          </div>
                          {s.meeting_url && (
                            <a href={s.meeting_url} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm">Join</Button>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}


        {activeTab === 'chat' && (
          <div className="space-y-6">
            <MentorshipChat menteeId={menteeId} mentorId={mentorId} mentorName={user?.email || 'Mentor'} />
          </div>
        )}

        {activeTab === 'flags' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Flags</h3>
                  <Button
                    variant="orange"
                    size="sm"
                    onClick={() => setShowFlagModal(true)}
                  >
                    Raise Flag
                  </Button>
                </div>
                {error && (
                  <div className="mb-4 p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg text-sm text-och-orange">
                    {error}
                  </div>
                )}
                {flags.length === 0 ? (
                  <div className="text-center py-8 text-och-steel">
                    <p>No flags raised for this mentee.</p>
                    <p className="text-sm mt-2">Click "Raise Flag" to flag issues that need attention.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flags.map((flag) => (
                      <Card key={flag.id} className="border border-och-steel/20">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-semibold capitalize">
                                  {flag.flag_type.replace(/_/g, ' ')}
                                </h4>
                                <Badge
                                  variant={
                                    flag.status === 'resolved'
                                      ? 'mint'
                                      : flag.status === 'acknowledged'
                                      ? 'defender'
                                      : 'steel'
                                  }
                                  className="text-xs"
                                >
                                  {flag.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-och-steel mt-1">{flag.description}</p>
                            </div>
                            <Badge
                              variant={
                                flag.severity === 'critical' || flag.severity === 'high'
                                  ? 'orange'
                                  : flag.severity === 'medium'
                                  ? 'gold'
                                  : 'steel'
                              }
                              className="ml-4 shrink-0"
                            >
                              {flag.severity}
                            </Badge>
                          </div>

                          <div className="flex gap-2 mt-3">
                            {flag.status === 'open' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => acknowledge(flag.id)}
                                disabled={updatingFlagId === flag.id}
                              >
                                {updatingFlagId === flag.id ? 'Saving…' : 'Acknowledge'}
                              </Button>
                            )}
                            {(flag.status === 'open' || flag.status === 'acknowledged') && (
                              <Button
                                variant="orange"
                                size="sm"
                                onClick={() => openResolve(flag.id)}
                                disabled={updatingFlagId === flag.id}
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                          <div className="text-xs text-och-steel mt-2">
                            Raised: {new Date(flag.raised_at).toLocaleDateString()} at {new Date(flag.raised_at).toLocaleTimeString()}
                            {flag.status === 'resolved' && flag.resolved_at && (
                              <> • Resolved: {new Date(flag.resolved_at).toLocaleDateString()}</>
                            )}
                            {flag.resolution_notes && (
                              <div className="mt-2 p-2 bg-och-midnight/50 rounded text-xs text-white">
                                <span className="font-semibold">Resolution:</span> {flag.resolution_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}


        {/* Resolve flag modal */}
        {resolveModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Resolve flag</h3>
                  <button
                    className="text-och-steel hover:text-white transition-colors"
                    onClick={() => {
                      if (updatingFlagId) return
                      setResolveModalOpen(false)
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Resolution notes (optional)</label>
                    <textarea
                      value={resolveNotes}
                      onChange={(e) => setResolveNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender resize-none"
                      placeholder="What was done to resolve this flag?"
                      disabled={!!updatingFlagId}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setResolveModalOpen(false)} disabled={!!updatingFlagId}>
                      Cancel
                    </Button>
                    <Button variant="orange" size="sm" onClick={resolve} disabled={!!updatingFlagId || !resolveFlagId}>
                      {updatingFlagId ? 'Saving…' : 'Resolve'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Raise Flag Modal */}
        {showFlagModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Raise Flag for {menteeData?.name}</h2>
                  <button
                    onClick={() => {
                      setShowFlagModal(false)
                      setError(null)
                      setFlagFormData({
                        flag_type: 'needs_attention',
                        severity: 'medium',
                        description: '',
                      })
                    }}
                    className="text-och-steel hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleRaiseFlag} className="space-y-4">
                  {/* Flag Type */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Flag Type *
                    </label>
                    <select
                      value={flagFormData.flag_type}
                      onChange={(e) =>
                        setFlagFormData({
                          ...flagFormData,
                          flag_type: e.target.value as typeof flagFormData.flag_type,
                        })
                      }
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      required
                    >
                      <option value="needs_attention">Needs Attention</option>
                      <option value="struggling">Struggling</option>
                      <option value="at_risk">At Risk</option>
                      <option value="technical_issue">Technical Issue</option>
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Severity *
                    </label>
                    <select
                      value={flagFormData.severity}
                      onChange={(e) =>
                        setFlagFormData({
                          ...flagFormData,
                          severity: e.target.value as typeof flagFormData.severity,
                        })
                      }
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Description *
                    </label>
                    <textarea
                      value={flagFormData.description}
                      onChange={(e) =>
                        setFlagFormData({ ...flagFormData, description: e.target.value })
                      }
                      placeholder="Describe the issue or concern..."
                      rows={4}
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender resize-none"
                      required
                    />
                    <p className="text-xs text-och-steel mt-1">
                      Provide specific details about why you're raising this flag.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg text-sm text-och-orange">
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowFlagModal(false)
                        setError(null)
                        setFlagFormData({
                          flag_type: 'needs_attention',
                          severity: 'medium',
                          description: '',
                        })
                      }}
                      disabled={submittingFlag}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="orange"
                      disabled={submittingFlag || !flagFormData.description.trim()}
                      className="flex-1"
                    >
                      {submittingFlag ? 'Raising Flag...' : 'Raise Flag'}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  )
}

