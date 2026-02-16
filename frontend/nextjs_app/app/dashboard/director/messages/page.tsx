'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { mentorClient } from '@/services/mentorClient'
import { DirectorMentorChat } from '@/components/mentor/DirectorMentorChat'
import { Card } from '@/components/ui/Card'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { RouteGuard } from '@/components/auth/RouteGuard'
import type { DirectorMentorConversation } from '@/services/types/mentor'

export default function DirectorMessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<DirectorMentorConversation[]>([])
  const [available, setAvailable] = useState<Array<{ id: number; name: string; email: string }>>([])
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null)
  const [loadDone, setLoadDone] = useState(false)

  const loadMentors = async () => {
    if (!user?.id) return
    try {
      const [convos, avail] = await Promise.all([
        mentorClient.getDirectorMentorConversations(),
        mentorClient.getDirectorMentorAvailable(),
      ])
      setConversations(convos)
      setAvailable(avail)
      if (convos.length > 0 && selectedMentorId === null) {
        setSelectedMentorId(convos[0].other_user.id)
      } else if (avail.length > 0 && convos.length === 0 && selectedMentorId === null) {
        setSelectedMentorId(avail[0].id)
      }
    } catch (err) {
      console.error('Failed to load mentors:', err)
      setConversations([])
      setAvailable([])
    } finally {
      setLoadDone(true)
    }
  }

  useEffect(() => {
    loadMentors()
  }, [user?.id])

  const mentorIdsFromConvos = new Set(conversations.map((c) => c.other_user.id))
  const mentorsList = [
    ...conversations,
    ...available
      .filter((a) => !mentorIdsFromConvos.has(a.id))
      .map((a) => ({
        other_user: a,
        last_message: null as DirectorMentorConversation['last_message'],
        unread_count: 0,
      })),
  ]
  const selectedMentor =
    selectedMentorId != null
      ? mentorsList.find((m) => m.other_user.id === selectedMentorId)?.other_user ??
        available.find((a) => a.id === selectedMentorId)
      : null

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <p className="text-och-steel text-sm">
              Chat one-on-one with mentors (e.g. about student cases or reviews)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h2 className="text-lg font-bold text-white mb-4">Mentors</h2>
                <p className="text-och-steel text-xs mb-3">
                  Start or continue a conversation with a mentor
                </p>
                {!loadDone && mentorsList.length === 0 ? (
                  <div className="text-och-steel text-sm">Loading...</div>
                ) : mentorsList.length === 0 ? (
                  <div className="text-och-steel text-sm">No mentors available</div>
                ) : (
                  <div className="space-y-2">
                    {mentorsList.map((m) => (
                      <button
                        key={m.other_user.id}
                        onClick={() => setSelectedMentorId(m.other_user.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all relative ${
                          selectedMentorId === m.other_user.id
                            ? 'bg-och-gold text-black'
                            : 'bg-white/5 text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{m.other_user.name}</div>
                          {m.unread_count > 0 && (
                            <span
                              className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                                selectedMentorId === m.other_user.id
                                  ? 'bg-black text-och-gold'
                                  : 'bg-och-gold text-black'
                              }`}
                            >
                              {m.unread_count > 99 ? '99+' : m.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="text-xs opacity-70">{m.other_user.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </div>
            <div className="lg:col-span-3">
              {selectedMentor ? (
                <DirectorMentorChat
                  otherUser={selectedMentor}
                  onMessagesUpdated={loadMentors}
                />
              ) : (
                <Card className="p-8">
                  <div className="text-center text-och-steel">
                    Select a mentor to start a conversation
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
