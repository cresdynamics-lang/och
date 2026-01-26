'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { marketplaceClient, type MarketplaceProfile } from '@/services/marketplaceClient'
import { Search, Filter, Heart, Bookmark, Mail, User } from 'lucide-react'
import Link from 'next/link'

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

  const commonSkills = ['Python', 'Security', 'Cloud', 'DevOps', 'Linux', 'Networking', 'Kubernetes', 'Docker', 'AWS', 'Azure']

  useEffect(() => {
    loadTalent()
  }, [filters])

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
    try {
      await marketplaceClient.logInterest(profileId, action)
      // Optionally refresh or show success message
    } catch (err: any) {
      console.error('Failed to log interest:', err)
      alert(err.message || 'Failed to save interest')
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
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className="cursor-pointer"
                  >
                    <Badge variant={selectedSkills.includes(skill) ? 'gold' : 'defender'}>
                      {skill}
                    </Badge>
                  </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {talent.map((profile) => (
              <Card key={profile.id} className="p-6 hover:border-och-gold/50 transition-colors">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{profile.mentee_name}</h3>
                      <p className="text-sm text-och-steel">{profile.primary_role || 'Cybersecurity Professional'}</p>
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
                  <div className="flex gap-2 pt-4 border-t border-och-defender/20">
                    <Button
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => handleInterest(profile.id, 'favorite')}
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      Favorite
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => handleInterest(profile.id, 'shortlist')}
                    >
                      <Bookmark className="w-3 h-3 mr-1" />
                      Shortlist
                    </Button>
                    {profile.tier === 'professional' && (
                      <Button
                        variant="gold"
                        className="flex-1 text-xs"
                        onClick={() => handleInterest(profile.id, 'contact_request')}
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Contact
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


