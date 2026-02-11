'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { marketplaceClient, type EmployerInterestLog, type MarketplaceProfile } from '@/services/marketplaceClient'
import { Bookmark, ArrowLeft, Loader2, Check, Heart, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { TalentProfileModal } from '@/components/marketplace/TalentProfileModal'

export default function ShortlistPage() {
  const router = useRouter()
  const [shortlist, setShortlist] = useState<EmployerInterestLog[]>([])
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
    loadShortlist()
    loadFavoritesAndShortlists()
  }, [])

  const loadShortlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await marketplaceClient.getInterestLogs('shortlist')
      // Handle both array and paginated response
      const logs = Array.isArray(response) ? response : (response?.results || [])
      setShortlist(logs)
    } catch (err: any) {
      // Silently handle missing endpoints
      const errorStatus = err?.status || err?.response?.status || 0;
      const isNotFound = errorStatus === 404;
      const isConnectionError = err?.message?.includes('Cannot connect to backend server') ||
                               err?.message?.includes('fetch failed');
      
      if (isNotFound || isConnectionError) {
        setShortlist([]);
        setError(null); // Don't show error for missing endpoints
      } else {
        const hasErrorContent = err?.message || err?.data || (err && Object.keys(err).length > 0);
        if (hasErrorContent) {
          console.error('Failed to load shortlist:', err);
        }
        setError(err.message || 'Failed to load shortlist');
      }
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
    } catch (err: any) {
      // Silently handle missing endpoints
      const errorStatus = err?.status || err?.response?.status || 0;
      const isNotFound = errorStatus === 404;
      const isConnectionError = err?.message?.includes('Cannot connect to backend server') ||
                               err?.message?.includes('fetch failed');
      
      // Only log if it's not a 404 or connection error and has meaningful content
      if (!isNotFound && !isConnectionError) {
        const hasErrorContent = err?.message || err?.data || (err && Object.keys(err).length > 0);
        if (hasErrorContent) {
          console.error('Failed to load favorites/shortlists:', err);
        }
      }
      // Silently set empty state for missing endpoints
      setFavoritedProfiles(new Set());
      setShortlistedProfiles(new Set());
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

      // Reload the shortlist to get updated data
      if (action === 'shortlist') {
        await loadShortlist()
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
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/sponsor/marketplace')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold mb-1 text-och-gold">Shortlist</h1>
          <p className="text-och-steel text-sm">Candidates in your active hiring funnel.</p>
        </div>

        {loading ? (
          <Card className="p-6 text-center text-och-steel text-sm">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading shortlist…
          </Card>
        ) : error ? (
          <Card className="p-6 text-center text-red-400 text-sm">{error}</Card>
        ) : shortlist.length === 0 ? (
          <Card className="p-6 text-center text-och-steel text-sm">
            <Bookmark className="w-10 h-10 mx-auto mb-3 text-och-steel/60" />
            No candidates in shortlist yet.
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-och-midnight/80 border-b border-och-steel/20 text-xs uppercase tracking-wide text-och-steel">
                  <tr>
                    <th className="px-4 py-3 text-left">Talent</th>
                    <th className="px-4 py-3 text-left">Readiness</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Tier</th>
                    <th className="px-4 py-3 text-left">Shortlisted</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-och-steel/20">
                  {shortlist.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-och-steel/10 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedProfile(log.profile)
                        setModalOpen(true)
                        marketplaceClient.logInterest(log.profile.id, 'view').catch(console.error)
                      }}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-white">
                            {log.profile.mentee_name}
                          </span>
                          <span className="text-xs text-och-steel">
                            {log.profile.mentee_email || 'Contact via marketplace'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {log.profile.readiness_score != null ? (
                          <span className="text-och-mint font-semibold">
                            {Number(log.profile.readiness_score).toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-och-steel">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-och-steel">
                        {log.profile.primary_role || '—'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge variant={log.profile.tier === 'professional' ? 'mint' : 'steel'} className="text-[11px]">
                          {log.profile.tier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-och-steel">
                        {new Date(log.created_at).toLocaleDateString()}
                      </td>
                      <td
                        className="px-4 py-3 align-top text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleInterest(log.profile.id, 'favorite')}
                            disabled={!!actionLoading[`${log.profile.id}-favorite`]}
                          >
                            {actionLoading[`${log.profile.id}-favorite`] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : favoritedProfiles.has(log.profile.id) ||
                              actionSuccess[log.profile.id]?.has('favorite') ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Heart className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            variant="gold"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleInterest(log.profile.id, 'contact_request')}
                            disabled={!!actionLoading[`${log.profile.id}-contact_request`]}
                          >
                            {actionLoading[`${log.profile.id}-contact_request`] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Mail className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
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
