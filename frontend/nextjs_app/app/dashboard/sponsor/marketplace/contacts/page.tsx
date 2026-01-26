'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { marketplaceClient, type EmployerInterestLog, type MarketplaceProfile } from '@/services/marketplaceClient'
import { Mail, ArrowLeft, Loader2, Building2, User, Calendar } from 'lucide-react'
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
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/sponsor/marketplace')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
          <h1 className="text-4xl font-bold mb-2 text-och-gold">Contacted Students</h1>
          <p className="text-och-steel mb-4">
            View all students you have contacted through the marketplace.
          </p>
        </div>

        {loading ? (
          <Card className="p-8">
            <div className="text-center text-och-steel">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              Loading contacted students...
            </div>
          </Card>
        ) : error ? (
          <Card className="p-8">
            <div className="text-center text-red-400">{error}</div>
          </Card>
        ) : contacts.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-och-steel">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No contacted students yet</p>
              <p className="text-sm mb-4">
                Start browsing talent and send contact requests to connect with students.
              </p>
              <Button variant="gold" onClick={() => router.push('/dashboard/sponsor/marketplace/talent')}>
                Browse Talent
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact) => (
              <Card
                key={contact.id}
                className="p-6 hover:border-och-gold/50 transition-colors"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {contact.profile?.mentee_name || contact.profile?.mentee_email || 'Unknown Student'}
                      </h3>
                      <p className="text-sm text-och-steel">
                        {contact.profile?.primary_role || 'Cybersecurity Professional'}
                      </p>
                    </div>
                    <Badge variant={contact.profile?.tier === 'professional' ? 'mint' : 'steel'}>
                      {contact.profile?.tier === 'professional' ? 'Professional' : contact.profile?.tier === 'starter' ? 'Starter' : 'Free'}
                    </Badge>
                  </div>

                  {/* Readiness Score */}
                  {contact.profile?.readiness_score !== null && contact.profile?.readiness_score !== undefined && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-och-steel">Readiness Score</span>
                        <Badge variant={getReadinessColor(contact.profile.readiness_score)}>
                          {contact.profile.readiness_score}% - {getReadinessLabel(contact.profile.readiness_score)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  {contact.profile?.profile_status && (
                    <div>
                      <Badge variant={getStatusBadge(contact.profile.profile_status)}>
                        {contact.profile.profile_status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  )}

                  {/* Message Preview */}
                  {contact.message && (
                    <div className="bg-och-midnight/30 rounded-lg p-3">
                      <p className="text-xs text-och-steel mb-1">Your Message:</p>
                      <p className="text-sm text-white line-clamp-2">{contact.message}</p>
                    </div>
                  )}

                  {/* Contact Date */}
                  <div className="flex items-center gap-2 text-xs text-och-steel">
                    <Calendar className="w-4 h-4" />
                    <span>Contacted on {new Date(contact.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-och-defender/20">
                    <Button
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => {
                        if (contact.profile) {
                          setSelectedProfile(contact.profile as MarketplaceProfile)
                          setModalOpen(true)
                        }
                      }}
                    >
                      <User className="w-3 h-3 mr-1" />
                      View Full Profile
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
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
