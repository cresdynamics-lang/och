'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { djangoClient } from '@/services/djangoClient'
import type { User } from '@/services/types'

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

export default function StudentProgressPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string

  const [student, setStudent] = useState<User | null>(null)
  const [progressData, setProgressData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (studentId) {
      loadData()
    }
  }, [studentId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [user, progress] = await Promise.all([
        djangoClient.users.getUser(Number(studentId)),
        djangoClient.progress.listProgress({ user: Number(studentId) })
      ])
      setStudent(user)
      setProgressData(progress.results || [])
    } catch (error) {
      console.error('Failed to load progress data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <RouteGuard requiredRoles={['admin']}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading progress data...</p>
            </div>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  if (!student) {
    return (
      <RouteGuard requiredRoles={['admin']}>
        <AdminLayout>
          <div className="p-6">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
              <ArrowLeftIcon />
              <span className="ml-2">Back</span>
            </Button>
            <Card className="p-12">
              <div className="text-center text-och-steel">
                <p className="text-lg mb-2">Student not found</p>
                <p className="text-sm">The student you're looking for doesn't exist or has been removed.</p>
              </div>
            </Card>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  const studentName = student.first_name && student.last_name
    ? `${student.first_name} ${student.last_name}`
    : student.email

  return (
    <RouteGuard requiredRoles={['admin']}>
      <AdminLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push(`/dashboard/admin/users/mentees/${studentId}`)}>
                <ArrowLeftIcon />
                <span className="ml-2">Back to Profile</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Progress Details</h1>
                <p className="text-och-steel mt-1">{studentName}</p>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-och-steel mb-2">Profile Status</h3>
                <Badge variant={student.profile_complete ? 'mint' : 'steel'} className="text-lg">
                  {student.profile_complete ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-och-steel mb-2">Onboarding Status</h3>
                <Badge variant={student.onboarding_complete ? 'mint' : 'steel'} className="text-lg">
                  {student.onboarding_complete ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-och-steel mb-2">Profiling Status</h3>
                <Badge variant={student.profiling_complete ? 'mint' : 'steel'} className="text-lg">
                  {student.profiling_complete ? 'Complete' : 'Incomplete'}
                </Badge>
                {student.recommended_track && (
                  <p className="text-xs text-och-steel mt-2">
                    Recommended: <span className="text-white font-medium">{student.recommended_track}</span>
                  </p>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-och-steel mb-2">Foundations Status</h3>
                <Badge variant={student.foundations_complete ? 'mint' : 'steel'} className="text-lg">
                  {student.foundations_complete ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
            </Card>
          </div>

          {/* Current Track Info */}
          {student.track_key && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Current Track</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-och-steel">Track</p>
                    <p className="text-white font-medium capitalize">{student.track_key}</p>
                  </div>
                  {student.cohort_id && (
                    <div>
                      <p className="text-sm text-och-steel">Cohort</p>
                      <p className="text-white font-medium">{student.cohort_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Detailed Progress Records */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Progress Records ({progressData.length})
              </h3>
              
              {progressData.length === 0 ? (
                <div className="text-center py-8 text-och-steel">
                  <p>No progress records found for this student.</p>
                  <p className="text-sm mt-2">Progress will appear here as the student completes curriculum activities.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {progressData.map((progress: any, index: number) => (
                    <div 
                      key={progress.id || index} 
                      className="p-4 bg-och-dark-lighter rounded-lg border border-och-steel/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white font-medium mb-1">
                            {progress.content_type || 'Activity'}
                          </p>
                          <p className="text-sm text-och-steel mb-2">
                            Progress: {progress.completion_percent || 0}%
                          </p>
                          {progress.last_accessed && (
                            <p className="text-xs text-och-steel">
                              Last accessed: {new Date(progress.last_accessed).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={
                            progress.completion_percent >= 100 ? 'mint' : 
                            progress.completion_percent > 0 ? 'orange' : 
                            'steel'
                          }
                        >
                          {progress.completion_percent >= 100 ? 'Complete' : 
                           progress.completion_percent > 0 ? 'In Progress' : 
                           'Not Started'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Learning Preferences */}
          {(student.preferred_learning_style || student.career_goals || student.cyber_exposure_level) && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Learning Profile</h3>
                <div className="space-y-3">
                  {student.preferred_learning_style && (
                    <div>
                      <p className="text-sm text-och-steel">Learning Style</p>
                      <p className="text-white font-medium capitalize">{student.preferred_learning_style}</p>
                    </div>
                  )}
                  {student.cyber_exposure_level && (
                    <div>
                      <p className="text-sm text-och-steel">Cyber Exposure Level</p>
                      <p className="text-white font-medium capitalize">{student.cyber_exposure_level}</p>
                    </div>
                  )}
                  {student.career_goals && (
                    <div>
                      <p className="text-sm text-och-steel">Career Goals</p>
                      <p className="text-white">{student.career_goals}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
