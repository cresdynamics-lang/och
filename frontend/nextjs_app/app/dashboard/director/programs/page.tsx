'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { usePrograms, useDeleteProgram } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'
import Link from 'next/link'
import './programs.css'

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
  const [programDetails, setProgramDetails] = useState<Record<string, ProgramDetails>>({})
  const programDetailsRef = useRef(programDetails)
  const [refreshingPrograms, setRefreshingPrograms] = useState<Set<string>>(new Set())

  programDetailsRef.current = programDetails

  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const programIdsFetchedRef = useRef<string | null>(null)

  const fetchProgramDetails = useCallback(async (programId: string, force = false) => {
    if (!programId) return

    const currentDetails = programDetailsRef.current
    if (!force) {
      const existing = currentDetails[programId]
      if (existing && Date.now() - existing.lastUpdated < 30000) {
        return existing
      }
    }

    setRefreshingPrograms(prev => new Set(prev).add(programId))

    try {
      const [programData, tracksData] = await Promise.allSettled([
        programsClient.getProgram(programId),
        programsClient.getTracks(programId)
      ])

      const tracks = tracksData.status === 'fulfilled' && Array.isArray(tracksData.value)
        ? tracksData.value
        : []

      const trackIds = tracks.map((t: any) => t.id)
      const cohortPromises = trackIds.map(async (trackId: string) => {
        try {
          const cohortsRes = await programsClient.getCohorts({ trackId, page: 1, pageSize: 100 })
          return Array.isArray(cohortsRes) ? cohortsRes : (cohortsRes?.results || [])
        } catch {
          return []
        }
      })

      const allCohortsData = await Promise.all(cohortPromises)
      const cohorts = allCohortsData.flat()

      const enrollmentStatsPromises = cohorts.slice(0, 10).map(async (cohort: any) => {
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

      const newDetails = {
        tracks,
        cohorts,
        enrollmentStats,
        isLoading: false,
        lastUpdated: Date.now()
      }

      setProgramDetails(prev => ({
        ...prev,
        [programId]: newDetails
      }))

      return newDetails
    } catch (err) {
      console.error(`Failed to fetch details for program ${programId}:`, err)
      const fallbackDetails = {
        tracks: programDetailsRef.current[programId]?.tracks || [],
        cohorts: programDetailsRef.current[programId]?.cohorts || [],
        enrollmentStats: programDetailsRef.current[programId]?.enrollmentStats || { total: 0, active: 0, pending: 0 },
        isLoading: false,
        lastUpdated: programDetailsRef.current[programId]?.lastUpdated || Date.now()
      }

      setProgramDetails(prev => ({
        ...prev,
        [programId]: fallbackDetails
      }))

      return fallbackDetails
    } finally {
      setRefreshingPrograms(prev => {
        const next = new Set(prev)
        next.delete(programId)
        return next
      })
    }
  }, [])

  const programIdsKey = useMemo(
    () => programs.map((p: any) => p.id).filter(Boolean).sort().join(','),
    [programs]
  )

  useEffect(() => {
    if (isLoading || programs.length === 0) return
    if (programIdsFetchedRef.current === programIdsKey) return
    programIdsFetchedRef.current = programIdsKey

    const batchSize = 3
    const processBatch = async (batch: any[]) => {
      const promises = batch.map((program: any) => {
        if (program.id) return fetchProgramDetails(program.id)
        return Promise.resolve()
      })
      await Promise.allSettled(promises)
    }

    const runBatches = async () => {
      for (let i = 0; i < programs.length; i += batchSize) {
        const batch = programs.slice(i, i + batchSize)
        await processBatch(batch)
        if (i + batchSize < programs.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }

    runBatches()
  }, [programIdsKey, isLoading, programs.length, fetchProgramDetails])

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
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="skeleton h-10 w-80 mb-2 rounded-lg"></div>
                  <div className="skeleton h-4 w-64 rounded"></div>
                </div>
                <div className="skeleton h-10 w-32 rounded-lg"></div>
              </div>
              
              <Card className="border-och-steel/20 bg-gradient-to-r from-och-midnight/50 to-och-midnight/30">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="skeleton h-4 w-24 mb-2 rounded"></div>
                      <div className="skeleton h-10 w-full rounded-lg"></div>
                    </div>
                    <div>
                      <div className="skeleton h-4 w-16 mb-2 rounded"></div>
                      <div className="skeleton h-10 w-full rounded-lg"></div>
                    </div>
                    <div>
                      <div className="skeleton h-4 w-12 mb-2 rounded"></div>
                      <div className="skeleton h-10 w-full rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="program-card bg-gradient-to-br from-och-midnight/90 to-och-midnight/60 border-och-steel/30">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="skeleton w-2 h-2 rounded-full"></div>
                          <div className="skeleton h-6 w-48 rounded"></div>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="skeleton h-5 w-16 rounded-full"></div>
                          <div className="skeleton h-5 w-20 rounded-full"></div>
                        </div>
                        <div className="skeleton h-4 w-full mb-2 rounded"></div>
                        <div className="skeleton h-4 w-3/4 rounded"></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-och-midnight/40 rounded-lg">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="text-center">
                          <div className="skeleton h-3 w-12 mx-auto mb-1 rounded"></div>
                          <div className="skeleton h-6 w-6 mx-auto rounded"></div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="skeleton h-8 flex-1 rounded-lg"></div>
                      <div className="skeleton h-8 flex-1 rounded-lg"></div>
                      <div className="skeleton h-8 w-8 rounded-lg"></div>
                    </div>
                  </div>
                </Card>
              ))}
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
          </div>

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

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPrograms && filteredPrograms.length > 0 ? (
              filteredPrograms.map((program: any, index: number) => {
                const details = programDetails[program.id]
                const isRefreshing = refreshingPrograms.has(program.id)
                const tracksCount = details?.tracks?.length ?? 0
                const cohortsCount = details?.cohorts?.length ?? 0
                const enrollmentStats = details?.enrollmentStats || { total: 0, active: 0, pending: 0 }
                const isLoadingDetails = !details
                
                return (
                  <Card 
                    key={program.id} 
                    className="program-card group relative overflow-hidden hover:border-och-defender/60 transition-all duration-500 hover:shadow-xl hover:shadow-och-defender/20 bg-gradient-to-br from-och-midnight/90 to-och-midnight/60 border-och-steel/30 hover:scale-[1.02] backdrop-blur-sm"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-och-defender/5 via-transparent to-och-mint/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${program.status === 'active' ? 'bg-och-mint status-active' : program.status === 'archived' ? 'bg-och-steel' : 'bg-och-orange status-pending'}`} />
                            <h3 className="text-lg font-bold text-white group-hover:text-och-defender transition-colors duration-300 leading-tight" title={program.name}>
                              {program.name}
                            </h3>
                            {isRefreshing && (
                              <div className="flex-shrink-0">
                                <svg className="w-4 h-4 text-och-defender animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge 
                              variant={program.status === 'active' ? 'defender' : program.status === 'archived' ? 'steel' : 'outline'}
                              className="text-xs font-medium px-2 py-1"
                            >
                              {program.status || 'active'}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-2 py-1 border-och-mint/30 text-och-mint">
                              {program.category || 'General'}
                            </Badge>
                          </div>
                          <p className="text-sm text-och-steel/90 line-clamp-2 leading-relaxed">
                            {program.description || 'No description available'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-gradient-to-br from-och-midnight/60 to-och-midnight/40 rounded-lg border border-och-steel/20 backdrop-blur-sm">
                        <div className="stat-card text-center group/stat">
                          <div className="text-xs text-och-steel/80 mb-1 font-medium uppercase tracking-wider">Tracks</div>
                          <div className="text-lg font-bold text-white group-hover/stat:text-och-defender transition-colors">
                            {isLoadingDetails ? (
                              <div className="flex justify-center">
                                <div className="w-4 h-4 skeleton rounded-full"></div>
                              </div>
                            ) : (
                              <span className="bg-gradient-to-r from-och-defender to-och-mint bg-clip-text text-transparent">{tracksCount}</span>
                            )}
                          </div>
                        </div>
                        <div className="stat-card text-center group/stat">
                          <div className="text-xs text-och-steel/80 mb-1 font-medium uppercase tracking-wider">Cohorts</div>
                          <div className="text-lg font-bold text-white group-hover/stat:text-och-mint transition-colors">
                            {isLoadingDetails ? (
                              <div className="flex justify-center">
                                <div className="w-4 h-4 skeleton rounded-full"></div>
                              </div>
                            ) : (
                              <span className="bg-gradient-to-r from-och-mint to-och-defender bg-clip-text text-transparent">{cohortsCount}</span>
                            )}
                          </div>
                        </div>
                        <div className="stat-card text-center group/stat">
                          <div className="text-xs text-och-steel/80 mb-1 font-medium uppercase tracking-wider">Students</div>
                          <div className="text-lg font-bold text-och-mint group-hover/stat:scale-110 transition-transform">
                            {isLoadingDetails ? (
                              <div className="flex justify-center">
                                <div className="w-4 h-4 skeleton rounded-full"></div>
                              </div>
                            ) : (
                              enrollmentStats.total
                            )}
                          </div>
                        </div>
                        <div className="stat-card text-center group/stat">
                          <div className="text-xs text-och-steel/80 mb-1 font-medium uppercase tracking-wider">Duration</div>
                          <div className="text-lg font-bold text-white group-hover/stat:text-och-gold transition-colors">
                            {program.duration_months ? (
                              <span className="bg-gradient-to-r from-och-gold to-och-orange bg-clip-text text-transparent">
                                {program.duration_months}mo
                              </span>
                            ) : (
                              <span className="text-och-steel">N/A</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {details && enrollmentStats.total > 0 && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-och-mint/10 to-och-defender/10 rounded-lg border border-och-mint/20">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-och-steel font-medium">Active</span>
                            <span className="text-och-mint font-bold">{enrollmentStats.active}</span>
                          </div>
                          {enrollmentStats.pending > 0 && (
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-och-steel font-medium">Pending</span>
                              <span className="text-och-orange font-bold">{enrollmentStats.pending}</span>
                            </div>
                          )}
                          <div className="w-full bg-och-midnight/50 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="progress-bar h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${enrollmentStats.total > 0 ? (enrollmentStats.active / enrollmentStats.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-3 border-t border-och-steel/30">
                        <Link href={`/dashboard/director/programs/${program.id}`} className="flex-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="enhanced-button w-full text-xs border-och-defender/50 text-och-defender hover:bg-och-defender hover:text-white transition-all duration-300"
                          >
                            View
                          </Button>
                        </Link>
                        <Link href={`/dashboard/director/programs/${program.id}/edit`} className="flex-1">
                          <Button 
                            variant="defender" 
                            size="sm" 
                            className="enhanced-button w-full text-xs transition-all duration-300"
                          >
                            Edit
                          </Button>
                        </Link>
                        
                        <div className="relative group/menu">
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2 border-och-steel/50 text-och-steel hover:border-och-mint hover:text-och-mint transition-all duration-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </Button>
                          
                          <div className="dropdown-menu absolute right-0 top-full mt-1 w-44 bg-och-midnight/95 backdrop-blur-md border border-och-steel/30 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 z-50">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  if (program.id) fetchProgramDetails(program.id, true)
                                }}
                                disabled={isRefreshing}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-och-steel hover:bg-och-defender/20 hover:text-och-mint transition-all duration-200 disabled:opacity-50"
                              >
                                <svg className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                              </button>
                              <Link
                                href={`/dashboard/director/programs/${program.id}/analytics`}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-och-steel hover:bg-och-defender/20 hover:text-och-mint transition-all duration-200"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Analytics
                              </Link>
                              <div className="border-t border-och-steel/20 my-1" />
                              <button
                                onClick={() => handleDelete(program.id, program.name)}
                                disabled={isDeleting}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-och-orange hover:bg-och-orange/20 transition-all duration-200 disabled:opacity-50"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
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
                  <Link href="/dashboard/director/programs/new" prefetch={true}>
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