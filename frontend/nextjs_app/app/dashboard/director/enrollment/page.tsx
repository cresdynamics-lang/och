'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { programsClient, type Enrollment } from '@/services/programsClient'
import Link from 'next/link'
import clsx from 'clsx'

interface WaitlistEntry {
  id: string
  user: string
  user_email?: string
  user_name?: string
  cohort: string
  cohort_name?: string
  position: number
  enrollment_type: string
  seat_type: string
  added_at: string
  active: boolean
}

interface PendingEnrollment extends Enrollment {
  cohort_name?: string
  track_name?: string
  user_name?: string
  user_email?: string
}

export default function EnrollmentPage() {
  const [cohorts, setCohorts] = useState<any[]>([])
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([])
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'waitlist'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [cohortFilter, setCohortFilter] = useState<string>('all')
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<string>>(new Set())
  const [selectedWaitlist, setSelectedWaitlist] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingCohort, setProcessingCohort] = useState<string | null>(null)
  const [processingWaitlistIds, setProcessingWaitlistIds] = useState<Set<string>>(new Set())
  
  // Pagination state
  const [pendingPage, setPendingPage] = useState(1)
  const [waitlistPage, setWaitlistPage] = useState(1)
  const itemsPerPage = 10

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch all cohorts
        const cohortsData = await programsClient.getCohorts({ page: 1, pageSize: 1000 })
        const cohortsList = Array.isArray(cohortsData) ? cohortsData : (cohortsData?.results || [])
        setCohorts(cohortsList)

        // Fetch enrollments and waitlist for each cohort
        const allPending: PendingEnrollment[] = []
        const allWaitlist: WaitlistEntry[] = []

        for (const cohort of cohortsList) {
          try {
            // Get enrollments
            const enrollments = await programsClient.getCohortEnrollments(cohort.id)
            const pending = enrollments
              .filter((e: Enrollment) => e.status === 'pending_payment' || e.status === 'pending')
              .map((e: Enrollment) => ({
                ...e,
                cohort_name: cohort.name,
                track_name: cohort.track_name || cohort.track,
              }))
            allPending.push(...pending)

            // Get waitlist
            const waitlist = await programsClient.getCohortWaitlist(cohort.id)
            const waitlistWithCohort = waitlist.map((w: any) => ({
              ...w,
              cohort: cohort.id,
              cohort_name: cohort.name,
            }))
            allWaitlist.push(...waitlistWithCohort)
          } catch (err) {
            console.error(`Failed to load data for cohort ${cohort.id}:`, err)
          }
        }

        setPendingEnrollments(allPending)
        setWaitlistEntries(allWaitlist)
      } catch (err: any) {
        console.error('Failed to load enrollment data:', err)
        setError(err?.message || 'Failed to load enrollment data')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Filter data
  const filteredPending = useMemo(() => {
    return pendingEnrollments.filter((enrollment) => {
      if (cohortFilter !== 'all' && enrollment.cohort !== cohortFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          enrollment.user_email?.toLowerCase().includes(query) ||
          enrollment.user_name?.toLowerCase().includes(query) ||
          enrollment.cohort_name?.toLowerCase().includes(query) ||
          enrollment.id.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [pendingEnrollments, cohortFilter, searchQuery])

  const filteredWaitlist = useMemo(() => {
    return waitlistEntries
      .filter((entry) => {
        if (cohortFilter !== 'all' && entry.cohort !== cohortFilter) return false
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            entry.user_email?.toLowerCase().includes(query) ||
            entry.user_name?.toLowerCase().includes(query) ||
            entry.cohort_name?.toLowerCase().includes(query) ||
            entry.id.toLowerCase().includes(query)
          )
        }
        return true
      })
      .filter((entry) => entry.active !== false) // Only show active waitlist entries
      .sort((a, b) => a.position - b.position) // Sort by position
  }, [waitlistEntries, cohortFilter, searchQuery])

  // Paginated data
  const paginatedPending = useMemo(() => {
    const start = (pendingPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredPending.slice(start, end)
  }, [filteredPending, pendingPage, itemsPerPage])

  const paginatedWaitlist = useMemo(() => {
    const start = (waitlistPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredWaitlist.slice(start, end)
  }, [filteredWaitlist, waitlistPage, itemsPerPage])

  const totalPendingPages = Math.ceil(filteredPending.length / itemsPerPage)
  const totalWaitlistPages = Math.ceil(filteredWaitlist.length / itemsPerPage)

  // Statistics
  const stats = useMemo(() => {
    const totalPending = pendingEnrollments.length
    const totalWaitlist = waitlistEntries.length
    const totalEnrollments = pendingEnrollments.length + waitlistEntries.length
    const cohortsWithPending = new Set(pendingEnrollments.map((e) => e.cohort)).size
    const cohortsWithWaitlist = new Set(waitlistEntries.map((w) => w.cohort)).size

    return {
      totalPending,
      totalWaitlist,
      totalEnrollments,
      cohortsWithPending,
      cohortsWithWaitlist,
    }
  }, [pendingEnrollments, waitlistEntries])

  // Handle approval
  const handleApproveEnrollment = async (enrollment: PendingEnrollment) => {
    setIsProcessing(true)
    setProcessingCohort(enrollment.cohort)
    setError(null)
    try {
      await programsClient.approveEnrollment(enrollment.cohort, enrollment.id)
      // Reload data
      const enrollments = await programsClient.getCohortEnrollments(enrollment.cohort)
      const pending = enrollments
        .filter((e: Enrollment) => e.status === 'pending_payment' || e.status === 'pending')
        .map((e: Enrollment) => ({
          ...e,
          cohort_name: cohorts.find((c) => c.id === enrollment.cohort)?.name,
          track_name: cohorts.find((c) => c.id === enrollment.cohort)?.track_name,
        }))
      setPendingEnrollments((prev) => prev.filter((e) => e.id !== enrollment.id))
    } catch (err: any) {
      console.error('Failed to approve enrollment:', err)
      setError(err?.message || 'Failed to approve enrollment')
    } finally {
      setIsProcessing(false)
      setProcessingCohort(null)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedEnrollments.size === 0) return

    setIsProcessing(true)
    setError(null)
    try {
      // Group by cohort
      const byCohort = new Map<string, string[]>()
      filteredPending.forEach((e) => {
        if (selectedEnrollments.has(e.id)) {
          if (!byCohort.has(e.cohort)) {
            byCohort.set(e.cohort, [])
          }
          byCohort.get(e.cohort)!.push(e.id)
        }
      })

      // Approve for each cohort
      for (const [cohortId, enrollmentIds] of Array.from(byCohort.entries())) {
        try {
          await programsClient.bulkApproveEnrollments(cohortId, enrollmentIds)
        } catch (err) {
          console.error(`Failed to approve enrollments for cohort ${cohortId}:`, err)
        }
      }

      // Reload data
      const allPending: PendingEnrollment[] = []
      for (const cohort of cohorts) {
        try {
          const enrollments = await programsClient.getCohortEnrollments(cohort.id)
          const pending = enrollments
            .filter((e: Enrollment) => e.status === 'pending_payment' || e.status === 'pending')
            .map((e: Enrollment) => ({
              ...e,
              cohort_name: cohort.name,
              track_name: cohort.track_name || cohort.track,
            }))
          allPending.push(...pending)
        } catch (err) {
          console.error(`Failed to reload enrollments for cohort ${cohort.id}:`, err)
        }
      }
      setPendingEnrollments(allPending)
      setSelectedEnrollments(new Set())
    } catch (err: any) {
      console.error('Failed to bulk approve enrollments:', err)
      setError(err?.message || 'Failed to approve enrollments')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle waitlist promotion (idempotent)
  const handlePromoteFromWaitlist = async (entry: WaitlistEntry) => {
    // Check if already processing this entry
    if (processingWaitlistIds.has(entry.id)) {
      return
    }

    // Check if entry is still active
    if (entry.active === false) {
      setError('This waitlist entry has already been promoted or is inactive.')
      return
    }

    setIsProcessing(true)
    setProcessingCohort(entry.cohort)
    setProcessingWaitlistIds((prev) => new Set(prev).add(entry.id))
    setError(null)

    try {
      const result = await programsClient.promoteFromWaitlist(entry.cohort, 1)
      
      // Check if promotion was successful
      if (result && result.promoted && result.promoted.length > 0) {
        // Reload waitlist for this cohort
        const waitlist = await programsClient.getCohortWaitlist(entry.cohort)
        const waitlistWithCohort = waitlist.map((w: any) => ({
          ...w,
          cohort: entry.cohort,
          cohort_name: cohorts.find((c) => c.id === entry.cohort)?.name,
        }))
        
        // Update waitlist entries - remove promoted entry and add updated list
        setWaitlistEntries((prev) => {
          const filtered = prev.filter((w) => w.cohort !== entry.cohort || w.id !== entry.id)
          return [...filtered, ...waitlistWithCohort]
        })

        // Also reload pending enrollments as the promoted user might appear there
        const enrollments = await programsClient.getCohortEnrollments(entry.cohort)
        const pending = enrollments
          .filter((e: Enrollment) => e.status === 'pending_payment' || e.status === 'pending')
          .map((e: Enrollment) => ({
            ...e,
            cohort_name: cohorts.find((c) => c.id === entry.cohort)?.name,
            track_name: cohorts.find((c) => c.id === entry.cohort)?.track_name,
          }))
        setPendingEnrollments((prev) => {
          const filtered = prev.filter((e) => e.cohort !== entry.cohort)
          return [...filtered, ...pending]
        })
      } else {
        // Promotion didn't happen (no seats available, etc.) - just refresh waitlist
        const waitlist = await programsClient.getCohortWaitlist(entry.cohort)
        const waitlistWithCohort = waitlist.map((w: any) => ({
          ...w,
          cohort: entry.cohort,
          cohort_name: cohorts.find((c) => c.id === entry.cohort)?.name,
        }))
        setWaitlistEntries((prev) => {
          const filtered = prev.filter((w) => w.cohort !== entry.cohort)
          return [...filtered, ...waitlistWithCohort]
        })
        setError('No seats available for promotion at this time.')
      }
    } catch (err: any) {
      console.error('Failed to promote from waitlist:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to promote from waitlist'
      setError(errorMessage)
      
      // Still refresh waitlist to get current state
      try {
        const waitlist = await programsClient.getCohortWaitlist(entry.cohort)
        const waitlistWithCohort = waitlist.map((w: any) => ({
          ...w,
          cohort: entry.cohort,
          cohort_name: cohorts.find((c) => c.id === entry.cohort)?.name,
        }))
        setWaitlistEntries((prev) => {
          const filtered = prev.filter((w) => w.cohort !== entry.cohort)
          return [...filtered, ...waitlistWithCohort]
        })
      } catch (refreshErr) {
        console.error('Failed to refresh waitlist:', refreshErr)
      }
    } finally {
      setIsProcessing(false)
      setProcessingCohort(null)
      setProcessingWaitlistIds((prev) => {
        const next = new Set(prev)
        next.delete(entry.id)
        return next
      })
    }
  }

  const handleBulkPromote = async () => {
    if (selectedWaitlist.size === 0) return

    // Filter out already processing or inactive entries
    const validEntries = Array.from(selectedWaitlist).filter((id) => {
      const entry = filteredWaitlist.find((w) => w.id === id)
      return entry && entry.active !== false && !processingWaitlistIds.has(id)
    })

    if (validEntries.length === 0) {
      setError('No valid entries selected for promotion. Some may already be processed or inactive.')
      return
    }

    setIsProcessing(true)
    setError(null)
    
    // Mark entries as processing
    setProcessingWaitlistIds((prev) => {
      const next = new Set(prev)
      validEntries.forEach((id) => next.add(id))
      return next
    })

    try {
      // Group by cohort and only count active entries
      const byCohort = new Map<string, number>()
      filteredWaitlist.forEach((w) => {
        if (validEntries.includes(w.id) && w.active !== false) {
          byCohort.set(w.cohort, (byCohort.get(w.cohort) || 0) + 1)
        }
      })

      const promotedCounts = new Map<string, number>()

      // Promote for each cohort (idempotent - backend handles duplicates)
      for (const [cohortId, count] of Array.from(byCohort.entries())) {
        try {
          const result = await programsClient.promoteFromWaitlist(cohortId, count)
          if (result && result.count) {
            promotedCounts.set(cohortId, result.count)
          }
        } catch (err) {
          console.error(`Failed to promote from waitlist for cohort ${cohortId}:`, err)
        }
      }

      // Reload waitlist and enrollments for all affected cohorts
      const affectedCohorts = Array.from(byCohort.keys())
      const allWaitlist: WaitlistEntry[] = []
      const allPending: PendingEnrollment[] = []

      for (const cohort of cohorts) {
        try {
          if (affectedCohorts.includes(cohort.id)) {
            // Reload waitlist
            const waitlist = await programsClient.getCohortWaitlist(cohort.id)
            const waitlistWithCohort = waitlist.map((w: any) => ({
              ...w,
              cohort: cohort.id,
              cohort_name: cohort.name,
            }))
            allWaitlist.push(...waitlistWithCohort)

            // Reload enrollments
            const enrollments = await programsClient.getCohortEnrollments(cohort.id)
            const pending = enrollments
              .filter((e: Enrollment) => e.status === 'pending_payment' || e.status === 'pending')
              .map((e: Enrollment) => ({
                ...e,
                cohort_name: cohort.name,
                track_name: cohort.track_name || cohort.track,
              }))
            allPending.push(...pending)
          } else {
            // Keep existing data for unaffected cohorts
            const existingWaitlist = waitlistEntries.filter((w) => w.cohort === cohort.id)
            allWaitlist.push(...existingWaitlist)
            const existingPending = pendingEnrollments.filter((e) => e.cohort === cohort.id)
            allPending.push(...existingPending)
          }
        } catch (err) {
          console.error(`Failed to reload data for cohort ${cohort.id}:`, err)
          // Keep existing data on error
          const existingWaitlist = waitlistEntries.filter((w) => w.cohort === cohort.id)
          allWaitlist.push(...existingWaitlist)
          const existingPending = pendingEnrollments.filter((e) => e.cohort === cohort.id)
          allPending.push(...existingPending)
        }
      }

      setWaitlistEntries(allWaitlist)
      setPendingEnrollments(allPending)
      setSelectedWaitlist(new Set())

      // Show success message
      const totalPromoted = Array.from(promotedCounts.values()).reduce((sum, count) => sum + count, 0)
      if (totalPromoted > 0) {
        // Success is implicit - entries will be removed from waitlist
      }
    } catch (err: any) {
      console.error('Failed to bulk promote from waitlist:', err)
      setError(err?.message || 'Failed to promote from waitlist')
    } finally {
      setIsProcessing(false)
      setProcessingWaitlistIds((prev) => {
        const next = new Set(prev)
        validEntries.forEach((id) => next.delete(id))
        return next
      })
    }
  }

  const toggleEnrollmentSelection = (id: string) => {
    const next = new Set(selectedEnrollments)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedEnrollments(next)
  }

  const toggleWaitlistSelection = (id: string) => {
    const entry = filteredWaitlist.find((w) => w.id === id)
    // Don't allow selecting inactive or processing entries
    if (entry && (entry.active === false || processingWaitlistIds.has(id))) {
      return
    }
    const next = new Set(selectedWaitlist)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedWaitlist(next)
  }

  // Reset pagination when filters change
  useEffect(() => {
    setPendingPage(1)
  }, [searchQuery, cohortFilter, activeTab])

  useEffect(() => {
    setWaitlistPage(1)
  }, [searchQuery, cohortFilter, activeTab])

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading enrollment data...</p>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Enrollment & Placement</h1>
                <p className="text-och-steel">Approve enrollments, manage waitlists, and handle placements</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsLoading(true)
                  try {
                    const cohortsData = await programsClient.getCohorts({ page: 1, pageSize: 1000 })
                    const cohortsList = Array.isArray(cohortsData) ? cohortsData : (cohortsData?.results || [])
                    setCohorts(cohortsList)

                    const allPending: PendingEnrollment[] = []
                    const allWaitlist: WaitlistEntry[] = []

                    for (const cohort of cohortsList) {
                      try {
                        const enrollments = await programsClient.getCohortEnrollments(cohort.id)
                        const pending = enrollments
                          .filter((e: Enrollment) => e.status === 'pending_payment' || e.status === 'pending')
                          .map((e: Enrollment) => ({
                            ...e,
                            cohort_name: cohort.name,
                            track_name: cohort.track_name || cohort.track,
                          }))
                        allPending.push(...pending)

                        const waitlist = await programsClient.getCohortWaitlist(cohort.id)
                        const waitlistWithCohort = waitlist.map((w: any) => ({
                          ...w,
                          cohort: cohort.id,
                          cohort_name: cohort.name,
                        }))
                        allWaitlist.push(...waitlistWithCohort)
                      } catch (err) {
                        console.error(`Failed to load data for cohort ${cohort.id}:`, err)
                      }
                    }

                    setPendingEnrollments(allPending)
                    setWaitlistEntries(allWaitlist)
                  } catch (err: any) {
                    setError(err?.message || 'Failed to refresh data')
                  } finally {
                    setIsLoading(false)
                  }
                }}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
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
                  <p className="text-och-steel text-sm mb-1">Pending Approvals</p>
                  <p className="text-2xl font-bold text-och-orange">{stats.totalPending}</p>
                  <p className="text-xs text-och-steel mt-1">{stats.cohortsWithPending} cohort(s)</p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <p className="text-och-steel text-sm mb-1">Waitlist Entries</p>
                  <p className="text-2xl font-bold text-och-defender">{stats.totalWaitlist}</p>
                  <p className="text-xs text-och-steel mt-1">{stats.cohortsWithWaitlist} cohort(s)</p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <p className="text-och-steel text-sm mb-1">Total Pending</p>
                  <p className="text-2xl font-bold text-white">{stats.totalEnrollments}</p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <p className="text-och-steel text-sm mb-1">Total Cohorts</p>
                  <p className="text-2xl font-bold text-och-mint">{cohorts.length}</p>
                </div>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Search</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by email, name, cohort, or ID..."
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Filter by Cohort</label>
                    <select
                      value={cohortFilter}
                      onChange={(e) => setCohortFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="all">All Cohorts</option>
                      {cohorts.map((cohort) => (
                        <option key={cohort.id} value={cohort.id}>
                          {cohort.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-och-steel/20">
            <button
              onClick={() => {
                setActiveTab('pending')
                setPendingPage(1)
              }}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'text-och-defender border-b-2 border-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Pending Approvals ({filteredPending.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('waitlist')
                setWaitlistPage(1)
              }}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'waitlist'
                  ? 'text-och-defender border-b-2 border-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Waitlist ({filteredWaitlist.length})
            </button>
          </div>

          {/* Pending Approvals Tab */}
          {activeTab === 'pending' && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Pending Enrollment Approvals</h2>
                  {selectedEnrollments.size > 0 && (
                    <Button
                      variant="mint"
                      size="sm"
                      onClick={handleBulkApprove}
                      disabled={isProcessing}
                    >
                      Approve Selected ({selectedEnrollments.size})
                    </Button>
                  )}
                </div>

                {filteredPending.length === 0 ? (
                  <div className="text-center py-12 text-och-steel">
                    <p>No pending enrollment approvals found.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginatedPending.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-defender/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={selectedEnrollments.has(enrollment.id)}
                                onChange={() => toggleEnrollmentSelection(enrollment.id)}
                                className="w-4 h-4 rounded border-och-steel/20 bg-och-midnight text-och-defender focus:ring-och-defender"
                              />
                              <div>
                                <p className="text-white font-semibold">
                                  {enrollment.user_name || enrollment.user_email || enrollment.user}
                                </p>
                                <p className="text-sm text-och-steel">{enrollment.user_email || enrollment.user}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-och-steel mt-2">
                              <span>
                                <span className="text-och-steel/70">Cohort:</span>{' '}
                                <Link
                                  href={`/dashboard/director/cohorts/${enrollment.cohort}/enrollments`}
                                  className="text-och-defender hover:underline"
                                >
                                  {enrollment.cohort_name || enrollment.cohort}
                                </Link>
                              </span>
                              {enrollment.track_name && (
                                <span>
                                  <span className="text-och-steel/70">Track:</span> {enrollment.track_name}
                                </span>
                              )}
                              <span>
                                <span className="text-och-steel/70">Seat Type:</span>{' '}
                                <Badge variant="outline">{enrollment.seat_type || 'paid'}</Badge>
                              </span>
                              <span>
                                <span className="text-och-steel/70">Status:</span>{' '}
                                <Badge variant="orange">{enrollment.status}</Badge>
                              </span>
                            </div>
                            {enrollment.payment_status && (
                              <p className="text-xs text-och-steel mt-2">
                                Payment Status: <Badge variant="orange">{enrollment.payment_status}</Badge>
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="mint"
                              size="sm"
                              onClick={() => handleApproveEnrollment(enrollment)}
                              disabled={isProcessing && processingCohort === enrollment.cohort}
                            >
                              {isProcessing && processingCohort === enrollment.cohort ? 'Approving...' : 'Approve'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!confirm('Are you sure you want to reject this enrollment?')) return
                                setIsProcessing(true)
                                setProcessingCohort(enrollment.cohort)
                                try {
                                  await programsClient.updateEnrollmentStatus(
                                    enrollment.cohort,
                                    enrollment.id,
                                    'withdrawn'
                                  )
                                  setPendingEnrollments((prev) => prev.filter((e) => e.id !== enrollment.id))
                                } catch (err: any) {
                                  setError(err?.message || 'Failed to reject enrollment')
                                } finally {
                                  setIsProcessing(false)
                                  setProcessingCohort(null)
                                }
                              }}
                              disabled={isProcessing && processingCohort === enrollment.cohort}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPendingPages > 1 && (
                      <div className="mt-6 flex items-center justify-between border-t border-och-steel/20 pt-4">
                        <div className="text-sm text-och-steel">
                          Showing {(pendingPage - 1) * itemsPerPage + 1} to{' '}
                          {Math.min(pendingPage * itemsPerPage, filteredPending.length)} of {filteredPending.length} entries
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                            disabled={pendingPage === 1}
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPendingPages) }, (_, i) => {
                              let pageNum: number
                              if (totalPendingPages <= 5) {
                                pageNum = i + 1
                              } else if (pendingPage <= 3) {
                                pageNum = i + 1
                              } else if (pendingPage >= totalPendingPages - 2) {
                                pageNum = totalPendingPages - 4 + i
                              } else {
                                pageNum = pendingPage - 2 + i
                              }
                              return (
                                <Button
                                  key={pageNum}
                                  variant={pendingPage === pageNum ? 'defender' : 'outline'}
                                  size="sm"
                                  onClick={() => setPendingPage(pageNum)}
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
                            onClick={() => setPendingPage((p) => Math.min(totalPendingPages, p + 1))}
                            disabled={pendingPage === totalPendingPages}
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
          )}

          {/* Waitlist Tab */}
          {activeTab === 'waitlist' && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Waitlist Entries</h2>
                  {selectedWaitlist.size > 0 && (
                    <Button
                      variant="defender"
                      size="sm"
                      onClick={handleBulkPromote}
                      disabled={isProcessing}
                    >
                      Promote Selected ({selectedWaitlist.size})
                    </Button>
                  )}
                </div>

                {filteredWaitlist.length === 0 ? (
                  <div className="text-center py-12 text-och-steel">
                    <p>No waitlist entries found.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginatedWaitlist.map((entry) => {
                        const isProcessing = processingWaitlistIds.has(entry.id)
                        const isInactive = entry.active === false
                        
                        return (
                        <div
                          key={entry.id}
                          className={clsx(
                            "p-4 rounded-lg border transition-colors",
                            isProcessing
                              ? "bg-och-defender/20 border-och-defender/50"
                              : isInactive
                              ? "bg-och-steel/10 border-och-steel/20 opacity-60"
                              : "bg-och-midnight/50 border-och-steel/20 hover:border-och-defender/50"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <input
                                  type="checkbox"
                                  checked={selectedWaitlist.has(entry.id)}
                                  onChange={() => toggleWaitlistSelection(entry.id)}
                                  disabled={isProcessing || isInactive}
                                  className="w-4 h-4 rounded border-och-steel/20 bg-och-midnight text-och-defender focus:ring-och-defender disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <div>
                                  <p className="text-white font-semibold">
                                    {entry.user_name || entry.user_email || entry.user}
                                  </p>
                                  <p className="text-sm text-och-steel">{entry.user_email || entry.user}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-och-steel mt-2">
                                {isProcessing && (
                                  <Badge variant="defender" className="animate-pulse">
                                    Processing...
                                  </Badge>
                                )}
                                {isInactive && (
                                  <Badge variant="mint">
                                    Promoted
                                  </Badge>
                                )}
                                <span>
                                  <span className="text-och-steel/70">Position:</span>{' '}
                                  <Badge variant="defender">#{entry.position}</Badge>
                                </span>
                                <span>
                                  <span className="text-och-steel/70">Cohort:</span>{' '}
                                  <Link
                                    href={`/dashboard/director/cohorts/${entry.cohort}/enrollments`}
                                    className="text-och-defender hover:underline"
                                  >
                                    {entry.cohort_name || entry.cohort}
                                  </Link>
                                </span>
                                <span>
                                  <span className="text-och-steel/70">Seat Type:</span>{' '}
                                  <Badge variant="outline">{entry.seat_type || 'paid'}</Badge>
                                </span>
                                <span>
                                  <span className="text-och-steel/70">Added:</span>{' '}
                                  {new Date(entry.added_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="defender"
                                size="sm"
                                onClick={() => handlePromoteFromWaitlist(entry)}
                                disabled={isProcessing || isInactive || processingCohort === entry.cohort}
                                title={
                                  isInactive
                                    ? 'Already promoted or inactive'
                                    : isProcessing
                                    ? 'Processing...'
                                    : 'Promote from waitlist'
                                }
                              >
                                {isProcessing
                                  ? 'Promoting...'
                                  : isInactive
                                  ? 'Promoted'
                                  : 'Promote'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {totalWaitlistPages > 1 && (
                      <div className="mt-6 flex items-center justify-between border-t border-och-steel/20 pt-4">
                        <div className="text-sm text-och-steel">
                          Showing {(waitlistPage - 1) * itemsPerPage + 1} to{' '}
                          {Math.min(waitlistPage * itemsPerPage, filteredWaitlist.length)} of {filteredWaitlist.length} entries
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWaitlistPage((p) => Math.max(1, p - 1))}
                            disabled={waitlistPage === 1}
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalWaitlistPages) }, (_, i) => {
                              let pageNum: number
                              if (totalWaitlistPages <= 5) {
                                pageNum = i + 1
                              } else if (waitlistPage <= 3) {
                                pageNum = i + 1
                              } else if (waitlistPage >= totalWaitlistPages - 2) {
                                pageNum = totalWaitlistPages - 4 + i
                              } else {
                                pageNum = waitlistPage - 2 + i
                              }
                              return (
                                <Button
                                  key={pageNum}
                                  variant={waitlistPage === pageNum ? 'defender' : 'outline'}
                                  size="sm"
                                  onClick={() => setWaitlistPage(pageNum)}
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
                            onClick={() => setWaitlistPage((p) => Math.min(totalWaitlistPages, p + 1))}
                            disabled={waitlistPage === totalWaitlistPages}
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
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

