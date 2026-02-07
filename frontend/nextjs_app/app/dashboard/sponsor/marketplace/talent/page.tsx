'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { marketplaceClient, type MarketplaceProfile } from '@/services/marketplaceClient'
import { Search, Heart, Bookmark, Mail, Check, Loader2 } from 'lucide-react'
import { TalentProfileModal } from '@/components/marketplace/TalentProfileModal'
import { ContactModal } from '@/components/marketplace/ContactModal'

export default function TalentBrowsePage() {
  const [talent, setTalent] = useState<MarketplaceProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      setError(err.message || 'Failed to load talent profiles')
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
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-1 text-och-gold">Talent</h1>
          <p className="text-och-steel text-sm">Filter students by readiness, skills, and status.</p>
        </div>

        {/* Filters */}
        <Card className="mb-4 p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-end flex-col sm:flex-row">
              <div className="flex-1">
                <label className="text-xs text-och-steel mb-1 block">Search</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name, role, or skill"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-och-midnight/50 border-och-defender/20"
                  />
                  <Button onClick={handleSearch} variant="gold" size="icon">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-och-steel mb-1 block">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-och-midnight/50 border border-och-defender/20 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="job_ready">Job Ready</option>
                  <option value="emerging_talent">Emerging Talent</option>
                  <option value="foundation_mode">Foundation Mode</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-och-steel mb-1 block">Min readiness</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="70"
                  value={filters.min_readiness}
                  onChange={(e) => setFilters(prev => ({ ...prev, min_readiness: e.target.value }))}
                  className="bg-och-midnight/50 border-och-defender/20"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-och-steel">
                  <input
                    type="checkbox"
                    checked={filters.contactable_only}
                    onChange={(e) => setFilters(prev => ({ ...prev, contactable_only: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span>Professional tier only</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs text-och-steel mb-1 block">Skills</label>
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
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-och-steel text-sm">Loading talent…</div>
          ) : error ? (
            <div className="p-8 text-center text-red-400 text-sm">{error}</div>
          ) : talent.length === 0 ? (
            <div className="p-8 text-center text-och-steel text-sm">
              No talent profiles match your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-och-midnight/80 border-b border-och-steel/20 text-xs uppercase tracking-wide text-och-steel">
                  <tr>
                    <th className="px-4 py-3 text-left">Talent</th>
                    <th className="px-4 py-3 text-left">Readiness</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Skills</th>
                    <th className="px-4 py-3 text-left">Tier</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-och-steel/20">
                  {talent.map((profile) => (
                    <tr
                      key={profile.id}
                      className="hover:bg-och-steel/10 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedProfile(profile)
                        setModalOpen(true)
                        marketplaceClient.logInterest(profile.id, 'view').catch(console.error)
                      }}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-white">
                            {profile.mentee_name}
                          </span>
                          <span className="text-xs text-och-steel">
                            {profile.mentee_email || 'Contact via marketplace'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {profile.readiness_score != null ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-och-mint font-semibold">
                              {Number(profile.readiness_score).toFixed(1)}
                            </span>
                            <span className="text-[11px] text-och-steel">
                              {getReadinessLabel(Number(profile.readiness_score))}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-och-steel">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-och-steel">
                        {profile.primary_role || '—'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {profile.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="defender" className="text-[11px]">
                              {skill}
                            </Badge>
                          ))}
                          {profile.skills.length > 3 && (
                            <Badge variant="steel" className="text-[11px]">
                              +{profile.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge variant={profile.tier === 'professional' ? 'mint' : 'steel'} className="text-[11px]">
                          {profile.tier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge variant={getStatusBadge(profile.profile_status)} className="text-[11px]">
                          {profile.profile_status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td
                        className="px-4 py-3 align-top text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <Button
                            variant={actionSuccess[profile.id]?.has('favorite') ? 'gold' : 'outline'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleInterest(profile.id, 'favorite')}
                            disabled={!!actionLoading[`${profile.id}-favorite`]}
                          >
                            {actionLoading[`${profile.id}-favorite`] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : actionSuccess[profile.id]?.has('favorite') ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Heart className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            variant={actionSuccess[profile.id]?.has('shortlist') ? 'gold' : 'outline'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleInterest(profile.id, 'shortlist')}
                            disabled={!!actionLoading[`${profile.id}-shortlist`]}
                          >
                            {actionLoading[`${profile.id}-shortlist`] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : actionSuccess[profile.id]?.has('shortlist') ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Bookmark className="w-3 h-3" />
                            )}
                          </Button>
                          {profile.tier === 'professional' && (
                            <Button
                              variant={actionSuccess[profile.id]?.has('contact_request') ? 'mint' : 'gold'}
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setProfileForContact(profile)
                                setContactModalOpen(true)
                              }}
                              disabled={
                                !!actionLoading[`${profile.id}-contact_request`] ||
                                actionSuccess[profile.id]?.has('contact_request')
                              }
                            >
                              {actionSuccess[profile.id]?.has('contact_request') ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Mail className="w-3 h-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

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

