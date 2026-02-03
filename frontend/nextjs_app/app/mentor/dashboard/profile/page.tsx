'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { djangoClient } from '@/services/djangoClient'
import { programsClient } from '@/services/programsClient'
import { useAuth } from '@/hooks/useAuth'
import type { User, UserRole } from '@/services/types'
import { MentorSupportAndHelp } from '@/components/mentor/MentorSupportAndHelp'

interface ProfileData extends User {
  roles?: UserRole[]
  primary_role?: UserRole
  consent_scopes?: any[]
  entitlements?: string[]
  role_specific_data?: {
    mentor?: {
      active_mentees?: number  // Legacy field, kept for compatibility
      total_sessions: number
      pending_work_items: number
      capacity_weekly: number
      specialties: string[]
      availability: any
    }
    student?: {
      track_name?: string
      cohort_name?: string
      enrollment_status?: string
    }
    director?: {
      cohorts_managed: number
      tracks_managed: number
    }
    admin?: {
      total_users: number
      active_users: number
    }
  }
}

const timezones = [
  'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00',
  'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00',
  'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00',
  'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'
]

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

export default function MentorProfilePage() {
  const router = useRouter()
  const { user: authUser, reloadUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'mentor' | 'account' | 'security'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [newSpecialty, setNewSpecialty] = useState('')
  const [availabilityDay, setAvailabilityDay] = useState('')
  const [availabilityStart, setAvailabilityStart] = useState('')
  const [availabilityEnd, setAvailabilityEnd] = useState('')
  
  // Student data from assigned cohorts
  const [studentStats, setStudentStats] = useState<{
    totalStudents: number
    assignedCohorts: number
    loading: boolean
  }>({
    totalStudents: 0,
    assignedCohorts: 0,
    loading: true,
  })

  useEffect(() => {
    loadProfile()
    loadStudentStats()
  }, [authUser?.id])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const profileData = await djangoClient.users.getProfile()
      setProfile(profileData as ProfileData)
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const loadStudentStats = async () => {
    if (!authUser?.id) return
    
    setStudentStats(prev => ({ ...prev, loading: true }))
    try {
      // Get all cohorts
      const cohortsData = await programsClient.getCohorts({ page: 1, pageSize: 1000 })
      const cohorts = Array.isArray(cohortsData) ? cohortsData : (cohortsData?.results || [])
      
      // Find cohorts where this mentor is assigned
      const assignedCohortIds: string[] = []
      let totalStudents = 0
      
      for (const cohort of cohorts) {
        try {
          const cohortMentors = await programsClient.getCohortMentors(String(cohort.id))
          const isAssigned = cohortMentors.some(
            (assignment: any) => 
              String(assignment.mentor) === String(authUser.id) && assignment.active
          )
          
          if (isAssigned) {
            assignedCohortIds.push(String(cohort.id))
            
            // Get enrollments for this cohort
            try {
              const enrollments = await programsClient.getCohortEnrollments(String(cohort.id))
              // Count active students
              const activeStudents = enrollments.filter(
                (e: any) => e.status === 'active' || e.status === 'pending_payment'
              ).length
              totalStudents += activeStudents
            } catch (err) {
              console.warn(`Failed to load enrollments for cohort ${cohort.id}:`, err)
            }
          }
        } catch (err) {
          console.warn(`Failed to check assignment for cohort ${cohort.id}:`, err)
        }
      }
      
      setStudentStats({
        totalStudents,
        assignedCohorts: assignedCohortIds.length,
        loading: false,
      })
    } catch (err: any) {
      console.error('Error loading student stats:', err)
      setStudentStats(prev => ({ ...prev, loading: false }))
    }
  }

  const handleFieldChange = (field: keyof ProfileData, value: any) => {
    if (!profile) return
    setProfile({ ...profile, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      const updateData: Partial<User> = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        bio: profile.bio,
        phone_number: profile.phone_number,
        country: profile.country,
        timezone: profile.timezone,
        language: profile.language,
        mentor_capacity_weekly: profile.mentor_capacity_weekly,
        mentor_specialties: profile.mentor_specialties,
        mentor_availability: profile.mentor_availability,
      }

      await djangoClient.users.updateProfile(updateData)
      await reloadUser()
      await loadProfile()
      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (err: any) {
      console.error('Error saving profile:', err)
      alert(err.message || 'Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addSpecialty = () => {
    if (!newSpecialty.trim() || !profile) return
    const specialties = profile.mentor_specialties || []
    if (specialties.includes(newSpecialty)) return
    setProfile({
      ...profile,
      mentor_specialties: [...specialties, newSpecialty]
    })
    setNewSpecialty('')
  }

  const removeSpecialty = (specialty: string) => {
    if (!profile) return
    setProfile({
      ...profile,
      mentor_specialties: (profile.mentor_specialties || []).filter(s => s !== specialty)
    })
  }

  const addAvailability = () => {
    if (!availabilityDay || !availabilityStart || !availabilityEnd || !profile) return
    const availability = profile.mentor_availability || {}
    const dayKey = availabilityDay.toLowerCase()
    const hours = availability[dayKey] || []
    
    // Check for overlap
    const newStart = parseInt(availabilityStart.replace(':', ''))
    const newEnd = parseInt(availabilityEnd.replace(':', ''))
    const hasOverlap = hours.some((slot: string) => {
      const [start, end] = slot.split('-').map(t => parseInt(t.replace(':', '')))
      return (newStart >= start && newStart < end) || (newEnd > start && newEnd <= end)
    })

    if (hasOverlap) {
      alert('This time slot overlaps with an existing slot')
      return
    }

    setProfile({
      ...profile,
      mentor_availability: {
        ...availability,
        [dayKey]: [...hours, `${availabilityStart}-${availabilityEnd}`]
      }
    })
    setAvailabilityDay('')
    setAvailabilityStart('')
    setAvailabilityEnd('')
  }

  const removeAvailability = (day: string, index: number) => {
    if (!profile) return
    const availability = profile.mentor_availability || {}
    const dayKey = day.toLowerCase()
    const hours = availability[dayKey] || []
    setProfile({
      ...profile,
      mentor_availability: {
        ...availability,
        [dayKey]: hours.filter((_: any, i: number) => i !== index)
      }
    })
  }

  const getRoleDisplayName = (role: UserRole | undefined) => {
    if (!role) return 'Mentor'
    return role.role_display_name || role.role || 'Mentor'
  }

  const getRoleBadgeVariant = (roleName: string) => {
    const role = roleName.toLowerCase()
    if (role === 'admin' || role === 'program_director') return 'defender'
    if (role === 'mentor') return 'mint'
    if (role === 'student' || role === 'mentee') return 'orange'
    return 'steel'
  }

  if (loading) {
  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-och-mint text-xl">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <Card>
          <div className="p-6 text-center">
            <p className="text-och-orange mb-4">{error || 'Failed to load profile'}</p>
            <Button onClick={loadProfile} variant="defender">Retry</Button>
          </div>
        </Card>
      </div>
    )
  }

  const primaryRole = profile.primary_role || (profile.roles && profile.roles.find(r => r.role === 'mentor')) || profile.roles?.[0]
  const roleDisplayName = getRoleDisplayName(primaryRole)
  const mentorData = profile.role_specific_data?.mentor

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Mentor Profile</h1>
        <p className="text-och-steel">
          Manage your profile details, settings, and support options.
        </p>
      </div>
          {primaryRole && (
            <Badge variant={getRoleBadgeVariant(primaryRole.role)} className="text-lg px-4 py-2">
              {roleDisplayName}
            </Badge>
          )}
      </div>

        {/* Role badges */}
        {profile.roles && profile.roles.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4">
            {profile.roles.map((role, idx) => (
              <Badge key={idx} variant={getRoleBadgeVariant(role.role)}>
                {role.role_display_name || role.role}
                {role.scope !== 'global' && (
                  <span className="ml-1 text-xs">({role.scope})</span>
                )}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-och-steel/20">
        {['profile', 'mentor', 'account', 'security'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab as any)
              setIsEditing(false)
            }}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? 'text-och-mint border-b-2 border-och-mint'
                : 'text-och-steel hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Profile Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                  {!isEditing && (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        First Name <span className="text-och-orange">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.first_name || ''}
                        onChange={(e) => handleFieldChange('first_name', e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                        required
                        disabled={!isEditing || saving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        Last Name <span className="text-och-orange">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.last_name || ''}
                        onChange={(e) => handleFieldChange('last_name', e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                        required
                        disabled={!isEditing || saving}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email || ''}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-och-steel cursor-not-allowed"
                      disabled
                    />
                    <p className="text-xs text-och-steel mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-1">
                      Bio
                    </label>
                    <textarea
                      value={profile.bio || ''}
                      onChange={(e) => handleFieldChange('bio', e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender min-h-[100px]"
                      placeholder="Tell us about yourself..."
                      disabled={!isEditing || saving}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={profile.country || ''}
                        onChange={(e) => handleFieldChange('country', e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                        placeholder="e.g., US, KE, ZA"
                        disabled={!isEditing || saving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        Time Zone
                      </label>
                      <select
                        value={profile.timezone || 'UTC'}
                        onChange={(e) => handleFieldChange('timezone', e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                        disabled={!isEditing || saving}
                      >
                        {timezones.map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone_number || ''}
                      onChange={(e) => handleFieldChange('phone_number', e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      placeholder="+1234567890"
                      disabled={!isEditing || saving}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="defender"
                      glow
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
      <div className="space-y-6">
              {/* Account Status */}
              <Card>
                <h3 className="text-lg font-bold mb-4 text-white">Account Status</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-och-steel mb-1">Status</p>
                    <Badge
                      variant={
                        profile.account_status === 'active'
                          ? 'mint'
                          : profile.account_status === 'suspended'
                          ? 'orange'
                          : 'defender'
                      }
                    >
                      {profile.account_status || 'Unknown'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel mb-1">Email Verified</p>
                    <Badge variant={profile.email_verified ? 'mint' : 'orange'}>
                      {profile.email_verified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel mb-1">MFA Enabled</p>
                    <Badge variant={profile.mfa_enabled ? 'mint' : 'defender'}>
                      {profile.mfa_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  {profile.created_at && (
                    <div>
                      <p className="text-sm text-och-steel mb-1">Member Since</p>
                      <p className="text-white text-sm">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Mentor Stats */}
                <Card>
                  <h3 className="text-lg font-bold mb-4 text-white">Mentor Statistics</h3>
                  
                  <div className="space-y-3">
                    <div>
                    <p className="text-sm text-och-steel mb-1">Students in Assigned Cohorts</p>
                    {studentStats.loading ? (
                      <p className="text-2xl font-bold text-och-steel">Loading...</p>
                    ) : (
                      <p className="text-2xl font-bold text-och-mint">
                        {studentStats.totalStudents}
                      </p>
                    )}
                    {!studentStats.loading && (
                      <p className="text-xs text-och-steel mt-1">
                        Across {studentStats.assignedCohorts} cohort{studentStats.assignedCohorts !== 1 ? 's' : ''}
                      </p>
                    )}
                    </div>
                  {mentorData && (
                    <>
                    <div>
                      <p className="text-sm text-och-steel mb-1">Total Sessions</p>
                      <p className="text-2xl font-bold text-och-mint">
                        {mentorData.total_sessions}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-och-steel mb-1">Pending Work Items</p>
                      <p className="text-2xl font-bold text-och-orange">
                        {mentorData.pending_work_items}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-och-steel mb-1">Weekly Capacity</p>
                      <p className="text-lg font-semibold text-white">
                        {mentorData.capacity_weekly} hours
                      </p>
                    </div>
                    </>
                  )}
                  </div>
                </Card>
            </div>
          </div>
        </form>
      )}

      {/* Mentor Tab - Mentor-specific settings */}
      {activeTab === 'mentor' && (
        <form onSubmit={handleSubmit}>
      <div className="space-y-6">
            <Card>
              <h2 className="text-2xl font-bold mb-4 text-white">Mentor Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-och-steel mb-1">
                    Weekly Capacity (hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={profile.mentor_capacity_weekly || 10}
                    onChange={(e) => handleFieldChange('mentor_capacity_weekly', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-1">
                    Specialties
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                      placeholder="Add specialty (e.g., SIEM, DFIR, Network Security)"
                      className="flex-1 px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      disabled={saving}
                    />
                    <Button type="button" variant="outline" onClick={addSpecialty} disabled={saving}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(profile.mentor_specialties || []).map((spec) => (
                      <Badge key={spec} variant="defender" className="flex items-center gap-2">
                        {spec}
                        <button
                          type="button"
                          onClick={() => removeSpecialty(spec)}
                          className="text-och-steel hover:text-white"
                          disabled={saving}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-1">
                    Availability
                  </label>
                  <div className="flex gap-2 mb-4">
                    <select
                      value={availabilityDay}
                      onChange={(e) => setAvailabilityDay(e.target.value)}
                      className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      disabled={saving}
                    >
                      <option value="">Select day</option>
                      {daysOfWeek.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={availabilityStart}
                      onChange={(e) => setAvailabilityStart(e.target.value)}
                      className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      disabled={saving}
                    />
                    <span className="self-center text-och-steel">to</span>
                    <input
                      type="time"
                      value={availabilityEnd}
                      onChange={(e) => setAvailabilityEnd(e.target.value)}
                      className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      disabled={saving}
                    />
                    <Button type="button" variant="outline" onClick={addAvailability} disabled={saving}>
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {daysOfWeek.map(day => {
                      const dayKey = day.toLowerCase()
                      const hours = (profile.mentor_availability || {})[dayKey] || []
                      if (hours.length === 0) return null
                      return (
                        <div key={day} className="p-3 bg-och-midnight/50 rounded-lg">
                          <p className="text-sm font-medium text-white mb-2">{day}</p>
                          <div className="space-y-1">
                            {hours.map((slot: string, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-och-steel">{slot}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeAvailability(day, idx)}
                                  disabled={saving}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    {Object.keys(profile.mentor_availability || {}).length === 0 && (
                      <p className="text-och-steel text-sm">No availability set</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-och-steel/20">
                  <Button
                    type="submit"
                    variant="defender"
                    glow
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </form>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <Card>
          <h2 className="text-2xl font-bold mb-4 text-white">Account Management</h2>
          <p className="text-och-steel mb-6">Account management features coming soon...</p>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card>
          <h2 className="text-2xl font-bold mb-4 text-white">Security Settings</h2>
          <p className="text-och-steel mb-6">Security settings coming soon...</p>
        </Card>
      )}

      {/* Support and Help */}
      <div className="mt-6">
        <MentorSupportAndHelp />
      </div>
    </div>
  )
}


