'use client'

import { useState, useEffect, useRef } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { apiGateway } from '@/services/apiGateway'
import { OCHSettingsSecurity } from '@/components/ui/settings/sections/OCHSettingsSecurity'
import type { User } from '@/services/types'

interface AuditLog {
  id: number
  action: string
  resource_type: string
  resource_id: string | null
  changes: Record<string, any>
  result: string
  timestamp: string
  actor_identifier: string
  ip_address: string | null
}

export default function DirectorSettingsPage() {
  const { user, reloadUser, logout } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'avatar' | 'security'>('profile')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    phone_number: '',
    country: '',
    timezone: 'UTC',
    language: 'en',
  })

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  // Full profile from GET /profile/ (auth/me only returns id, email, name)
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    apiGateway
      .get<User>('/profile/')
      .then((data) => {
        if (cancelled) return
        setProfile(data)
        setFormData({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          email: data.email ?? '',
          bio: data.bio ?? '',
          phone_number: data.phone_number ?? '',
          country: data.country ?? '',
          timezone: data.timezone ?? 'UTC',
          language: data.language ?? 'en',
        })
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to load profile:', err)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    loadAuditLogs()
  }, [])

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true)
      const response = await apiGateway.get<any>('/audit-logs/', {
        params: {
          resource_type: 'user',
          ...(user?.id != null && { user_id: user.id.toString() }),
          range: 'month',
        },
      })
      const list = Array.isArray(response) ? response : (response?.results ?? [])
      setAuditLogs(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      setAuditLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id) return

    setIsSaving(true)
    setSaveStatus(null)
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        bio: formData.bio || null,
        phone_number: formData.phone_number || null,
        country: formData.country || null,
        timezone: formData.timezone,
        language: formData.language,
      }
      const updatedUser = await apiGateway.patch<User>('/profile/', payload)

      if (updatedUser) {
        setProfile(updatedUser)
        setFormData({
          first_name: updatedUser.first_name ?? '',
          last_name: updatedUser.last_name ?? '',
          email: updatedUser.email ?? '',
          bio: updatedUser.bio ?? '',
          phone_number: updatedUser.phone_number ?? '',
          country: updatedUser.country ?? '',
          timezone: updatedUser.timezone ?? 'UTC',
          language: updatedUser.language ?? 'en',
        })
      }
      setSaveStatus('Account updated successfully')
      await reloadUser()
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error: any) {
      setSaveStatus(`Error: ${error.message || 'Failed to update account'}`)
      setTimeout(() => setSaveStatus(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordData.old_password || !passwordData.new_password) {
      setSaveStatus('Error: All password fields are required')
      setTimeout(() => setSaveStatus(null), 5000)
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setSaveStatus('Error: New passwords do not match')
      setTimeout(() => setSaveStatus(null), 5000)
      return
    }

    if (passwordData.new_password.length < 8) {
      setSaveStatus('Error: Password must be at least 8 characters long')
      setTimeout(() => setSaveStatus(null), 5000)
      return
    }

    setIsSaving(true)
    setSaveStatus(null)
    try {
      await apiGateway.post('/auth/change-password/', {
        current_password: passwordData.old_password,
        new_password: passwordData.new_password,
      })
      setSaveStatus('Password changed successfully')
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      })
      await reloadUser()
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error: any) {
      setSaveStatus(`Error: ${error.message || error.detail || 'Failed to change password'}`)
      setTimeout(() => setSaveStatus(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setSaveStatus('Error: Invalid file type. Please upload JPEG, PNG, GIF, or WebP')
      setTimeout(() => setSaveStatus(null), 5000)
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveStatus('Error: File size exceeds 5MB limit')
      setTimeout(() => setSaveStatus(null), 5000)
      return
    }

    setUploadingAvatar(true)
    setSaveStatus(null)

    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const res = await apiGateway.post<{ avatar_url?: string }>('/users/upload_avatar/', fd, { headers: {} })
      if (res?.avatar_url) {
        setProfile((prev) => (prev ? { ...prev, avatar_url: res.avatar_url } : null))
      }
      setSaveStatus('Profile picture updated successfully')
      await reloadUser()
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error: any) {
      setSaveStatus(`Error: ${error.message || error.detail || 'Failed to upload avatar'}`)
      setTimeout(() => setSaveStatus(null), 5000)
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      login: 'Logged in',
      logout: 'Logged out',
      password_change: 'Password changed',
      role_assigned: 'Role assigned',
      role_revoked: 'Role revoked',
    }
    return labels[action] || action
  }

  const formatChanges = (changes: Record<string, any>) => {
    if (!changes || Object.keys(changes).length === 0) return null
    
    return Object.entries(changes).map(([field, value]) => {
      const oldVal = value?.old || 'N/A'
      const newVal = value?.new || 'N/A'
      return `${field}: ${oldVal} → ${newVal}`
    }).join(', ')
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-mint">Account Settings</h1>
            <p className="text-och-steel">Manage your account information, security, and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-och-steel/20">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'text-och-mint border-b-2 border-och-mint'
                    : 'text-och-steel hover:text-white'
                }`}
              >
                Profile Info
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'password'
                    ? 'text-och-mint border-b-2 border-och-mint'
                    : 'text-och-steel hover:text-white'
                }`}
              >
                Password
              </button>
              <button
                onClick={() => setActiveTab('avatar')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'avatar'
                    ? 'text-och-mint border-b-2 border-och-mint'
                    : 'text-och-steel hover:text-white'
                }`}
              >
                Profile Picture
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'text-och-mint border-b-2 border-och-mint'
                    : 'text-och-steel hover:text-white'
                }`}
              >
                Security & MFA
              </button>
            </div>

            {/* Profile Info Tab */}
            {activeTab === 'profile' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-white">Account Information</h2>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-och-steel">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-och-steel">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-och-steel">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-och-steel">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full px-4 py-2.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      placeholder="e.g. +1234567890"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-och-steel">
                      Bio
                    </label>
                    <textarea
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-4 py-2.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint resize-none"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-och-steel">
                        Country
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-4 py-2.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        placeholder="e.g. US"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-och-steel">
                        Timezone
                      </label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="America/Chicago">America/Chicago</option>
                        <option value="America/Denver">America/Denver</option>
                        <option value="America/Los_Angeles">America/Los_Angeles</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                        <option value="Africa/Nairobi">Africa/Nairobi</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-och-steel">
                        Language
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full px-4 py-2.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="sw">Swahili</option>
                      </select>
                    </div>
                  </div>

                  {saveStatus && (
                    <div
                      className={`p-3 rounded-lg ${
                        saveStatus.includes('Error')
                          ? 'bg-och-orange/20 border border-och-orange text-och-orange'
                          : 'bg-och-mint/20 border border-och-mint text-och-mint'
                      }`}
                    >
                      {saveStatus}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="mint"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (user) {
                          setFormData({
                            first_name: user.first_name || '',
                            last_name: user.last_name || '',
                            email: user.email || '',
                            bio: user.bio || '',
                            phone_number: user.phone_number || '',
                            country: user.country || '',
                            timezone: user.timezone || 'UTC',
                            language: user.language || 'en',
                          })
                        }
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Password Change Tab */}
            {activeTab === 'password' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-white">Change Password</h2>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-och-steel">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.old_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, old_password: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      placeholder="Current password"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-och-steel">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, new_password: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      placeholder="Min 8 characters"
                    />
                    <p className="text-xs text-och-steel">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-och-steel">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirm_password: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      placeholder="Confirm new password"
                    />
                  </div>

                  {saveStatus && (
                    <div
                      className={`p-3 rounded-lg ${
                        saveStatus.includes('Error')
                          ? 'bg-och-orange/20 border border-och-orange text-och-orange'
                          : 'bg-och-mint/20 border border-och-mint text-och-mint'
                      }`}
                    >
                      {saveStatus}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="mint"
                      onClick={handlePasswordChange}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Changing Password...' : 'Change Password'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPasswordData({
                          old_password: '',
                          new_password: '',
                          confirm_password: '',
                        })
                      }
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Profile Picture Tab */}
            {activeTab === 'avatar' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-white">Profile Picture</h2>
                <div className="space-y-4">
                  {/* Current Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {(profile ?? user)?.avatar_url ? (
                        <img
                          src={(profile ?? user)!.avatar_url!}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover border-2 border-och-mint"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-och-defender/20 border-2 border-och-defender flex items-center justify-center">
                          <span className="text-4xl text-och-steel">
                            {(profile ?? user)?.first_name?.[0]?.toUpperCase() ?? (profile ?? user)?.email?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-och-steel mb-2">
                        Upload a new profile picture. Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <Button
                        variant="defender"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? 'Uploading...' : 'Choose File'}
                      </Button>
                    </div>
                  </div>

                  {saveStatus && (
                    <div
                      className={`p-3 rounded-lg ${
                        saveStatus.includes('Error')
                          ? 'bg-och-orange/20 border border-och-orange text-och-orange'
                          : 'bg-och-mint/20 border border-och-mint text-och-mint'
                      }`}
                    >
                      {saveStatus}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Security & MFA Tab - Director/Mentor/Admin/Finance require at least 2 methods */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <p className="text-sm text-och-steel">
                  Your role requires at least two MFA methods to sign in. Add or manage methods below; you must always keep at least two.
                </p>
                <OCHSettingsSecurity />
              </div>
            )}

            {/* Account Updates History */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Account Update History</h2>
                <Button variant="outline" size="sm" onClick={loadAuditLogs}>
                  Refresh
                </Button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <p className="text-och-steel">Loading update history...</p>
                ) : auditLogs.length === 0 ? (
                  <p className="text-och-steel">No account updates found</p>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                log.result === 'success'
                                  ? 'mint'
                                  : log.result === 'failure'
                                  ? 'orange'
                                  : 'defender'
                              }
                            >
                              {getActionLabel(log.action)}
                            </Badge>
                            <span className="text-sm text-och-steel">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {formatChanges(log.changes) && (
                            <p className="text-sm text-och-steel mt-1">
                              Changes: {formatChanges(log.changes)}
                            </p>
                          )}
                          {log.ip_address && (
                            <p className="text-xs text-och-steel mt-1">
                              IP: {log.ip_address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Current User Info Sidebar - use full profile from GET /profile/ */}
          <div className="space-y-6 lg:min-w-0">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-white">Current Account</h2>
              <div className="space-y-5">
                {/* Profile Picture Preview */}
                <div className="flex justify-center">
                  {(profile ?? user)?.avatar_url ? (
                    <img
                      src={(profile ?? user)!.avatar_url!}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-och-mint"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-och-defender/20 border-2 border-och-defender flex items-center justify-center">
                      <span className="text-2xl text-och-steel">
                        {(profile ?? user)?.first_name?.[0]?.toUpperCase() ?? (profile ?? user)?.email?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-och-steel">User ID</p>
                  <p className="text-white font-mono text-sm break-all">{(profile ?? user)?.id ?? '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-och-steel">Email</p>
                  <p className="text-white break-all">{(profile ?? user)?.email ?? '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-och-steel">Full Name</p>
                  <p className="text-white">
                    {[(profile ?? user)?.first_name, (profile ?? user)?.last_name].filter(Boolean).join(' ') || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-och-steel">Account Status</p>
                  <Badge
                    variant={
                      (profile ?? user)?.account_status === 'active'
                        ? 'mint'
                        : (profile ?? user)?.account_status === 'suspended'
                        ? 'orange'
                        : 'defender'
                    }
                  >
                    {(profile ?? user)?.account_status ?? 'Unknown'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-och-steel">Email Verified</p>
                  <Badge variant={(profile ?? user)?.email_verified ? 'mint' : 'orange'}>
                    {(profile ?? user)?.email_verified ? 'Verified' : 'Not Verified'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-och-steel">MFA Enabled</p>
                  <Badge variant={(profile ?? user)?.mfa_enabled ? 'mint' : 'defender'}>
                    {(profile ?? user)?.mfa_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-och-steel">Risk Level</p>
                  <Badge
                    variant={
                      (profile ?? user)?.risk_level === 'low'
                        ? 'mint'
                        : (profile ?? user)?.risk_level === 'high'
                        ? 'orange'
                        : 'defender'
                    }
                  >
                    {(profile ?? user)?.risk_level ?? 'Unknown'}
                  </Badge>
                </div>
                {(profile ?? user)?.created_at && (
                  <div className="space-y-1">
                    <p className="text-sm text-och-steel">Member Since</p>
                    <p className="text-white text-sm">
                      {new Date((profile ?? user)!.created_at!).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {((profile ?? user) as any)?.last_login && (
                  <div className="space-y-1">
                    <p className="text-sm text-och-steel">Last Login</p>
                    <p className="text-white text-sm">
                      {new Date(((profile ?? user) as any).last_login).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-white text-och-orange">Session</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-och-steel mb-2">
                    Sign out of your current session
                  </p>
                  <Button
                    variant="orange"
                    className="w-full"
                    onClick={async () => {
                      if (confirm('Are you sure you want to logout?')) {
                        await logout()
                      }
                    }}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          </div>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
