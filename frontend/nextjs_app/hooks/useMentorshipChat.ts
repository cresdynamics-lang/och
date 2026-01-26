'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { mentorshipClient } from '@/services/mentorshipClient'
import { mentorshipWS } from '@/utils/websocket'
import type { ChatMessage, MentorPresence } from '@/services/types/mentorship'

export function useMentorshipChat(menteeId: string | undefined, mentorId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [presence, setPresence] = useState<MentorPresence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = useCallback(async () => {
    if (!menteeId) return

    try {
      const data = await mentorshipClient.getChatMessages(menteeId, mentorId)
      setMessages(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }, [menteeId, mentorId])

  const loadPresence = useCallback(async () => {
    if (!menteeId) return

    try {
      const data = await mentorshipClient.getMentorPresence(menteeId)
      setPresence(data)
    } catch (err: any) {
      console.error('Failed to load presence:', err)
    }
  }, [menteeId])

  const sendMessage = useCallback(async (message: string, attachments?: File[]) => {
    if (!menteeId) return

    try {
      const newMessage = await mentorshipClient.sendMessage(menteeId, {
        message,
        mentor_id: mentorId,
        attachments,
      })
      setMessages(prev => [...prev, newMessage])
      
      // Also send via WebSocket for real-time delivery
      if (mentorshipWS.isConnected()) {
        mentorshipWS.send('chat_message', {
          mentee_id: menteeId,
          mentor_id: mentorId,
          message,
        })
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send message')
    }
  }, [menteeId, mentorId])

  // WebSocket setup
  useEffect(() => {
    if (!menteeId) return

    mentorshipWS.connect()

    const unsubscribeMessage = mentorshipWS.on('chat_message', (data: ChatMessage) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.find(m => m.id === data.id)) return prev
        return [...prev, data]
      })
    })

    const unsubscribePresence = mentorshipWS.on('mentor_presence', (data: MentorPresence) => {
      setPresence(prev => {
        const index = prev.findIndex(p => p.mentor_id === data.mentor_id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = data
          return updated
        }
        return [...prev, data]
      })
    })

    const unsubscribeConnect = mentorshipWS.onConnect(() => {
      setIsConnected(true)
    })

    const unsubscribeDisconnect = mentorshipWS.onDisconnect(() => {
      setIsConnected(false)
    })

    return () => {
      unsubscribeMessage()
      unsubscribePresence()
      unsubscribeConnect()
      unsubscribeDisconnect()
    }
  }, [menteeId])

  useEffect(() => {
    if (menteeId) {
      loadMessages()
      loadPresence()
      // Refresh presence every 30 seconds
      const interval = setInterval(loadPresence, 30000)
      return () => clearInterval(interval)
    }
  }, [menteeId, loadMessages, loadPresence])

  return {
    messages,
    presence,
    isLoading,
    error,
    isConnected,
    sendMessage,
    messagesEndRef,
    reload: loadMessages,
  }
}

