'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'

interface Enrollment {
  id: string
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  cohort: {
    id: string
    name: string
    track: {
      name: string
      program: {
        name: string
      }
    }
  }
  enrollment_type: string
  seat_type: string
  payment_status: string
  status: string
  joined_at: string
}

interface Cohort {
  id: string
  name: string
  seat_cap: number
  track: {
    name: string
    program: {
      name: string
    }
  }
}

export default function EnrollmentApprovalClient() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [selectedCohort, setSelectedCohort] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load cohorts
      const cohortsResponse = await fetch('/api/v1/director/cohorts-management/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (cohortsResponse.ok) {
        const cohortsData = await cohortsResponse.json()
        setCohorts(cohortsData.results || cohortsData)
      }

      // Load pending enrollments
      const enrollmentsResponse = await fetch('/api/v1/director/cohorts-management/enrollments/?status=pending_payment', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (enrollmentsResponse.ok) {
        const enrollmentsData = await enrollmentsResponse.json()
        setEnrollments(enrollmentsData.results || enrollmentsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCohortEnrollments = async (cohortId: string) => {
    try {
      const response = await fetch(`/api/v1/director/cohorts-management/${cohortId}/enrollments/?status=pending_payment`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setEnrollments(data)
      }
    } catch (error) {
      console.error('Error loading cohort enrollments:', error)
    }
  }

  const handleApprove = async (enrollmentId: string) => {
    setProcessing(enrollmentId)
    try {
      const enrollment = enrollments.find(e => e.id === enrollmentId)
      if (!enrollment) return

      const response = await fetch(`/api/v1/director/cohorts-management/${enrollment.cohort.id}/approve_enrollment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId
        })
      })

      if (response.ok) {
        // Remove from pending list
        setEnrollments(prev => prev.filter(e => e.id !== enrollmentId))
      } else {
        const error = await response.json()
        console.error('Failed to approve enrollment:', error)
      }
    } catch (error) {
      console.error('Error approving enrollment:', error)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (enrollmentId: string, reason: string = '') => {
    setProcessing(enrollmentId)
    try {
      const enrollment = enrollments.find(e => e.id === enrollmentId)
      if (!enrollment) return

      const response = await fetch(`/api/v1/director/cohorts-management/${enrollment.cohort.id}/reject_enrollment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          reason
        })
      })

      if (response.ok) {
        // Remove from pending list
        setEnrollments(prev => prev.filter(e => e.id !== enrollmentId))
      } else {
        const error = await response.json()
        console.error('Failed to reject enrollment:', error)
      }
    } catch (error) {
      console.error('Error rejecting enrollment:', error)
    } finally {
      setProcessing(null)
    }
  }

  const getSeatTypeColor = (seatType: string) => {
    switch (seatType) {
      case 'paid': return 'defender'
      case 'scholarship': return 'mint'
      case 'sponsored': return 'orange'
      default: return 'steel'
    }
  }

  const getEnrollmentTypeLabel = (type: string) => {
    switch (type) {
      case 'self': return 'Self-enrolled'
      case 'sponsor': return 'Sponsor assigned'
      case 'invite': return 'Invited'
      case 'director': return 'Director assigned'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
          <p className="text-och-steel">Loading enrollment requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Enrollment Approvals</h1>
        <p className="text-och-steel">Review and approve student enrollment requests</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">
                Filter by Cohort
              </label>
              <select
                value={selectedCohort}
                onChange={(e) => {
                  setSelectedCohort(e.target.value)
                  if (e.target.value) {
                    loadCohortEnrollments(e.target.value)
                  } else {
                    loadData()
                  }
                }}
                className="px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
              >
                <option value="">All Cohorts</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name} ({cohort.track.program.name})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Enrollment Requests */}
      {enrollments.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-white mb-2">No Pending Enrollments</h3>
            <p className="text-och-steel">All enrollment requests have been processed</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="border-och-orange/30">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">
                        {enrollment.user.first_name} {enrollment.user.last_name}
                      </h3>
                      <Badge variant={getSeatTypeColor(enrollment.seat_type) as any}>
                        {enrollment.seat_type}
                      </Badge>
                      <Badge variant="orange">
                        {getEnrollmentTypeLabel(enrollment.enrollment_type)}
                      </Badge>
                    </div>
                    
                    <p className="text-och-steel mb-1">{enrollment.user.email}</p>
                    
                    <div className="text-sm text-och-steel">
                      <p><strong>Program:</strong> {enrollment.cohort.track.program.name}</p>
                      <p><strong>Track:</strong> {enrollment.cohort.track.name}</p>
                      <p><strong>Cohort:</strong> {enrollment.cohort.name}</p>
                      <p><strong>Applied:</strong> {new Date(enrollment.joined_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(enrollment.id, 'Capacity full')}
                      disabled={processing === enrollment.id}
                    >
                      {processing === enrollment.id ? 'Processing...' : 'Reject'}
                    </Button>
                    <Button
                      variant="mint"
                      size="sm"
                      onClick={() => handleApprove(enrollment.id)}
                      disabled={processing === enrollment.id}
                    >
                      {processing === enrollment.id ? 'Processing...' : 'Approve'}
                    </Button>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="border-t border-och-steel/20 pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-och-steel">Payment Status</p>
                      <Badge variant={enrollment.payment_status === 'paid' ? 'mint' : 'orange'}>
                        {enrollment.payment_status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-och-steel">Seat Type</p>
                      <p className="text-white capitalize">{enrollment.seat_type}</p>
                    </div>
                    <div>
                      <p className="text-och-steel">Enrollment Method</p>
                      <p className="text-white">{getEnrollmentTypeLabel(enrollment.enrollment_type)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}