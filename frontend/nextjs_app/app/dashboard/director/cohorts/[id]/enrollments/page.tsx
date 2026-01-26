'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCohort } from '@/hooks/usePrograms'
import { programsClient, type Enrollment } from '@/services/programsClient'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUsers } from '@/hooks/useUsers'

interface WaitlistEntry {
  id: string
  user: string
  user_email?: string
  user_name?: string
  position: number
  seat_type: string
  enrollment_type: string
  added_at: string
  active: boolean
}

export default function CohortEnrollmentsPage() {
  const params = useParams()
  const router = useRouter()
  const cohortId = params.id as string
  const { cohort, isLoading: loadingCohort, reload: reloadCohort } = useCohort(cohortId)

  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(['all']))
  const [selectedSeatTypes, setSelectedSeatTypes] = useState<Set<string>>(new Set(['all']))
  const [selectedEnrollmentTypes, setSelectedEnrollmentTypes] = useState<Set<string>>(new Set(['all']))
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [updatingEnrollments, setUpdatingEnrollments] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showSeatPoolModal, setShowSeatPoolModal] = useState(false)
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [seatPool, setSeatPool] = useState<{ paid: number; scholarship: number; sponsored: number }>({
    paid: 0,
    scholarship: 0,
    sponsored: 0,
  })

  // Student picker (fetch from backend users endpoint; directors can see all users)
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [assignSeatType, setAssignSeatType] = useState<'paid' | 'scholarship' | 'sponsored'>('paid')
  const [assignEnrollmentType, setAssignEnrollmentType] = useState<'director' | 'invite' | 'sponsor' | 'self'>('director')
  
  // Fetch users for student selection with search
  const { users, isLoading: usersLoading, error: usersError } = useUsers({
    page: 1,
    page_size: 200,
    search: studentSearch.trim() || undefined,
  })
  
  // Filter students from users (excluding already enrolled users)
  const students = useMemo(() => {
    const enrolledUserIds = new Set(enrollments.map(e => String(e.user)))
    return users.filter(u => !enrolledUserIds.has(String(u.id)))
  }, [users, enrollments])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!cohortId) return
      setIsLoading(true)
      setError(null)
      try {
        const [enrolls, waitlistData] = await Promise.all([
          programsClient.getCohortEnrollments(cohortId),
          programsClient.getCohortWaitlist(cohortId).catch(() => []),
        ])
        setEnrollments(enrolls)
        setWaitlist(waitlistData)
      } catch (err: any) {
        console.error('Failed to load enrollment data:', err)
        setError(err?.message || 'Failed to load enrollment data')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [cohortId, cohort])

  // Sync seat pool from cohort data
  useEffect(() => {
    if (cohort?.seat_pool && !showSeatPoolModal) {
      const pool = cohort.seat_pool as any
      setSeatPool({
        paid: pool.paid || 0,
        scholarship: pool.scholarship || 0,
        sponsored: pool.sponsored || 0,
      })
    }
  }, [cohort, showSeatPoolModal])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openFilter) {
        setOpenFilter(null)
      }
    }
    if (openFilter) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [openFilter])

  // Filter enrollments
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      // If 'all' is selected or the specific value is selected, include it
      if (!selectedStatuses.has('all') && !selectedStatuses.has(e.status)) return false
      if (!selectedSeatTypes.has('all') && !selectedSeatTypes.has(e.seat_type)) return false
      if (!selectedEnrollmentTypes.has('all') && !selectedEnrollmentTypes.has(e.enrollment_type)) return false
      return true
    })
  }, [enrollments, selectedStatuses, selectedSeatTypes, selectedEnrollmentTypes])

  // Calculate statistics
  const stats = useMemo(() => {
    const active = enrollments.filter((e) => e.status === 'active').length
    const pending = enrollments.filter((e) => e.status === 'pending_payment').length
    const withdrawn = enrollments.filter((e) => e.status === 'withdrawn').length
    const completed = enrollments.filter((e) => e.status === 'completed').length
    const seatUtilization = cohort ? (active / cohort.seat_cap) * 100 : 0
    const availableSeats = cohort ? Math.max(0, cohort.seat_cap - active) : 0

    return {
      active,
      pending,
      withdrawn,
      completed,
      total: enrollments.length,
      waitlist: waitlist.filter((w) => w.active).length,
      seatUtilization,
      availableSeats,
    }
  }, [enrollments, waitlist, cohort])

  // Handle enrollment approval
  const handleApproveEnrollment = async (enrollmentId: string) => {
    setIsProcessing(true)
    setError(null)
    try {
      const updated = await programsClient.approveEnrollment(cohortId, enrollmentId)
      setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? updated : e)))
    } catch (err: any) {
      setError(err?.message || 'Failed to approve enrollment')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle bulk approval
  const handleBulkApprove = async () => {
    if (selectedEnrollments.size === 0) return
    setIsProcessing(true)
    setError(null)
    try {
      await programsClient.bulkApproveEnrollments(cohortId, Array.from(selectedEnrollments))
      // Reload enrollments
      const enrolls = await programsClient.getCohortEnrollments(cohortId)
      setEnrollments(enrolls)
      setSelectedEnrollments(new Set())
    } catch (err: any) {
      setError(err?.message || 'Failed to approve enrollments')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle status update
  const handleUpdateStatus = async (enrollmentId: string, status: string) => {
    // Optimistic update
    const enrollment = enrollments.find(e => e.id === enrollmentId)
    if (!enrollment) return
    
    // Store original status for rollback
    const originalStatus = enrollment.status
    
    // Optimistically update UI
    setEnrollments((prev) => prev.map((e) => 
      e.id === enrollmentId ? { ...e, status: status as any } : e
    ))
    
    setUpdatingEnrollments((prev) => new Set(prev).add(enrollmentId))
    setError(null)
    
    try {
      const updated = await programsClient.updateEnrollmentStatus(cohortId, enrollmentId, status)
      setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? updated : e)))
    } catch (err: any) {
      // Rollback on error
      setEnrollments((prev) => prev.map((e) => 
        e.id === enrollmentId ? { ...e, status: originalStatus as any } : e
      ))
      setError(err?.message || 'Failed to update enrollment status')
    } finally {
      setUpdatingEnrollments((prev) => {
        const next = new Set(prev)
        next.delete(enrollmentId)
        return next
      })
    }
  }

  const handleBulkStatus = async (statusValue: string) => {
    if (selectedEnrollments.size === 0) return
    setIsProcessing(true)
    setError(null)
    try {
      await programsClient.bulkUpdateEnrollmentsStatus(cohortId, Array.from(selectedEnrollments), statusValue)
      const enrolls = await programsClient.getCohortEnrollments(cohortId)
      setEnrollments(enrolls)
      setSelectedEnrollments(new Set())
    } catch (err: any) {
      setError(err?.message || 'Failed to update enrollments')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkRemove = async () => {
    if (selectedEnrollments.size === 0) return
    if (!confirm(`Remove ${selectedEnrollments.size} enrollment(s)? This will delete the enrollment records.`)) return
    setIsProcessing(true)
    setError(null)
    try {
      await programsClient.bulkRemoveEnrollments(cohortId, Array.from(selectedEnrollments))
      const enrolls = await programsClient.getCohortEnrollments(cohortId)
      setEnrollments(enrolls)
      setSelectedEnrollments(new Set())
    } catch (err: any) {
      setError(err?.message || 'Failed to remove enrollments')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle seat pool update
  const [seatPoolForm, setSeatPoolForm] = useState<{ paid: number; scholarship: number; sponsored: number }>({
    paid: 0,
    scholarship: 0,
    sponsored: 0,
  })
  const [seatPoolError, setSeatPoolError] = useState<string | null>(null)
  const [seatPoolSuccess, setSeatPoolSuccess] = useState<string | null>(null)

  // Initialize seat pool form when cohort loads or modal opens
  useEffect(() => {
    if (showSeatPoolModal && cohort?.seat_pool) {
      const pool = cohort.seat_pool as any
      setSeatPoolForm({
        paid: pool.paid || 0,
        scholarship: pool.scholarship || 0,
        sponsored: pool.sponsored || 0,
      })
    }
  }, [showSeatPoolModal, cohort])

  const handleUpdateSeatPool = async () => {
    setSeatPoolError(null)
    setSeatPoolSuccess(null)

    // Validate total doesn't exceed seat cap
    const total = seatPoolForm.paid + seatPoolForm.scholarship + seatPoolForm.sponsored
    if (cohort && total > cohort.seat_cap) {
      setSeatPoolError(`Total allocated seats (${total}) cannot exceed seat capacity (${cohort.seat_cap})`)
      return
    }

    if (total < 0) {
      setSeatPoolError('Seat allocations cannot be negative')
      return
    }

    setIsProcessing(true)
    try {
      await programsClient.manageSeatPool(cohortId, seatPoolForm)
      setSeatPoolSuccess('Seat pool updated successfully')
      
      // Reload cohort data to sync with backend
      await reloadCohort()
      
      // Update local seat pool state
      setSeatPool(seatPoolForm)
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowSeatPoolModal(false)
        setSeatPoolSuccess(null)
      }, 2000)
    } catch (err: any) {
      console.error('Failed to update seat pool:', err)
      const errorMessage = err?.response?.data?.error || 
                           err?.response?.data?.seat_pool?.[0] ||
                           err?.message || 
                           'Failed to update seat pool. Please check your permissions and try again.'
      setSeatPoolError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleStudentSelection = (userId: string) => {
    const next = new Set(selectedStudentIds)
    if (next.has(userId)) next.delete(userId)
    else next.add(userId)
    setSelectedStudentIds(next)
  }

  const assignSelectedStudents = async () => {
    if (selectedStudentIds.size === 0) return
    setIsProcessing(true)
    setError(null)
    try {
      await programsClient.bulkCreateEnrollments(cohortId, {
        user_ids: Array.from(selectedStudentIds),
        seat_type: assignSeatType,
        enrollment_type: assignEnrollmentType,
      })
      // Reload enrollments/waitlist
      const [enrolls, waitlistData] = await Promise.all([
        programsClient.getCohortEnrollments(cohortId),
        programsClient.getCohortWaitlist(cohortId).catch(() => []),
      ])
      setEnrollments(enrolls)
      setWaitlist(waitlistData)
      setSelectedStudentIds(new Set())
      setShowAssignModal(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to assign students')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle promote from waitlist
  const handlePromoteFromWaitlist = async (count?: number) => {
    setIsProcessing(true)
    setError(null)
    try {
      await programsClient.promoteFromWaitlist(cohortId, count)
      // Reload data
      const [enrolls, waitlistData] = await Promise.all([
        programsClient.getCohortEnrollments(cohortId),
        programsClient.getCohortWaitlist(cohortId).catch(() => []),
      ])
      setEnrollments(enrolls)
      setWaitlist(waitlistData)
    } catch (err: any) {
      setError(err?.message || 'Failed to promote from waitlist')
    } finally {
      setIsProcessing(false)
    }
  }

  // Toggle selection
  const toggleSelection = (enrollmentId: string) => {
    const newSelected = new Set(selectedEnrollments)
    if (newSelected.has(enrollmentId)) {
      newSelected.delete(enrollmentId)
    } else {
      newSelected.add(enrollmentId)
    }
    setSelectedEnrollments(newSelected)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'defender' | 'mint' | 'orange' | 'steel' | 'gold'> = {
      active: 'mint',
      pending_payment: 'orange',
      suspended: 'orange',
      withdrawn: 'steel',
      completed: 'mint',
      incomplete: 'orange',
    }
    return variants[status] || 'steel'
  }

  const getSeatTypeBadge = (seatType: string) => {
    const variants: Record<string, 'defender' | 'mint' | 'orange' | 'gold'> = {
      paid: 'mint',
      scholarship: 'gold',
      sponsored: 'defender',
    }
    return variants[seatType] || 'steel'
  }

  if (loadingCohort || isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading enrollments...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (!cohort) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="border-och-orange/50">
            <div className="p-6 text-center">
              <p className="text-och-orange mb-4">Cohort not found</p>
              <Link href="/dashboard/director/cohorts">
                <Button variant="outline">Back to Cohorts</Button>
              </Link>
            </div>
          </Card>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Manage Enrollments</h1>
                <p className="text-och-steel">{cohort.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="defender">{cohort.status}</Badge>
                  <span className="text-sm text-och-steel">
                    {cohort.track_name} • {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="defender" size="sm" onClick={() => setShowAssignModal(true)}>
                  Assign Students
                </Button>
                <Link href={`/dashboard/director/cohorts/${cohortId}`}>
                  <Button variant="outline" size="sm">
                    ← Back to Cohort
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {error && (
            <Card className="mb-6 border-och-orange/50">
              <div className="p-4 text-och-orange">{error}</div>
            </Card>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Active Enrollments</p>
                <p className="text-2xl font-bold text-och-mint">{stats.active}</p>
                <p className="text-xs text-och-steel mt-1">
                  {stats.seatUtilization.toFixed(1)}% utilization
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Pending Payment</p>
                <p className="text-2xl font-bold text-och-orange">{stats.pending}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Waitlist</p>
                <p className="text-2xl font-bold text-white">{stats.waitlist}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Available Seats</p>
                <p className="text-2xl font-bold text-och-mint">{stats.availableSeats}</p>
                <p className="text-xs text-och-steel mt-1">of {cohort.seat_cap} total</p>
              </div>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex flex-wrap items-start gap-4 mb-4">
                {/* Status Filter */}
                <div className="relative">
                  <label className="text-sm text-och-steel mb-1 block">Status</label>
                  <div className="relative">
                    <button
                      type="button"
                      className="bg-och-midnight border border-och-steel/20 rounded px-3 py-2 text-white text-left w-full min-w-[180px] flex items-center justify-between hover:border-och-defender transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenFilter(openFilter === 'status' ? null : 'status')
                      }}
                    >
                      <span>
                        {selectedStatuses.has('all')
                          ? 'All Status'
                          : `${selectedStatuses.size} selected`}
                      </span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openFilter === 'status' && (
                      <div
                        className="absolute z-10 mt-1 w-full bg-och-midnight border border-och-steel/20 rounded-lg shadow-lg max-h-60 overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                      <div className="p-2">
                        <label className="flex items-center gap-2 p-2 hover:bg-och-midnight/50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStatuses.has('all') || selectedStatuses.size === 6}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStatuses(new Set(['all', 'active', 'pending_payment', 'suspended', 'withdrawn', 'completed']))
                              } else {
                                setSelectedStatuses(new Set(['all']))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-white text-sm">Select All</span>
                        </label>
                        <div className="border-t border-och-steel/20 my-1"></div>
                        {['active', 'pending_payment', 'suspended', 'withdrawn', 'completed'].map((status) => (
                          <label
                            key={status}
                            className="flex items-center gap-2 p-2 hover:bg-och-midnight/50 rounded cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              const newSet = new Set(selectedStatuses)
                              if (newSet.has('all')) newSet.delete('all')
                              if (newSet.has(status)) {
                                newSet.delete(status)
                              } else {
                                newSet.add(status)
                              }
                              // If all individual options are selected, add 'all'
                              if (newSet.size === 5) {
                                newSet.add('all')
                              }
                              // If no options selected, add 'all' back
                              if (newSet.size === 0) {
                                newSet.add('all')
                              }
                              setSelectedStatuses(newSet)
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStatuses.has(status)}
                              onChange={() => {}}
                              className="rounded"
                            />
                            <span className="text-white text-sm capitalize">
                              {status ? status.replace('_', ' ') : 'N/A'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    )}
                  </div>
                </div>

                {/* Seat Type Filter */}
                <div className="relative">
                  <label className="text-sm text-och-steel mb-1 block">Seat Type</label>
                  <div className="relative">
                    <button
                      type="button"
                      className="bg-och-midnight border border-och-steel/20 rounded px-3 py-2 text-white text-left w-full min-w-[180px] flex items-center justify-between hover:border-och-defender transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenFilter(openFilter === 'seat' ? null : 'seat')
                      }}
                    >
                      <span>
                        {selectedSeatTypes.has('all')
                          ? 'All Types'
                          : `${selectedSeatTypes.size} selected`}
                      </span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openFilter === 'seat' && (
                      <div
                        className="absolute z-10 mt-1 w-full bg-och-midnight border border-och-steel/20 rounded-lg shadow-lg max-h-60 overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                      <div className="p-2">
                        <label className="flex items-center gap-2 p-2 hover:bg-och-midnight/50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSeatTypes.has('all') || selectedSeatTypes.size === 4}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSeatTypes(new Set(['all', 'paid', 'scholarship', 'sponsored']))
                              } else {
                                setSelectedSeatTypes(new Set(['all']))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-white text-sm">Select All</span>
                        </label>
                        <div className="border-t border-och-steel/20 my-1"></div>
                        {['paid', 'scholarship', 'sponsored'].map((seatType) => (
                          <label
                            key={seatType}
                            className="flex items-center gap-2 p-2 hover:bg-och-midnight/50 rounded cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              const newSet = new Set(selectedSeatTypes)
                              if (newSet.has('all')) newSet.delete('all')
                              if (newSet.has(seatType)) {
                                newSet.delete(seatType)
                              } else {
                                newSet.add(seatType)
                              }
                              // If all individual options are selected, add 'all'
                              if (newSet.size === 3) {
                                newSet.add('all')
                              }
                              // If no options selected, add 'all' back
                              if (newSet.size === 0) {
                                newSet.add('all')
                              }
                              setSelectedSeatTypes(newSet)
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSeatTypes.has(seatType)}
                              onChange={() => {}}
                              className="rounded"
                            />
                            <span className="text-white text-sm capitalize">{seatType}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    )}
                  </div>
                </div>

                {/* Enrollment Type Filter */}
                <div className="relative">
                  <label className="text-sm text-och-steel mb-1 block">Enrollment Type</label>
                  <div className="relative">
                    <button
                      type="button"
                      className="bg-och-midnight border border-och-steel/20 rounded px-3 py-2 text-white text-left w-full min-w-[180px] flex items-center justify-between hover:border-och-defender transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenFilter(openFilter === 'enrollment' ? null : 'enrollment')
                      }}
                    >
                      <span>
                        {selectedEnrollmentTypes.has('all')
                          ? 'All Types'
                          : `${selectedEnrollmentTypes.size} selected`}
                      </span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openFilter === 'enrollment' && (
                      <div
                        className="absolute z-10 mt-1 w-full bg-och-midnight border border-och-steel/20 rounded-lg shadow-lg max-h-60 overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                      <div className="p-2">
                        <label className="flex items-center gap-2 p-2 hover:bg-och-midnight/50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedEnrollmentTypes.has('all') || selectedEnrollmentTypes.size === 5}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEnrollmentTypes(new Set(['all', 'self', 'sponsor', 'invite', 'director']))
                              } else {
                                setSelectedEnrollmentTypes(new Set(['all']))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-white text-sm">Select All</span>
                        </label>
                        <div className="border-t border-och-steel/20 my-1"></div>
                        {['self', 'sponsor', 'invite', 'director'].map((enrollmentType) => (
                          <label
                            key={enrollmentType}
                            className="flex items-center gap-2 p-2 hover:bg-och-midnight/50 rounded cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              const newSet = new Set(selectedEnrollmentTypes)
                              if (newSet.has('all')) newSet.delete('all')
                              if (newSet.has(enrollmentType)) {
                                newSet.delete(enrollmentType)
                              } else {
                                newSet.add(enrollmentType)
                              }
                              // If all individual options are selected, add 'all'
                              if (newSet.size === 4) {
                                newSet.add('all')
                              }
                              // If no options selected, add 'all' back
                              if (newSet.size === 0) {
                                newSet.add('all')
                              }
                              setSelectedEnrollmentTypes(newSet)
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedEnrollmentTypes.has(enrollmentType)}
                              onChange={() => {}}
                              className="rounded"
                            />
                            <span className="text-white text-sm capitalize">
                              {enrollmentType === 'self' ? 'Self-enroll' : enrollmentType === 'director' ? 'Director Assign' : enrollmentType}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    )}
                  </div>
                </div>

                <div className="flex-1"></div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStatuses(new Set(['all']))
                      setSelectedSeatTypes(new Set(['all']))
                      setSelectedEnrollmentTypes(new Set(['all']))
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
                {selectedEnrollments.size > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="mint"
                      size="sm"
                      onClick={handleBulkApprove}
                      disabled={isProcessing}
                    >
                      Approve Selected ({selectedEnrollments.size})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatus('suspended')}
                      disabled={isProcessing}
                    >
                      Suspend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatus('withdrawn')}
                      disabled={isProcessing}
                    >
                      Withdraw
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkRemove}
                      disabled={isProcessing}
                      className="text-och-orange hover:text-och-orange/80 hover:border-och-orange"
                    >
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEnrollments(new Set())}
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}
              </div>

              {/* Seat Pool Summary */}
              <div className="pt-4 border-t border-och-steel/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">Seat Pool Allocation</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSeatPoolModal(true)}
                  >
                    Manage Seat Pool
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-och-steel">Paid:</span>
                    <span className="text-white ml-2 font-medium">{seatPool.paid}</span>
                  </div>
                  <div>
                    <span className="text-och-steel">Scholarship:</span>
                    <span className="text-white ml-2 font-medium">{seatPool.scholarship}</span>
                  </div>
                  <div>
                    <span className="text-och-steel">Sponsored:</span>
                    <span className="text-white ml-2 font-medium">{seatPool.sponsored}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Enrollments Table */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Enrollments ({filteredEnrollments.length})
                </h2>
                <Button variant="defender" size="sm" onClick={() => setShowAssignModal(true)}>
                  + Assign Students
                </Button>
              </div>

              {filteredEnrollments.length === 0 ? (
                <div className="text-center py-12 text-och-steel">
                  <p>No enrollments found matching the selected filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-och-steel/20">
                        <th className="text-left py-3 px-4 text-sm text-och-steel">
                          <input
                            type="checkbox"
                            checked={selectedEnrollments.size === filteredEnrollments.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEnrollments(new Set(filteredEnrollments.map((e) => e.id)))
                              } else {
                                setSelectedEnrollments(new Set())
                              }
                            }}
                          />
                        </th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Student</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Status</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Seat Type</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Enrollment Type</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Payment</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Joined</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEnrollments.map((enrollment) => (
                        <tr
                          key={enrollment.id}
                          className="border-b border-och-steel/10 hover:bg-och-midnight/50"
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedEnrollments.has(enrollment.id)}
                              onChange={() => toggleSelection(enrollment.id)}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-white font-medium">
                                {enrollment.user_name || enrollment.user_email || enrollment.user}
                              </p>
                              {enrollment.user_email && enrollment.user_name && (
                                <p className="text-xs text-och-steel">{enrollment.user_email}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={getStatusBadge(enrollment.status)}>
                              {enrollment.status ? enrollment.status.replace('_', ' ') : 'N/A'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={getSeatTypeBadge(enrollment.seat_type)}>
                              {enrollment.seat_type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-och-steel capitalize">
                            {enrollment.enrollment_type ? enrollment.enrollment_type.replace('_', ' ') : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                enrollment.payment_status === 'paid'
                                  ? 'mint'
                                  : enrollment.payment_status === 'waived'
                                  ? 'gold'
                                  : 'orange'
                              }
                            >
                              {enrollment.payment_status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-och-steel">
                            {new Date(enrollment.joined_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2 items-center">
                              {enrollment.status === 'pending_payment' && (
                                <Button
                                  variant="mint"
                                  size="sm"
                                  onClick={() => handleApproveEnrollment(enrollment.id)}
                                  disabled={isProcessing || updatingEnrollments.has(enrollment.id)}
                                >
                                  Approve
                                </Button>
                              )}
                              <div className="relative">
                              <select
                                value={enrollment.status}
                                  onChange={(e) => {
                                    handleUpdateStatus(enrollment.id, e.target.value)
                                  }}
                                  className="bg-och-midnight border border-och-steel/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-och-defender focus:ring-1 focus:ring-och-defender transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8 min-w-[140px]"
                                  disabled={isProcessing || updatingEnrollments.has(enrollment.id)}
                              >
                                  <option value="active" className="bg-och-midnight">Active</option>
                                  <option value="pending_payment" className="bg-och-midnight">Pending Payment</option>
                                  <option value="suspended" className="bg-och-midnight">Suspended</option>
                                  <option value="withdrawn" className="bg-och-midnight">Withdrawn</option>
                                  <option value="completed" className="bg-och-midnight">Completed</option>
                              </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                  {updatingEnrollments.has(enrollment.id) ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-och-defender"></div>
                                  ) : (
                                    <svg className="w-4 h-4 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {/* Waitlist */}
          {waitlist.filter((w) => w.active).length > 0 && (
            <Card className="mt-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Waitlist ({waitlist.filter((w) => w.active).length})
                  </h2>
                  {stats.availableSeats > 0 && (
                    <Button
                      variant="mint"
                      size="sm"
                      onClick={() => handlePromoteFromWaitlist(stats.availableSeats)}
                      disabled={isProcessing}
                    >
                      Promote All Available ({stats.availableSeats})
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {waitlist
                    .filter((w) => w.active)
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-och-midnight/50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-och-mint font-bold w-8">#{entry.position}</span>
                          <div>
                            <p className="text-white font-medium">
                              {entry.user_name || entry.user_email || entry.user}
                            </p>
                            <p className="text-xs text-och-steel">
                              {entry.seat_type} • {entry.enrollment_type} • Added{' '}
                              {new Date(entry.added_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {stats.availableSeats > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePromoteFromWaitlist(1)}
                            disabled={isProcessing}
                          >
                            Promote
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Assign Students Modal */}
        {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl bg-och-midnight border border-och-steel/20 rounded-xl shadow-xl">
            <div className="p-6 border-b border-och-steel/20 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Assign Students</h3>
                <p className="text-sm text-och-steel mt-1">Search and select students, then assign in bulk.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAssignModal(false)} disabled={isProcessing}>
                Close
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {(usersError || error) && (
                <div className="p-3 rounded-lg border border-och-orange/50 bg-och-orange/10 text-och-orange text-sm">
                  {error || usersError || 'An error occurred'}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">Search students</label>
                  <input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Seat type</label>
                  <select
                    value={assignSeatType}
                    onChange={(e) => setAssignSeatType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="paid">Paid</option>
                    <option value="scholarship">Scholarship</option>
                    <option value="sponsored">Sponsored</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Enrollment type</label>
                  <select
                    value={assignEnrollmentType}
                    onChange={(e) => setAssignEnrollmentType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="director">Director assign</option>
                    <option value="invite">Invite</option>
                    <option value="sponsor">Sponsor</option>
                    <option value="self">Self</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex items-end justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStudentIds(new Set())}
                    disabled={isProcessing || selectedStudentIds.size === 0}
                  >
                    Clear Selected
                  </Button>
                  <Button
                    variant="defender"
                    size="sm"
                    onClick={assignSelectedStudents}
                    disabled={isProcessing || selectedStudentIds.size === 0}
                  >
                    {isProcessing ? 'Assigning...' : `Assign Selected (${selectedStudentIds.size})`}
                  </Button>
                </div>
              </div>

              <Card className="border-och-steel/20">
                <div className="p-4">
                  <div className="max-h-[340px] overflow-auto divide-y divide-och-steel/10">
                    {students.map((u: any) => (
                      <div
                        key={u.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.has(String(u.id))}
                            onChange={() => toggleStudentSelection(String(u.id))}
                            disabled={isProcessing}
                          />
                          <div>
                            <div className="text-white font-medium">
                              {(u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.email}
                            </div>
                            <div className="text-xs text-och-steel">{u.email}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {u.roles?.slice(0, 2).map((r: any) => (
                            <Badge key={r.id || r.role} variant="outline" className="text-xs">
                              {r.role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    {usersLoading && (
                      <div className="py-4 text-center text-och-steel text-sm">
                        Loading students...
                      </div>
                    )}
                    {!usersLoading && students.length === 0 && (
                      <div className="py-10 text-center text-och-steel">
                        {studentSearch ? 'No students found matching your search.' : 'No students available.'}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
        )}
      </DirectorLayout>
    </RouteGuard>
  )
}
