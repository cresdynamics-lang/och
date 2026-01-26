'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { mentorClient } from '@/services/mentorClient'
import { profilerClient } from '@/services/profilerClient'
import { talentscopeClient } from '@/services/talentscopeClient'
import { programsClient, type Enrollment, type Cohort } from '@/services/programsClient'
import { useCohorts } from '@/hooks/usePrograms'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CohortMetrics } from '@/components/mentor/CohortMetrics'
import type {
  AssignedMentee,
  MenteeGoal,
  MenteeFlag,
  TalentScopeMentorView,
  MentorInfluenceIndex,
} from '@/services/types/mentor'

// Tab component for organizing different sections
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-b-2 border-och-defender text-och-defender'
          : 'text-och-steel hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

// Mentee Profile View Component
function MenteeProfileView({ menteeId }: { menteeId: string }) {
  const [profilerData, setProfilerData] = useState<any>(null)
  const [talentscopeData, setTalentscopeData] = useState<TalentScopeMentorView | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfileData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [futureYou, talentscope] = await Promise.all([
        profilerClient.getFutureYou(menteeId),
        mentorClient.getTalentScopeView('', menteeId), // mentorId can be extracted from auth
      ])
      setProfilerData(futureYou)
      setTalentscopeData(talentscope)
    } catch (err: any) {
      setError(err?.message || 'Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" onClick={loadProfileData} disabled={loading}>
        {loading ? 'Loading...' : 'Load Profile Data'}
      </Button>
      
      {error && (
        <div className="text-sm text-och-orange">{error}</div>
      )}

      {profilerData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="p-4">
              <h4 className="text-sm font-semibold text-white mb-2">Future-You Persona</h4>
              <p className="text-sm text-och-steel">{profilerData.persona || 'Not available'}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h4 className="text-sm font-semibold text-white mb-2">Track Recommendation</h4>
              <p className="text-sm text-och-steel">{profilerData.recommended_track || 'Not available'}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h4 className="text-sm font-semibold text-white mb-2">Mission Difficulty Level</h4>
              <p className="text-sm text-och-steel">{profilerData.mission_difficulty || 'Not available'}</p>
            </div>
          </Card>
        </div>
      )}

      {talentscopeData && (
        <Card>
          <div className="p-4">
            <h4 className="text-sm font-semibold text-white mb-2">TalentScope Baseline</h4>
            <div className="space-y-2">
              {talentscopeData.ingested_signals && (
                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-och-steel mb-2">Ingested Signals</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-och-steel">Mission Scores:</span>
                      <span className="text-white">{talentscopeData.ingested_signals.mission_scores}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Habit Logs:</span>
                      <span className="text-white">{talentscopeData.ingested_signals.habit_logs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Mentor Evaluations:</span>
                      <span className="text-white">{talentscopeData.ingested_signals.mentor_evaluations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Community Engagement:</span>
                      <span className="text-white">{talentscopeData.ingested_signals.community_engagement}</span>
                    </div>
                  </div>
                </div>
              )}
              {talentscopeData.skills_heatmap && Object.keys(talentscopeData.skills_heatmap).length > 0 && (
                <div className="mt-4">
                  <h5 className="text-xs font-semibold text-och-steel mb-2">Skills Heatmap</h5>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {Object.entries(talentscopeData.skills_heatmap).map(([skill, score]: [string, any]) => (
                      <div key={skill} className="flex items-center justify-between text-xs">
                        <span className="text-och-steel">{skill}:</span>
                        <span className="text-white">{score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {talentscopeData.readiness_over_time && talentscopeData.readiness_over_time.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-xs font-semibold text-och-steel mb-2">Readiness Over Time</h5>
                  <div className="text-xs text-och-steel">
                    Latest: {talentscopeData.readiness_over_time[talentscopeData.readiness_over_time.length - 1]?.score || 0}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default function MenteesPage() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()

  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'sessions' | 'flags' | 'performance'>('overview')
  const [selectedMentee, setSelectedMentee] = useState<string | null>(null)
  const [mentees, setMentees] = useState<AssignedMentee[]>([])
  const [goals, setGoals] = useState<MenteeGoal[]>([])
  const [flags, setFlags] = useState<MenteeFlag[]>([])
  const [influenceIndex, setInfluenceIndex] = useState<MentorInfluenceIndex | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10) // Show 10 mentees per page
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagFormData, setFlagFormData] = useState({
    mentee_id: '',
    flag_type: 'struggling' as 'struggling' | 'at_risk' | 'needs_attention' | 'technical_issue',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    description: '',
  })
  const [submittingFlag, setSubmittingFlag] = useState(false)

  const router = useRouter()
  const { cohorts, isLoading: cohortsLoading } = useCohorts({ page: 1, pageSize: 500 })

  // Load mentees from assigned cohorts
  useEffect(() => {
    const loadMenteesFromCohorts = async () => {
      if (!mentorId) {
        setLoading(false)
        return
      }

      // Wait for cohorts to finish loading
      if (cohortsLoading) {
        return
      }
      
      setLoading(true)
      setError(null)
      
      try {
        console.log('[Mentees] Loading mentees for mentor:', mentorId)
        console.log('[Mentees] Total cohorts available:', cohorts.length)

        // Step 1: Find all cohorts where this mentor is assigned
        const assignedCohorts: Cohort[] = []
        
        for (const cohort of cohorts) {
          try {
            const cohortMentors = await programsClient.getCohortMentors(String(cohort.id))
            console.log(`[Mentees] Cohort ${cohort.name} mentors:`, cohortMentors)
            
            const isAssigned = cohortMentors.some(
              (assignment: any) => {
                const mentorMatch = String(assignment.mentor) === String(mentorId)
                const active = assignment.active !== false
                console.log(`[Mentees] Checking assignment: mentor ${assignment.mentor} === ${mentorId}? ${mentorMatch}, active: ${active}`)
                return mentorMatch && active
              }
            )
            
            if (isAssigned) {
              console.log(`[Mentees] Mentor is assigned to cohort: ${cohort.name}`)
              assignedCohorts.push(cohort)
            }
          } catch (err) {
            console.error(`[Mentees] Failed to check mentor assignment for cohort ${cohort.id}:`, err)
          }
        }

        console.log('[Mentees] Assigned cohorts found:', assignedCohorts.length)

        if (assignedCohorts.length === 0) {
          console.log('[Mentees] No cohorts found where mentor is assigned')
          setMentees([])
          setLoading(false)
          return
        }

        // Step 2: Get all enrollments from assigned cohorts
        // Map to store enrollments by user ID, keeping the first one found
        const enrollmentMap = new Map<string, { enrollment: Enrollment; cohort: Cohort }>()

        for (const cohort of assignedCohorts) {
          try {
            console.log(`[Mentees] Loading enrollments for cohort: ${cohort.name} (${cohort.id})`)
            const enrollments = await programsClient.getCohortEnrollments(String(cohort.id))
            console.log(`[Mentees] Found ${enrollments.length} enrollments in cohort ${cohort.name}`)
            
            // Filter for active enrollments (students with 'active' or 'completed' status)
            const activeEnrollments = enrollments.filter(
              (e) => e.status === 'active' || e.status === 'completed'
            )
            
            console.log(`[Mentees] Active enrollments: ${activeEnrollments.length}`)
            
            // Store enrollments by user ID (deduplicate - a user might be in multiple cohorts)
            for (const enrollment of activeEnrollments) {
              // All enrollments from getCohortEnrollments are already for this cohort
              // Just ensure we have the user and they're not already stored
              if (enrollment.user && !enrollmentMap.has(enrollment.user)) {
                enrollmentMap.set(enrollment.user, { enrollment, cohort })
              }
            }
          } catch (err) {
            console.error(`[Mentees] Failed to load enrollments for cohort ${cohort.id}:`, err)
          }
        }

        console.log('[Mentees] Total unique mentees found:', enrollmentMap.size)

        // Step 3: Convert enrollments to AssignedMentee format
        const menteesData: AssignedMentee[] = Array.from(enrollmentMap.values()).map(({ enrollment, cohort: enrollmentCohort }) => {
          return {
            id: enrollment.user,
            user_id: enrollment.user,
            name: enrollment.user_name || enrollment.user_email || 'Unknown',
            email: enrollment.user_email || '',
            track: enrollmentCohort.track_name || '',
            cohort: enrollmentCohort.name || enrollment.cohort_name || '',
            readiness_score: 0, // Will be updated if available from dashboard cache
            risk_level: 'low',
            missions_completed: 0,
            subscription_tier: enrollment.seat_type === 'paid' ? 'professional' : enrollment.seat_type === 'scholarship' ? 'professional' : 'free',
            assigned_at: enrollment.joined_at,
            status: enrollment.status === 'active' ? 'active' : enrollment.status === 'completed' ? 'active' : 'inactive',
          }
        })

        console.log('[Mentees] Final mentees data:', menteesData)
        
        // If we found mentees from cohorts, use those
        if (menteesData.length > 0) {
          setMentees(menteesData)
        } else {
          // Fallback: Try the direct mentor mentees API
          console.log('[Mentees] No mentees from cohorts, trying direct API...')
          try {
            const directMentees = await mentorClient.getAssignedMentees(mentorId)
            console.log('[Mentees] Direct API returned:', directMentees.length, 'mentees')
            setMentees(directMentees)
          } catch (fallbackErr) {
            console.error('[Mentees] Direct API also failed:', fallbackErr)
            setMentees([])
          }
        }
      } catch (err: any) {
        console.error('[Mentees] Failed to load mentees from cohorts:', err)
        
        // Try fallback API
        try {
          console.log('[Mentees] Trying fallback direct API...')
          const directMentees = await mentorClient.getAssignedMentees(mentorId)
          setMentees(directMentees)
        } catch (fallbackErr) {
          setError(err?.message || 'Failed to load mentees. Check console for details.')
          setMentees([])
        }
      } finally {
        setLoading(false)
      }
    }

    loadMenteesFromCohorts()
  }, [mentorId, cohorts, cohortsLoading])

  // Load goals when goals tab is active
  useEffect(() => {
    if (activeTab === 'goals' && mentorId) {
      const loadGoals = async () => {
        try {
          const data = await mentorClient.getMenteeGoals(mentorId)
          setGoals(data)
        } catch (err) {
          console.error('Failed to load goals:', err)
        }
      }
      loadGoals()
    }
  }, [activeTab, mentorId])

  // Load flags when flags tab is active
  useEffect(() => {
    if (activeTab === 'flags' && mentorId) {
      const loadFlags = async () => {
        try {
          const data = await mentorClient.getMenteeFlags(mentorId)
          setFlags(data)
        } catch (err) {
          console.error('Failed to load flags:', err)
        }
      }
      loadFlags()
    }
  }, [activeTab, mentorId])

  // Handle flag submission
  const handleFlagSubmit = async () => {
    if (!flagFormData.mentee_id || !flagFormData.description.trim() || !mentorId) {
      return
    }
    
    setSubmittingFlag(true)
    try {
      await mentorClient.flagMentee(mentorId, flagFormData)
      // Reload flags
      const updatedFlags = await mentorClient.getMenteeFlags(mentorId)
      setFlags(updatedFlags)
      // Reset form
      setFlagFormData({
        mentee_id: '',
        flag_type: 'struggling',
        severity: 'medium',
        description: '',
      })
      setShowFlagModal(false)
    } catch (err: any) {
      console.error('Failed to raise flag:', err)
      alert(err?.message || 'Failed to raise flag. Please try again.')
    } finally {
      setSubmittingFlag(false)
    }
  }

  // Load influence index
  useEffect(() => {
    if (mentorId) {
      const loadInfluenceIndex = async () => {
        try {
          const data = await mentorClient.getInfluenceIndex(mentorId)
          setInfluenceIndex(data)
        } catch (err) {
          console.error('Failed to load influence index:', err)
        }
      }
      loadInfluenceIndex()
    }
  }, [mentorId])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'defender' | 'mint' | 'orange' | 'steel'> = {
      active: 'mint',
      completed: 'mint',
      achieved: 'mint',
      verified: 'mint',
      draft: 'steel',
      pending: 'orange',
      in_progress: 'defender',
      struggling: 'orange',
      at_risk: 'orange',
      needs_attention: 'orange',
    }
    return variants[status] || 'steel'
  }

  // Filter mentees by search query
  const filteredMentees = useMemo(() => {
    if (!searchQuery) return mentees
    const query = searchQuery.toLowerCase()
    return mentees.filter((mentee) => 
      mentee.name.toLowerCase().includes(query) ||
      mentee.email.toLowerCase().includes(query) ||
      mentee.track?.toLowerCase().includes(query) ||
      mentee.cohort?.toLowerCase().includes(query)
    )
  }, [mentees, searchQuery])

  // Pagination calculations
  const totalPages = useMemo(() => Math.ceil(filteredMentees.length / pageSize), [filteredMentees.length, pageSize])
  const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize])
  const endIndex = useMemo(() => startIndex + pageSize, [startIndex, pageSize])
  const paginatedMentees = useMemo(() => filteredMentees.slice(startIndex, endIndex), [filteredMentees, startIndex, endIndex])

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  return (
    <RouteGuard>
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Mentee Management</h1>
          <p className="text-och-steel">
            Guide the transformation of your assigned mentees. Leverage platform tools to ensure mentees do the work.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-och-steel/20">
          <div className="flex gap-2">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              Assigned Mentees
            </TabButton>
            <TabButton active={activeTab === 'goals'} onClick={() => setActiveTab('goals')}>
              Goal Feedback
            </TabButton>
            <TabButton active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')}>
              Session Management
            </TabButton>
            <TabButton active={activeTab === 'flags'} onClick={() => setActiveTab('flags')}>
              Flags & Attention
            </TabButton>
            <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')}>
              Performance Tracking
            </TabButton>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Mentor Influence Index Summary */}
            {influenceIndex && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Mentor Influence Index</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-och-steel">Overall Influence Score</div>
                      <div className="text-2xl font-bold text-och-mint">{influenceIndex.overall_influence_score || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-och-steel">Mentee Improvement Rate</div>
                      <div className="text-2xl font-bold text-och-mint">{influenceIndex.metrics?.mentee_improvement_rate || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-och-steel">Feedback to Performance</div>
                      <div className="text-2xl font-bold text-och-mint">
                        {(influenceIndex.correlation_data?.feedback_to_performance || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Mentees List */}
            <Card>
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Assigned Mentees</h3>
                    <p className="text-sm text-och-steel">
                      {filteredMentees.length} mentee{filteredMentees.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search mentees..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-sm text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
                    />
                    <Badge variant="defender">{mentees.length} total</Badge>
                  </div>
                </div>

                {loading && <div className="text-och-steel text-center py-8">Loading mentees...</div>}
                {error && (
                  <div className="text-och-orange bg-och-orange/10 border border-och-orange/30 rounded-lg p-4 mb-4">
                    {error}
                  </div>
                )}

                {!loading && !error && filteredMentees.length === 0 && (
                  <div className="text-center py-8 text-och-steel">
                    <p className="mb-2">No mentees found.</p>
                    {searchQuery ? (
                      <p className="text-sm">Try adjusting your search query.</p>
                    ) : (
                      <>
                        <p className="text-sm mb-4">
                          This could mean:
                        </p>
                        <ul className="text-sm text-left max-w-md mx-auto space-y-1 mb-4">
                          <li>• You are not assigned to any cohorts yet</li>
                          <li>• The cohorts you're assigned to have no active enrollments</li>
                          <li>• The cohorts are still being set up</li>
                        </ul>
                        <p className="text-sm mt-4">Contact your Program Director if you believe this is an error.</p>
                        {cohorts.length === 0 && (
                          <p className="text-xs text-och-orange mt-2">Note: No cohorts available in the system.</p>
                        )}
                        {cohorts.length > 0 && (
                          <p className="text-xs text-och-steel mt-2">Note: {cohorts.length} cohort(s) available. Check your cohort assignments.</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {!loading && !error && filteredMentees.length > 0 && (
                  <>
                    <div className="space-y-2">
                      {paginatedMentees.map((mentee) => (
                        <Link
                          key={mentee.id}
                          href={`/dashboard/mentor/mentees/${mentee.id}`}
                          className="block"
                        >
                          <div className="p-3 bg-och-midnight/50 border border-och-steel/20 rounded-lg hover:border-och-defender/50 hover:bg-och-midnight/70 transition-all cursor-pointer">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="text-white font-medium hover:text-och-defender transition-colors truncate">
                                    {mentee.name}
                                  </h4>
                                  {mentee.subscription_tier === 'professional' && (
                                    <Badge variant="defender" className="text-xs shrink-0">$7</Badge>
                                  )}
                                  <Badge
                                    variant={mentee.risk_level === 'high' ? 'orange' : mentee.risk_level === 'medium' ? 'gold' : 'mint'}
                                    className="text-xs shrink-0"
                                  >
                                    {mentee.risk_level || 'low'}
                                  </Badge>
                                  <Badge
                                    variant={mentee.status === 'active' ? 'mint' : 'steel'}
                                    className="text-xs shrink-0"
                                  >
                                    {mentee.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-och-steel flex-wrap">
                                  {mentee.email && (
                                    <span className="truncate">{mentee.email}</span>
                                  )}
                                  {mentee.track && (
                                    <>
                                      <span>•</span>
                                      <span>{mentee.track}</span>
                                    </>
                                  )}
                                  {mentee.cohort && (
                                    <>
                                      <span>•</span>
                                      <span>{mentee.cohort}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                  <div className="text-xs text-och-steel">Readiness</div>
                                  <div className="text-sm text-white font-medium">{mentee.readiness_score || 0}%</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-och-steel">Missions</div>
                                  <div className="text-sm text-white font-medium">{mentee.missions_completed || 0}</div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    router.push(`/dashboard/mentor/mentees/${mentee.id}`)
                                  }}
                                  className="shrink-0"
                                >
                                  View →
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-och-steel/20">
                        <div className="text-sm text-och-steel">
                          Showing {startIndex + 1} to {Math.min(endIndex, filteredMentees.length)} of {filteredMentees.length} mentees
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum: number
                              if (totalPages <= 5) {
                                pageNum = i + 1
                              } else if (currentPage <= 3) {
                                pageNum = i + 1
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                              } else {
                                pageNum = currentPage - 2 + i
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? 'defender' : 'outline'}
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                  className="min-w-[2.5rem]"
                                >
                                  {pageNum}
                                </Button>
                              )
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Goal Feedback</h3>
                <p className="text-sm text-och-steel mb-4">
                  Review and provide feedback on goals for Professional-tier mentees.
                  Goals lifecycle: draft → active → achieved → verified
                </p>

                {goals.length === 0 ? (
                  <div className="text-center py-8 text-och-steel">
                    <p>No goals pending feedback.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <Card key={goal.id} className="border border-och-steel/20">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="text-white font-semibold">{goal.mentee_name}</h4>
                              <p className="text-sm text-och-steel">{goal.title}</p>
                            </div>
                            <Badge variant={getStatusBadge(goal.status) as any}>
                              {goal.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-och-steel mb-3">
                            <span>Type: {goal.goal_type}</span>
                            {goal.target_date && <span>Due: {new Date(goal.target_date).toLocaleDateString()}</span>}
                          </div>
                          {goal.description && (
                            <p className="text-sm text-och-steel mb-3">{goal.description}</p>
                          )}
                          {goal.status === 'pending' && (
                            <Button variant="defender" size="sm">
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

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Session Management</h3>
                <p className="text-sm text-och-steel mb-4">
                  Manage group mentorship sessions, confirm/reschedule student requests, and record session notes.
                </p>
                <Button variant="defender" size="sm">
                  Create Group Session
                </Button>
                {/* Session list would go here */}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'flags' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Flags & Attention</h3>
                    <p className="text-sm text-och-steel">
                  Flag mentees who need attention. Flags initiate intervention playbooks.
                </p>
                  </div>
                  <Button 
                    variant="orange" 
                    size="sm"
                    onClick={() => setShowFlagModal(true)}
                  >
                  Raise Flag for Mentee
                </Button>
                </div>

                {/* Flag Modal */}
                {showFlagModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md m-4">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white">Raise Flag</h3>
                          <button
                            onClick={() => setShowFlagModal(false)}
                            className="text-och-steel hover:text-white"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Select Mentee *
                            </label>
                            <select
                              value={flagFormData.mentee_id}
                              onChange={(e) => setFlagFormData({ ...flagFormData, mentee_id: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                            >
                              <option value="">-- Select a mentee --</option>
                              {mentees.map((mentee) => (
                                <option key={mentee.id} value={mentee.id}>
                                  {mentee.name} ({mentee.email})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Flag Type *
                            </label>
                            <select
                              value={flagFormData.flag_type}
                              onChange={(e) => setFlagFormData({ ...flagFormData, flag_type: e.target.value as any })}
                              className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                            >
                              <option value="struggling">Struggling</option>
                              <option value="at_risk">At Risk</option>
                              <option value="needs_attention">Needs Attention</option>
                              <option value="technical_issue">Technical Issue</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Severity *
                            </label>
                            <select
                              value={flagFormData.severity}
                              onChange={(e) => setFlagFormData({ ...flagFormData, severity: e.target.value as any })}
                              className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Description *
                            </label>
                            <textarea
                              value={flagFormData.description}
                              onChange={(e) => setFlagFormData({ ...flagFormData, description: e.target.value })}
                              placeholder="Describe why this mentee needs attention..."
                              rows={4}
                              className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-sm text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender resize-none"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="orange"
                              size="sm"
                              onClick={handleFlagSubmit}
                              disabled={submittingFlag || !flagFormData.mentee_id || !flagFormData.description.trim()}
                              className="flex-1"
                            >
                              {submittingFlag ? 'Submitting...' : 'Raise Flag'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowFlagModal(false)
                                setFlagFormData({
                                  mentee_id: '',
                                  flag_type: 'struggling',
                                  severity: 'medium',
                                  description: '',
                                })
                              }}
                              disabled={submittingFlag}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Flags List */}
                {flags.length === 0 ? (
                  <div className="text-center py-8 text-och-steel">
                    <p>No flags raised.</p>
                    <p className="text-sm mt-2">Click "Raise Flag for Mentee" to flag a mentee who needs attention.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-och-steel">
                        {flags.length} flag{flags.length !== 1 ? 's' : ''} raised
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="orange" className="text-xs">
                          {flags.filter(f => f.severity === 'critical' || f.severity === 'high').length} High/Critical
                        </Badge>
                        <Badge variant="mint" className="text-xs">
                          {flags.filter(f => f.status === 'open').length} Open
                        </Badge>
                        <Badge variant="steel" className="text-xs">
                          {flags.filter(f => f.status === 'resolved').length} Resolved
                        </Badge>
                      </div>
                    </div>
                    {flags.map((flag) => (
                      <Card key={flag.id} className="border border-och-steel/20 hover:border-och-orange/50 transition-colors">
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-white font-semibold">{flag.mentee_name}</h4>
                            <Badge
                              variant={
                                flag.severity === 'critical' || flag.severity === 'high'
                                  ? 'orange'
                                  : flag.severity === 'medium'
                                  ? 'gold'
                                  : 'steel'
                              }
                                  className="text-xs capitalize"
                            >
                              {flag.severity}
                            </Badge>
                                <Badge
                                  variant={
                                    flag.status === 'resolved'
                                      ? 'mint'
                                      : flag.status === 'acknowledged'
                                      ? 'defender'
                                      : 'steel'
                                  }
                                  className="text-xs capitalize"
                                >
                                  {flag.status}
                                </Badge>
                          </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="defender" className="text-xs capitalize">
                                  {flag.flag_type.replace(/_/g, ' ')}
                                </Badge>
                          </div>
                            </div>
                          </div>
                          <p className="text-sm text-white mb-3">{flag.description}</p>
                          <div className="flex items-center justify-between text-xs text-och-steel">
                            <span>Raised: {new Date(flag.raised_at).toLocaleString()}</span>
                            {flag.resolved_at && (
                              <span>Resolved: {new Date(flag.resolved_at).toLocaleString()}</span>
                            )}
                          </div>
                          {flag.resolution_notes && (
                            <div className="mt-3 p-3 bg-och-midnight/50 rounded-lg">
                              <div className="text-xs text-och-steel mb-1">Resolution Notes:</div>
                              <p className="text-sm text-white">{flag.resolution_notes}</p>
                            </div>
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
                <h3 className="text-lg font-semibold text-white mb-2">Cohort Performance Analytics</h3>
                <p className="text-sm text-och-steel mb-6">
                  Track overall performance metrics for all your assigned cohorts. View readiness scores, risk distributions, mission completion rates, and more.
                </p>
                {mentorId && mentees.length > 0 ? (
                  <CohortMetrics mentees={mentees} mentorId={mentorId} />
                ) : (
                  <div className="text-center py-8 text-och-steel">
                    <p>No mentees assigned yet. Once mentees are assigned to cohorts, you'll see cohort metrics here.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  )
}
