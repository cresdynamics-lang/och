'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useMentorshipChat } from '@/hooks/useMentorshipChat'
import { useAuth } from '@/hooks/useAuth'
import type { ChatMessage } from '@/services/types/mentorship'

interface MentorshipChatProps {
  menteeId?: string
  mentorId?: string
  mentorName?: string
}

export function MentorshipChat({ menteeId: menteeIdProp, mentorId, mentorName }: MentorshipChatProps) {
  const { user } = useAuth()
  // Default to logged-in mentee (student view), but allow mentors to provide a target mentee id.
  const menteeId = menteeIdProp || user?.id?.toString()
  const {
    messages,
    presence,
    isLoading,
    error,
    isConnected,
    sendMessage,
    messagesEndRef,
  } = useMentorshipChat(menteeId, mentorId)

  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if (!inputMessage.trim() && !fileInputRef.current?.files?.length) return

    setIsSending(true)
    try {
      const files = fileInputRef.current?.files
        ? Array.from(fileInputRef.current.files)
        : undefined
      await sendMessage(inputMessage, files)
      setInputMessage('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getMentorStatus = () => {
    if (!mentorId) return null
    const mentorPresence = presence.find(p => p.mentor_id === mentorId)
    if (!mentorPresence) return null
    return mentorPresence.online ? 'online' : 'offline'
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-och-steel">Loading chat...</div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 border-och-orange">
        <div className="text-och-orange text-sm">{error}</div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-och-steel/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="font-semibold text-white">
              {mentorName || 'Mentor Chat'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isConnected ? (
                <Badge variant="mint" className="text-xs">Connected</Badge>
              ) : (
                <Badge variant="steel" className="text-xs">Disconnected</Badge>
              )}
              {getMentorStatus() && (
                <span className={`text-xs ${getMentorStatus() === 'online' ? 'text-och-mint' : 'text-och-steel'}`}>
                  {getMentorStatus() === 'online' ? '● Online' : '○ Offline'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-och-steel py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message: ChatMessage) => {
            const isMentee = message.sender_type === 'mentee'
            return (
              <div
                key={message.id}
                className={`flex ${isMentee ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    isMentee
                      ? 'bg-och-defender text-white'
                      : 'bg-och-midnight/50 text-white'
                  }`}
                >
                  <div className="text-xs text-och-steel mb-1">
                    {message.sender_name} • {formatTime(message.timestamp)}
                  </div>
                  <div className="text-sm">{message.message}</div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-och-mint hover:underline"
                        >
                          📎 {attachment.filename}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-och-steel/20">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.txt,.jpg,.png"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            📎
          </Button>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender resize-none"
            rows={2}
          />
          <Button
            variant="defender"
            onClick={handleSend}
            disabled={isSending || (!inputMessage.trim() && !fileInputRef.current?.files?.length)}
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

