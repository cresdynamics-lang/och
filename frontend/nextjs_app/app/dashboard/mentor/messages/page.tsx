'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { mentorClient } from '@/services/mentorClient'
import { MentorshipMessaging } from '@/components/mentor/MentorshipMessaging'
import { DirectorMentorChat } from '@/components/mentor/DirectorMentorChat'
import { Card } from '@/components/ui/Card'
import type { DirectorMentorConversation } from '@/services/types/mentor'

type Tab = 'mentees' | 'directors'

export default function MentorMessagesPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const menteeIdFromUrl = searchParams.get('mentee')
  const [tab, setTab] = useState<Tab>('mentees')
  const [mentees, setMentees] = useState<Array<{
    id: string
    assignmentId: string
    name: string
    email: string
    lastMessageTime?: string
    unreadCount: number
  }>>([])
  const [selectedMentee, setSelectedMentee] = useState<string | null>(null)
  const [directors, setDirectors] = useState<DirectorMentorConversation[]>([])
  const [directorsAvailable, setDirectorsAvailable] = useState<Array<{ id: number; name: string; email: string }>>([])
  const [selectedDirectorId, setSelectedDirectorId] = useState<number | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [directorsLoadDone, setDirectorsLoadDone] = useState(false)

  const loadDirectors = async () => {
    if (!user?.id) return
    try {
      const [conversations, available] = await Promise.all([
        mentorClient.getDirectorMentorConversations(),
        mentorClient.getDirectorMentorAvailable(),
      ])
      setDirectors(conversations)
      setDirectorsAvailable(available)
      if (conversations.length > 0 && !selectedDirectorId) {
        setSelectedDirectorId(conversations[0].other_user.id)
      } else if (available.length > 0 && conversations.length === 0 && !selectedDirectorId) {
        setSelectedDirectorId(available[0].id)
      }
    } catch (err) {
      console.error('Failed to load directors:', err)
      setDirectors([])
      setDirectorsAvailable([])
    } finally {
      setDirectorsLoadDone(true)
    }
  }

  useEffect(() => {
    if (tab === 'directors') {
      loadDirectors()
    }
  }, [tab, user?.id])

  useEffect(() => {
    // Initial load - fast and minimal
    loadMentees()
    
    // Refresh mentees list every 30 seconds to update unread counts and sorting
    const intervalId = setInterval(() => {
      loadMenteesSilently()
    }, 30000)
    
    return () => clearInterval(intervalId)
  }, [user?.id, menteeIdFromUrl])

  const loadMenteesSilently = async () => {
    if (!user?.id) return

    try {
      // Don't set loading state to prevent UI flicker
      const assignments = await mentorClient.getMentorAssignments(user.id.toString())
      
      // CRITICAL: Ensure assignments is an array before calling map
      if (!assignments || !Array.isArray(assignments)) {
        console.log('[loadMenteesSilently] No assignments found or invalid response')
        setMentees([])
        return
      }
      
      const menteesList = assignments.map(assignment => ({
        id: assignment.mentee_id,
        assignmentId: assignment.id,
        name: assignment.mentee_name,
        email: assignment.mentee_email,
        lastMessageTime: assignment.last_message_time || undefined,
        unreadCount: assignment.unread_count || 0,
      }))
      
      setMentees(menteesList)
      
      // Auto-select first mentee if none selected and list is not empty
      if (!selectedMentee && menteesList.length > 0) {
        setSelectedMentee(menteesList[0].assignmentId)
      }
    } catch (err) {
      console.error('Failed to silently refresh mentees:', err)
      // Set empty array on error to prevent undefined map calls
      setMentees([])
      // Don't show error to user for silent refresh
    }
  }

  const loadMentees = async () => {
    if (!user?.id) return

    try {
      // Get all assignments for this mentor
      const assignments = await mentorClient.getMentorAssignments(user.id.toString())
      
      // CRITICAL: Ensure assignments is an array before calling map
      if (!assignments || !Array.isArray(assignments)) {
        console.log('[loadMentees] No assignments found or invalid response')
        setMentees([])
        setIsInitialLoad(false)
        return
      }
      
      const menteesList = assignments.map(assignment => ({
        id: assignment.mentee_id,
        assignmentId: assignment.id,
        name: assignment.mentee_name,
        email: assignment.mentee_email,
        lastMessageTime: assignment.last_message_time || undefined,
        unreadCount: assignment.unread_count || 0,
      }))
      
      setMentees(menteesList)
      
      // Auto-select mentee: prefer ?mentee= from URL, then first in list
      if (menteesList.length > 0) {
        if (menteeIdFromUrl) {
          const match = menteesList.find(m => m.id === menteeIdFromUrl)
          if (match) {
            setSelectedMentee(match.assignmentId)
          } else {
            setSelectedMentee(menteesList[0].assignmentId)
          }
        } else {
          setSelectedMentee(menteesList[0].assignmentId)
        }
      }
      
      // Mark initial load as complete
      setIsInitialLoad(false)
    } catch (err) {
      console.error('Failed to load mentees:', err)
      // Set empty array on error to prevent undefined map calls
      setMentees([])
      setIsInitialLoad(false)
    }
  }

  const selectedMenteeData = mentees.find(m => m.assignmentId === selectedMentee)
  const directorIdsFromConvos = new Set(directors.map((d) => d.other_user.id))
  const directorsList = [
    ...directors,
    ...directorsAvailable
      .filter((a) => !directorIdsFromConvos.has(a.id))
      .map((a) => ({
        other_user: a,
        last_message: null as DirectorMentorConversation['last_message'],
        unread_count: 0,
      })),
  ]
  const selectedDirector = selectedDirectorId
    ? directorsList.find(
        (d) => d.other_user.id === selectedDirectorId
      )?.other_user ?? directorsAvailable.find((a) => a.id === selectedDirectorId)
    : null

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-och-steel text-sm">
          Communicate with mentees and directors
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab('mentees')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === 'mentees'
              ? 'bg-och-gold text-black'
              : 'bg-white/10 text-white hover:bg-white/15'
          }`}
        >
          Mentees
        </button>
        <button
          type="button"
          onClick={() => setTab('directors')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === 'directors'
              ? 'bg-och-gold text-black'
              : 'bg-white/10 text-white hover:bg-white/15'
          }`}
        >
          Directors
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {tab === 'mentees' ? (
          <>
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h2 className="text-lg font-bold text-white mb-4">Mentees</h2>
                {isInitialLoad && mentees.length === 0 ? (
                  <div className="text-och-steel text-sm">Loading...</div>
                ) : mentees.length === 0 ? (
                  <div className="text-och-steel text-sm">No mentees assigned</div>
                ) : (
                  <div className="space-y-2">
                    {mentees.map((mentee) => (
                      <button
                        key={mentee.assignmentId}
                        onClick={() => setSelectedMentee(mentee.assignmentId)}
                        className={`w-full text-left p-3 rounded-lg transition-all relative ${
                          selectedMentee === mentee.assignmentId
                            ? 'bg-och-gold text-black'
                            : 'bg-white/5 text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{mentee.name}</div>
                          {mentee.unreadCount > 0 && (
                            <span
                              className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                                selectedMentee === mentee.assignmentId
                                  ? 'bg-black text-och-gold'
                                  : 'bg-och-gold text-black'
                              }`}
                            >
                              {mentee.unreadCount > 99 ? '99+' : mentee.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="text-xs opacity-70">{mentee.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </div>
            <div className="lg:col-span-3">
              {isInitialLoad ? (
                <Card className="p-8">
                  <div className="text-center text-och-steel">Loading messages...</div>
                </Card>
              ) : selectedMenteeData ? (
                <MentorshipMessaging
                  assignmentId={selectedMenteeData.assignmentId}
                  recipientName={selectedMenteeData.name}
                  onMessagesUpdated={loadMenteesSilently}
                />
              ) : (
                <Card className="p-8">
                  <div className="text-center text-och-steel">
                    Select a mentee to start messaging
                  </div>
                </Card>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h2 className="text-lg font-bold text-white mb-4">Directors</h2>
                <p className="text-och-steel text-xs mb-3">
                  Chat with directors about student cases or change of track
                </p>
                {!directorsLoadDone && directorsList.length === 0 ? (
                  <div className="text-och-steel text-sm">Loading...</div>
                ) : directorsList.length === 0 ? (
                  <div className="text-och-steel text-sm">No directors available</div>
                ) : (
                  <div className="space-y-2">
                    {directorsList.map((d) => (
                      <button
                        key={d.other_user.id}
                        onClick={() => setSelectedDirectorId(d.other_user.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all relative ${
                          selectedDirectorId === d.other_user.id
                            ? 'bg-och-gold text-black'
                            : 'bg-white/5 text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{d.other_user.name}</div>
                          {d.unread_count > 0 && (
                            <span
                              className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                                selectedDirectorId === d.other_user.id
                                  ? 'bg-black text-och-gold'
                                  : 'bg-och-gold text-black'
                              }`}
                            >
                              {d.unread_count > 99 ? '99+' : d.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="text-xs opacity-70">{d.other_user.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </div>
            <div className="lg:col-span-3">
              {selectedDirector ? (
                <DirectorMentorChat
                  otherUser={selectedDirector}
                  onMessagesUpdated={loadDirectors}
                />
              ) : (
                <Card className="p-8">
                  <div className="text-center text-och-steel">
                    Select a director to start a conversation (e.g. student case or change of track)
                  </div>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

