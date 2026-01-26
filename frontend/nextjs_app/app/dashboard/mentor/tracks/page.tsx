'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useTracks, usePrograms, useTrack, useProgram } from '@/hooks/usePrograms'
import { programsClient, type Track, type Milestone, type Module, type Cohort } from '@/services/programsClient'

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

export default function MentorTracksPage() {
  const { user } = useAuth()
  const router = useRouter()
  const mentorId = user?.id?.toString()
  
  const { programs } = usePrograms()
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all')
  const [selectedCohortId, setSelectedCohortId] = useState<string>('all')
  
  // Always load all tracks (for assigned cohorts view)
  const { tracks: allTracksFromAPI, isLoading: allTracksLoading } = useTracks()
  
  // Fetch tracks for selected program
  const { tracks: programTracks, isLoading: programTracksLoading } = useTracks(
    selectedProgramId !== 'all' ? selectedProgramId : undefined
  )
  
  // Also fetch program detail (includes tracks nested in program object - more reliable)
  const { program: selectedProgramDetail, isLoading: loadingProgramDetail } = useProgram(
    selectedProgramId !== 'all' ? selectedProgramId : ''
  )
  
  // State for manual track fetching fallback
  const [manuallyFetchedTracks, setManuallyFetchedTracks] = useState<Track[]>([])
  const [isManuallyFetching, setIsManuallyFetching] = useState(false)
  
  // Manually fetch tracks if hooks aren't working
  useEffect(() => {
    const fetchTracksManually = async () => {
      if (selectedProgramId === 'all') return
      if (programTracks.length > 0 || (selectedProgramDetail?.tracks && selectedProgramDetail.tracks.length > 0)) return
      if (isManuallyFetching) return
      
      setIsManuallyFetching(true)
      try {
        console.log('🔄 Manually fetching tracks for program:', selectedProgramId)
        const tracks = await programsClient.getTracks(selectedProgramId)
        console.log('✅ Manually fetched tracks:', tracks.length)
        setManuallyFetchedTracks(Array.isArray(tracks) ? tracks : [])
      } catch (err) {
        console.error('❌ Failed to manually fetch tracks:', err)
        setManuallyFetchedTracks([])
      } finally {
        setIsManuallyFetching(false)
      }
    }
    
    // Only fetch if we've waited a bit and still no tracks
    const timeout = setTimeout(() => {
      if (selectedProgramId !== 'all' && !programTracksLoading && !loadingProgramDetail) {
        fetchTracksManually()
      }
    }, 2000)
    
    return () => clearTimeout(timeout)
  }, [selectedProgramId, programTracks.length, selectedProgramDetail?.tracks?.length, programTracksLoading, loadingProgramDetail, isManuallyFetching])

  // Combine tracks from different sources
  const allTracks = useMemo(() => {
    if (selectedProgramId !== 'all') {
      // When program is selected, prefer tracks from program detail (more reliable)
      if (selectedProgramDetail?.tracks && Array.isArray(selectedProgramDetail.tracks) && selectedProgramDetail.tracks.length > 0) {
        console.log('✅ Using tracks from program detail:', {
          programId: selectedProgramId,
          tracksCount: selectedProgramDetail.tracks.length,
          tracks: selectedProgramDetail.tracks.map((t: any) => ({ id: String(t.id), name: t.name }))
        })
        return selectedProgramDetail.tracks
      }
      // Fallback to tracks from tracks endpoint
      if (programTracks.length > 0) {
        console.log('📡 Using tracks from tracks endpoint for program:', {
          programId: selectedProgramId,
          tracksCount: programTracks.length,
          tracks: programTracks.map(t => ({ id: String(t.id), name: t.name }))
        })
        return programTracks
      }
      // Fallback to manually fetched tracks
      if (manuallyFetchedTracks.length > 0) {
        console.log('🔧 Using manually fetched tracks:', {
          programId: selectedProgramId,
          tracksCount: manuallyFetchedTracks.length
        })
        return manuallyFetchedTracks
      }
      // If still no tracks, log warning
      console.warn('⚠️ No tracks found for program:', selectedProgramId)
      return []
    }
    // When showing all, use all tracks from API
    console.log('📋 Using all tracks from API:', {
      tracksCount: allTracksFromAPI.length,
      tracks: allTracksFromAPI.map(t => ({ id: String(t.id), name: t.name }))
    })
    return allTracksFromAPI
  }, [selectedProgramId, selectedProgramDetail, programTracks, allTracksFromAPI, manuallyFetchedTracks])
  
  const tracksLoading = allTracksLoading || (selectedProgramId !== 'all' && (programTracksLoading || loadingProgramDetail))
  
  const [assignments, setAssignments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trackDetails, setTrackDetails] = useState<Record<string, { milestones: Milestone[]; modules: Module[]; cohorts: Cohort[] }>>({})
  const [fullTrackDetails, setFullTrackDetails] = useState<Record<string, Track>>({})
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set())
  const [loadingFullTracks, setLoadingFullTracks] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'cohorts' | 'milestones'>('name')

  // Load mentor assignments to get assigned tracks
  useEffect(() => {
    const loadAssignments = async () => {
      if (!mentorId) return

      setIsLoading(true)
      setError(null)

      try {
        const mentorAssignmentsList = await programsClient.getMentorAssignments(mentorId)
        const activeAssignments = mentorAssignmentsList.filter(a => a.active)
        
        console.log('Active assignments:', activeAssignments.length)
        
        if (activeAssignments.length === 0) {
          setAssignments([])
          setIsLoading(false)
          return
        }

        // Get unique cohort IDs
        const cohortIds = Array.from(new Set(activeAssignments.map(a => String(a.cohort))))
        console.log('Cohort IDs to fetch:', cohortIds)
        
        // Fetch cohort details in parallel
        const cohortPromises = cohortIds.map(async (cohortId) => {
          try {
            return await programsClient.getCohort(cohortId)
          } catch (err) {
            console.error(`Failed to load cohort ${cohortId}:`, err)
            return null
          }
        })
        
        const cohortDetails = (await Promise.all(cohortPromises)).filter(Boolean) as Cohort[]
        
        // Log cohort details for debugging
        console.log('Loaded cohorts:', cohortDetails.map(c => ({
          id: c.id,
          name: c.name,
          track: c.track,
          track_name: c.track_name
        })))
        
        // Check which cohorts have tracks
        const cohortsWithTracks = cohortDetails.filter(c => c.track)
        console.log('Cohorts with tracks:', cohortsWithTracks.length, 'out of', cohortDetails.length)
        
        const enrichedAssignments = activeAssignments.map(a => {
          const cohort = cohortDetails.find(c => String(c.id) === String(a.cohort))
          if (cohort) {
            console.log(`Assignment ${a.id}: Cohort ${cohort.name} has track: ${cohort.track || 'none'} (${cohort.track_name || 'no name'})`)
          } else {
            console.warn(`Assignment ${a.id}: Cohort not found for ${a.cohort}`)
          }
          return { ...a, cohort }
        })
        
        setAssignments(enrichedAssignments)
      } catch (err: any) {
        console.error('Failed to load mentor assignments:', err)
        setError(err?.message || 'Failed to load assigned tracks')
      } finally {
        setIsLoading(false)
      }
    }

    if (mentorId) {
      loadAssignments()
    }
  }, [mentorId])

  // Get unique cohorts and programs from assignments
  const availableCohorts = useMemo(() => {
    const uniqueCohorts = new Map<string, Cohort>()
    assignments.forEach(a => {
      if (a.cohort) {
        uniqueCohorts.set(String(a.cohort.id), a.cohort)
      }
    })
    return Array.from(uniqueCohorts.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [assignments])

  const availablePrograms = useMemo(() => {
    const programMap = new Map<string, { id: string; name: string }>()
    
    // Get all programs from the programs hook (all available programs)
    programs.forEach(program => {
      if (program.id) {
        programMap.set(String(program.id), { id: program.id || '', name: program.name })
      }
    })
    
    // Also include programs from all loaded tracks
    allTracksFromAPI.forEach(track => {
      if (track.program) {
        const program = programs.find(p => String(p.id) === String(track.program))
        if (program) {
          programMap.set(String(program.id), { id: program.id || '', name: program.name })
        } else if (track.program_name) {
          // If program not found but we have program_name, use track's program reference
          programMap.set(String(track.program), { id: String(track.program), name: track.program_name })
        }
      }
    })
    
    // Include program from selected program detail if available
    if (selectedProgramDetail) {
      programMap.set(String(selectedProgramDetail.id), { 
        id: selectedProgramDetail.id || '', 
        name: selectedProgramDetail.name 
      })
    }
    
    return Array.from(programMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [allTracksFromAPI, programs, selectedProgramDetail])

  // Get unique track IDs from mentor's assigned cohorts
  const assignedTrackIds = useMemo(() => {
    if (!assignments.length) return []
    
    const trackIds = new Set<string>()
    assignments.forEach(a => {
      const trackId = a.cohort?.track
      if (trackId) {
        trackIds.add(String(trackId))
      }
    })
    
    return Array.from(trackIds)
  }, [assignments])

  // Get tracks based on filter mode
  // If program is selected, show all tracks from that program
  // Otherwise, show only tracks assigned to mentor's cohorts
  const assignedTracks = useMemo(() => {
    console.log('🔍 Computing tracks:', {
      selectedProgramId,
      assignmentsCount: assignments.length,
      allTracksCount: allTracks.length,
      assignedTrackIds: assignedTrackIds,
      allTracksFromAPICount: allTracksFromAPI.length,
      programTracksCount: programTracks.length,
      selectedProgramDetailTracks: selectedProgramDetail?.tracks?.length || 0,
    })
    
    // If a program is selected, show all tracks from that program
    if (selectedProgramId !== 'all') {
      console.log(`📋 Showing all tracks for program: ${selectedProgramId}`)
      
      if (!allTracks.length) {
        console.log('⚠️ No tracks loaded for selected program yet')
        return []
      }
      
      const programTracks = allTracks.map(track => {
        // Find cohorts for this track from assignments
        const trackAssignments = assignments.filter(a => {
          const cohortTrackId = a.cohort?.track ? String(a.cohort.track) : null
          const trackIdStr = String(track.id)
          return cohortTrackId === trackIdStr
        })
        const trackCohorts = trackAssignments.map(a => a.cohort).filter(Boolean) as Cohort[]
        
        return {
          ...track,
          assignments: trackAssignments,
          cohorts: trackCohorts,
        }
      })
      
      console.log(`✅ Found ${programTracks.length} tracks for program`)
      return programTracks
    }
    
    // Otherwise, show only tracks assigned to mentor's cohorts
    console.log('👤 Showing tracks assigned to mentor cohorts')
    
    if (!assignments.length) {
      console.log('No assignments found')
      return []
    }
    
    if (assignedTrackIds.length === 0) {
      console.log('⚠️ No track IDs found in cohorts')
      return []
    }
    
    // Use allTracksFromAPI as the source for matching (always loaded, contains all tracks)
    const tracksToSearch = allTracksFromAPI.length > 0 ? allTracksFromAPI : allTracks
    
    if (!tracksToSearch.length) {
      console.log('⚠️ No tracks available to search')
      return []
    }
    
    console.log(`🔍 Searching in ${tracksToSearch.length} tracks for ${assignedTrackIds.length} track IDs`)
    console.log('Track IDs to find:', assignedTrackIds)
    console.log('Available track IDs:', tracksToSearch.map(t => String(t.id)))
    
    // Find matching tracks from available tracks
    const matchingTracks = tracksToSearch.filter(t => {
      const trackIdStr = String(t.id)
      const matches = assignedTrackIds.includes(trackIdStr)
      if (matches) {
        console.log(`✅ Matched track: ${t.name} (${trackIdStr})`)
      }
      return matches
    })
    
    console.log(`📊 Matched ${matchingTracks.length} tracks out of ${assignedTrackIds.length} expected`)
    
    // Enrich tracks with cohort and assignment info
    const enrichedTracks = matchingTracks.map(track => {
      const trackAssignments = assignments.filter(a => {
        const cohortTrackId = a.cohort?.track ? String(a.cohort.track) : null
        const trackIdStr = String(track.id)
        return cohortTrackId === trackIdStr
      })
      const trackCohorts = trackAssignments.map(a => a.cohort).filter(Boolean) as Cohort[]
      
      return {
        ...track,
        assignments: trackAssignments,
        cohorts: trackCohorts,
      }
    })
    
    console.log('✅ Final assigned tracks:', enrichedTracks.length, enrichedTracks.map(t => t.name))
    return enrichedTracks
  }, [allTracks, allTracksFromAPI, assignments, assignedTrackIds, selectedProgramId, programTracks, selectedProgramDetail])

  // Fetch full track details for each assigned track from the program
  useEffect(() => {
    const fetchFullTrackDetails = async () => {
      if (assignedTracks.length === 0) return

      for (const track of assignedTracks) {
        const trackId = String(track.id)
        
        // Skip if already loaded or loading
        if (fullTrackDetails[trackId] || loadingFullTracks.has(trackId)) continue

        setLoadingFullTracks(prev => new Set([...Array.from(prev), trackId]))

        try {
          console.log(`Fetching full track details for: ${track.name} (${trackId})`)
          const fullTrack = await programsClient.getTrack(trackId)
          console.log(`✅ Loaded full track details:`, fullTrack)
          
          setFullTrackDetails(prev => ({
            ...prev,
            [trackId]: fullTrack,
          }))
        } catch (err) {
          console.error(`Failed to fetch full track details for ${trackId}:`, err)
        } finally {
          setLoadingFullTracks(prev => {
            const newSet = new Set(prev)
            newSet.delete(trackId)
            return newSet
          })
        }
      }
    }

    fetchFullTrackDetails()
  }, [assignedTracks])

  // Load track details (milestones, modules)
  const loadTrackDetails = async (trackId: string) => {
    if (trackDetails[trackId] || loadingDetails.has(trackId)) return

    setLoadingDetails(prev => new Set([...Array.from(prev), trackId]))

    try {
      const [milestones, allModules] = await Promise.all([
        programsClient.getMilestones(trackId),
        programsClient.getModules(undefined, trackId),
      ])

      // Load modules for each milestone
      const modulesByMilestone: Record<string, Module[]> = {}
      for (const milestone of milestones) {
        if (milestone.id) {
          try {
            const milestoneModules = await programsClient.getModules(milestone.id)
            modulesByMilestone[milestone.id] = milestoneModules.sort((a, b) => (a.order || 0) - (b.order || 0))
          } catch (err) {
            console.error(`Failed to load modules for milestone ${milestone.id}:`, err)
            modulesByMilestone[milestone.id] = []
          }
        }
      }

      // Combine all modules
      const allModulesList = Object.values(modulesByMilestone).flat()
      const uniqueModules = Array.from(
        new Map(allModulesList.map(m => [m.id, m])).values()
      )

      // Get cohorts for this track from assignments
      const trackCohorts = assignments
        .filter(a => String(a.cohort?.track) === String(trackId))
        .map(a => a.cohort)
        .filter(Boolean) as Cohort[]

      setTrackDetails(prev => ({
        ...prev,
        [trackId]: {
          milestones: milestones.sort((a, b) => (a.order || 0) - (b.order || 0)),
          modules: uniqueModules.sort((a, b) => (a.order || 0) - (b.order || 0)),
          cohorts: trackCohorts,
        },
      }))
    } catch (err) {
      console.error(`Failed to load track details for ${trackId}:`, err)
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev)
        newSet.delete(trackId)
        return newSet
      })
    }
  }

  const toggleTrack = (trackId: string) => {
    const newExpanded = new Set(expandedTracks)
    if (newExpanded.has(trackId)) {
      newExpanded.delete(trackId)
    } else {
      newExpanded.add(trackId)
      loadTrackDetails(trackId)
    }
    setExpandedTracks(newExpanded)
  }

  // Filter and sort tracks
  const filteredAndSortedTracks = useMemo(() => {
    let filtered = assignedTracks
    
    // Apply program filter
    if (selectedProgramId !== 'all') {
      filtered = filtered.filter(track => {
        const trackProgramId = track.program ? String(track.program) : null
        return trackProgramId === selectedProgramId
      })
    }
    
    // Apply cohort filter
    if (selectedCohortId !== 'all') {
      filtered = filtered.filter(track => {
        return track.cohorts?.some(c => String(c.id) === selectedCohortId)
      })
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(track =>
        track.name.toLowerCase().includes(query) ||
        track.description?.toLowerCase().includes(query) ||
        track.track_type?.toLowerCase().includes(query) ||
        track.key?.toLowerCase().includes(query) ||
        track.cohorts?.some(c => c.name?.toLowerCase().includes(query))
      )
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'cohorts':
          return (b.cohorts?.length || 0) - (a.cohorts?.length || 0)
        case 'milestones':
          const aMilestones = trackDetails[String(a.id)]?.milestones.length || 0
          const bMilestones = trackDetails[String(b.id)]?.milestones.length || 0
          return bMilestones - aMilestones
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })
    
    return filtered
  }, [assignedTracks, searchQuery, sortBy, trackDetails, selectedProgramId, selectedCohortId])

  // Get program name for a track
  const getProgramName = (track: Track) => {
    if (track.program_name) return track.program_name
    if (track.program) {
      const program = programs.find(p => String(p.id) === String(track.program))
      return program?.name || 'Unknown Program'
    }
    return 'No Program'
  }

  // Wait for initial load
  const isInitialLoading = (isLoading && assignments.length === 0) || (tracksLoading && allTracks.length === 0)

  if (isInitialLoading) {
    return (
      <RouteGuard>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
            <div className="text-och-steel">
              {selectedProgramId !== 'all' 
                ? `Loading tracks for selected program...` 
                : 'Loading your assigned tracks...'}
            </div>
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
            <div className="text-och-orange mb-4">Error: {error}</div>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
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
              <h1 className="text-4xl font-bold mb-2 text-och-mint">My Tracks</h1>
              <p className="text-och-steel">
                Explore tracks assigned to your cohorts and view detailed curriculum information.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/mentor/cohorts-tracks')}
              >
                ← Cohorts & Tracks
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-6 p-4">
          <div className="space-y-4">
            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-och-steel mb-2">Filter by Program</label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => {
                    setSelectedProgramId(e.target.value)
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-mint focus:border-och-mint"
                >
                  <option value="all">All Programs</option>
                  {availablePrograms.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-och-steel mb-2">Filter by Cohort</label>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-mint focus:border-och-mint"
                >
                  <option value="all">All Cohorts</option>
                  {availableCohorts.map(cohort => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-och-steel mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-mint"
                >
                  <option value="name">Sort by Name</option>
                  <option value="cohorts">Sort by Cohorts</option>
                  <option value="milestones">Sort by Milestones</option>
                </select>
              </div>
            </div>
            
            {/* Search and View Mode */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm text-och-steel mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search tracks, cohorts, or programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-mint focus:border-och-mint"
                />
              </div>
              <div>
                <label className="block text-sm text-och-steel mb-2">View Mode</label>
                <div className="flex gap-2 bg-och-midnight/50 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'list' ? 'defender' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    List
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'defender' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    Grid
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(selectedProgramId !== 'all' || selectedCohortId !== 'all' || searchQuery.trim()) && (
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-och-steel/20">
                <span className="text-xs text-och-steel">Active filters:</span>
                {selectedProgramId !== 'all' && (
                  <Badge variant="defender" className="text-xs">
                    Program: {availablePrograms.find(p => p.id === selectedProgramId)?.name || 'Unknown'}
                    <button
                      onClick={() => setSelectedProgramId('all')}
                      className="ml-2 hover:text-och-orange"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedCohortId !== 'all' && (
                  <Badge variant="mint" className="text-xs">
                    Cohort: {availableCohorts.find(c => c.id === selectedCohortId)?.name || 'Unknown'}
                    <button
                      onClick={() => setSelectedCohortId('all')}
                      className="ml-2 hover:text-och-orange"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {searchQuery.trim() && (
                  <Badge variant="outline" className="text-xs">
                    Search: {searchQuery}
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-2 hover:text-och-orange"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProgramId('all')
                    setSelectedCohortId('all')
                    setSearchQuery('')
                  }}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Info Banner */}
        {selectedProgramId !== 'all' && (
          <Card className="mb-6 p-4 bg-och-defender/20 border border-och-defender/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium mb-1">
                  Showing tracks from: {availablePrograms.find(p => p.id === selectedProgramId)?.name || 'Selected Program'}
                </p>
                <p className="text-sm text-och-steel">
                  {allTracks.length} track{allTracks.length !== 1 ? 's' : ''} loaded from this program
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProgramId('all')}
              >
                Show All Tracks
              </Button>
            </div>
          </Card>
        )}

        {/* Tracks List */}
        {filteredAndSortedTracks.length === 0 ? (
          <Card className="p-6">
            <div className="text-center py-12">
              <p className="text-och-steel mb-4">
                {assignedTracks.length === 0 
                  ? 'No assigned tracks found.'
                  : 'No tracks match your search criteria.'}
              </p>
              {assignedTracks.length === 0 && (
                <>
                  <p className="text-sm text-och-steel mb-2">
                    {assignments.length > 0 
                      ? `You have ${assignments.length} cohort assignment(s), but no tracks were found. This might mean:` 
                      : 'You have no active cohort assignments.'}
                  </p>
                  {assignments.length > 0 && (
                    <ul className="text-sm text-och-steel text-left max-w-md mx-auto space-y-1 mb-4">
                      <li>• The cohorts may not have tracks assigned yet</li>
                      <li>• The tracks may not be accessible</li>
                      <li>• There may be a data synchronization issue</li>
                    </ul>
                  )}
                  <p className="text-sm text-och-steel">Contact your Program Director if you believe this is an error.</p>
                </>
              )}
            </div>
          </Card>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTracks.map((track) => {
              const trackId = String(track.id)
              const details = trackDetails[trackId]
              const fullTrack = fullTrackDetails[trackId] || track
              const cohortsCount = track.cohorts?.length || 0
              const isLoadingFullTrack = loadingFullTracks.has(trackId)

              return (
                <Card key={trackId} className="overflow-hidden hover:border-och-mint/50 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{fullTrack.name || track.name}</h3>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge variant={(fullTrack.track_type || track.track_type) === 'primary' ? 'defender' : 'gold'}>
                            {(fullTrack.track_type || track.track_type) === 'primary' ? 'Primary' : 'Cross-Track'}
                          </Badge>
                          {(fullTrack.key || track.key) && (
                            <Badge variant="outline" className="text-xs">{fullTrack.key || track.key}</Badge>
                          )}
                          {isLoadingFullTrack && (
                            <Badge variant="outline" className="text-xs">Loading...</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-och-steel mb-4 line-clamp-2">{fullTrack.description || track.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-och-steel">Program:</span>
                        <span className="text-white">{getProgramName(fullTrack || track)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-och-steel">Cohorts:</span>
                        <span className="text-och-mint font-semibold">{cohortsCount}</span>
                      </div>
                      {details && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-och-steel">Milestones:</span>
                            <span className="text-white">{details.milestones.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-och-steel">Modules:</span>
                            <span className="text-white">{details.modules.length}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-och-steel/20">
                      <Button
                        variant="defender"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/mentor/tracks/${trackId}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTrack(trackId)}
                      >
                        {expandedTracks.has(trackId) ? <ChevronDownIcon /> : <ChevronRightIcon />}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          // List View
          <div className="space-y-6">
            {filteredAndSortedTracks
              .filter(track => {
                if (!track.id) {
                  console.warn('⚠️ Filtering out track missing ID:', track)
                  return false
                }
                return true
              })
              .map((track) => {
              const trackId = String(track.id)
              const isExpanded = expandedTracks.has(trackId)
              const details = trackDetails[trackId]
              const fullTrack = fullTrackDetails[trackId] || track // Use full track details if available
              const cohortsCount = track.cohorts?.length || 0
              const isLoadingDetails = loadingDetails.has(trackId)
              const isLoadingFullTrack = loadingFullTracks.has(trackId)

              return (
                <Card key={trackId} className="overflow-hidden">
                  <div className="p-6 border-b border-och-steel/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h2 className="text-2xl font-bold text-white">{fullTrack.name || track.name}</h2>
                          <Badge variant={(fullTrack.track_type || track.track_type) === 'primary' ? 'defender' : 'gold'}>
                            {(fullTrack.track_type || track.track_type) === 'primary' ? 'Primary Track' : 'Cross-Track'}
                          </Badge>
                          {(fullTrack.key || track.key) && (
                            <Badge variant="outline">{fullTrack.key || track.key}</Badge>
                          )}
                          {isLoadingFullTrack && (
                            <Badge variant="outline" className="text-xs">Loading details...</Badge>
                          )}
                        </div>
                        <p className="text-och-steel mb-4">{fullTrack.description || track.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                          <div>
                            <span className="text-och-steel">Program: </span>
                            <span className="text-white font-medium">{getProgramName(fullTrack || track)}</span>
                          </div>
                          <div>
                            <span className="text-och-steel">Cohorts: </span>
                            <span className="text-och-mint font-semibold">{cohortsCount}</span>
                          </div>
                          {details && (
                            <>
                              <div>
                                <span className="text-och-steel">Milestones: </span>
                                <span className="text-white">{details.milestones.length}</span>
                              </div>
                              <div>
                                <span className="text-och-steel">Modules: </span>
                                <span className="text-white">{details.modules.length}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Button
                          variant="defender"
                          onClick={() => {
                            // Ensure trackId is properly formatted and valid
                            if (!track.id) {
                              console.error('❌ Cannot navigate: Track missing ID', track)
                              alert('Error: Track ID is missing. Please contact support.')
                              return
                            }
                            
                            const formattedId = String(track.id).trim()
                            if (!formattedId) {
                              console.error('❌ Cannot navigate: Invalid track ID', { trackId, formattedId, track })
                              alert('Error: Invalid track ID. Please contact support.')
                              return
                            }
                            
                            console.log('🔍 Navigating to track detail:', { 
                              trackId, 
                              formattedId, 
                              track: { 
                                id: track.id, 
                                name: track.name, 
                                key: track.key,
                                program: track.program
                              } 
                            })
                            router.push(`/dashboard/mentor/tracks/${formattedId}`)
                          }}
                        >
                          View Full Details
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => toggleTrack(trackId)}
                          disabled={isLoadingDetails}
                        >
                          {isLoadingDetails ? 'Loading...' : isExpanded ? 'Hide Details' : 'View Details'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Track Details */}
                  {isExpanded && (
                    <div className="p-6 space-y-6">
                      {isLoadingDetails ? (
                        <div className="text-center py-8">
                          <div className="text-och-steel">Loading track details...</div>
                        </div>
                      ) : details ? (
                        <>
                          {/* Associated Cohorts */}
                          {track.cohorts && track.cohorts.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-4">My Assigned Cohorts</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {track.cohorts.map((cohort: Cohort) => {
                                  const assignment = track.assignments?.find(a => String(a.cohort?.id) === String(cohort.id))
                                  return (
                                    <Card
                                      key={cohort.id}
                                      className="p-4 bg-och-midnight/50 border border-och-steel/20 hover:border-och-mint/50 transition-colors cursor-pointer"
                                      onClick={() => router.push(`/dashboard/mentor/cohorts-tracks`)}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <h4 className="text-white font-medium mb-1">{cohort.name}</h4>
                                          <div className="flex items-center gap-2 text-xs text-och-steel">
                                            <span>{cohort.enrolled_count || 0} students</span>
                                            <span>•</span>
                                            <span className="capitalize">{cohort.mode}</span>
                                            {assignment && (
                                              <>
                                                <span>•</span>
                                                <Badge variant="outline" className="text-xs">
                                                  {assignment.role}
                                                </Badge>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <Badge variant={
                                          cohort.status === 'active' || cohort.status === 'running' ? 'mint' :
                                          cohort.status === 'closing' ? 'orange' : 'steel'
                                        }>
                                          {cohort.status}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-och-steel mt-2">
                                        {new Date(cohort.start_date).toLocaleDateString()} - {new Date(cohort.end_date).toLocaleDateString()}
                                      </div>
                                    </Card>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Milestones */}
                          {details.milestones.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-4">Curriculum Milestones</h3>
                              <div className="space-y-3">
                                {details.milestones.map((milestone: Milestone) => {
                                  const milestoneModules = details.modules.filter(
                                    (m: Module) => m.milestone === milestone.id
                                  )
                                  return (
                                    <div
                                      key={milestone.id}
                                      className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <h4 className="text-white font-medium">
                                            {milestone.order}. {milestone.name}
                                          </h4>
                                          {milestone.description && (
                                            <p className="text-sm text-och-steel mt-1">
                                              {milestone.description}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {milestone.duration_weeks && (
                                            <Badge variant="outline" className="text-xs">
                                              {milestone.duration_weeks} weeks
                                            </Badge>
                                          )}
                                          <Badge variant="mint" className="text-xs">
                                            {milestoneModules.length} module{milestoneModules.length !== 1 ? 's' : ''}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-och-steel">Failed to load track details.</div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Summary Stats */}
        {assignedTracks.length > 0 && (
          <Card className="mt-6 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-och-steel">Total Tracks</div>
                <div className="text-2xl font-bold text-och-mint">{assignedTracks.length}</div>
              </div>
              <div>
                <div className="text-sm text-och-steel">Total Cohorts</div>
                <div className="text-2xl font-bold text-och-mint">{assignments.length}</div>
              </div>
              <div>
                <div className="text-sm text-och-steel">Total Milestones</div>
                <div className="text-2xl font-bold text-och-mint">
                  {Object.values(trackDetails).reduce((sum, d) => sum + d.milestones.length, 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-och-steel">Total Modules</div>
                <div className="text-2xl font-bold text-och-mint">
                  {Object.values(trackDetails).reduce((sum, d) => sum + d.modules.length, 0)}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </RouteGuard>
  )
}
