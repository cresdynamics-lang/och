'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { marketplaceClient, type JobPosting, type MarketplaceProfile } from '@/services/marketplaceClient'
import Link from 'next/link'

const ITEMS_PER_PAGE = 20

export default function GovernancePage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [profiles, setProfiles] = useState<MarketplaceProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'jobs' | 'profiles' | 'settings'>('jobs')
  const [settings, setSettings] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [updatingProfileId, setUpdatingProfileId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (activeTab === 'jobs') {
      loadJobs()
    } else if (activeTab === 'profiles') {
      loadProfiles()
    } else if (activeTab === 'settings') {
      loadSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage])

  const loadJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await marketplaceClient.adminListJobs({
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
      })
      setJobs(Array.isArray(response) ? response : response.results || [])
      setTotalCount(Array.isArray(response) ? response.length : response.count || 0)
    } catch (err: any) {
      setError(err?.message || 'Failed to load job postings')
      console.error('Error loading jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadProfiles = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      setError(null)
      const response = await marketplaceClient.adminListProfiles({
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
      })
      const profilesList = Array.isArray(response) ? response : response.results || []
      setProfiles(profilesList)
      setTotalCount(Array.isArray(response) ? response.length : response.count || 0)
      console.log('Profiles loaded:', profilesList.length, 'profiles')
    } catch (err: any) {
      setError(err?.message || 'Failed to load profiles')
      console.error('Error loading profiles:', err)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      const settingsData = await marketplaceClient.adminGetSettings()
      setSettings(settingsData)
    } catch (err: any) {
      setError(err?.message || 'Failed to load settings')
      console.error('Error loading settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveJob = async (jobId: string) => {
    try {
      await marketplaceClient.adminApproveJob(jobId)
      loadJobs()
    } catch (err: any) {
      alert(err?.message || 'Failed to approve job')
    }
  }

  const handleRejectJob = async (jobId: string) => {
    const reason = prompt('Enter rejection reason (optional):')
    try {
      await marketplaceClient.adminRejectJob(jobId, reason || undefined)
      loadJobs()
    } catch (err: any) {
      alert(err?.message || 'Failed to reject job')
    }
  }

  const handleUpdateProfile = async (profileId: string, data: any) => {
    try {
      setUpdatingProfileId(profileId)
      
      // Optimistically update the UI immediately
      setProfiles(prevProfiles => {
        const updated = prevProfiles.map(profile => 
          profile.id === profileId 
            ? { ...profile, ...data }
            : profile
        )
        console.log('Optimistic update - is_visible:', updated.find(p => p.id === profileId)?.is_visible)
        return updated
      })
      
      // Add a small delay to ensure state update is visible
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const updatedProfile = await marketplaceClient.adminUpdateProfile(profileId, data)
      console.log('Profile updated successfully - is_visible:', updatedProfile.is_visible)
      
      // Update the specific profile in state with server response
      // Use functional update to ensure we have the latest state
      setProfiles(prevProfiles => {
        const updated = prevProfiles.map(profile => {
          if (profile.id === profileId) {
            // Create a completely new object to ensure React detects the change
            const merged: MarketplaceProfile = {
              ...profile,
              ...updatedProfile,
              // Explicitly set is_visible from server response (this is the source of truth)
              is_visible: updatedProfile.is_visible !== undefined 
                ? Boolean(updatedProfile.is_visible) 
                : Boolean(data.is_visible),
            }
            console.log('Final merged profile - is_visible:', merged.is_visible, 'Full profile:', merged)
            return merged
          }
          return profile
        })
        console.log('All profiles after update:', updated.map(p => ({ id: p.id, name: p.mentee_name, is_visible: p.is_visible })))
        // Return a new array to ensure React detects the change
        return [...updated]
      })
      
      // Force a re-render by updating refresh key
      setRefreshKey(prev => prev + 1)
      
      // Small delay to ensure state update is processed
      await new Promise(resolve => setTimeout(resolve, 100))
      setUpdatingProfileId(null)
      
      // Don't reload profiles - the server response is the source of truth
      // The optimistic update + server response merge should be sufficient
    } catch (err: any) {
      setUpdatingProfileId(null)
      console.error('Error updating profile:', err)
      // Reload profiles to revert optimistic update on error
      loadProfiles(false).catch(() => {})
      alert(err?.message || 'Failed to update profile')
    }
  }

  const handleUpdateSettings = async () => {
    if (!settings) return
    try {
      await marketplaceClient.adminUpdateSettings(settings)
      alert('Settings updated successfully')
    } catch (err: any) {
      alert(err?.message || 'Failed to update settings')
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-gold">Governance Console</h1>
                <p className="text-och-steel">Moderate content and configure marketplace rules</p>
              </div>
              <Link href="/dashboard/admin/marketplace">
                <Button variant="outline">← Back</Button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-och-steel/20">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'jobs'
                  ? 'text-och-mint border-b-2 border-och-mint'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Job Postings
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'profiles'
                  ? 'text-och-mint border-b-2 border-och-mint'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Profile Management
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'settings'
                  ? 'text-och-mint border-b-2 border-och-mint'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Settings
            </button>
          </div>

          {error && (
            <Card className="p-4 mb-6 bg-red-500/10 border-red-500/20">
              <p className="text-red-400">{error}</p>
            </Card>
          )}

          {/* Job Postings Tab */}
          {activeTab === 'jobs' && (
            <>
              {loading ? (
                <Card className="p-8">
                  <p className="text-och-steel text-center">Loading job postings...</p>
                </Card>
              ) : jobs.length === 0 ? (
                <Card className="p-8">
                  <p className="text-och-steel text-center">No job postings found</p>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4 mb-6">
                    {jobs.map((job) => (
                      <Card key={job.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-white">{job.title}</h3>
                              <Badge variant={job.is_active ? 'mint' : 'steel'}>
                                {job.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-och-steel mb-4">
                              <p>
                                <span className="font-semibold">Employer:</span>{' '}
                                {typeof job.employer === 'object' && job.employer
                                  ? job.employer.company_name
                                  : job.employer_id}
                              </p>
                              <p>
                                <span className="font-semibold">Type:</span> {job.job_type}
                              </p>
                              <p>
                                <span className="font-semibold">Location:</span> {job.location || 'Remote'}
                              </p>
                              <p className="mt-2 text-och-steel line-clamp-2">{job.description}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            {!job.is_active && (
                              <Button
                                variant="gold"
                                size="sm"
                                onClick={() => handleApproveJob(job.id)}
                              >
                                Approve
                              </Button>
                            )}
                            {job.is_active && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectJob(job.id)}
                              >
                                Reject
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this job posting?')) {
                                  marketplaceClient.adminDeleteJob(job.id).then(() => loadJobs())
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-och-steel text-sm">
                        Page {currentPage} of {totalPages} ({totalCount} total)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Profiles Tab */}
          {activeTab === 'profiles' && (
            <>
              {loading ? (
                <Card className="p-8">
                  <p className="text-och-steel text-center">Loading profiles...</p>
                </Card>
              ) : profiles.length === 0 ? (
                <Card className="p-8">
                  <p className="text-och-steel text-center">No profiles found</p>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4 mb-6">
                    {profiles.map((profile) => (
                      <Card key={`${profile.id}-${refreshKey}`} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-white">
                                {profile.mentee_name || profile.mentee_email}
                              </h3>
                                <Badge variant={profile.is_visible ? 'mint' : 'steel'}>
                                {profile.is_visible ? 'Visible' : 'Hidden'}
                              </Badge>
                              <Badge variant="outline">{profile.profile_status}</Badge>
                            </div>
                            <div className="space-y-1 text-sm text-och-steel mb-4">
                              <p>
                                <span className="font-semibold">Tier:</span> {profile.tier}
                              </p>
                              <p>
                                <span className="font-semibold">Readiness Score:</span>{' '}
                                {profile.readiness_score || 'N/A'}
                              </p>
                              <p>
                                <span className="font-semibold">Primary Role:</span>{' '}
                                {profile.primary_role || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <select
                              value={profile.profile_status}
                              onChange={(e) =>
                                handleUpdateProfile(profile.id, {
                                  profile_status: e.target.value,
                                })
                              }
                              className="px-3 py-1 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                            >
                              <option value="foundation_mode">Foundation Mode</option>
                              <option value="emerging_talent">Emerging Talent</option>
                              <option value="job_ready">Job Ready</option>
                            </select>
                            <Button
                              variant={profile.is_visible ? 'outline' : 'gold'}
                              size="sm"
                              onClick={() =>
                                handleUpdateProfile(profile.id, {
                                  is_visible: !profile.is_visible,
                                })
                              }
                              disabled={updatingProfileId === profile.id}
                            >
                              {updatingProfileId === profile.id ? 'Updating...' : (profile.is_visible ? 'Hide' : 'Show')}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-och-steel text-sm">
                        Page {currentPage} of {totalPages} ({totalCount} total)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <>
              {loading ? (
                <Card className="p-8">
                  <p className="text-och-steel text-center">Loading settings...</p>
                </Card>
              ) : settings ? (
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Visibility Rules</h3>
                  <div className="space-y-4 mb-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.visibility_rules.free_tier_can_contact}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            visibility_rules: {
                              ...settings.visibility_rules,
                              free_tier_can_contact: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-white">Free tier can contact</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.visibility_rules.starter_tier_can_contact}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            visibility_rules: {
                              ...settings.visibility_rules,
                              starter_tier_can_contact: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-white">Starter tier can contact</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.visibility_rules.professional_tier_can_contact}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            visibility_rules: {
                              ...settings.visibility_rules,
                              professional_tier_can_contact: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-white">Professional tier can contact</span>
                    </label>
                    <div>
                      <label className="block text-white mb-2">
                        Min Readiness for Visibility
                      </label>
                      <Input
                        type="number"
                        value={settings.visibility_rules.min_readiness_for_visibility}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            visibility_rules: {
                              ...settings.visibility_rules,
                              min_readiness_for_visibility: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="bg-och-midnight border-och-steel/20"
                      />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4">Job Posting Rules</h3>
                  <div className="space-y-4 mb-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.job_posting_rules.require_approval}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            job_posting_rules: {
                              ...settings.job_posting_rules,
                              require_approval: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-white">Require approval</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.job_posting_rules.auto_approve}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            job_posting_rules: {
                              ...settings.job_posting_rules,
                              auto_approve: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-white">Auto approve</span>
                    </label>
                  </div>

                  <Button onClick={handleUpdateSettings} variant="gold">
                    Save Settings
                  </Button>
                </Card>
              ) : (
                <Card className="p-8">
                  <p className="text-och-steel text-center">Failed to load settings</p>
                </Card>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
