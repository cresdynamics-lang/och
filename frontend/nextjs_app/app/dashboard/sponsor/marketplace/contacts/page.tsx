'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { marketplaceClient, type EmployerInterestLog, type MarketplaceProfile } from '@/services/marketplaceClient'
import { Mail, ArrowLeft, Loader2, User, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TalentProfileModal } from '@/components/marketplace/TalentProfileModal'

export default function ContactedStudentsPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<EmployerInterestLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Modal state
  const [selectedProfile, setSelectedProfile] = useState<MarketplaceProfile | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await marketplaceClient.getInterestLogs('contact_request')
      const contactsArray = Array.isArray(response) ? response : (response?.results || [])
      setContacts(contactsArray)
    } catch (err: any) {
      console.error('Failed to load contacted students:', err)
      setError(err.message || 'Failed to load contacted students')
    } finally {
      setLoading(false)
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
    const variants: Record<string, 'mint' | 'gold' | 'steel' | 'defender'> = {
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
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/sponsor/marketplace')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold mb-1 text-och-gold">Contacted</h1>
          <p className="text-och-steel text-sm mb-1">
            Students you have already reached out to.
          </p>
        </div>

        {loading ? (
          <Card className="p-6 text-center text-och-steel text-sm">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading contacted students…
          </Card>
        ) : error ? (
          <Card className="p-6 text-center text-red-400 text-sm">{error}</Card>
        ) : contacts.length === 0 ? (
          <Card className="p-6 text-center text-och-steel text-sm">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-60" />
            No contacted students yet.
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
                    <th className="px-4 py-3 text-left">Contacted</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-och-steel/20">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="hover:bg-och-steel/10 transition-colors cursor-pointer"
                      onClick={() => {
                        if (contact.profile) {
                          setSelectedProfile(contact.profile as MarketplaceProfile)
                          setModalOpen(true)
                        }
                      }}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-white">
                            {contact.profile?.mentee_name || contact.profile?.mentee_email || 'Student'}
                          </span>
                          <span className="text-xs text-och-steel">
                            {contact.profile?.mentee_email || 'Contact via marketplace'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {contact.profile?.readiness_score != null ? (
                          <span className="text-och-mint font-semibold">
                            {Number(contact.profile.readiness_score).toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-och-steel">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-och-steel">
                        {contact.profile?.primary_role || '—'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {contact.profile && (
                          <Badge
                            variant={contact.profile.tier === 'professional' ? 'mint' : 'steel'}
                            className="text-[11px]"
                          >
                            {contact.profile.tier}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-och-steel">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(contact.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {contact.profile?.profile_status && (
                          <Badge
                            variant={getStatusBadge(contact.profile.profile_status)}
                            className="text-[11px]"
                          >
                            {contact.profile.profile_status.replace('_', ' ')}
                          </Badge>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 align-top text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <User className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Profile Detail Modal */}
        <TalentProfileModal
          profile={selectedProfile}
          open={modalOpen && !!selectedProfile}
          onClose={() => {
            setModalOpen(false)
            setSelectedProfile(null)
          }}
          onFavorite={() => {}}
          onShortlist={() => {}}
          onContact={() => {}}
          isFavorited={false}
          isShortlisted={false}
          actionLoading={{}}
        />
      </div>
    </div>
  )
}
