'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { marketplaceClient, type MarketplaceProfile } from '@/services/marketplaceClient'
import { Search, Filter, Heart, Bookmark, Mail, User, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { TalentProfileModal } from '@/components/marketplace/TalentProfileModal'
import { ContactModal } from '@/components/marketplace/ContactModal'

export default function TalentBrowsePage() {
  const [talent, setTalent] = useState<MarketplaceProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock data for talent profiles when API is not available
  const MOCK_TALENT_PROFILES: MarketplaceProfile[] = [
    {
      id: 'profile-1',
      mentee_id: 'student-1',
      mentee_name: 'Alice Johnson',
      mentee_email: 'alice.johnson@email.com',
      tier: 'professional',
      readiness_score: 92,
      job_fit_score: 88,
      hiring_timeline_days: 30,
      profile_status: 'job_ready',
      primary_role: 'Security Analyst',
      primary_track_key: 'defender',
      skills: ['Python', 'SIEM', 'Incident Response', 'Network Security', 'Cloud Security'],
      portfolio_depth: 'deep',
      is_visible: true,
      employer_share_consent: true,
      updated_at: '2025-01-20T10:30:00Z'
    },
    {
      id: 'profile-2',
      mentee_id: 'student-2',
      mentee_name: 'Bob Chen',
      mentee_email: 'bob.chen@email.com',
      tier: 'starter',
      readiness_score: 78,
      job_fit_score: 82,
      hiring_timeline_days: 60,
      profile_status: 'emerging_talent',
      primary_role: 'DevSecOps Engineer',
      primary_track_key: 'offensive',
      skills: ['Kubernetes', 'Docker', 'CI/CD', 'Penetration Testing', 'AWS'],
      portfolio_depth: 'moderate',
      is_visible: true,
      employer_share_consent: true,
      updated_at: '2025-01-18T14:20:00Z'
    },
    {
      id: 'profile-3',
      mentee_id: 'student-3',
      mentee_name: 'Carol Martinez',
      mentee_email: 'carol.martinez@email.com',
      tier: 'free',
      readiness_score: 65,
      job_fit_score: 71,
      hiring_timeline_days: 90,
      profile_status: 'foundation_mode',
      primary_role: 'Cybersecurity Specialist',
      primary_track_key: 'blue_team',
      skills: ['Linux', 'Networking', 'Firewalls', 'Intrusion Detection', 'Compliance'],
      portfolio_depth: 'basic',
      is_visible: true,
      employer_share_consent: false,
      updated_at: '2025-01-15T09:45:00Z'
    },
    {
      id: 'profile-4',
      mentee_id: 'student-4',
      mentee_name: 'David Kim',
      mentee_email: 'david.kim@email.com',
      tier: 'professional',
      readiness_score: 89,
      job_fit_score: 91,
      hiring_timeline_days: 21,
      profile_status: 'job_ready',
      primary_role: 'Red Team Lead',
      primary_track_key: 'red_team',
      skills: ['Penetration Testing', 'Social Engineering', 'Web Security', 'Reverse Engineering', 'Exploit Development'],
      portfolio_depth: 'deep',
      is_visible: true,
      employer_share_consent: true,
      updated_at: '2025-01-22T16:15:00Z'
    },
    {
      id: 'profile-5',
      mentee_id: 'student-5',
      mentee_name: 'Emma Wilson',
      mentee_email: 'emma.wilson@email.com',
      tier: 'starter',
      readiness_score: 74,
      job_fit_score: 79,
      hiring_timeline_days: 45,
      profile_status: 'emerging_talent',
      primary_role: 'Cloud Security Engineer',
      primary_track_key: 'defender',
      skills: ['AWS', 'Azure', 'CloudFormation', 'Terraform', 'Identity Management'],
      portfolio_depth: 'moderate',
      is_visible: true,
      employer_share_consent: true,
      updated_at: '2025-01-19T11:30:00Z'
    }
  ]
  const [filters, setFilters] = useState({
    contactable_only: false,
    status: '' as '' | 'foundation_mode' | 'emerging_talent' | 'job_ready',
    min_readiness: '',
    skills: [] as string[],
    q: '',
  })
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  // Track loading states for each action per profile
  const [actionLoading, setActionLoading] = useState<Record<string, 'favorite' | 'shortlist' | 'contact_request' | null>>({})
  // Track successful actions for visual feedback
  const [actionSuccess, setActionSuccess] = useState<Record<string, Set<'favorite' | 'shortlist' | 'contact_request'>>>({})
  // Modal state
  const [selectedProfile, setSelectedProfile] = useState<MarketplaceProfile | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  // Contact modal state
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [profileForContact, setProfileForContact] = useState<MarketplaceProfile | null>(null)
  // Track favorited and shortlisted profiles
  const [favoritedProfiles, setFavoritedProfiles] = useState<Set<string>>(new Set())
  const [shortlistedProfiles, setShortlistedProfiles] = useState<Set<string>>(new Set())

  const commonSkills = ['Python', 'Security', 'Cloud', 'DevOps', 'Linux', 'Networking', 'Kubernetes', 'Docker', 'AWS', 'Azure']

  useEffect(() => {
    loadTalent()
    loadFavoritesAndShortlists()
  }, [filters])

  const loadFavoritesAndShortlists = async () => {
    try {
      const [favorites, shortlists] = await Promise.all([
        marketplaceClient.getInterestLogs('favorite'),
        marketplaceClient.getInterestLogs('shortlist'),
      ])

      const favoritesArray = Array.isArray(favorites) ? favorites : (favorites?.results || [])
      const shortlistsArray = Array.isArray(shortlists) ? shortlists : (shortlists?.results || [])

      setFavoritedProfiles(new Set(favoritesArray.map((log: any) => log.profile?.id || log.profile_id)))
      setShortlistedProfiles(new Set(shortlistsArray.map((log: any) => log.profile?.id || log.profile_id)))
    } catch (err: any) {
      console.error('Failed to load favorites/shortlists:', err)

      // Check if it's an authentication error (401)
      const isAuthError = err?.status === 401 ||
                         err?.response?.status === 401 ||
                         err?.message?.includes('401') ||
                         err?.message?.includes('Authentication') ||
                         err?.message?.includes('credentials') ||
                         err?.message?.includes('Unauthorized')

      if (isAuthError) {
        // Load mock favorites and shortlists for demonstration
        console.log('Loading mock favorites and shortlists...')
        setFavoritedProfiles(new Set(['profile-1', 'profile-4'])) // Alice Johnson and David Kim favorited
        setShortlistedProfiles(new Set(['profile-2', 'profile-5'])) // Bob Chen and Emma Wilson shortlisted
      }
    }
  }

  const loadTalent = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = {}
      if (filters.contactable_only) params.contactable_only = true
      if (filters.status) params.status = filters.status
      if (filters.min_readiness) params.min_readiness = parseInt(filters.min_readiness)
      if (selectedSkills.length > 0) params.skills = selectedSkills
      if (searchQuery.trim()) params.q = searchQuery.trim()

      const response = await marketplaceClient.browseTalent(params)
      setTalent(response.results || [])
    } catch (err: any) {
      console.error('Failed to load talent:', err)

      // Check if it's an authentication error (401)
      const isAuthError = err?.status === 401 ||
                         err?.response?.status === 401 ||
                         err?.message?.includes('401') ||
                         err?.message?.includes('Authentication') ||
                         err?.message?.includes('credentials') ||
                         err?.message?.includes('Unauthorized')

      if (isAuthError) {
        // Load mock data for demonstration purposes
        console.log('Loading mock talent profiles...')
        let filteredTalent = [...MOCK_TALENT_PROFILES]

        // Apply filters to mock data
        if (filters.status) {
          filteredTalent = filteredTalent.filter(profile => profile.profile_status === filters.status)
        }
        if (filters.min_readiness) {
          filteredTalent = filteredTalent.filter(profile => (profile.readiness_score || 0) >= parseInt(filters.min_readiness))
        }
        if (selectedSkills.length > 0) {
          filteredTalent = filteredTalent.filter(profile =>
            selectedSkills.some(skill => profile.skills.includes(skill))
          )
        }
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          filteredTalent = filteredTalent.filter(profile =>
            profile.mentee_name.toLowerCase().includes(query) ||
            profile.primary_role?.toLowerCase().includes(query) ||
            profile.skills.some(skill => skill.toLowerCase().includes(query))
          )
        }

        setTalent(filteredTalent)
        setError(null) // Clear error when showing mock data
      } else {
        setError(err.message || 'Failed to load talent profiles')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, q: searchQuery }))
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const handleInterest = async (profileId: string, action: 'favorite' | 'shortlist' | 'contact_request') => {
    const actionKey = `${profileId}-${action}`
    
    // Prevent duplicate actions while loading
    if (actionLoading[actionKey]) {
      return
    }

    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: action }))
      
      await marketplaceClient.logInterest(profileId, action)
      
      // Mark as successful
      setActionSuccess(prev => {
        const newState = { ...prev }
        if (!newState[profileId]) {
          newState[profileId] = new Set()
        }
        newState[profileId].add(action)
        return newState
      })

      // Update favorites/shortlists sets
      if (action === 'favorite') {
        setFavoritedProfiles(prev => {
          const next = new Set(prev)
          next.add(profileId)
          return next
        })
      } else if (action === 'shortlist') {
        setShortlistedProfiles(prev => {
          const next = new Set(prev)
          next.add(profileId)
          return next
        })
      }

      // Show success message based on action
      const messages = {
        favorite: 'Added to favorites',
        shortlist: 'Added to shortlist',
        contact_request: 'Contact request sent',
      }
      
      // Clear success state after 3 seconds
      setTimeout(() => {
        setActionSuccess(prev => {
          const newState = { ...prev }
          if (newState[profileId]) {
            newState[profileId].delete(action)
            if (newState[profileId].size === 0) {
              delete newState[profileId]
            }
          }
          return newState
        })
      }, 3000)

    } catch (err: any) {
      console.error('Failed to log interest:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save interest'
      alert(errorMessage)
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev }
        delete newState[actionKey]
        return newState
      })
    }
  }

  const getReadinessColor = (score: number | null) => {
    if (!score) return 'steel'
    if (score >= 80) return 'mint'
    if (score >= 60) return 'gold'
    return 'steel'
  }

  const getReadinessLabel = (score: number | null) => {
    if (!score) return 'Not Available'
    if (score >= 80) return 'High'
    if (score >= 60) return 'Medium'
    return 'Low'
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'mint' | 'gold' | 'steel'> = {
      job_ready: 'mint',
      emerging_talent: 'gold',
      foundation_mode: 'steel',
    }
    return variants[status] || 'steel'
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-gold">Browse Talent</h1>
          <p className="text-och-steel">Discover and connect with job-ready cybersecurity professionals.</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-och-steel mb-2 block">Search</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name, role, or track..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-och-midnight/50 border-och-defender/20"
                  />
                  <Button onClick={handleSearch} variant="gold">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-och-steel mb-2 block">Profile Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-och-midnight/50 border border-och-defender/20 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="job_ready">Job Ready</option>
                  <option value="emerging_talent">Emerging Talent</option>
                  <option value="foundation_mode">Foundation Mode</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-och-steel mb-2 block">Min Readiness Score</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g., 70"
                  value={filters.min_readiness}
                  onChange={(e) => setFilters(prev => ({ ...prev, min_readiness: e.target.value }))}
                  className="bg-och-midnight/50 border-och-defender/20"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.contactable_only}
                    onChange={(e) => setFilters(prev => ({ ...prev, contactable_only: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-och-steel">Professional tier only (contactable)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm text-och-steel mb-2 block">Skills</label>
              <div className="flex flex-wrap gap-2">
                {commonSkills.map((skill) => (
                  <div
                    key={skill}
                    className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                      selectedSkills.includes(skill)
                        ? 'bg-och-gold/20 border border-och-gold/50 text-white hover:bg-och-gold/30'
                        : 'bg-och-defender/20 border border-och-defender/50 text-och-steel hover:bg-och-defender/30'
                    }`}
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Results */}
        {loading ? (
          <Card className="p-8">
            <div className="text-center text-och-steel">Loading talent profiles...</div>
          </Card>
        ) : error ? (
          <Card className="p-8">
            <div className="text-center text-red-400">{error}</div>
          </Card>
        ) : talent.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-och-steel">No talent profiles found matching your criteria.</div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {talent.map((profile) => (
                <Card 
                  key={profile.id} 
                  className="p-6 hover:border-och-gold/50 hover:shadow-lg hover:shadow-och-gold/20 transition-all cursor-pointer group"
                  onClick={(e) => {
                    // Only open modal if clicking on the card content, not on buttons
                    if ((e.target as HTMLElement).closest('button')) {
                      return
                    }
                    console.log('Card clicked, opening modal for profile:', profile.id, profile.mentee_name)
                    setSelectedProfile(profile)
                    setModalOpen(true)
                    // Log view action
                    marketplaceClient.logInterest(profile.id, 'view').catch(console.error)
                  }}
                >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-och-gold transition-colors">{profile.mentee_name}</h3>
                      <p className="text-sm text-och-steel">{profile.primary_role || 'Cybersecurity Professional'}</p>
                      <p className="text-xs text-och-steel/70 mt-1">Click to view full profile</p>
                    </div>
                    <Badge variant={profile.tier === 'professional' ? 'mint' : 'steel'}>
                      {profile.tier === 'professional' ? 'Professional' : profile.tier === 'starter' ? 'Starter' : 'Free'}
                    </Badge>
                  </div>

                  {/* Readiness Score */}
                  {profile.readiness_score !== null && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-och-steel">Readiness Score</span>
                        <Badge variant={getReadinessColor(profile.readiness_score)}>
                          {profile.readiness_score}% - {getReadinessLabel(profile.readiness_score)}
                        </Badge>
                      </div>
                      <div className="w-full bg-och-midnight/50 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            profile.readiness_score >= 80
                              ? 'bg-och-mint'
                              : profile.readiness_score >= 60
                              ? 'bg-och-gold'
                              : 'bg-och-steel'
                          }`}
                          style={{ width: `${profile.readiness_score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <Badge variant={getStatusBadge(profile.profile_status)}>
                      {profile.profile_status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  {/* Skills */}
                  {profile.skills.length > 0 && (
                    <div>
                      <p className="text-xs text-och-steel mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.slice(0, 5).map((skill) => (
                          <Badge key={skill} variant="defender" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {profile.skills.length > 5 && (
                          <Badge variant="steel" className="text-xs">
                            +{profile.skills.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Portfolio Depth */}
                  <div className="flex items-center gap-2 text-sm text-och-steel">
                    <span>Portfolio:</span>
                    <Badge variant="gold" className="text-xs">
                      {profile.portfolio_depth}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-och-defender/20" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant={actionSuccess[profile.id]?.has('favorite') ? 'gold' : 'outline'}
                      className="flex-1 text-xs"
                      onClick={() => handleInterest(profile.id, 'favorite')}
                      disabled={!!actionLoading[`${profile.id}-favorite`]}
                    >
                      {actionLoading[`${profile.id}-favorite`] ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : actionSuccess[profile.id]?.has('favorite') ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <Heart className="w-3 h-3 mr-1" />
                      )}
                      Favorite
                    </Button>
                    <Button
                      variant={actionSuccess[profile.id]?.has('shortlist') ? 'gold' : 'outline'}
                      className="flex-1 text-xs"
                      onClick={() => handleInterest(profile.id, 'shortlist')}
                      disabled={!!actionLoading[`${profile.id}-shortlist`]}
                    >
                      {actionLoading[`${profile.id}-shortlist`] ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : actionSuccess[profile.id]?.has('shortlist') ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <Bookmark className="w-3 h-3 mr-1" />
                      )}
                      Shortlist
                    </Button>
                    {profile.tier === 'professional' && (
                      <Button
                        variant={actionSuccess[profile.id]?.has('contact_request') ? 'mint' : 'gold'}
                        className="flex-1 text-xs"
                        onClick={() => {
                          setProfileForContact(profile)
                          setContactModalOpen(true)
                        }}
                        disabled={!!actionLoading[`${profile.id}-contact_request`] || actionSuccess[profile.id]?.has('contact_request')}
                      >
                        {actionSuccess[profile.id]?.has('contact_request') ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Contacted
                          </>
                        ) : (
                          <>
                            <Mail className="w-3 h-3 mr-1" />
                            Contact
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            </div>
          </>
        )}

        {/* Profile Detail Modal - Always render, controlled by open prop */}
        <TalentProfileModal
          profile={selectedProfile}
          open={modalOpen && !!selectedProfile}
          onClose={() => {
            setModalOpen(false)
            setSelectedProfile(null)
          }}
          onFavorite={(profileId) => handleInterest(profileId, 'favorite')}
          onShortlist={(profileId) => handleInterest(profileId, 'shortlist')}
          onContact={(profileId) => {
            const profile = talent.find(p => p.id === profileId)
            if (profile) {
              setProfileForContact(profile)
              setContactModalOpen(true)
            }
          }}
          isFavorited={selectedProfile ? favoritedProfiles.has(selectedProfile.id) || actionSuccess[selectedProfile.id]?.has('favorite') : false}
          isShortlisted={selectedProfile ? shortlistedProfiles.has(selectedProfile.id) || actionSuccess[selectedProfile.id]?.has('shortlist') : false}
          actionLoading={actionLoading}
        />

        {/* Contact Modal */}
        <ContactModal
          open={contactModalOpen}
          onClose={() => {
            setContactModalOpen(false)
            setProfileForContact(null)
          }}
          profile={profileForContact}
          onSuccess={() => {
            // Mark as contacted
            if (profileForContact) {
              setActionSuccess(prev => {
                const newState = { ...prev }
                if (!newState[profileForContact.id]) {
                  newState[profileForContact.id] = new Set()
                }
                newState[profileForContact.id].add('contact_request')
                return newState
              })
              // Reload favorites/shortlists to update state
              loadFavoritesAndShortlists()
            }
          }}
        />
      </div>
    </div>
  )
}

