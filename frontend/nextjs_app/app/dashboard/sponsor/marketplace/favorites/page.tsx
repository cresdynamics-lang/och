'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { marketplaceClient, type EmployerInterestLog, type MarketplaceProfile } from '@/services/marketplaceClient'
import { Heart, ArrowLeft, Loader2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TalentProfileModal } from '@/components/marketplace/TalentProfileModal'

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<EmployerInterestLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Modal state
  const [selectedProfile, setSelectedProfile] = useState<MarketplaceProfile | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  // Track loading states for each action per profile
  const [actionLoading, setActionLoading] = useState<Record<string, 'favorite' | 'shortlist' | 'contact_request' | null>>({})
  // Track successful actions for visual feedback
  const [actionSuccess, setActionSuccess] = useState<Record<string, Set<'favorite' | 'shortlist' | 'contact_request'>>>({})
  // Track favorited and shortlisted profiles
  const [favoritedProfiles, setFavoritedProfiles] = useState<Set<string>>(new Set())
  const [shortlistedProfiles, setShortlistedProfiles] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadFavorites()
    loadFavoritesAndShortlists()
  }, [])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await marketplaceClient.getInterestLogs('favorite')
      // Handle both array and paginated response
      const logs = Array.isArray(response) ? response : (response?.results || [])
      setFavorites(logs)
    } catch (err: any) {
      console.error('Failed to load favorites:', err)
      setError(err.message || 'Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  const loadFavoritesAndShortlists = async () => {
    try {
      const [favorites, shortlists] = await Promise.all([
        marketplaceClient.getInterestLogs('favorite'),
        marketplaceClient.getInterestLogs('shortlist'),
      ])
      
      const favoriteLogs = Array.isArray(favorites) ? favorites : (favorites?.results || [])
      const shortlistLogs = Array.isArray(shortlists) ? shortlists : (shortlists?.results || [])
      
      setFavoritedProfiles(new Set(favoriteLogs.map((log: EmployerInterestLog) => log.profile.id)))
      setShortlistedProfiles(new Set(shortlistLogs.map((log: EmployerInterestLog) => log.profile.id)))
    } catch (err) {
      console.error('Failed to load favorites/shortlists:', err)
    }
  }

  const handleInterest = async (profileId: string, action: 'favorite' | 'shortlist' | 'contact_request') => {
    const key = `${profileId}-${action}`
    try {
      setActionLoading(prev => ({ ...prev, [key]: action }))
      await marketplaceClient.logInterest(profileId, action)
      
      // Update local state
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

      // Reload the favorites to get updated data
      if (action === 'favorite') {
        await loadFavorites()
      }
    } catch (err: any) {
      console.error(`Failed to ${action}:`, err)
      alert(`Failed to ${action === 'contact_request' ? 'send contact request' : action}. Please try again.`)
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev }
        delete newState[key]
        return newState
      })
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/sponsor/marketplace')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
          <h1 className="text-4xl font-bold mb-2 text-och-gold">Favorites</h1>
          <p className="text-och-steel">Your favorited talent profiles</p>
        </div>

        {loading ? (
          <Card className="p-8">
            <div className="text-center text-och-steel">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              Loading favorites...
            </div>
          </Card>
        ) : error ? (
          <Card className="p-8">
            <div className="text-center text-red-400">{error}</div>
          </Card>
        ) : favorites.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-och-steel">
              <Heart className="w-16 h-16 mx-auto mb-4 text-och-steel/50" />
              <p className="text-lg mb-2">No favorites yet</p>
              <p className="text-sm">Start browsing talent and add profiles to your favorites</p>
              <Button
                variant="gold"
                className="mt-4"
                onClick={() => router.push('/dashboard/sponsor/marketplace/talent')}
              >
                Browse Talent
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((log) => (
              <Card key={log.id} className="p-6 hover:border-och-gold/50 transition-colors">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {log.profile.mentee_name}
                      </h3>
                      <p className="text-sm text-och-steel">
                        {log.profile.primary_role || 'Cybersecurity Professional'}
                      </p>
                    </div>
                    <Badge variant={log.profile.tier === 'professional' ? 'mint' : 'steel'}>
                      {log.profile.tier === 'professional' ? 'Professional' : 'Starter'}
                    </Badge>
                  </div>

                  {log.profile.readiness_score !== null && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-och-steel">Readiness Score</span>
                        <Badge variant={log.profile.readiness_score >= 80 ? 'mint' : log.profile.readiness_score >= 60 ? 'gold' : 'steel'}>
                          {log.profile.readiness_score}%
                        </Badge>
                      </div>
                    </div>
                  )}

                  {log.profile.skills && log.profile.skills.length > 0 && (
                    <div>
                      <p className="text-xs text-och-steel mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {log.profile.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="defender" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {log.profile.skills.length > 3 && (
                          <Badge variant="steel" className="text-xs">
                            +{log.profile.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-och-defender/20">
                    <p className="text-xs text-och-steel mb-2">
                      Favorited on {new Date(log.created_at).toLocaleDateString()}
                    </p>
                    <Button
                      variant="gold"
                      className="w-full text-xs"
                      onClick={() => {
                        setSelectedProfile(log.profile)
                        setModalOpen(true)
                        // Log view action
                        marketplaceClient.logInterest(log.profile.id, 'view').catch(console.error)
                      }}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
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
          onContact={(profileId) => handleInterest(profileId, 'contact_request')}
          isFavorited={selectedProfile ? favoritedProfiles.has(selectedProfile.id) || actionSuccess[selectedProfile.id]?.has('favorite') : false}
          isShortlisted={selectedProfile ? shortlistedProfiles.has(selectedProfile.id) || actionSuccess[selectedProfile.id]?.has('shortlist') : false}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  )
}
