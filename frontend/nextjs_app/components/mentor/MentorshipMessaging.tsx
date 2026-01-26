'use client'

import { useState, useEffect, useRef } from 'react'
import { mentorClient } from '@/services/mentorClient'
import { useAuth } from '@/hooks/useAuth'
import type { MentorshipMessage } from '@/services/types/mentor'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Send, Paperclip } from 'lucide-react'

interface MentorshipMessagingProps {
  assignmentId: string
  recipientName: string
  onMessagesUpdated?: () => void
}

export function MentorshipMessaging({ assignmentId, recipientName, onMessagesUpdated }: MentorshipMessagingProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<MentorshipMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [messageBody, setMessageBody] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const shouldAutoScrollRef = useRef(true)

  // Check if user is near bottom of scroll
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true
    const container = messagesContainerRef.current
    const threshold = 100 // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  }

  // Load messages
  const loadMessages = async () => {
    if (!assignmentId) {
      console.log('No assignmentId provided')
      return
    }
    
    try {
      console.log('Loading messages for assignment:', assignmentId, 'user:', user?.id)
      const response = await mentorClient.getMessages(assignmentId)
      
      // Handle both array and object responses
      let loadedMessages: MentorshipMessage[] = []
      let newAssignmentId: string | null = null
      
      if (Array.isArray(response)) {
        loadedMessages = response
      } else if (response && typeof response === 'object' && 'messages' in response) {
        loadedMessages = response.messages || []
        if (response.assignment_id && response.assignment_id !== assignmentId) {
          newAssignmentId = response.assignment_id
          console.warn(`⚠️ Assignment ID changed from ${assignmentId} to ${newAssignmentId}. Updating...`)
        }
      }
      
      console.log('Loaded messages:', loadedMessages.length, 'for assignment:', assignmentId, newAssignmentId ? `(corrected to: ${newAssignmentId})` : '')
      console.log('Messages data:', loadedMessages)
      setMessages(loadedMessages)
      
      // If assignment_id changed, notify parent to update
      if (newAssignmentId && onMessagesUpdated) {
        // The parent component should update the assignmentId
        console.log('Assignment ID changed - parent should update assignmentId to:', newAssignmentId)
      }
      
      // Mark unread messages as read
      const unreadMessages = loadedMessages.filter(m => 
        !m.is_read && m.recipient.id === user?.id?.toString()
      )
      for (const msg of unreadMessages) {
        try {
          await mentorClient.markMessageRead(msg.id)
        } catch (err) {
          console.error('Failed to mark message as read:', err)
        }
      }
      
      // Notify parent component that messages were updated (to refresh unread counts)
      if (onMessagesUpdated) {
        onMessagesUpdated()
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (assignmentId) {
      loadMessages()
    }
  }, [assignmentId])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!assignmentId) return
    
    const intervalId = setInterval(() => {
      loadMessages()
    }, 3000)

    return () => clearInterval(intervalId)
  }, [assignmentId])

  // Track scroll position - disable auto-scroll if user scrolls up
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      // Only enable auto-scroll if user is near bottom
      shouldAutoScrollRef.current = isNearBottom()
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // NO auto-scroll on message updates - only scroll when user sends a message

  const handleSend = async () => {
    if (!messageBody.trim() && selectedFiles.length === 0) return
    if (!assignmentId) return

    try {
      setIsSending(true)
      
      const response = await mentorClient.sendMessage(assignmentId, {
        body: messageBody.trim(),
        attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
      })
      
      // Check if assignment_id changed in response
      if (response && typeof response === 'object' && 'assignment_id' in response) {
        const newAssignmentId = response.assignment_id
        if (newAssignmentId && newAssignmentId !== assignmentId) {
          console.warn(`⚠️ Assignment ID changed from ${assignmentId} to ${newAssignmentId} after sending message.`)
          // Note: We can't update assignmentId here as it's a prop, but the parent should handle it
          // The next loadMessages() call will use the correct ID
        }
      }
      
      // Clear input
      setMessageBody('')
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Reload messages immediately
      await loadMessages()
      // Scroll to bottom after sending (user wants to see their message)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err: any) {
      console.error('Failed to send message:', err)
      alert(err.message || 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isSent = (message: MentorshipMessage) => {
    return message.sender.id === user?.id?.toString()
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center text-och-steel">Loading messages...</div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-bold text-white">Messages with {recipientName}</h3>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-och-steel py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isSent(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isSent(message)
                    ? 'bg-och-gold text-black'
                    : 'bg-white/10 text-white'
                }`}
              >
                <div className="text-xs font-semibold mb-1">
                  {isSent(message) ? 'You' : message.sender.name}
                </div>
                <div className="text-sm whitespace-pre-wrap">{message.body}</div>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline flex items-center gap-1"
                      >
                        <Paperclip className="w-3 h-3" />
                        {att.filename}
                      </a>
                    ))}
                  </div>
                )}
                <div className="text-xs opacity-70 mt-1">
                  {formatTime(message.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer"
          >
            <Paperclip className="w-5 h-5 text-och-steel" />
          </label>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-och-steel resize-none"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={isSending || (!messageBody.trim() && selectedFiles.length === 0)}
            className="bg-och-gold text-black hover:bg-och-gold/90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        {selectedFiles.length > 0 && (
          <div className="mt-2 text-xs text-och-steel">
            {selectedFiles.length} file(s) selected
          </div>
        )}
      </div>
    </Card>
  )
}

