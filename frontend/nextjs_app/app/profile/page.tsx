/**
 * Profile Page Component
 * Allows users to view and manage their account information, preferences, and security settings
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { djangoClient } from '@/services/djangoClient'
import { useAuth } from '@/hooks/useAuth'
import type { User, UserRole } from '@/services/types'

interface ProfileData extends User {
  roles?: UserRole[]
  primary_role?: UserRole
  consent_scopes?: any[]
  entitlements?: string[]
  role_specific_data?: {
    mentor?: {
      active_mentees: number
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

const learningStyles = [
  { value: 'visual', label: 'Visual Learner' },
  { value: 'auditory', label: 'Auditory Learner' },
  { value: 'kinesthetic', label: 'Kinesthetic Learner' },
  { value: 'reading', label: 'Reading/Writing Learner' },
  { value: 'mixed', label: 'Mixed' },
]

const cyberExposureLevels = [
  { value: 'none', label: 'No Experience' },
  { value: 'beginner', label: 'Beginner (Some Awareness)' },
  { value: 'intermediate', label: 'Intermediate (Some Training)' },
  { value: 'advanced', label: 'Advanced (Professional Experience)' },
]

const timezones = [
  'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00',
  'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00',
  'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00',
  'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'
]

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser, reloadUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'security'>('profile')

  useEffect(() => {
    loadProfile()
  }, [])

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
        preferred_learning_style: profile.preferred_learning_style,
        career_goals: profile.career_goals,
        cyber_exposure_level: profile.cyber_exposure_level,
      }

      await djangoClient.users.updateProfile(updateData)
      await reloadUser()
      alert('Profile updated successfully!')
    } catch (err: any) {
      console.error('Error saving profile:', err)
      alert(err.message || 'Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getRoleDisplayName = (role: UserRole | undefined) => {
    if (!role) return 'User'
    return role.role_display_name || role.role || 'User'
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
      <div className="min-h-screen bg-och-midnight p-6 flex items-center justify-center">
        <div className="text-och-mint text-xl">Loading profile...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-och-midnight p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="p-6 text-center">
              <p className="text-och-orange mb-4">{error || 'Failed to load profile'}</p>
              <Button onClick={loadProfile} variant="defender">Retry</Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const primaryRole = profile.primary_role || (profile.roles && profile.roles[0])
  const roleDisplayName = getRoleDisplayName(primaryRole)

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-mint">My Profile</h1>
              <p className="text-och-steel">
                Manage your account information and preferences
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
          {['profile', 'account', 'security'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
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
                  <h2 className="text-2xl font-bold mb-4 text-white">Basic Information</h2>
                  
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
                          disabled={saving}
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
                          disabled={saving}
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
                        disabled={saving}
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
                          disabled={saving}
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
                          disabled={saving}
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
                        disabled={saving}
                      />
                    </div>
                  </div>
                </Card>

                {/* Learning Preferences (for students/mentees) */}
                {(primaryRole?.role === 'student' || primaryRole?.role === 'mentee') && (
                  <Card>
                    <h2 className="text-2xl font-bold mb-4 text-white">Learning Preferences</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-och-steel mb-1">
                          Preferred Learning Style
                        </label>
                        <select
                          value={profile.preferred_learning_style || ''}
                          onChange={(e) => handleFieldChange('preferred_learning_style', e.target.value)}
                          className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                          disabled={saving}
                        >
                          <option value="">Select learning style</option>
                          {learningStyles.map(style => (
                            <option key={style.value} value={style.value}>{style.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-och-steel mb-1">
                          Career Goals
                        </label>
                        <textarea
                          value={profile.career_goals || ''}
                          onChange={(e) => handleFieldChange('career_goals', e.target.value)}
                          className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender min-h-[100px]"
                          placeholder="Describe your career aspirations and goals..."
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-och-steel mb-1">
                          Cyber Exposure Level
                        </label>
                        <select
                          value={profile.cyber_exposure_level || ''}
                          onChange={(e) => handleFieldChange('cyber_exposure_level', e.target.value)}
                          className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                          disabled={saving}
                        >
                          <option value="">Select your level</option>
                          {cyberExposureLevels.map(level => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Mentor-specific section */}
                {primaryRole?.role === 'mentor' && profile.role_specific_data?.mentor && (
                  <Card>
                    <h2 className="text-2xl font-bold mb-4 text-white">Mentor Information</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-och-steel mb-1">Active Mentees</p>
                        <p className="text-2xl font-bold text-och-mint">
                          {profile.role_specific_data.mentor.active_mentees}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-och-steel mb-1">Total Sessions</p>
                        <p className="text-2xl font-bold text-och-mint">
                          {profile.role_specific_data.mentor.total_sessions}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-och-steel mb-1">Pending Work Items</p>
                        <p className="text-2xl font-bold text-och-orange">
                          {profile.role_specific_data.mentor.pending_work_items}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-och-steel mb-1">Weekly Capacity</p>
                        <p className="text-2xl font-bold text-white">
                          {profile.role_specific_data.mentor.capacity_weekly} hours
                        </p>
                      </div>
                    </div>

                    {profile.role_specific_data.mentor.specialties.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-och-steel mb-2">Specialties</p>
                        <div className="flex gap-2 flex-wrap">
                          {profile.role_specific_data.mentor.specialties.map((spec, idx) => (
                            <Badge key={idx} variant="defender">{spec}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Student-specific section */}
                {profile.role_specific_data?.student && (
                  <Card>
                    <h2 className="text-2xl font-bold mb-4 text-white">Enrollment Information</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {profile.role_specific_data.student.track_name && (
                        <div>
                          <p className="text-sm text-och-steel mb-1">Track</p>
                          <p className="text-lg font-semibold text-white">
                            {profile.role_specific_data.student.track_name}
                          </p>
                        </div>
                      )}
                      {profile.role_specific_data.student.cohort_name && (
                        <div>
                          <p className="text-sm text-och-steel mb-1">Cohort</p>
                          <p className="text-lg font-semibold text-white">
                            {profile.role_specific_data.student.cohort_name}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="defender"
                    className="flex-1"
                    glow
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
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

                {/* Quick Actions */}
                <Card>
                  <h3 className="text-lg font-bold mb-4 text-white">Quick Actions</h3>
                  
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveTab('security')}
                    >
                      Change Password
                    </Button>
                    {!profile.mfa_enabled && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push('/dashboard/settings/security')}
                      >
                        Enable MFA
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
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
      </div>
    </div>
  )
}
