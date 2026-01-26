'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { usePrograms, useDeleteProgram, useUpdateCohortDirector } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'
import Link from 'next/link'

interface ProgramDetails {
  tracks: any[]
  cohorts: any[]
  enrollmentStats: {
    total: number
    active: number
    pending: number
  }
  isLoading: boolean
  lastUpdated: number
}

export default function ProgramsPage() {
  const { programs, isLoading, reload } = usePrograms()
  const { deleteProgram, isLoading: isDeleting } = useDeleteProgram()
  const { updateCohort, isLoading: isAssigning, error: assignApiError } = useUpdateCohortDirector()
  const [programDetails, setProgramDetails] = useState<Record<string, ProgramDetails>>({})
  const [refreshingPrograms, setRefreshingPrograms] = useState<Set<string>>(new Set())
  
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Assign cohort functionality state
  const [assignProgramId, setAssignProgramId] = useState<string>('')
  const [assignTrackId, setAssignTrackId] = useState<string>('')
  const [assignCohortId, setAssignCohortId] = useState<string>('')
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)
  const [cohortSearchQuery, setCohortSearchQuery] = useState('')
  const [showCohortDropdown, setShowCohortDropdown] = useState(false)
  const [allCohorts, setAllCohorts] = useState<any[]>([])

  // Fetch comprehensive program details
  const fetchProgramDetails = useCallback(async (programId: string, force = false) => {
    if (!programId) return
    
    // Don't refetch if recently updated (within 5 seconds) unless forced
    if (!force) {
      const existing = programDetails[programId]
      if (existing && Date.now() - existing.lastUpdated < 5000) {
        return
      }
    }
    
    setRefreshingPrograms(prev => new Set(prev).add(programId))
    
    try {
      // Fetch program, tracks, and cohorts in parallel
      const [programData, tracksData] = await Promise.all([
        programsClient.getProgram(programId),
        programsClient.getTracks(programId)
      ])
      
      // Get cohorts for all tracks in this program
      const trackIds = Array.isArray(tracksData) ? tracksData.map((t: any) => t.id) : []
      const cohortPromises = trackIds.map(async (trackId: string) => {
        try {
          const cohortsRes = await programsClient.getCohorts({ trackId, page: 1, pageSize: 1000 })
          return Array.isArray(cohortsRes) ? cohortsRes : (cohortsRes?.results || [])
        } catch {
          return []
        }
      })
      
      const allCohortsData = await Promise.all(cohortPromises)
      const cohorts = allCohortsData.flat()
      
      // Calculate enrollment statistics
      const enrollmentStatsPromises = cohorts.map(async (cohort: any) => {
        try {
          const enrollments = await programsClient.getCohortEnrollments(cohort.id)
          return enrollments || []
        } catch {
          return []
        }
      })
      
      const enrollmentsArrays = await Promise.all(enrollmentStatsPromises)
      const allEnrollments = enrollmentsArrays.flat()
      
      const enrollmentStats = {
        total: allEnrollments.length,
        active: allEnrollments.filter((e: any) => e.status === 'active').length,
        pending: allEnrollments.filter((e: any) => e.status === 'pending' || e.status === 'pending_payment').length,
      }
      
      setProgramDetails(prev => ({
        ...prev,
        [programId]: {
          tracks: Array.isArray(tracksData) ? tracksData : [],
          cohorts: cohorts,
          enrollmentStats,
          isLoading: false,
          lastUpdated: Date.now()
        }
      }))
    } catch (err) {
      console.error(`Failed to fetch details for program ${programId}:`, err)
      setProgramDetails(prev => ({
        ...prev,
        [programId]: {
          tracks: prev[programId]?.tracks || [],
          cohorts: prev[programId]?.cohorts || [],
          enrollmentStats: prev[programId]?.enrollmentStats || { total: 0, active: 0, pending: 0 },
          isLoading: false,
          lastUpdated: prev[programId]?.lastUpdated || Date.now()
        }
      }))
    } finally {
      setRefreshingPrograms(prev => {
        const next = new Set(prev)
        next.delete(programId)
        return next
      })
    }
  }, [programDetails])

  // Fetch details for all programs on mount
  useEffect(() => {
    if (!isLoading && programs.length > 0) {
      programs.forEach((program: any) => {
        if (program.id) {
          fetchProgramDetails(program.id)
        }
      })
    }
  }, [programs, isLoading, fetchProgramDetails])

  // Load all cohorts for assignment dropdown
  useEffect(() => {
    const loadCohorts = async () => {
      try {
        const response = await programsClient.getCohorts({ page: 1, pageSize: 1000 })
        const cohorts = Array.isArray(response) ? response : (response.results || [])
        setAllCohorts(cohorts)
      } catch (err) {
        console.error('Failed to load cohorts:', err)
      }
    }
    loadCohorts()
  }, [])

  // Listen for program creation events
  useEffect(() => {
    const handleProgramCreated = () => {
      reload()
    }
    window.addEventListener('programCreated', handleProgramCreated)
    return () => window.removeEventListener('programCreated', handleProgramCreated)
  }, [reload])

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      if (filterCategory !== 'all' && program.category !== filterCategory) return false
      if (filterStatus !== 'all' && program.status !== filterStatus) return false
      if (searchQuery && !program.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !program.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [programs, filterCategory, filterStatus, searchQuery])

  // Get tracks for selected program
  const assignTracks = useMemo(() => {
    if (!assignProgramId) return []
    const details = programDetails[assignProgramId]
    return details?.tracks || []
  }, [assignProgramId, programDetails])

  const filteredCohorts = useMemo(() => {
    const q = cohortSearchQuery.trim().toLowerCase()
    if (!q) return allCohorts
    return allCohorts.filter((c) => {
      const hay = `${c.name} ${c.track_name || ''} ${c.status || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [allCohorts, cohortSearchQuery])

  const handleAssign = async () => {
    setAssignError(null)
    setAssignSuccess(null)

    if (!assignProgramId || !assignTrackId || !assignCohortId) {
      setAssignError('Please select a program, track, and cohort.')
      return
    }

    try {
      await updateCohort(assignCohortId, { track: assignTrackId })
      setAssignSuccess('Cohort updated successfully.')
      
      // Refresh all data
      await reload()
      programs.forEach((p: any) => {
        if (p.id) fetchProgramDetails(p.id, true)
      })
      
      setTimeout(() => {
        setAssignProgramId('')
        setAssignTrackId('')
        setAssignCohortId('')
        setCohortSearchQuery('')
        setShowCohortDropdown(false)
        setAssignSuccess(null)
      }, 2000)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail || 
                          err?.response?.data?.track?.[0] ||
                          err?.message || 
                          'Failed to assign cohort to track'
      setAssignError(errorMessage)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }
    try {
      await deleteProgram(id)
      await reload()
    } catch (err) {
      console.error('Failed to delete program:', err)
    }
  }

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading programs...</p>
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-white">Programs Management</h1>
                <p className="text-och-steel">Manage your learning programs, tracks, and cohorts</p>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/director/programs/new">
                  <Button variant="defender" size="sm" className="gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Program
                  </Button>
                </Link>
              </div>
            </div>

            {/* Filters */}
            <Card className="border-och-steel/20 bg-gradient-to-r from-och-midnight/50 to-och-midnight/30">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Search Programs</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or description..."
                        className="w-full pl-10 pr-4 py-2.5 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:outline-none focus:border-och-defender focus:ring-2 focus:ring-och-defender/20 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender focus:ring-2 focus:ring-och-defender/20 transition-all"
                    >
                      <option value="all">All Categories</option>
                      <option value="technical">Technical</option>
                      <option value="leadership">Leadership</option>
                      <option value="mentorship">Mentorship</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender focus:ring-2 focus:ring-och-defender/20 transition-all"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Assign Cohort to Program Section */}
            <Card className="mt-6 border-och-defender/30 bg-gradient-to-r from-och-defender/5 to-transparent">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-och-defender/20 rounded-lg">
                    <svg className="w-5 h-5 text-och-defender" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Assign Cohort to Track</h2>
                    <p className="text-sm text-och-steel mt-0.5">
                      Link cohorts to programs by assigning them to tracks
                    </p>
                  </div>
                </div>

                {(assignError || assignApiError) && (
                  <div className="mb-4 p-3 rounded-lg border border-och-orange/50 bg-och-orange/10 text-och-orange text-sm">
                    {assignError || assignApiError}
                  </div>
                )}
                {assignSuccess && (
                  <div className="mb-4 p-3 rounded-lg border border-och-mint/50 bg-och-mint/10 text-och-mint text-sm">
                    {assignSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Program</label>
                    <select
                      value={assignProgramId}
                      onChange={(e) => {
                        setAssignProgramId(e.target.value)
                        setAssignTrackId('')
                        setAssignError(null)
                        setAssignSuccess(null)
                      }}
                      className="w-full px-4 py-2.5 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="">Select a program...</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Track</label>
                    <select
                      value={assignTrackId}
                      onChange={(e) => {
                        setAssignTrackId(e.target.value)
                        setAssignError(null)
                      }}
                      disabled={!assignProgramId || !programDetails[assignProgramId]}
                      className="w-full px-4 py-2.5 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender disabled:opacity-50"
                    >
                      <option value="">
                        {!assignProgramId ? 'Select program first' : assignTracks.length === 0 ? 'No tracks available' : 'Select a track...'}
                      </option>
                      {assignTracks.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.key})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-white mb-2">Cohort</label>
                    <input
                      type="text"
                      value={cohortSearchQuery}
                      onChange={(e) => {
                        setCohortSearchQuery(e.target.value)
                        setShowCohortDropdown(true)
                        setAssignCohortId('')
                      }}
                      onFocus={() => setShowCohortDropdown(true)}
                      placeholder="Search cohorts..."
                      className="w-full px-4 py-2.5 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                    {showCohortDropdown && filteredCohorts.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-och-midnight border border-och-steel/30 rounded-lg shadow-xl max-h-60 overflow-auto">
                        {filteredCohorts.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setAssignCohortId(c.id)
                              setCohortSearchQuery(c.name)
                              setShowCohortDropdown(false)
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-och-midnight/80 transition-colors border-b border-och-steel/10 last:border-0"
                          >
                            <div className="text-sm font-medium text-white">{c.name}</div>
                            <div className="text-xs text-och-steel mt-0.5">
                              {c.track_name || `Track: ${c.track}`} • {c.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAssignProgramId('')
                      setAssignTrackId('')
                      setAssignCohortId('')
                      setCohortSearchQuery('')
                      setShowCohortDropdown(false)
                    }}
                    disabled={isAssigning}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="defender"
                    size="sm"
                    onClick={handleAssign}
                    disabled={isAssigning || !assignProgramId || !assignTrackId || !assignCohortId}
                  >
                    {isAssigning ? 'Assigning...' : 'Assign Cohort'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Programs Count and Refresh */}
          <div className="mb-6 flex items-center justify-between">
            <div className="text-och-steel">
              Showing <span className="text-white font-semibold">{filteredPrograms.length}</span> of <span className="text-white font-semibold">{programs.length}</span> programs
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                reload()
                programs.forEach((p: any) => {
                  if (p.id) fetchProgramDetails(p.id, true)
                })
              }}
              disabled={isLoading}
              className="gap-2"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh All
            </Button>
          </div>

          {/* Programs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms && filteredPrograms.length > 0 ? (
              filteredPrograms.map((program: any) => {
                const details = programDetails[program.id]
                const isRefreshing = refreshingPrograms.has(program.id)
                const tracksCount = details?.tracks?.length ?? 0
                const cohortsCount = details?.cohorts?.length ?? 0
                const enrollmentStats = details?.enrollmentStats || { total: 0, active: 0, pending: 0 }
                const isLoadingDetails = !details
                
                return (
                  <Card 
                    key={program.id} 
                    className="group hover:border-och-defender/50 transition-all duration-300 hover:shadow-xl hover:shadow-och-defender/10 bg-gradient-to-br from-och-midnight/80 to-och-midnight/50 border-och-steel/20"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-white truncate group-hover:text-och-defender transition-colors">
                              {program.name}
                            </h3>
                            {isRefreshing && (
                              <svg className="w-4 h-4 text-och-defender animate-spin flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={program.status === 'active' ? 'defender' : program.status === 'archived' ? 'steel' : 'outline'}
                              className="text-xs"
                            >
                              {program.status || 'active'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {program.category || 'N/A'}
                            </Badge>
                          </div>
                          <p className="text-sm text-och-steel line-clamp-2">
                            {program.description || 'No description available'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Statistics Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-och-midnight/40 rounded-lg border border-och-steel/10">
                        <div className="text-center">
                          <div className="text-xs text-och-steel mb-1">Tracks</div>
                          <div className="text-lg font-bold text-white">
                            {isLoadingDetails ? (
                              <div className="flex justify-center">
                                <div className="w-4 h-4 border-2 border-och-steel border-t-och-defender rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              tracksCount
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-och-steel mb-1">Cohorts</div>
                          <div className="text-lg font-bold text-white">
                            {isLoadingDetails ? (
                              <div className="flex justify-center">
                                <div className="w-4 h-4 border-2 border-och-steel border-t-och-defender rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              cohortsCount
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-och-steel mb-1">Enrollments</div>
                          <div className="text-lg font-bold text-och-mint">
                            {isLoadingDetails ? (
                              <div className="flex justify-center">
                                <div className="w-4 h-4 border-2 border-och-steel border-t-och-mint rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              enrollmentStats.total
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-och-steel mb-1">Duration</div>
                          <div className="text-lg font-bold text-white">
                            {program.duration_months ? `${program.duration_months}mo` : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Enrollment Breakdown */}
                      {details && enrollmentStats.total > 0 && (
                        <div className="mb-4 p-3 bg-och-midnight/30 rounded-lg border border-och-steel/10">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-och-steel">Active Enrollments</span>
                            <span className="text-white font-semibold">{enrollmentStats.active}</span>
                          </div>
                          {enrollmentStats.pending > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-och-steel">Pending</span>
                              <span className="text-och-orange font-semibold">{enrollmentStats.pending}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-och-steel/20">
                        <Link href={`/dashboard/director/programs/${program.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View
                          </Button>
                        </Link>
                        <Link href={`/dashboard/director/programs/${program.id}/edit`} className="flex-1">
                          <Button variant="defender" size="sm" className="w-full">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (program.id) fetchProgramDetails(program.id, true)
                          }}
                          disabled={isRefreshing}
                          className="px-3"
                          title="Refresh details"
                        >
                          <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(program.id, program.name)}
                          disabled={isDeleting}
                          className="px-3 text-och-orange hover:text-och-orange/80 hover:border-och-orange"
                          title="Delete program"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })
            ) : (
              <Card className="col-span-full border-och-steel/20">
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-och-midnight/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-och-steel mb-2 text-lg">No programs found</p>
                  <p className="text-och-steel/70 mb-6">Create your first program to get started</p>
                  <Link href="/dashboard/director/programs/new">
                    <Button variant="defender">
                      Create Your First Program
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
