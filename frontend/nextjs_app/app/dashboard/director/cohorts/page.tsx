'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useCohorts, useDeleteCohort, usePrograms, useTracks } from '@/hooks/usePrograms'
import { programsClient, type Cohort, type Program, type Track } from '@/services/programsClient'
import { directorClient } from '@/services/directorClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CohortsPage() {
  const router = useRouter()
  const { programs, isLoading: loadingPrograms } = usePrograms()
  const { tracks, isLoading: loadingTracks } = useTracks()
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all')
  const [selectedTrackId, setSelectedTrackId] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12) // Show 12 cohorts per page in grid layout
  
  // Fetch paginated cohorts
  const { cohorts, pagination, isLoading, error, reload } = useCohorts({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    trackId: selectedTrackId !== 'all' ? selectedTrackId : undefined,
    page: currentPage,
    pageSize: pageSize
  })

  // Filter tracks by selected program
  const availableTracks = useMemo(() => {
    if (selectedProgramId === 'all') return tracks
    return tracks.filter(t => t.program === selectedProgramId)
  }, [selectedProgramId, tracks])

  // Filter cohorts by search query and program (client-side since server handles status and track)
  const filteredCohorts = useMemo(() => {
    return cohorts.filter((cohort) => {
      // Filter by program if selected
      if (selectedProgramId !== 'all') {
        const cohortTrack = tracks.find(t => t.id === cohort.track)
        if (!cohortTrack || cohortTrack.program !== selectedProgramId) {
          return false
        }
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = cohort.name?.toLowerCase().includes(query)
        const matchesTrack = cohort.track_name?.toLowerCase().includes(query)
        if (!matchesName && !matchesTrack) return false
      }
      
      return true
    })
  }, [cohorts, selectedProgramId, tracks, searchQuery])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedTrackId, statusFilter, selectedProgramId])

  // Calculate total pages
  const totalPages = Math.ceil((pagination.count || 0) / pageSize)

  const selectedProgram = useMemo(() => {
    if (selectedProgramId === 'all') return null
    return programs.find(p => p.id === selectedProgramId)
  }, [programs, selectedProgramId])

  const selectedTrack = useMemo(() => {
    if (selectedTrackId === 'all') return null
    return tracks.find(t => t.id === selectedTrackId)
  }, [tracks, selectedTrackId])

  // Reset track filter when program changes
  useEffect(() => {
    if (selectedProgramId !== 'all' && selectedTrackId !== 'all') {
      const trackBelongsToProgram = availableTracks.some(t => t.id === selectedTrackId)
      if (!trackBelongsToProgram) {
        setSelectedTrackId('all')
      }
    }
  }, [selectedProgramId, availableTracks, selectedTrackId])

  const { deleteCohort, isLoading: isDeleting } = useDeleteCohort()
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean
    type: 'delete' | 'archive' | 'status'
    cohort: Cohort | null
    newStatus?: string
  }>({ show: false, type: 'delete', cohort: null })
  const [isProcessing, setIsProcessing] = useState(false)
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuOpen) {
        const menuElement = menuRefs.current[actionMenuOpen]
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setActionMenuOpen(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [actionMenuOpen])

  const handleDelete = async (cohort: Cohort) => {
    setConfirmModal({ show: true, type: 'delete', cohort })
  }

  const handleArchive = async (cohort: Cohort) => {
    if (cohort.status !== 'closing') {
      alert('Cohort must be in "closing" status before it can be archived.')
      return
    }
    setConfirmModal({ show: true, type: 'archive', cohort })
  }

  const handleStatusUpdate = async (cohort: Cohort, newStatus: string) => {
    setConfirmModal({ show: true, type: 'status', cohort, newStatus })
  }

  const confirmAction = async () => {
    if (!confirmModal.cohort) return

    setIsProcessing(true)
    try {
      if (confirmModal.type === 'delete') {
        await deleteCohort(confirmModal.cohort.id)
      } else if (confirmModal.type === 'archive') {
        await directorClient.archiveCohort(confirmModal.cohort.id)
      } else if (confirmModal.type === 'status' && confirmModal.newStatus) {
        await directorClient.updateCohortStatus(confirmModal.cohort.id, confirmModal.newStatus)
      }
      setConfirmModal({ show: false, type: 'delete', cohort: null })
      setActionMenuOpen(null)
      await reload()
    } catch (err: any) {
      alert(err.message || `Failed to ${confirmModal.type} cohort`)
      console.error(`Failed to ${confirmModal.type} cohort:`, err)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusTransitions = (currentStatus: string): string[] => {
    const transitions: Record<string, string[]> = {
      draft: ['active'],
      active: ['running', 'cancelled'],
      running: ['closing', 'cancelled'],
      closing: ['closed'],
      closed: [],
      cancelled: [],
    }
    return transitions[currentStatus] || []
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCohorts = filteredCohorts.length
    const activeCohorts = filteredCohorts.filter(c => c.status === 'active' || c.status === 'running').length
    const totalSeats = filteredCohorts.reduce((sum, c) => sum + (c.seat_cap || 0), 0)
    const totalEnrolled = filteredCohorts.reduce((sum, c) => sum + (c.enrolled_count || 0), 0)
    const avgCompletion = totalCohorts > 0
      ? filteredCohorts.reduce((sum, c) => sum + (c.completion_rate || 0), 0) / totalCohorts
      : 0

    return {
      totalCohorts,
      activeCohorts,
      totalSeats,
      totalEnrolled,
      avgCompletion,
      utilization: totalSeats > 0 ? (totalEnrolled / totalSeats) * 100 : 0
    }
  }, [filteredCohorts])

  if (isLoading || loadingPrograms || loadingTracks) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading cohorts...</p>
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
                  <h2 className="text-xl font-bold text-white">Error Loading Cohorts</h2>
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
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Cohorts Management</h1>
                <p className="text-och-steel">
                  {selectedProgram 
                    ? `Viewing cohorts for: ${selectedProgram.name}${selectedTrack ? ` → ${selectedTrack.name}` : ''}`
                    : selectedTrack
                    ? `Viewing cohorts for track: ${selectedTrack.name}`
                    : 'View and manage all cohorts across programs'}
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/director/cohorts/new">
                  <Button variant="defender" size="sm">
                    + Create Cohort
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Search and Filters Toggle */}
            <Card className="mb-6 border-och-defender/50">
              <div className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="🔍 Search cohorts by name or track..."
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    {showFilters ? '▲ Hide Filters' : '▼ Show Filters'}
                  </Button>
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-och-steel/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Program Filter */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Filter by Program
                        </label>
                        <select
                          value={selectedProgramId}
                          onChange={(e) => {
                            setSelectedProgramId(e.target.value)
                            setSelectedTrackId('all')
                          }}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        >
                          <option value="all">📚 All Programs</option>
                          {programs.map((program) => (
                            <option key={program.id} value={program.id}>
                              {program.name} {program.status === 'active' ? '✓' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Track Filter */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Filter by Track
                        </label>
                        <select
                          value={selectedTrackId}
                          onChange={(e) => setSelectedTrackId(e.target.value)}
                          disabled={selectedProgramId !== 'all' && availableTracks.length === 0}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender/30 rounded-lg text-white focus:outline-none focus:border-och-defender disabled:opacity-50"
                        >
                          <option value="all">🎯 All Tracks</option>
                          {availableTracks.map((track) => (
                            <option key={track.id} value={track.id}>
                              {track.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Filter by Status
                        </label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        >
                          <option value="all">All Statuses</option>
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="running">Running</option>
                          <option value="closing">Closing</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="border-och-defender/30">
                <div className="p-4">
                  <p className="text-xs text-och-steel mb-1">Total Cohorts</p>
                  <p className="text-2xl font-bold text-white">{stats.totalCohorts}</p>
                </div>
              </Card>
              <Card className="border-och-mint/30">
                <div className="p-4">
                  <p className="text-xs text-och-steel mb-1">Active Cohorts</p>
                  <p className="text-2xl font-bold text-och-mint">{stats.activeCohorts}</p>
                </div>
              </Card>
              <Card className="border-och-gold/30">
                <div className="p-4">
                  <p className="text-xs text-och-steel mb-1">Total Seats</p>
                  <p className="text-2xl font-bold text-och-gold">{stats.totalSeats}</p>
                </div>
              </Card>
              <Card className="border-och-orange/30">
                <div className="p-4">
                  <p className="text-xs text-och-steel mb-1">Enrolled</p>
                  <p className="text-2xl font-bold text-och-orange">{stats.totalEnrolled}</p>
                  <p className="text-xs text-och-steel mt-1">
                    {stats.utilization.toFixed(1)}% utilization
                  </p>
                </div>
              </Card>
              <Card className="border-och-defender/30">
                <div className="p-4">
                  <p className="text-xs text-och-steel mb-1">Avg Completion</p>
                  <p className="text-2xl font-bold text-och-defender">{stats.avgCompletion.toFixed(1)}%</p>
                </div>
              </Card>
            </div>

            {/* Cohorts Grid Dashboard */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-och-steel">
                Showing <span className="text-white font-semibold">{filteredCohorts.length}</span> of{' '}
                <span className="text-white font-semibold">{pagination.count || 0}</span> total cohorts
                {filteredCohorts.length !== cohorts.length && searchQuery && ' (search filtered)'}
                {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
              </div>
              <Button onClick={reload} variant="outline" size="sm">
                🔄 Refresh
              </Button>
            </div>

            {filteredCohorts.length === 0 ? (
              <Card>
                <div className="p-12 text-center">
                  <p className="text-och-steel mb-4">No cohorts found</p>
                  {cohorts.length === 0 ? (
                    <div>
                      <p className="text-och-steel mb-4">No cohorts found. Create your first cohort to get started.</p>
                      <Link href="/dashboard/director/cohorts/new">
                        <Button variant="defender">Create New Cohort</Button>
                      </Link>
                    </div>
                  ) : (
                    <p className="text-och-steel">Try adjusting your filters</p>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCohorts.map((cohort) => {
                  const cohortTrack = tracks.find(t => t.id === cohort.track)
                  const cohortProgram = cohortTrack ? programs.find(p => p.id === cohortTrack.program) : null
                  
                  const statusColors = {
                    running: 'border-och-mint/50 bg-och-mint/5 hover:border-och-mint',
                    active: 'border-och-defender/50 bg-och-defender/5 hover:border-och-defender',
                    draft: 'border-och-orange/50 bg-och-orange/5 hover:border-och-orange',
                    closing: 'border-och-gold/50 bg-och-gold/5 hover:border-och-gold',
                    closed: 'border-och-steel/50 bg-och-steel/5 hover:border-och-steel'
                  }
                  
                  const statusColor = statusColors[cohort.status as keyof typeof statusColors] || statusColors.draft
                  
                  const statusTransitions = getStatusTransitions(cohort.status)
                  
                  return (
                    <div key={cohort.id} className="relative">
                      <Card className={`${statusColor} transition-all h-full hover:shadow-lg hover:shadow-och-defender/20`}>
                        <div className="p-6 h-full flex flex-col">
                          {/* Header with Actions */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge 
                                variant={
                                  cohort.status === 'running' ? 'mint' :
                                  cohort.status === 'active' ? 'defender' :
                                  cohort.status === 'closed' ? 'steel' :
                                  'orange'
                                }
                              >
                                {cohort.status}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-och-steel">
                                  {cohort.created_at ? new Date(cohort.created_at).toLocaleDateString() : ''}
                                </span>
                                {/* Action Menu Button */}
                                <div className="relative" ref={(el) => { menuRefs.current[cohort.id] = el }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setActionMenuOpen(actionMenuOpen === cohort.id ? null : cohort.id)
                                    }}
                                    className="p-1.5 hover:bg-och-steel/20 rounded-lg transition-colors"
                                    aria-label="Cohort actions"
                                  >
                                    <svg className="w-5 h-5 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                  </button>
                                  
                                  {/* Action Menu Dropdown */}
                                  {actionMenuOpen === cohort.id && (
                                    <div className="absolute right-0 top-8 z-50 w-48 bg-och-midnight border border-och-steel/30 rounded-lg shadow-xl overflow-hidden">
                                      <Link
                                        href={`/dashboard/director/cohorts/${cohort.id}`}
                                        className="block px-4 py-2 text-sm text-white hover:bg-och-defender/20 transition-colors"
                                        onClick={() => setActionMenuOpen(null)}
                                      >
                                        📊 View Details
                                      </Link>
                                      <Link
                                        href={`/dashboard/director/cohorts/${cohort.id}/edit`}
                                        className="block px-4 py-2 text-sm text-white hover:bg-och-defender/20 transition-colors"
                                        onClick={() => setActionMenuOpen(null)}
                                      >
                                        ✏️ Edit Cohort
                                      </Link>
                                      
                                      {/* Status Update Options */}
                                      {statusTransitions.length > 0 && (
                                        <>
                                          <div className="border-t border-och-steel/20 my-1"></div>
                                          <div className="px-4 py-2 text-xs text-och-steel uppercase">Update Status</div>
                                          {statusTransitions.map((status) => (
                                            <button
                                              key={status}
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleStatusUpdate(cohort, status)
                                                setActionMenuOpen(null)
                                              }}
                                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-och-defender/20 transition-colors"
                                            >
                                              → {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </button>
                                          ))}
                                        </>
                                      )}
                                      
                                      {/* Archive Option */}
                                      {cohort.status === 'closing' && (
                                        <>
                                          <div className="border-t border-och-steel/20 my-1"></div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleArchive(cohort)
                                              setActionMenuOpen(null)
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-och-gold hover:bg-och-gold/20 transition-colors"
                                          >
                                            📦 Archive Cohort
                                          </button>
                                        </>
                                      )}
                                      
                                      {/* Delete Option */}
                                      <div className="border-t border-och-steel/20 my-1"></div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDelete(cohort)
                                          setActionMenuOpen(null)
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-och-orange hover:bg-och-orange/20 transition-colors"
                                      >
                                        🗑️ Delete Cohort
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{cohort.name}</h3>
                            <div className="space-y-1 text-sm">
                              {cohortProgram && (
                                <div className="text-och-steel">
                                  <span className="text-och-defender">📚</span> {cohortProgram.name}
                                </div>
                              )}
                              {cohortTrack && (
                                <div className="text-och-steel">
                                  <span className="text-och-mint">🎯</span> {cohortTrack.name || cohort.track_name}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Key Metrics */}
                          <div className="flex-1 space-y-3 mb-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-och-steel">Enrollment</span>
                                <span className="text-sm font-bold text-white">
                                  {cohort.enrolled_count || 0} / {cohort.seat_cap}
                                </span>
                              </div>
                              <ProgressBar
                                value={cohort.seat_utilization || 0}
                                variant="orange"
                                showLabel={false}
                                className="h-2"
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-och-steel">Completion</span>
                                <span className="text-sm font-bold text-white">
                                  {cohort.completion_rate?.toFixed(1) || 0}%
                                </span>
                              </div>
                              <ProgressBar
                                value={cohort.completion_rate || 0}
                                variant="mint"
                                showLabel={false}
                                className="h-2"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-och-steel/20">
                              <div>
                                <p className="text-xs text-och-steel">Duration</p>
                                <p className="text-xs text-white mt-1 line-clamp-1">
                                  {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'N/A'} - {cohort.end_date ? new Date(cohort.end_date).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-och-steel">Mode</p>
                                <p className="text-xs text-white mt-1 capitalize">{cohort.mode}</p>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-4 border-t border-och-steel/20 space-y-2">
                            <Link href={`/dashboard/director/cohorts/${cohort.id}`} className="block">
                              <div className="w-full text-center px-4 py-2 bg-och-defender text-white rounded-lg font-medium hover:bg-och-defender/80 transition-colors">
                                🎛️ Manage Cohort
                              </div>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Card className="mt-6 border-och-defender/30">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-och-steel text-sm">
                      Page {currentPage} of {totalPages} • {pagination.count || 0} total cohorts
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || isLoading}
                      >
                        ← Previous
                      </Button>
                      <div className="flex gap-1">
                        {/* Show page numbers */}
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
                              disabled={isLoading}
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
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || isLoading}
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmModal.show && confirmModal.cohort && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !isProcessing && setConfirmModal({ show: false, type: 'delete', cohort: null })}>
            <Card className="w-full max-w-md mx-4 border-och-orange/50" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-och-orange text-2xl">
                    {confirmModal.type === 'delete' ? '⚠️' : confirmModal.type === 'archive' ? '📦' : '🔄'}
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {confirmModal.type === 'delete' && 'Delete Cohort'}
                    {confirmModal.type === 'archive' && 'Archive Cohort'}
                    {confirmModal.type === 'status' && 'Update Status'}
                  </h2>
                </div>
                
                <div className="mb-6">
                  <p className="text-och-steel mb-2">
                    {confirmModal.type === 'delete' && (
                      <>
                        Are you sure you want to delete <span className="text-white font-semibold">{confirmModal.cohort.name}</span>? 
                        This action cannot be undone and will affect all enrollments, mentors, and associated data.
                      </>
                    )}
                    {confirmModal.type === 'archive' && (
                      <>
                        Archive <span className="text-white font-semibold">{confirmModal.cohort.name}</span>? 
                        This will trigger certificate issuance and mark the cohort as closed. The cohort will be archived and cannot be reopened.
                      </>
                    )}
                    {confirmModal.type === 'status' && confirmModal.newStatus && (
                      <>
                        Update <span className="text-white font-semibold">{confirmModal.cohort.name}</span> status from{' '}
                        <span className="text-och-gold">{confirmModal.cohort.status}</span> to{' '}
                        <span className="text-och-mint">{confirmModal.newStatus}</span>?
                      </>
                    )}
                  </p>
                  
                  {confirmModal.type === 'delete' && (
                    <div className="mt-4 p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg">
                      <p className="text-sm text-och-orange">
                        ⚠️ This is a destructive action. All enrollments, mentor assignments, and cohort data will be permanently deleted.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => !isProcessing && setConfirmModal({ show: false, type: 'delete', cohort: null })}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={confirmModal.type === 'delete' ? 'orange' : confirmModal.type === 'archive' ? 'gold' : 'defender'}
                    onClick={confirmAction}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </span>
                    ) : (
                      <>
                        {confirmModal.type === 'delete' && 'Delete Cohort'}
                        {confirmModal.type === 'archive' && 'Archive Cohort'}
                        {confirmModal.type === 'status' && 'Update Status'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </DirectorLayout>
    </RouteGuard>
  )
}

