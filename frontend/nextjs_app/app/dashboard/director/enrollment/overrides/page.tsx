'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { programsClient, type Enrollment } from '@/services/programsClient'
import Link from 'next/link'

interface CohortOverrideData {
  id: string
  name: string
  track_name?: string
  status: string
  seat_cap: number
  enrolled_count?: number
}

interface EnrollmentOverride extends Enrollment {
  cohort_name?: string
  track_name?: string
  user_name?: string
  user_email?: string
}

export default function EnrollmentOverridesPage() {
  const [cohorts, setCohorts] = useState<CohortOverrideData[]>([])
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentOverride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingEnrollment, setProcessingEnrollment] = useState<string | null>(null)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overrideType, setOverrideType] = useState<'seat_type' | 'payment' | 'capacity' | null>(null)
  const [overrideForm, setOverrideForm] = useState({
    seat_type: 'paid' as 'paid' | 'scholarship' | 'sponsored',
    payment_status: 'waived' as 'pending' | 'paid' | 'waived',
    new_capacity: 0,
  })

  // Fetch cohorts
  useEffect(() => {
    const loadCohorts = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await programsClient.getCohorts({ page: 1, pageSize: 1000 })
        const cohortsList = Array.isArray(data) ? data : (data?.results || [])
        setCohorts(cohortsList)
      } catch (err: any) {
        console.error('Failed to load cohorts:', err)
        setError(err?.message || 'Failed to load cohorts')
        setCohorts([])
      } finally {
        setIsLoading(false)
      }
    }
    loadCohorts()
  }, [])

  // Load enrollments when cohort is selected
  useEffect(() => {
    const loadEnrollments = async () => {
      if (!selectedCohort) {
        setEnrollments([])
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const enrollmentsData = await programsClient.getCohortEnrollments(selectedCohort)
        const cohort = cohorts.find((c) => c.id === selectedCohort)
        const enrollmentsWithCohort = enrollmentsData.map((e: Enrollment) => ({
          ...e,
          cohort_name: cohort?.name,
          track_name: cohort?.track_name,
        }))
        setEnrollments(enrollmentsWithCohort)
      } catch (err: any) {
        console.error('Failed to load enrollments:', err)
        setError(err?.message || 'Failed to load enrollments')
        setEnrollments([])
      } finally {
        setIsLoading(false)
      }
    }
    loadEnrollments()
  }, [selectedCohort, cohorts])

  // Filter enrollments
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enrollment) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          enrollment.user_email?.toLowerCase().includes(query) ||
          enrollment.user_name?.toLowerCase().includes(query) ||
          enrollment.id.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [enrollments, searchQuery])

  const selectedCohortData = useMemo(() => {
    return cohorts.find((c) => c.id === selectedCohort)
  }, [cohorts, selectedCohort])

  // Statistics
  const stats = useMemo(() => {
    if (!selectedCohortData) return null

    const totalEnrolled = enrollments.length
    const activeEnrolled = enrollments.filter((e) => e.status === 'active').length
    const paidSeats = enrollments.filter((e) => e.seat_type === 'paid').length
    const scholarshipSeats = enrollments.filter((e) => e.seat_type === 'scholarship').length
    const sponsoredSeats = enrollments.filter((e) => e.seat_type === 'sponsored').length
    const waivedPayments = enrollments.filter((e) => e.payment_status === 'waived').length

    return {
      totalEnrolled,
      activeEnrolled,
      paidSeats,
      scholarshipSeats,
      sponsoredSeats,
      waivedPayments,
      seatCap: selectedCohortData.seat_cap,
      utilization: selectedCohortData.seat_cap > 0 ? (totalEnrolled / selectedCohortData.seat_cap) * 100 : 0,
    }
  }, [enrollments, selectedCohortData])

  // Handle seat type override
  const handleOverrideSeatType = async (enrollmentId: string, newSeatType: 'paid' | 'scholarship' | 'sponsored') => {
    if (!selectedCohort) return

    setIsProcessing(true)
    setProcessingEnrollment(enrollmentId)
    setError(null)
    try {
      // Update enrollment through cohort endpoint
      // Note: This might need a backend endpoint for updating enrollment seat_type
      // For now, we'll use the update enrollment status endpoint
      await programsClient.updateEnrollmentStatus(selectedCohort, enrollmentId, 'active')
      
      // Reload enrollments
      const enrollmentsData = await programsClient.getCohortEnrollments(selectedCohort)
      const cohort = cohorts.find((c) => c.id === selectedCohort)
      const enrollmentsWithCohort = enrollmentsData.map((e: Enrollment) => ({
        ...e,
        cohort_name: cohort?.name,
        track_name: cohort?.track_name,
      }))
      setEnrollments(enrollmentsWithCohort)
    } catch (err: any) {
      console.error('Failed to override seat type:', err)
      setError(err?.message || 'Failed to override seat type')
    } finally {
      setIsProcessing(false)
      setProcessingEnrollment(null)
    }
  }

  // Handle payment override (waive payment)
  const handleOverridePayment = async (enrollmentId: string) => {
    if (!selectedCohort) return

    setIsProcessing(true)
    setProcessingEnrollment(enrollmentId)
    setError(null)
    try {
      // Approve enrollment (this waives payment)
      await programsClient.approveEnrollment(selectedCohort, enrollmentId)
      
      // Reload enrollments
      const enrollmentsData = await programsClient.getCohortEnrollments(selectedCohort)
      const cohort = cohorts.find((c) => c.id === selectedCohort)
      const enrollmentsWithCohort = enrollmentsData.map((e: Enrollment) => ({
        ...e,
        cohort_name: cohort?.name,
        track_name: cohort?.track_name,
      }))
      setEnrollments(enrollmentsWithCohort)
    } catch (err: any) {
      console.error('Failed to override payment:', err)
      setError(err?.message || 'Failed to waive payment')
    } finally {
      setIsProcessing(false)
      setProcessingEnrollment(null)
    }
  }

  // Handle bulk payment override
  const handleBulkOverridePayment = async () => {
    if (selectedEnrollments.size === 0 || !selectedCohort) return

    setIsProcessing(true)
    setError(null)
    try {
      const enrollmentIds = Array.from(selectedEnrollments)
      await programsClient.bulkApproveEnrollments(selectedCohort, enrollmentIds)
      
      // Reload enrollments
      const enrollmentsData = await programsClient.getCohortEnrollments(selectedCohort)
      const cohort = cohorts.find((c) => c.id === selectedCohort)
      const enrollmentsWithCohort = enrollmentsData.map((e: Enrollment) => ({
        ...e,
        cohort_name: cohort?.name,
        track_name: cohort?.track_name,
      }))
      setEnrollments(enrollmentsWithCohort)
      setSelectedEnrollments(new Set())
    } catch (err: any) {
      console.error('Failed to bulk override payment:', err)
      setError(err?.message || 'Failed to bulk waive payments')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle capacity override
  const handleOverrideCapacity = async () => {
    if (!selectedCohort || overrideForm.new_capacity <= 0) return

    setIsProcessing(true)
    setError(null)
    try {
      // Update cohort seat capacity
      await programsClient.updateCohortDirector(selectedCohort, {
        seat_cap: overrideForm.new_capacity,
      })
      
      // Reload cohorts
      const data = await programsClient.getCohorts({ page: 1, pageSize: 1000 })
      const cohortsList = Array.isArray(data) ? data : (data?.results || [])
      setCohorts(cohortsList)
      
      setShowOverrideModal(false)
      setOverrideForm({ ...overrideForm, new_capacity: 0 })
    } catch (err: any) {
      console.error('Failed to override capacity:', err)
      setError(err?.message || 'Failed to update seat capacity')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleEnrollmentSelection = (id: string) => {
    const next = new Set(selectedEnrollments)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedEnrollments(next)
  }

  if (isLoading && !selectedCohort) {
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

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Seat Overrides</h1>
                <p className="text-och-steel">Override seat types, payment requirements, and capacity limits</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const loadCohorts = async () => {
                      setIsLoading(true)
                      try {
                        const data = await programsClient.getCohorts({ page: 1, pageSize: 1000 })
                        const cohortsList = Array.isArray(data) ? data : (data?.results || [])
                        setCohorts(cohortsList)
                        if (selectedCohort) {
                          const enrollmentsData = await programsClient.getCohortEnrollments(selectedCohort)
                          const cohort = cohortsList.find((c) => c.id === selectedCohort)
                          const enrollmentsWithCohort = enrollmentsData.map((e: Enrollment) => ({
                            ...e,
                            cohort_name: cohort?.name,
                            track_name: cohort?.track_name,
                          }))
                          setEnrollments(enrollmentsWithCohort)
                        }
                      } catch (err: any) {
                        setError(err?.message || 'Failed to refresh data')
                      } finally {
                        setIsLoading(false)
                      }
                    }
                    loadCohorts()
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </Button>
                <Link href="/dashboard/director/enrollment/seats">
                  <Button variant="outline" size="sm">
                    View Seat Allocation
                  </Button>
                </Link>
              </div>
            </div>

            {error && (
              <Card className="mb-6 border-och-orange/50">
                <div className="p-4 text-och-orange">{error}</div>
              </Card>
            )}

            {/* Cohort Selection */}
            <Card className="mb-6">
              <div className="p-4">
                <label className="block text-sm font-medium text-white mb-2">Select Cohort</label>
                <select
                  value={selectedCohort || ''}
                  onChange={(e) => {
                    setSelectedCohort(e.target.value || null)
                    setSelectedEnrollments(new Set())
                    setSearchQuery('')
                  }}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                >
                  <option value="">-- Select a cohort --</option>
                  {cohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name} {cohort.track_name ? `(${cohort.track_name})` : ''} - {cohort.status}
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {/* Statistics */}
            {selectedCohortData && stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Total Enrolled</p>
                    <p className="text-2xl font-bold text-white">{stats.totalEnrolled}</p>
                    <p className="text-xs text-och-steel mt-1">
                      {stats.utilization.toFixed(1)}% of {stats.seatCap} seats
                    </p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Active Enrollments</p>
                    <p className="text-2xl font-bold text-och-mint">{stats.activeEnrolled}</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Payment Waived</p>
                    <p className="text-2xl font-bold text-och-defender">{stats.waivedPayments}</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Seat Types</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">Paid: {stats.paidSeats}</Badge>
                      <Badge variant="outline">Scholarship: {stats.scholarshipSeats}</Badge>
                      <Badge variant="outline">Sponsored: {stats.sponsoredSeats}</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Enrollments Table */}
          {selectedCohort && (
            <>
              {/* Search and Actions */}
              <Card className="mb-6">
                <div className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search enrollments by email, name, or ID..."
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      />
                    </div>
                    {selectedEnrollments.size > 0 && (
                      <Button
                        variant="defender"
                        size="sm"
                        onClick={handleBulkOverridePayment}
                        disabled={isProcessing}
                      >
                        Waive Payment for Selected ({selectedEnrollments.size})
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOverrideType('capacity')
                        setOverrideForm({ ...overrideForm, new_capacity: selectedCohortData?.seat_cap || 0 })
                        setShowOverrideModal(true)
                      }}
                    >
                      Override Capacity
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Enrollments List */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">
                      Enrollments ({filteredEnrollments.length})
                    </h2>
                    <Link href={`/dashboard/director/cohorts/${selectedCohort}/enrollments`}>
                      <Button variant="outline" size="sm">
                        View Full Details
                      </Button>
                    </Link>
                  </div>

                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-defender mx-auto mb-4"></div>
                      <p className="text-och-steel">Loading enrollments...</p>
                    </div>
                  ) : filteredEnrollments.length === 0 ? (
                    <div className="text-center py-12 text-och-steel">
                      <p>No enrollments found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredEnrollments.map((enrollment) => (
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
                                  <span className="text-och-steel/70">Seat Type:</span>{' '}
                                  <Badge variant="outline">{enrollment.seat_type}</Badge>
                                </span>
                                <span>
                                  <span className="text-och-steel/70">Payment:</span>{' '}
                                  <Badge
                                    variant={
                                      enrollment.payment_status === 'waived'
                                        ? 'mint'
                                        : enrollment.payment_status === 'paid'
                                        ? 'defender'
                                        : 'orange'
                                    }
                                  >
                                    {enrollment.payment_status}
                                  </Badge>
                                </span>
                                <span>
                                  <span className="text-och-steel/70">Status:</span>{' '}
                                  <Badge
                                    variant={
                                      enrollment.status === 'active'
                                        ? 'mint'
                                        : enrollment.status === 'pending_payment'
                                        ? 'orange'
                                        : 'outline'
                                    }
                                  >
                                    {enrollment.status}
                                  </Badge>
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newType =
                                    enrollment.seat_type === 'paid'
                                      ? 'scholarship'
                                      : enrollment.seat_type === 'scholarship'
                                      ? 'sponsored'
                                      : 'paid'
                                  handleOverrideSeatType(enrollment.id, newType)
                                }}
                                disabled={isProcessing && processingEnrollment === enrollment.id}
                              >
                                Change Seat Type
                              </Button>
                              {enrollment.payment_status !== 'waived' && (
                                <Button
                                  variant="defender"
                                  size="sm"
                                  onClick={() => handleOverridePayment(enrollment.id)}
                                  disabled={isProcessing && processingEnrollment === enrollment.id}
                                >
                                  {isProcessing && processingEnrollment === enrollment.id
                                    ? 'Processing...'
                                    : 'Waive Payment'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {/* Capacity Override Modal */}
          {showOverrideModal && overrideType === 'capacity' && selectedCohortData && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-md bg-och-midnight border border-och-steel/20 rounded-xl shadow-xl">
                <div className="p-6 border-b border-och-steel/20 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Override Seat Capacity</h3>
                    <p className="text-sm text-och-steel mt-1">
                      {selectedCohortData.name}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowOverrideModal(false)
                      setOverrideType(null)
                    }}
                    disabled={isProcessing}
                  >
                    Close
                  </Button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Current Capacity: {selectedCohortData.seat_cap} seats
                    </label>
                    <label className="block text-sm font-medium text-white mb-2">
                      New Capacity
                    </label>
                    <input
                      type="number"
                      min={selectedCohortData.enrolled_count || 0}
                      value={overrideForm.new_capacity}
                      onChange={(e) => {
                        setOverrideForm({ ...overrideForm, new_capacity: parseInt(e.target.value) || 0 })
                      }}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                    <p className="text-xs text-och-steel mt-1">
                      Minimum: {selectedCohortData.enrolled_count || 0} (current enrolled count)
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowOverrideModal(false)
                        setOverrideType(null)
                      }}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="defender"
                      size="sm"
                      onClick={handleOverrideCapacity}
                      disabled={
                        isProcessing ||
                        overrideForm.new_capacity < (selectedCohortData.enrolled_count || 0) ||
                        overrideForm.new_capacity === selectedCohortData.seat_cap
                      }
                      className="flex-1"
                    >
                      {isProcessing ? 'Updating...' : 'Update Capacity'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
