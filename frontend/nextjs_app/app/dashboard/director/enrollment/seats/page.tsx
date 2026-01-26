'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { programsClient } from '@/services/programsClient'
import Link from 'next/link'

interface SeatPoolData {
  paid: number
  scholarship: number
  sponsored: number
}

interface CohortSeatData {
  id: string
  name: string
  track_name?: string
  status: string
  seat_cap: number
  seat_pool?: SeatPoolData
  enrolled_count?: number
  start_date?: string
  end_date?: string
}

// Helper function to map Cohort to CohortSeatData
const mapCohortToSeatData = (cohort: any): CohortSeatData => ({
  id: cohort.id,
  name: cohort.name,
  track_name: cohort.track_name,
  status: cohort.status,
  seat_cap: cohort.seat_cap,
  enrolled_count: cohort.enrolled_count,
  start_date: cohort.start_date,
  end_date: cohort.end_date,
  seat_pool: cohort.seat_pool ? {
    paid: cohort.seat_pool.paid ?? 0,
    scholarship: cohort.seat_pool.scholarship ?? 0,
    sponsored: cohort.seat_pool.sponsored ?? 0,
  } : undefined,
})

export default function SeatAllocationPage() {
  const [cohorts, setCohorts] = useState<CohortSeatData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null)
  const [seatPoolForm, setSeatPoolForm] = useState<SeatPoolData>({
    paid: 0,
    scholarship: 0,
    sponsored: 0,
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [seatPoolError, setSeatPoolError] = useState<string | null>(null)
  const [seatPoolSuccess, setSeatPoolSuccess] = useState<string | null>(null)

  // Fetch all cohorts
  useEffect(() => {
    const loadCohorts = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await programsClient.getCohorts({ page: 1, pageSize: 1000 })
        const cohortsList = Array.isArray(data) ? data : (data?.results || [])
        // Map to CohortSeatData format, ensuring seat_pool properties are numbers
        const mappedCohorts: CohortSeatData[] = cohortsList.map(mapCohortToSeatData)
        setCohorts(mappedCohorts)
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

  // Filter cohorts
  const filteredCohorts = useMemo(() => {
    return cohorts.filter((cohort) => {
      if (statusFilter !== 'all' && cohort.status !== statusFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          cohort.name.toLowerCase().includes(query) ||
          cohort.track_name?.toLowerCase().includes(query) ||
          cohort.id.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [cohorts, statusFilter, searchQuery])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSeats = filteredCohorts.reduce((sum, c) => sum + c.seat_cap, 0)
    const totalEnrolled = filteredCohorts.reduce((sum, c) => sum + (c.enrolled_count || 0), 0)
    const totalAllocated = filteredCohorts.reduce((sum, c) => {
      const pool = c.seat_pool || { paid: 0, scholarship: 0, sponsored: 0 }
      return sum + pool.paid + pool.scholarship + pool.sponsored
    }, 0)
    const totalAvailable = totalSeats - totalEnrolled
    const utilization = totalSeats > 0 ? (totalEnrolled / totalSeats) * 100 : 0

    return {
      totalCohorts: filteredCohorts.length,
      totalSeats,
      totalEnrolled,
      totalAllocated,
      totalAvailable,
      utilization,
    }
  }, [filteredCohorts])

  // Handle seat pool modal
  const openSeatPoolModal = (cohort: CohortSeatData) => {
    setSelectedCohort(cohort.id)
    setSeatPoolForm(cohort.seat_pool || { paid: 0, scholarship: 0, sponsored: 0 })
    setSeatPoolError(null)
    setSeatPoolSuccess(null)
  }

  const handleUpdateSeatPool = async () => {
    if (!selectedCohort) return

    setSeatPoolError(null)
    setSeatPoolSuccess(null)

    const cohort = cohorts.find((c) => c.id === selectedCohort)
    if (!cohort) return

    // Validate total doesn't exceed seat cap
    const total = seatPoolForm.paid + seatPoolForm.scholarship + seatPoolForm.sponsored
    if (total > cohort.seat_cap) {
      setSeatPoolError(`Total allocated seats (${total}) cannot exceed seat capacity (${cohort.seat_cap})`)
      return
    }

    if (total < 0) {
      setSeatPoolError('Seat allocations cannot be negative')
      return
    }

    setIsProcessing(true)
    try {
      await programsClient.manageSeatPool(selectedCohort, seatPoolForm)
      setSeatPoolSuccess('Seat pool updated successfully')

      // Reload cohorts to sync with backend
      const data = await programsClient.getCohorts({ page: 1, pageSize: 1000 })
      const cohortsList = Array.isArray(data) ? data : (data?.results || [])
      const mappedCohorts: CohortSeatData[] = cohortsList.map(mapCohortToSeatData)
      setCohorts(mappedCohorts)

      // Close modal after 2 seconds
      setTimeout(() => {
        setSelectedCohort(null)
        setSeatPoolSuccess(null)
      }, 2000)
    } catch (err: any) {
      console.error('Failed to update seat pool:', err)
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.seat_pool?.[0] ||
        err?.message ||
        'Failed to update seat pool. Please check your permissions and try again.'
      setSeatPoolError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading seat allocations...</p>
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
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Seat Allocation Management</h1>
                <p className="text-och-steel">View and manage seat allocations across all cohorts</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const loadCohorts = async () => {
                    setIsLoading(true)
                    try {
                      const data = await programsClient.getCohorts({ page: 1, pageSize: 1000 })
                      const cohortsList = Array.isArray(data) ? data : (data?.results || [])
                      const mappedCohorts: CohortSeatData[] = cohortsList.map(mapCohortToSeatData)
                      setCohorts(mappedCohorts)
                    } catch (err: any) {
                      setError(err?.message || 'Failed to load cohorts')
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
            </div>

            {error && (
              <Card className="mb-6 border-och-orange/50">
                <div className="p-4 text-och-orange">{error}</div>
              </Card>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <div className="p-4">
                  <p className="text-och-steel text-sm mb-1">Total Cohorts</p>
                  <p className="text-2xl font-bold text-white">{stats.totalCohorts}</p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <p className="text-och-steel text-sm mb-1">Total Seats</p>
                  <p className="text-2xl font-bold text-och-mint">{stats.totalSeats}</p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <p className="text-och-steel text-sm mb-1">Enrolled</p>
                  <p className="text-2xl font-bold text-white">{stats.totalEnrolled}</p>
                  <p className="text-xs text-och-steel mt-1">{stats.utilization.toFixed(1)}% utilization</p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <p className="text-och-steel text-sm mb-1">Allocated</p>
                  <p className="text-2xl font-bold text-och-defender">{stats.totalAllocated}</p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <p className="text-och-steel text-sm mb-1">Available</p>
                  <p className="text-2xl font-bold text-och-mint">{stats.totalAvailable}</p>
                </div>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Search Cohorts</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, track, or ID..."
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Status Filter</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="running">Running</option>
                      <option value="closing">Closing</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Cohorts Table */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Seat Allocations ({filteredCohorts.length} cohorts)
                </h2>
              </div>

              {filteredCohorts.length === 0 ? (
                <div className="text-center py-12 text-och-steel">
                  <p>No cohorts found matching the selected filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-och-steel/20">
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Cohort</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Track</th>
                        <th className="text-left py-3 px-4 text-sm text-och-steel">Status</th>
                        <th className="text-center py-3 px-4 text-sm text-och-steel">Seat Cap</th>
                        <th className="text-center py-3 px-4 text-sm text-och-steel">Enrolled</th>
                        <th className="text-center py-3 px-4 text-sm text-och-steel">Paid</th>
                        <th className="text-center py-3 px-4 text-sm text-och-steel">Scholarship</th>
                        <th className="text-center py-3 px-4 text-sm text-och-steel">Sponsored</th>
                        <th className="text-center py-3 px-4 text-sm text-och-steel">Total Allocated</th>
                        <th className="text-center py-3 px-4 text-sm text-och-steel">Available</th>
                        <th className="text-center py-3 px-4 text-sm text-och-steel">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCohorts.map((cohort) => {
                        const pool = cohort.seat_pool || { paid: 0, scholarship: 0, sponsored: 0 }
                        const totalAllocated = pool.paid + pool.scholarship + pool.sponsored
                        const available = cohort.seat_cap - (cohort.enrolled_count || 0)
                        const utilization = cohort.seat_cap > 0 ? ((cohort.enrolled_count || 0) / cohort.seat_cap) * 100 : 0

                        return (
                          <tr
                            key={cohort.id}
                            className="border-b border-och-steel/10 hover:bg-och-midnight/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div>
                                <Link
                                  href={`/dashboard/director/cohorts/${cohort.id}/enrollments`}
                                  className="text-white font-medium hover:text-och-defender transition-colors"
                                >
                                  {cohort.name}
                                </Link>
                                {cohort.start_date && (
                                  <p className="text-xs text-och-steel mt-0.5">
                                    {new Date(cohort.start_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-och-steel">
                              {cohort.track_name || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
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
                            </td>
                            <td className="py-3 px-4 text-center text-white font-medium">
                              {cohort.seat_cap}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div>
                                <span className="text-white font-medium">{cohort.enrolled_count || 0}</span>
                                <p className="text-xs text-och-steel">{utilization.toFixed(1)}%</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center text-och-mint font-medium">
                              {pool.paid || 0}
                            </td>
                            <td className="py-3 px-4 text-center text-och-gold font-medium">
                              {pool.scholarship || 0}
                            </td>
                            <td className="py-3 px-4 text-center text-och-defender font-medium">
                              {pool.sponsored || 0}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`font-medium ${
                                  totalAllocated > cohort.seat_cap
                                    ? 'text-och-orange'
                                    : totalAllocated === cohort.seat_cap
                                    ? 'text-och-mint'
                                    : 'text-white'
                                }`}
                              >
                                {totalAllocated}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`font-medium ${
                                  available > 0 ? 'text-och-mint' : available === 0 ? 'text-och-orange' : 'text-och-orange'
                                }`}
                              >
                                {available}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openSeatPoolModal(cohort)}
                                className="text-xs"
                              >
                                Manage
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Manage Seat Pool Modal */}
        {selectedCohort && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-och-midnight border border-och-steel/20 rounded-xl shadow-xl">
              <div className="p-6 border-b border-och-steel/20 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Manage Seat Pool</h3>
                  <p className="text-sm text-och-steel mt-1">
                    {cohorts.find((c) => c.id === selectedCohort)?.name}
                  </p>
                  <p className="text-xs text-och-steel mt-0.5">
                    Total capacity: {cohorts.find((c) => c.id === selectedCohort)?.seat_cap} seats
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCohort(null)
                    setSeatPoolError(null)
                    setSeatPoolSuccess(null)
                  }}
                  disabled={isProcessing}
                >
                  Close
                </Button>
              </div>

              <div className="p-6 space-y-4">
                {seatPoolError && (
                  <div className="p-3 rounded-lg border border-och-orange/50 bg-och-orange/10 text-och-orange text-sm">
                    {seatPoolError}
                  </div>
                )}
                {seatPoolSuccess && (
                  <div className="p-3 rounded-lg border border-och-mint/50 bg-och-mint/10 text-och-mint text-sm">
                    {seatPoolSuccess}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Paid Seats</label>
                    <input
                      type="number"
                      min="0"
                      max={cohorts.find((c) => c.id === selectedCohort)?.seat_cap || 0}
                      value={seatPoolForm.paid}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        setSeatPoolForm((prev) => ({ ...prev, paid: value }))
                        setSeatPoolError(null)
                      }}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Scholarship Seats</label>
                    <input
                      type="number"
                      min="0"
                      max={cohorts.find((c) => c.id === selectedCohort)?.seat_cap || 0}
                      value={seatPoolForm.scholarship}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        setSeatPoolForm((prev) => ({ ...prev, scholarship: value }))
                        setSeatPoolError(null)
                      }}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Sponsored Seats</label>
                    <input
                      type="number"
                      min="0"
                      max={cohorts.find((c) => c.id === selectedCohort)?.seat_cap || 0}
                      value={seatPoolForm.sponsored}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        setSeatPoolForm((prev) => ({ ...prev, sponsored: value }))
                        setSeatPoolError(null)
                      }}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>

                  <div className="pt-4 border-t border-och-steel/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-och-steel">Total Allocated</span>
                      <span
                        className={`text-lg font-bold ${
                          seatPoolForm.paid + seatPoolForm.scholarship + seatPoolForm.sponsored >
                          (cohorts.find((c) => c.id === selectedCohort)?.seat_cap || 0)
                            ? 'text-och-orange'
                            : seatPoolForm.paid + seatPoolForm.scholarship + seatPoolForm.sponsored ===
                              (cohorts.find((c) => c.id === selectedCohort)?.seat_cap || 0)
                            ? 'text-och-mint'
                            : 'text-white'
                        }`}
                      >
                        {seatPoolForm.paid + seatPoolForm.scholarship + seatPoolForm.sponsored} /{' '}
                        {cohorts.find((c) => c.id === selectedCohort)?.seat_cap}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-och-steel">Available</span>
                      <span className="text-sm font-medium text-white">
                        {(cohorts.find((c) => c.id === selectedCohort)?.seat_cap || 0) -
                          (seatPoolForm.paid + seatPoolForm.scholarship + seatPoolForm.sponsored)}{' '}
                        seats
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCohort(null)
                      setSeatPoolError(null)
                      setSeatPoolSuccess(null)
                    }}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="defender"
                    size="sm"
                    onClick={handleUpdateSeatPool}
                    disabled={
                      isProcessing ||
                      seatPoolForm.paid + seatPoolForm.scholarship + seatPoolForm.sponsored >
                        (cohorts.find((c) => c.id === selectedCohort)?.seat_cap || 0) ||
                      seatPoolForm.paid < 0 ||
                      seatPoolForm.scholarship < 0 ||
                      seatPoolForm.sponsored < 0
                    }
                    className="flex-1"
                  >
                    {isProcessing ? 'Updating...' : 'Update Seat Pool'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DirectorLayout>
    </RouteGuard>
  )
}
