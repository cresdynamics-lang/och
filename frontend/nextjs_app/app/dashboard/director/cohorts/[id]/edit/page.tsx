'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCohort, useUpdateCohort, useTrack } from '@/hooks/usePrograms'
import { programsClient, type Cohort } from '@/services/programsClient'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface SeatPool {
  paid: number
  scholarship: number
  sponsored: number
}

export default function EditCohortPage() {
  const params = useParams()
  const router = useRouter()
  const cohortId = params.id as string
  const { cohort, isLoading: loadingCohort, reload: reloadCohort } = useCohort(cohortId)
  const { track, isLoading: loadingTrack } = useTrack(cohort?.track || '')
  const { updateCohort, isLoading: isUpdating, error: updateError } = useUpdateCohort()

  const [formData, setFormData] = useState<Partial<Cohort>>({
    name: '',
    start_date: '',
    end_date: '',
    mode: 'virtual',
    seat_cap: 20,
    mentor_ratio: 0.1,
    status: 'draft',
  })
  const [seatPool, setSeatPool] = useState<SeatPool>({ paid: 0, scholarship: 0, sponsored: 0 })
  const [error, setError] = useState<string | null>(null)

  // Initialize form data when cohort loads
  useEffect(() => {
    if (cohort) {
      // Format dates for date inputs (YYYY-MM-DD)
      const startDate = cohort.start_date ? (cohort.start_date.includes('T') ? cohort.start_date.split('T')[0] : cohort.start_date) : ''
      const endDate = cohort.end_date ? (cohort.end_date.includes('T') ? cohort.end_date.split('T')[0] : cohort.end_date) : ''

      setFormData({
        name: cohort.name || '',
        start_date: startDate,
        end_date: endDate,
        mode: cohort.mode || 'virtual',
        seat_cap: cohort.seat_cap || 20,
        mentor_ratio: cohort.mentor_ratio || 0.1,
        status: cohort.status || 'draft',
      })

      // Set seat pool if available
      if ((cohort as any).seat_pool && typeof (cohort as any).seat_pool === 'object') {
        const pool = (cohort as any).seat_pool as any
        setSeatPool({
          paid: pool.paid || 0,
          scholarship: pool.scholarship || 0,
          sponsored: pool.sponsored || 0,
        })
      }
    }
  }, [cohort])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields')
      return
    }

    if (!cohort) {
      setError('Cohort data is not available')
      return
    }

    try {
      const updateData: any = {
        track: cohort.track, // Track is required by backend serializer
        name: formData.name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        mode: formData.mode,
        seat_cap: formData.seat_cap,
        mentor_ratio: formData.mentor_ratio,
        status: formData.status,
      }

      // Include seat pool if it has values
      if (seatPool.paid > 0 || seatPool.scholarship > 0 || seatPool.sponsored > 0) {
        updateData.seat_pool = seatPool
      }

      await updateCohort(cohortId, updateData)
      
      // Reload cohort data
      await reloadCohort()
      
      // Redirect to cohort detail page
      router.push(`/dashboard/director/cohorts/${cohortId}`)
    } catch (err: any) {
      console.error('Failed to update cohort:', err)
      
      // Extract detailed error message from backend response
      let errorMessage = 'Failed to update cohort'
      const errorData = err?.response?.data || err?.data
      
      if (errorData) {
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail)
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string'
            ? errorData.error
            : JSON.stringify(errorData.error)
        } else if (errorData.details) {
          // Handle validation errors with field-specific messages
          const fieldErrors = Object.entries(errorData.details)
            .map(([field, errors]: [string, any]) => {
              const errorMsg = Array.isArray(errors) ? errors.join(', ') : String(errors)
              return `${field}: ${errorMsg}`
            })
            .join('; ')
          errorMessage = fieldErrors || errorMessage
        } else if (typeof errorData === 'object') {
          // Handle field-level validation errors
          const fieldErrors = Object.entries(errorData)
            .filter(([key]) => key !== 'received_data')
            .map(([field, errors]: [string, any]) => {
              const errorMsg = Array.isArray(errors) ? errors.join(', ') : String(errors)
              return `${field}: ${errorMsg}`
            })
            .join('; ')
          if (fieldErrors) {
            errorMessage = fieldErrors
          }
        }
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    }
  }

  const totalSeatsAllocated = seatPool.paid + seatPool.scholarship + seatPool.sponsored
  const seatsRemaining = (formData.seat_cap || 0) - totalSeatsAllocated

  if (loadingCohort) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card>
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading cohort details...</p>
            </div>
          </Card>
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Edit Cohort</h1>
                <p className="text-och-steel">
                  Update cohort details and configuration
                </p>
              </div>
              <Link href={`/dashboard/director/cohorts/${cohortId}`}>
                <Button variant="outline" size="sm">
                  ← Back to Cohort
                </Button>
              </Link>
            </div>

            {/* Cohort Info Card */}
            <Card className="mb-6 border-och-defender/30">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">{cohort.name}</h3>
                  <Badge variant="defender">{cohort.status}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-och-steel">Track:</span>
                    <span className="ml-2 text-white">{cohort.track_name || track?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-och-steel">Mode:</span>
                    <span className="ml-2 text-white capitalize">{cohort.mode}</span>
                  </div>
                  <div>
                    <span className="text-och-steel">Seat Cap:</span>
                    <span className="ml-2 text-white">{cohort.seat_cap}</span>
                  </div>
                  <div>
                    <span className="text-och-steel">Mentor Ratio:</span>
                    <span className="ml-2 text-white">1:{Math.round(1 / (cohort.mentor_ratio || 0.1))}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Cohort Details</h2>

                {error && (
                  <div className="p-4 bg-och-orange/20 border border-och-orange rounded-lg text-och-orange">
                    {error}
                  </div>
                )}

                {updateError && (
                  <div className="p-4 bg-och-orange/20 border border-och-orange rounded-lg text-och-orange">
                    {updateError}
                  </div>
                )}

                {/* Cohort Name */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Cohort Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    placeholder="e.g., Jan 2026 Cohort"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                </div>

                {/* Delivery Mode */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Delivery Mode *
                  </label>
                  <select
                    required
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="virtual">Virtual</option>
                    <option value="onsite">Onsite</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="running">Running</option>
                    <option value="closing">Closing</option>
                    <option value="closed">Closed</option>
                  </select>
                  <p className="text-xs text-och-steel mt-2">
                    Status lifecycle: draft → active → running → closing → closed
                  </p>
                </div>

                {/* Capacity Section */}
                <div className="border-t border-och-steel/20 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Capacity & Resources</h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Seat Capacity *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.seat_cap}
                        onChange={(e) => setFormData({ ...formData, seat_cap: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Mentor Ratio (e.g., 0.1 = 1:10) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="1"
                        step="0.01"
                        value={formData.mentor_ratio}
                        onChange={(e) => setFormData({ ...formData, mentor_ratio: parseFloat(e.target.value) || 0.1 })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      />
                      <p className="text-xs text-och-steel mt-1">
                        Recommended: 0.1 (1 mentor per 10 students)
                      </p>
                    </div>
                  </div>

                  {/* Seat Pool Breakdown */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Seat Pool Breakdown
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-och-steel mb-1">Paid Seats</label>
                        <input
                          type="number"
                          min="0"
                          value={seatPool.paid}
                          onChange={(e) => setSeatPool({ ...seatPool, paid: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-och-steel mb-1">Scholarship Seats</label>
                        <input
                          type="number"
                          min="0"
                          value={seatPool.scholarship}
                          onChange={(e) => setSeatPool({ ...seatPool, scholarship: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-och-steel mb-1">Sponsored Seats</label>
                        <input
                          type="number"
                          min="0"
                          value={seatPool.sponsored}
                          onChange={(e) => setSeatPool({ ...seatPool, sponsored: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="text-och-steel">Total Allocated:</span>
                      <span className={`font-medium ${totalSeatsAllocated > (formData.seat_cap || 0) ? 'text-och-orange' : 'text-white'}`}>
                        {totalSeatsAllocated}
                      </span>
                      <span className="text-och-steel">/ {formData.seat_cap}</span>
                      {seatsRemaining < 0 && (
                        <Badge variant="orange" className="ml-2">Over capacity!</Badge>
                      )}
                      {seatsRemaining > 0 && (
                        <span className="text-och-steel">({seatsRemaining} remaining)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-och-steel/20">
                  <Link href={`/dashboard/director/cohorts/${cohortId}`}>
                    <Button type="button" variant="outline" disabled={isUpdating}>
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    variant="defender"
                    disabled={isUpdating || !formData.name || !formData.start_date || !formData.end_date}
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </Card>
          </form>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

