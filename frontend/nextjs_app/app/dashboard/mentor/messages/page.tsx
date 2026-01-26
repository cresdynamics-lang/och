'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { mentorClient } from '@/services/mentorClient'
import { MentorshipMessaging } from '@/components/mentor/MentorshipMessaging'
import { Card } from '@/components/ui/Card'
import { programsClient } from '@/services/programsClient'

export default function MentorMessagesPage() {
  const { user } = useAuth()
  const [mentees, setMentees] = useState<Array<{
    id: string
    assignmentId: string
    name: string
    email: string
    lastMessageTime?: string
    unreadCount: number
  }>>([])
  const [selectedMentee, setSelectedMentee] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    // Initial load - fast and minimal
    loadMentees()
    
    // Refresh mentees list every 30 seconds to update unread counts and sorting
    // Use silent refresh that doesn't show loading state
    const intervalId = setInterval(() => {
      loadMenteesSilently()
    }, 30000)
    
    return () => clearInterval(intervalId)
  }, [user?.id])

  const loadMenteesSilently = async () => {
    if (!user?.id) return

    try {
      // Don't set loading state to prevent UI flicker
      const assignments = await mentorClient.getMentorAssignments(user.id.toString())
      
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
      // Don't show error to user for silent refresh
    }
  }

  const loadMentees = async () => {
    if (!user?.id) return

    try {
      // Get all assignments for this mentor
      const assignments = await mentorClient.getMentorAssignments(user.id.toString())
      
      const menteesList = assignments.map(assignment => ({
        id: assignment.mentee_id,
        assignmentId: assignment.id,
        name: assignment.mentee_name,
        email: assignment.mentee_email,
        lastMessageTime: assignment.last_message_time || undefined,
        unreadCount: assignment.unread_count || 0,
      }))
      
      setMentees(menteesList)
      
      // Auto-select first mentee if none selected
      if (!selectedMentee && menteesList.length > 0) {
        setSelectedMentee(menteesList[0].assignmentId)
      }
      
      // Mark initial load as complete
      setIsInitialLoad(false)
    } catch (err) {
      console.error('Failed to load mentees:', err)
      setIsInitialLoad(false)
    }
  }

  const selectedMenteeData = mentees.find(m => m.assignmentId === selectedMentee)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-och-steel text-sm">Communicate with your mentees</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mentee List */}
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
                        <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                          selectedMentee === mentee.assignmentId
                            ? 'bg-black text-och-gold'
                            : 'bg-och-gold text-black'
                        }`}>
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

        {/* Messages */}
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
      </div>
    </div>
  )
}

