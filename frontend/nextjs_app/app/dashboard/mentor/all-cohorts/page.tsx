'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { programsClient, type Cohort, type Track, type MentorAssignment } from '@/services/programsClient'

export default function AllCohortsPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'running' | 'closing' | 'closed'>('all')
  const [cohortMentors, setCohortMentors] = useState<Record<string, MentorAssignment[]>>({})
  const [loadingMentors, setLoadingMentors] = useState<Set<string>>(new Set())
  const [tracksCache, setTracksCache] = useState<Map<string, Track>>(new Map())
  const [expandedCohorts, setExpandedCohorts] = useState<Set<string>>(new Set())

  // Load all cohorts (view-only for mentors)
  useEffect(() => {
    const loadCohorts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Use view_all=true to get all cohorts (read-only access for mentors)
        const response = await programsClient.getCohorts({ page: 1, pageSize: 500, viewAll: true })
        const cohortsList = Array.isArray(response) ? response : response.results || []
        
        setCohorts(cohortsList)

        // Pre-load tracks for cohorts
        const trackIds = Array.from(new Set(cohortsList.map(c => c.track).filter(Boolean)))
        const trackPromises = trackIds.map(async (trackId) => {
          try {
            const track = await programsClient.getTrack(trackId!)
            if (track) {
              setTracksCache(prev => new Map(prev).set(trackId!, track))
            }
          } catch (err) {
            console.error(`Failed to load track ${trackId}:`, err)
          }
        })
        
        await Promise.all(trackPromises)
      } catch (err: any) {
        console.error('Failed to load cohorts:', err)
        setError(err?.message || 'Failed to load cohorts. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    loadCohorts()
  }, [])

  // Load mentors for a cohort when expanded
  const loadCohortMentors = async (cohortId: string) => {
    if (cohortMentors[cohortId] || loadingMentors.has(cohortId)) return

    setLoadingMentors(prev => new Set(prev).add(cohortId))

    try {
      const mentors = await programsClient.getCohortMentors(cohortId)
      setCohortMentors(prev => ({
        ...prev,
        [cohortId]: mentors.filter(m => m.active !== false),
      }))
    } catch (err) {
      console.error(`Failed to load mentors for cohort ${cohortId}:`, err)
    } finally {
      setLoadingMentors(prev => {
        const newSet = new Set(prev)
        newSet.delete(cohortId)
        return newSet
      })
    }
  }

  // Filter cohorts
  const filteredCohorts = useMemo(() => {
    let filtered = cohorts

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.track_name?.toLowerCase().includes(query) ||
        c.mode?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [cohorts, statusFilter, searchQuery])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'defender' | 'mint' | 'orange' | 'steel'> = {
      active: 'mint',
      running: 'mint',
      draft: 'steel',
      closing: 'orange',
      closed: 'steel',
    }
    return variants[status] || 'steel'
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'defender' | 'mint' | 'orange'> = {
      primary: 'defender',
      support: 'mint',
      guest: 'orange',
    }
    return variants[role] || 'steel'
  }

  if (isLoading) {
    return (
      <RouteGuard>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-och-mint border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-och-steel text-lg">Loading all cohorts...</div>
          </div>
        </div>
      </RouteGuard>
    )
  }

  if (error) {
    return (
      <RouteGuard>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          <Card className="p-6">
            <div className="text-och-orange">Error: {error}</div>
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-3 text-och-mint">All Cohorts</h1>
              <p className="text-och-steel text-lg">
                View all available cohorts in Ongoza CyberHub (Read-only)
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/mentor/cohorts-tracks')}
            >
              ← My Assigned Cohorts
            </Button>
          </div>
          {cohorts.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-och-mint/10 border border-och-mint/30 rounded-lg">
              <span className="text-och-mint font-semibold">{cohorts.length}</span>
              <span className="text-och-steel">
                {cohorts.length === 1 ? 'cohort available' : 'cohorts available'}
              </span>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 p-5 bg-gradient-to-br from-och-midnight to-och-midnight/80 border-och-steel/30">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search cohorts by name, track, or mode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-och-midnight/50 border border-och-steel/20 text-white placeholder-och-steel/60 focus:outline-none focus:ring-2 focus:ring-och-mint focus:border-och-mint transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2.5 rounded-lg bg-och-midnight/50 border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-mint transition-all cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="running">Running</option>
                <option value="closing">Closing</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Cohorts List */}
        {filteredCohorts.length === 0 ? (
          <Card className="p-12">
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-och-steel/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xl text-white font-semibold mb-2">No Cohorts Found</p>
              <p className="text-och-steel mb-6 max-w-md mx-auto">
                {cohorts.length === 0 
                  ? 'No cohorts are currently available in the system.'
                  : 'Try adjusting your search or filter criteria to find cohorts.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCohorts.map((cohort) => {
              const track = cohort.track ? tracksCache.get(String(cohort.track)) : null
              const mentors = cohortMentors[cohort.id] || []
              const isLoadingMentors = loadingMentors.has(cohort.id)
              const isExpanded = expandedCohorts.has(cohort.id)

              return (
                <Card key={cohort.id} className="overflow-hidden border-och-steel/20 hover:border-och-mint/30 transition-all">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{cohort.name}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant={getStatusBadge(cohort.status)}>
                            {cohort.status}
                          </Badge>
                          {track && (
                            <Badge variant="outline">{track.name}</Badge>
                          )}
                          {cohort.mode && (
                            <span className="text-sm text-och-steel">{cohort.mode}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cohort Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <div className="text-och-steel mb-1">Students</div>
                        <div className="text-white font-semibold">{cohort.enrolled_count || 0} / {cohort.seat_cap || 0}</div>
                      </div>
                      <div>
                        <div className="text-och-steel mb-1">Capacity</div>
                        <div className="text-white font-semibold">
                          {cohort.seat_utilization ? `${cohort.seat_utilization.toFixed(1)}%` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-och-steel mb-1">Start Date</div>
                        <div className="text-white font-medium">
                          {new Date(cohort.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div>
                        <div className="text-och-steel mb-1">End Date</div>
                        <div className="text-white font-medium">
                          {new Date(cohort.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    {/* Assigned Mentors Section */}
                    <div className="border-t border-och-steel/20 pt-4">
                      <button
                        onClick={() => {
                          const newExpanded = !isExpanded
                          if (newExpanded) {
                            setExpandedCohorts(prev => new Set(prev).add(cohort.id))
                            if (mentors.length === 0 && !isLoadingMentors) {
                              loadCohortMentors(cohort.id)
                            }
                          } else {
                            setExpandedCohorts(prev => {
                              const newSet = new Set(prev)
                              newSet.delete(cohort.id)
                              return newSet
                            })
                          }
                        }}
                        className="w-full flex items-center justify-between text-left hover:bg-och-midnight/50 p-2 rounded-lg transition-colors"
                      >
                        <span className="text-sm font-semibold text-white">
                          Assigned Mentors
                          {mentors.length > 0 && (
                            <span className="ml-2 text-och-steel font-normal">({mentors.length})</span>
                          )}
                        </span>
                        <svg 
                          className={`w-5 h-5 text-och-steel transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2">
                          {isLoadingMentors ? (
                            <div className="text-sm text-och-steel text-center py-2">Loading mentors...</div>
                          ) : mentors.length === 0 ? (
                            <div className="text-sm text-och-steel text-center py-2">No mentors assigned</div>
                          ) : (
                            mentors.map((assignment: MentorAssignment) => {
                              const mentorName = assignment.mentor_name || assignment.mentor_email || assignment.mentor || 'Unknown'
                              return (
                                <div
                                  key={assignment.id}
                                  className="p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-white font-medium">{mentorName}</div>
                                      <div className="text-xs text-och-steel mt-1">
                                        Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <Badge variant={getRoleBadge(assignment.role)}>
                                      {assignment.role}
                                    </Badge>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* View Details Button */}
                    {cohort.id && (
                      <div className="mt-4 pt-4 border-t border-och-steel/20">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            // Check if this cohort is assigned to the mentor
                            router.push(`/dashboard/mentor/cohorts-tracks`)
                          }}
                        >
                          View Details (if assigned)
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Summary Stats */}
        {cohorts.length > 0 && (
          <Card className="mt-6 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-och-steel">Total Cohorts</div>
                <div className="text-2xl font-bold text-och-mint">{cohorts.length}</div>
              </div>
              <div>
                <div className="text-sm text-och-steel">Active/Running</div>
                <div className="text-2xl font-bold text-och-mint">
                  {cohorts.filter(c => c.status === 'active' || c.status === 'running').length}
                </div>
              </div>
              <div>
                <div className="text-sm text-och-steel">Total Students</div>
                <div className="text-2xl font-bold text-och-mint">
                  {cohorts.reduce((sum, c) => sum + (c.enrolled_count || 0), 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-och-steel">Total Capacity</div>
                <div className="text-2xl font-bold text-och-mint">
                  {cohorts.reduce((sum, c) => sum + (c.seat_cap || 0), 0)}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </RouteGuard>
  )
}

