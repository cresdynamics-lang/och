'use client'

import { useState, useMemo, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useTracks, useDeleteTrack, usePrograms, useProgram } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function TracksPage() {
  const router = useRouter()
  const { programs, isLoading: loadingPrograms, reload: reloadPrograms } = usePrograms()
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all')
  const [hasSetDefaultProgram, setHasSetDefaultProgram] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12)
  
  // Set default to first program when programs are loaded
  useEffect(() => {
    if (!loadingPrograms && programs.length > 0 && !hasSetDefaultProgram && selectedProgramId === 'all') {
      setSelectedProgramId(String(programs[0].id))
      setHasSetDefaultProgram(true)
    }
  }, [programs, loadingPrograms, hasSetDefaultProgram, selectedProgramId])
  
  // Fetch selected program details dynamically to get latest updates
  const { program: selectedProgramFromApi, isLoading: loadingSelectedProgram, reload: reloadSelectedProgram } = useProgram(
    selectedProgramId !== 'all' ? selectedProgramId : ''
  )
  
  const { tracks: tracksFromApi, isLoading, error, reload } = useTracks(selectedProgramId === 'all' ? undefined : selectedProgramId)
  const { deleteTrack, isLoading: isDeleting } = useDeleteTrack()
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cohortsMap, setCohortsMap] = useState<Record<string, number>>({})
  
  // State for assign cohorts modal
  const [selectedTrackForAssignment, setSelectedTrackForAssignment] = useState<string | null>(null)
  const [availableCohorts, setAvailableCohorts] = useState<any[]>([])
  const [selectedCohortIds, setSelectedCohortIds] = useState<Set<string>>(new Set())
  const [isLoadingCohorts, setIsLoadingCohorts] = useState(false)
  const [isAssigningCohorts, setIsAssigningCohorts] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)

  // Use fetched program details if available, otherwise fall back to cached list
  const selectedProgram = useMemo(() => {
    if (selectedProgramId === 'all') return null
    // Prefer the fresh API data if available (this ensures we get latest updates)
    if (selectedProgramFromApi) return selectedProgramFromApi
    // Fall back to cached list as backup
    return programs.find(p => p.id === selectedProgramId)
  }, [selectedProgramId, selectedProgramFromApi, programs])

  // Use tracks from program detail if available (more accurate), otherwise use tracks from API
  // Program detail tracks include all tracks without permission filtering issues
  // This ensures we always show the tracks that actually belong to the program
  const tracks = useMemo(() => {
    if (selectedProgramId === 'all') {
      return tracksFromApi
    }
    // Prefer tracks from program detail API as it's the source of truth
    // The program detail endpoint returns all tracks for the program without permission filtering
    if (selectedProgramFromApi?.tracks && Array.isArray(selectedProgramFromApi.tracks) && selectedProgramFromApi.tracks.length > 0) {
      const programTracks = selectedProgramFromApi.tracks
      const apiTracks = tracksFromApi
      
      console.log('📊 Using tracks from program detail API (source of truth):', {
        programId: selectedProgramId,
        programName: selectedProgramFromApi.name,
        tracksFromProgramDetail: programTracks.length,
        tracksFromTracksEndpoint: apiTracks.length,
        programTracks: programTracks.map(t => ({ id: t.id, name: t.name, program: t.program })),
        apiTracks: apiTracks.map(t => ({ id: t.id, name: t.name, program: t.program }))
      })
      
      // If there's a mismatch, log it for debugging
      if (programTracks.length !== apiTracks.length) {
        console.warn('⚠️ Track count mismatch detected!', {
          programDetailTracks: programTracks.length,
          apiTracksEndpoint: apiTracks.length,
          programId: selectedProgramId,
          programName: selectedProgramFromApi.name,
          message: 'Using program detail tracks as source of truth'
        })
        
        // Check if any tracks from program detail are missing from API tracks
        const programTrackIds = new Set(programTracks.map(t => t.id))
        const apiTrackIds = new Set(apiTracks.map(t => t.id))
        const missingFromApi = programTracks.filter(t => !apiTrackIds.has(t.id))
        const extraInApi = apiTracks.filter(t => !programTrackIds.has(t.id))
        
        if (missingFromApi.length > 0) {
          console.warn('📋 Tracks in program but missing from API endpoint:', missingFromApi.map(t => ({ id: t.id, name: t.name })))
        }
        if (extraInApi.length > 0) {
          console.warn('📋 Tracks in API endpoint but not in program:', extraInApi.map(t => ({ id: t.id, name: t.name, program: t.program })))
        }
      }
      
      return programTracks
    }
    // Fall back to tracks from API endpoint if program detail hasn't loaded yet or doesn't have tracks
    console.log('📊 Using tracks from tracks API endpoint:', {
      programId: selectedProgramId,
      tracksCount: tracksFromApi.length
    })
    return tracksFromApi
  }, [selectedProgramId, selectedProgramFromApi, tracksFromApi])

  // Load cohort counts for each track
  useEffect(() => {
    if (tracks.length === 0) {
      setCohortsMap({})
      return
    }
    const loadCohortCounts = async () => {
      const counts: Record<string, number> = {}
      await Promise.all(
        tracks.map(async (track) => {
          if (!track.id) return
          try {
            // `getCohorts` is paginated; use count for an accurate total.
            const res = await programsClient.getCohorts({ trackId: track.id, page: 1, pageSize: 1 })
            counts[track.id] = typeof res?.count === 'number' ? res.count : 0
          } catch (err) {
            console.error(`Failed to load cohorts for track ${track.id}:`, err)
            counts[track.id] = 0
          }
        })
      )
      setCohortsMap(counts)
    }
    loadCohortCounts()
  }, [tracks])

  // Reset pagination when filters/program selection changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedProgramId, filterType, searchQuery])

  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      // Filter by track type
      if (filterType !== 'all' && track.track_type !== filterType) return false
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = track.name?.toLowerCase().includes(query)
        const matchesDescription = track.description?.toLowerCase().includes(query)
        const matchesKey = track.key?.toLowerCase().includes(query)
        if (!matchesName && !matchesDescription && !matchesKey) return false
      }
      
      return true
    })
  }, [tracks, filterType, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredTracks.length / pageSize))

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const paginatedTracks = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredTracks.slice(start, start + pageSize)
  }, [filteredTracks, currentPage, pageSize])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete track "${name}"? This action cannot be undone and will affect all associated cohorts and enrollments.`)) {
      return
    }
    try {
      await deleteTrack(id)
      await reload()
    } catch (err: any) {
      alert(err.message || 'Failed to delete track')
      console.error('Failed to delete track:', err)
    }
  }

  // Handle opening assign cohorts modal
  const handleOpenAssignCohorts = async (trackId: string) => {
    setSelectedTrackForAssignment(trackId)
    setSelectedCohortIds(new Set())
    setAssignError(null)
    setAssignSuccess(null)
    setIsLoadingCohorts(true)
    
    try {
      // Fetch all available cohorts (not filtered by track, so we can see all cohorts)
      const response = await programsClient.getCohorts({ page: 1, pageSize: 1000 })
      const allCohorts = Array.isArray(response) ? response : (response.results || [])
      
      // Filter out cohorts that are already assigned to this track
      const trackCohorts = allCohorts.filter((c: any) => String(c.track) === String(trackId))
      const trackCohortIds = new Set(trackCohorts.map((c: any) => String(c.id)))
      
      // Show all cohorts, but we'll indicate which are already assigned
      setAvailableCohorts(allCohorts)
    } catch (err: any) {
      console.error('Failed to load cohorts:', err)
      setAssignError(err?.message || 'Failed to load available cohorts')
      setAvailableCohorts([])
    } finally {
      setIsLoadingCohorts(false)
    }
  }

  // Handle assigning selected cohorts to track
  const handleAssignCohorts = async () => {
    if (!selectedTrackForAssignment) return
    if (selectedCohortIds.size === 0) {
      setAssignError('Please select at least one cohort to assign')
      return
    }

    setAssignError(null)
    setAssignSuccess(null)
    setIsAssigningCohorts(true)

    try {
      // Update each selected cohort to assign it to the track
      const updatePromises = Array.from(selectedCohortIds).map((cohortId) =>
        programsClient.updateCohort(cohortId, { track: selectedTrackForAssignment })
      )

      await Promise.all(updatePromises)
      
      setAssignSuccess(`Successfully assigned ${selectedCohortIds.size} cohort(s) to the track`)
      
      // Reload tracks and cohorts map
      await reload()
      
      // Reload cohort counts - refetch all tracks to get updated data
      const updatedTracksResponse = await programsClient.getTracks(selectedProgramId === 'all' ? undefined : selectedProgramId)
      const updatedTracks = Array.isArray(updatedTracksResponse) ? updatedTracksResponse : []
      const counts: Record<string, number> = {}
      await Promise.all(
        updatedTracks.map(async (track: any) => {
          if (!track.id) return
          try {
            const res = await programsClient.getCohorts({ trackId: track.id, page: 1, pageSize: 1 })
            counts[track.id] = typeof res?.count === 'number' ? res.count : 0
          } catch (err) {
            counts[track.id] = 0
          }
        })
      )
      setCohortsMap(counts)

      // Close modal after 2 seconds
      setTimeout(() => {
        setSelectedTrackForAssignment(null)
        setSelectedCohortIds(new Set())
        setAssignSuccess(null)
      }, 2000)
    } catch (err: any) {
      console.error('Failed to assign cohorts:', err)
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail || 
                          err?.response?.data?.track?.[0] ||
                          err?.message || 
                          'Failed to assign cohorts to track'
      setAssignError(errorMessage)
    } finally {
      setIsAssigningCohorts(false)
    }
  }

  // Toggle cohort selection
  const toggleCohortSelection = (cohortId: string) => {
    setSelectedCohortIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(cohortId)) {
        newSet.delete(cohortId)
      } else {
        newSet.add(cohortId)
      }
      return newSet
    })
  }

  if (isLoading || loadingPrograms || (selectedProgramId !== 'all' && loadingSelectedProgram)) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (error) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="max-w-7xl mx-auto">
            <Card className="border-och-orange/50">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-och-orange text-xl">⚠️</div>
                  <h2 className="text-xl font-bold text-white">Error Loading Tracks</h2>
                </div>
                <p className="text-och-steel mb-4">{error}</p>
                <Button onClick={reload} variant="defender" size="sm">
                  Retry
                </Button>
              </div>
            </Card>
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
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Tracks Management</h1>
                <p className="text-och-steel">
                  {selectedProgram 
                    ? `Viewing tracks for: ${selectedProgram.name}`
                    : 'View and manage learning tracks across all programs'}
                </p>
              </div>
              <div className="flex gap-3">
                {selectedProgramId !== 'all' && (
                  <Link href={`/dashboard/director/programs/${selectedProgramId}/edit`}>
                    <Button variant="defender" size="sm">
                      Manage Tracks
                    </Button>
                  </Link>
                )}
                {selectedProgramId !== 'all' ? (
                  <Link href={`/dashboard/director/programs/${selectedProgramId}/edit`}>
                    <Button variant="outline" size="sm">
                      + Create Track
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard/director/programs/new">
                    <Button variant="outline" size="sm">
                      + Create Program
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Program Selector - Prominent */}
            <Card className="mb-6 border-och-defender/50">
              <div className="p-6">
                <label className="block text-sm font-medium text-white mb-3">
                  Select Program to Manage Tracks
                </label>
                <div className="flex gap-4 items-center">
                  <select
                    value={selectedProgramId}
                    onChange={(e) => {
                      setSelectedProgramId(e.target.value)
                      setHasSetDefaultProgram(true) // Mark as manually changed
                      setSearchQuery('') // Reset search when changing program
                      setFilterType('all') // Reset filters
                      // Reload programs list to ensure we have latest data
                      if (e.target.value !== 'all') {
                        reloadPrograms()
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-och-midnight/50 border border-och-defender/30 rounded-lg text-white focus:outline-none focus:border-och-defender text-lg font-medium"
                  >
                    <option value="all">📚 All Programs</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name} {program.status === 'active' ? '✓' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedProgramId !== 'all' && selectedProgram && (
                    <Link href={`/dashboard/director/programs/${selectedProgramId}`}>
                      <Button variant="outline" size="sm">
                        View Program Details
                      </Button>
                    </Link>
                  )}
                </div>
                {selectedProgram && (
                  <div className="mt-4 pt-4 border-t border-och-steel/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-och-steel">Status:</span>
                        <Badge 
                          variant={selectedProgram.status === 'active' ? 'defender' : selectedProgram.status === 'archived' ? 'steel' : 'outline'}
                          className="ml-2"
                        >
                          {selectedProgram.status || 'N/A'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-och-steel">Duration:</span>
                        <span className="ml-2 text-white font-medium">
                          {selectedProgram.duration_months ? `${selectedProgram.duration_months} months` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-och-steel">Category:</span>
                        <span className="ml-2 text-white font-medium">
                          {selectedProgram.category || selectedProgram.categories?.[0] || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-och-steel">Tracks:</span>
                        <span className="ml-2 text-white font-medium">
                          {selectedProgramFromApi?.tracks_count ?? selectedProgramFromApi?.tracks?.length ?? tracks.length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Filters */}
            <Card>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Search Tracks</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, key, or description..."
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Track Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="all">All Types</option>
                      <option value="primary">Primary Track</option>
                      <option value="cross_track">Cross-Track Program</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="text-och-steel">
              {selectedProgram ? (
                <>
                  Showing <span className="text-white font-semibold">{filteredTracks.length}</span> of{' '}
                  <span className="text-white font-semibold">{tracks.length}</span> tracks in{' '}
                  <span className="text-och-defender font-semibold">{selectedProgram.name}</span>
                  {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                </>
              ) : (
                <>
                  Showing <span className="text-white font-semibold">{filteredTracks.length}</span> of{' '}
                  <span className="text-white font-semibold">{tracks.length}</span> tracks across all programs
                  {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                </>
              )}
            </div>
            {tracks.length > 0 && (
              <div className="flex gap-2">
                {selectedProgramId !== 'all' && (
                  <Button 
                    onClick={() => {
                      reloadPrograms() // Refresh programs list (for dropdown)
                      reloadSelectedProgram() // Refresh selected program details
                      reload() // Refresh tracks
                    }} 
                    variant="outline" 
                    size="sm"
                    title="Refresh program details and tracks"
                  >
                    🔄 Refresh Program & Tracks
                  </Button>
                )}
                <Button onClick={reload} variant="outline" size="sm" title="Refresh tracks only">
                  🔄 Refresh Tracks
                </Button>
              </div>
            )}
          </div>

          {filteredTracks.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <p className="text-och-steel mb-4">No tracks found</p>
                {tracks.length === 0 ? (
                  <div>
                    {selectedProgramId === 'all' ? (
                      <>
                        <p className="text-och-steel mb-4">No tracks found. Select a program above or create a new program.</p>
                        <Link href="/dashboard/director/programs/new">
                          <Button variant="defender">Create New Program</Button>
                        </Link>
                      </>
                    ) : selectedProgram ? (
                      <>
                        <p className="text-och-steel mb-4">No tracks found in "{selectedProgram.name}". Add tracks to this program.</p>
                        <Link href={`/dashboard/director/programs/${selectedProgramId}`}>
                          <Button variant="defender">View Program Details</Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <p className="text-och-steel mb-4">No programs found. Create a program first, then add tracks to it.</p>
                        <Link href="/dashboard/director/programs/new">
                          <Button variant="defender">Create Your First Program</Button>
                        </Link>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-och-steel">Try adjusting your filters</p>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* List View */}
              <Card className="border-och-defender/30">
                <div className="p-4">
                  <div className="hidden md:grid grid-cols-12 gap-3 text-xs uppercase tracking-wide text-och-steel pb-3 border-b border-och-steel/20">
                    <div className="col-span-5">Track</div>
                    <div className="col-span-2">Key / Program</div>
                    <div className="col-span-1 text-right">Cohorts</div>
                    <div className="col-span-1 text-right">Milestones</div>
                    <div className="col-span-1 text-right">Modules</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  <div className="divide-y divide-och-steel/20">
                    {paginatedTracks.map((track) => {
                      const cohortsCount = cohortsMap[track.id || ''] ?? 0
                      const milestonesCount = track.milestones?.length || 0
                      const modulesCount =
                        track.milestones?.reduce((sum: number, m: any) => sum + (m.modules?.length || 0), 0) || 0

                      return (
                        <div
                          key={track.id}
                          onClick={() => track.id && router.push(`/dashboard/director/tracks/${track.id}`)}
                          className="py-4 cursor-pointer hover:bg-och-midnight/30 transition-colors"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            <div className="md:col-span-5">
                              <div className="flex items-center gap-2">
                                <Badge variant={track.track_type === 'primary' ? 'defender' : 'gold'}>
                                  {track.track_type === 'primary' ? 'Primary' : 'Cross-Track'}
                                </Badge>
                                <div className="text-white font-semibold">{track.name}</div>
                              </div>
                              <div className="text-xs text-och-steel mt-1 line-clamp-1">
                                {track.description || 'No description'}
                              </div>
                            </div>

                            <div className="md:col-span-2">
                              <div className="flex items-center gap-2">
                                <code className="px-2 py-1 bg-och-midnight/50 rounded text-och-defender font-mono text-xs">
                                  {track.key}
                                </code>
                              </div>
                              <div className="text-xs text-och-steel mt-1 line-clamp-1">
                                {track.program_name || (track.program ? `Program: ${track.program}` : 'No program')}
                              </div>
                            </div>

                            <div className="md:col-span-1 md:text-right text-sm text-white">
                              {cohortsCount}
                            </div>
                            <div className="md:col-span-1 md:text-right text-sm text-white">
                              {milestonesCount}
                            </div>
                            <div className="md:col-span-1 md:text-right text-sm text-white">
                              {modulesCount}
                            </div>

                            <div className="md:col-span-2 flex flex-wrap gap-2 md:justify-end">
                              {track.id && (
                                <Button
                                  variant="defender"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/dashboard/director/tracks/${track.id}`)
                                  }}
                                >
                                  Manage
                                </Button>
                              )}
                              {track.program && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/dashboard/director/programs/${track.program}`)
                                  }}
                                >
                                  Program
                                </Button>
                              )}
                              {track.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenAssignCohorts(track.id!)
                                  }}
                                >
                                  Cohorts
                                </Button>
                              )}
                              {track.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(track.id!, track.name)
                                  }}
                                  disabled={isDeleting}
                                  className="text-och-orange hover:text-och-orange/80 hover:border-och-orange"
                                >
                                  {isDeleting ? 'Deleting...' : 'Delete'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Card className="border-och-defender/30">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-och-steel text-sm">
                        Page {currentPage} of {totalPages} • {filteredTracks.length} tracks
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          ← Previous
                        </Button>
                        <div className="flex gap-1">
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
                                className="min-w-[40px]"
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next →
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Assign Cohorts Modal */}
        {selectedTrackForAssignment && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-och-steel/20 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Assign Cohorts to Track</h3>
                  <p className="text-sm text-och-steel mt-1">
                    {tracks.find((t) => t.id === selectedTrackForAssignment)?.name}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTrackForAssignment(null)
                    setSelectedCohortIds(new Set())
                    setAssignError(null)
                    setAssignSuccess(null)
                  }}
                  disabled={isAssigningCohorts}
                >
                  Close
                </Button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {assignError && (
                  <div className="p-3 rounded-lg border border-och-orange/50 bg-och-orange/10 text-och-orange text-sm mb-4">
                    {assignError}
                  </div>
                )}
                {assignSuccess && (
                  <div className="p-3 rounded-lg border border-och-mint/50 bg-och-mint/10 text-och-mint text-sm mb-4">
                    {assignSuccess}
                  </div>
                )}

                {isLoadingCohorts ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                      <p className="text-och-steel">Loading available cohorts...</p>
                    </div>
                  </div>
                ) : availableCohorts.length === 0 ? (
                  <div className="text-center py-12 text-och-steel">
                    <p>No cohorts available. Create cohorts first.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-och-steel">
                        Select cohorts to assign to this track ({selectedCohortIds.size} selected)
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Select all cohorts that aren't already assigned to this track
                          const trackId = selectedTrackForAssignment
                          const notAssignedCohorts = availableCohorts.filter(
                            (c: any) => String(c.track) !== String(trackId)
                          )
                          setSelectedCohortIds(new Set(notAssignedCohorts.map((c: any) => String(c.id))))
                        }}
                      >
                        Select All Available
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {availableCohorts.map((cohort: any) => {
                        const isAlreadyAssigned = String(cohort.track) === String(selectedTrackForAssignment)
                        const isSelected = selectedCohortIds.has(String(cohort.id))
                        
                        return (
                          <div
                            key={cohort.id}
                            className={`p-4 rounded-lg border ${
                              isAlreadyAssigned
                                ? 'border-och-mint/50 bg-och-mint/10'
                                : isSelected
                                ? 'border-och-defender bg-och-defender/10'
                                : 'border-och-steel/20 bg-och-midnight/50'
                            } cursor-pointer hover:border-och-defender/50 transition-colors`}
                            onClick={() => !isAlreadyAssigned && toggleCohortSelection(String(cohort.id))}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  {!isAlreadyAssigned && (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleCohortSelection(String(cohort.id))}
                                      className="w-4 h-4 text-och-defender rounded focus:ring-och-defender"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white">{cohort.name}</span>
                                      {isAlreadyAssigned && (
                                        <Badge variant="mint">Already Assigned</Badge>
                                      )}
                                      <Badge
                                        variant={
                                          cohort.status === 'running'
                                            ? 'mint'
                                            : cohort.status === 'active'
                                            ? 'defender'
                                            : cohort.status === 'closed'
                                            ? 'steel'
                                            : 'orange'
                                        }
                                      >
                                        {cohort.status}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-och-steel mt-1">
                                      {cohort.track_name && `Current Track: ${cohort.track_name}`}
                                      {cohort.start_date && ` • Start: ${new Date(cohort.start_date).toLocaleDateString()}`}
                                      {cohort.seat_cap && ` • Capacity: ${cohort.seat_cap} seats`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-och-steel/20 flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTrackForAssignment(null)
                    setSelectedCohortIds(new Set())
                    setAssignError(null)
                    setAssignSuccess(null)
                  }}
                  disabled={isAssigningCohorts}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="defender"
                  size="sm"
                  onClick={handleAssignCohorts}
                  disabled={isAssigningCohorts || selectedCohortIds.size === 0 || isLoadingCohorts}
                  className="flex-1"
                >
                  {isAssigningCohorts ? 'Assigning...' : `Assign ${selectedCohortIds.size} Cohort(s)`}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </DirectorLayout>
    </RouteGuard>
  )
}

