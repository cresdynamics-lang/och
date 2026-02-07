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

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string

  const [student, setStudent] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (studentId) {
      loadStudentData()
    }
  }, [studentId])

  const loadStudentData = async () => {
    try {
      setIsLoading(true)
      const user = await djangoClient.users.getUser(Number(studentId))
      setStudent(user)
    } catch (error) {
      console.error('Failed to load student:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendVerificationEmail = async () => {
    if (!student) return
    
    if (!confirm(`Send verification email to ${student.email}?`)) return

    try {
      setIsUpdating(true)
      await djangoClient.auth.resendVerificationEmail(Number(studentId))
      alert(`Verification email sent to ${student.email}.\n\nThe student will receive an email with a verification link.`)
    } catch (error: any) {
      console.error('Failed to send verification email:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to send verification email'
      alert(`Error: ${errorMsg}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleManualVerifyEmail = async () => {
    if (!student) return
    
    if (!confirm('Are you sure you want to MANUALLY verify this student\'s email?\n\nThis will bypass the email verification process and directly activate the account.')) return

    try {
      setIsUpdating(true)
      await djangoClient.users.updateUser(Number(studentId), {
        email_verified: true,
        account_status: 'active',
        is_active: true
      })
      
      await loadStudentData()
      alert('Student email verified and account activated successfully')
    } catch (error) {
      console.error('Failed to verify student:', error)
      alert('Failed to verify student')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleActive = async () => {
    if (!student) return
    
    const confirmMsg = student.is_active 
      ? 'Are you sure you want to deactivate this student account?'
      : 'Are you sure you want to reactivate this student account?'
    
    if (!confirm(confirmMsg)) return

    try {
      setIsUpdating(true)
      await djangoClient.users.updateUser(Number(studentId), {
        is_active: !student.is_active,
        account_status: student.is_active ? 'deactivated' : 'active'
      })
      
      await loadStudentData()
      alert(`Student ${student.is_active ? 'deactivated' : 'reactivated'} successfully`)
    } catch (error) {
      console.error('Failed to update student status:', error)
      alert('Failed to update student status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleResetPassword = async () => {
    if (!student) return
    
    if (!confirm('Are you sure you want to send a password reset email to this student?')) return

    try {
      setIsUpdating(true)
      await djangoClient.auth.requestPasswordReset({ email: student.email })
      alert('Password reset email sent successfully')
    } catch (error) {
      console.error('Failed to send password reset:', error)
      alert('Failed to send password reset email')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleResetOnboarding = async () => {
    if (!student) return
    
    if (!confirm('Are you sure you want to reset this student\'s onboarding progress?')) return

    try {
      setIsUpdating(true)
      await djangoClient.users.updateUser(Number(studentId), {
        onboarding_complete: false,
        profile_complete: false
      })
      
      await loadStudentData()
      alert('Onboarding reset successfully')
    } catch (error) {
      console.error('Failed to reset onboarding:', error)
      alert('Failed to reset onboarding')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleResetProfiling = async () => {
    if (!student) return
    
    if (!confirm('Are you sure you want to reset this student\'s profiling data?')) return

    try {
      setIsUpdating(true)
      await djangoClient.users.updateUser(Number(studentId), {
        profiling_complete: false,
        profiling_completed_at: null
      })
      
      await loadStudentData()
      alert('Profiling reset successfully')
    } catch (error) {
      console.error('Failed to reset profiling:', error)
      alert('Failed to reset profiling')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleViewProgress = () => {
    // Navigate to a detailed progress view
    router.push(`/dashboard/admin/progress/${studentId}`)
  }

  if (isLoading) {
    return (
      <RouteGuard requiredRoles={['admin']}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading student details...</p>
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
              <span className="ml-2">Back to Students</span>
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
              <Button variant="outline" onClick={() => router.push('/dashboard/admin/users/mentees')}>
                <ArrowLeftIcon />
                <span className="ml-2">Back</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">{studentName}</h1>
                <p className="text-och-steel mt-1">{student.email}</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Badge
                variant={
                  student.account_status === 'pending_verification' 
                    ? 'orange' 
                    : student.is_active && student.account_status === 'active' 
                    ? 'mint' 
                    : 'steel'
                }
              >
                {student.account_status === 'pending_verification' 
                  ? 'Pending Email Verification' 
                  : student.account_status === 'active' && student.is_active 
                  ? 'Active' 
                  : student.account_status || 'Inactive'}
              </Badge>
              {!student.email_verified && (
                <Badge variant="orange">
                  Email Not Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-och-steel">Username</p>
                    <p className="text-white font-medium">{student.username || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel">Email</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{student.email}</p>
                      <Badge variant={student.email_verified ? 'mint' : 'orange'} className="text-xs">
                        {student.email_verified ? 'Verified' : 'Not Verified'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel">Phone</p>
                    <p className="text-white font-medium">{student.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel">Account Status</p>
                    <Badge variant={
                      student.account_status === 'active' ? 'mint' :
                      student.account_status === 'pending_verification' ? 'orange' :
                      'steel'
                    }>
                      {student.account_status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel">Joined</p>
                    <p className="text-white font-medium">
                      {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Program Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-och-steel">Cohort</p>
                    <p className="text-white font-medium">{student.cohort_id || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel">Track</p>
                    <p className="text-white font-medium">{student.track_key || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel">Country</p>
                    <p className="text-white font-medium">{student.country || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel">Timezone</p>
                    <p className="text-white font-medium">{student.timezone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Progress Status</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-och-steel">Profile Complete</p>
                    <Badge variant={student.profile_complete ? 'mint' : 'steel'}>
                      {student.profile_complete ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel">Onboarding Complete</p>
                    <Badge variant={student.onboarding_complete ? 'mint' : 'steel'}>
                      {student.onboarding_complete ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel">Profiling Complete</p>
                    <Badge variant={student.profiling_complete ? 'mint' : 'steel'}>
                      {student.profiling_complete ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel">Foundations Complete</p>
                    <Badge variant={student.foundations_complete ? 'mint' : 'steel'}>
                      {student.foundations_complete ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Bio */}
          {student.bio && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Bio</h3>
                <p className="text-och-steel">{student.bio}</p>
              </div>
            </Card>
          )}

          {/* Career Goals */}
          {student.career_goals && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Career Goals</h3>
                <p className="text-och-steel">{student.career_goals}</p>
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Admin Actions</h3>
              
              {/* Email Verification Section */}
              {!student.email_verified && (
                <div className="mb-6 p-4 bg-och-orange/10 border border-och-orange/30 rounded-lg">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-white font-semibold mb-1">Email Not Verified</p>
                      <p className="text-sm text-och-steel">This student's email address has not been verified yet.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="defender" 
                        size="sm"
                        onClick={handleSendVerificationEmail}
                        disabled={isUpdating}
                      >
                        Send Verification Email
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleManualVerifyEmail}
                        disabled={isUpdating}
                      >
                        Manual Override
                      </Button>
                    </div>
                    <p className="text-xs text-och-steel">
                      <strong>Send Verification Email:</strong> Student receives email with verification link
                      <br />
                      <strong>Manual Override:</strong> Instantly verify without sending email
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                <Button 
                  variant="defender" 
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={isUpdating}
                >
                  Send Password Reset
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetOnboarding}
                  disabled={isUpdating}
                >
                  Reset Onboarding
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetProfiling}
                  disabled={isUpdating}
                >
                  Reset Profiling
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleViewProgress}
                  disabled={isUpdating}
                >
                  View Progress Details
                </Button>
                {student.email_verified && (
                  <Button 
                    variant={student.is_active ? 'orange' : 'mint'} 
                    size="sm"
                    onClick={handleToggleActive}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating...' : student.is_active ? 'Deactivate Account' : 'Reactivate Account'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
