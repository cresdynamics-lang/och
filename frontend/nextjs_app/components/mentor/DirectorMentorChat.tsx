'use client'

import { useState, useEffect, useRef } from 'react'
import { mentorClient } from '@/services/mentorClient'
import { useAuth } from '@/hooks/useAuth'
import type { DirectorMentorMessage } from '@/services/types/mentor'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Send } from 'lucide-react'

interface DirectorMentorChatProps {
  otherUser: { id: number; name: string; email: string }
  onMessagesUpdated?: () => void
}

export function DirectorMentorChat({ otherUser, onMessagesUpdated }: DirectorMentorChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<DirectorMentorMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [messageBody, setMessageBody] = useState('')
  const [subject, setSubject] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const loadMessages = async () => {
    if (!otherUser?.id) return
    try {
      const list = await mentorClient.getDirectorMentorMessages(otherUser.id)
      setMessages(list)
      const unread = list.filter(
        (m) => !m.is_read && m.recipient.id === user?.id?.toString()
      )
      for (const msg of unread) {
        try {
          await mentorClient.markDirectorMentorMessageRead(msg.id)
        } catch {
          // ignore
        }
      }
      onMessagesUpdated?.()
    } catch (err) {
      console.error('Failed to load director-mentor messages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (otherUser?.id) {
      setIsLoading(true)
      loadMessages()
    }
  }, [otherUser?.id])

  useEffect(() => {
    if (!otherUser?.id) return
    const intervalId = setInterval(loadMessages, 4000)
    return () => clearInterval(intervalId)
  }, [otherUser?.id])

  const handleSend = async () => {
    if (!messageBody.trim()) return
    try {
      setIsSending(true)
      await mentorClient.sendDirectorMentorMessage({
        recipient_id: otherUser.id,
        body: messageBody.trim(),
        subject: subject.trim() || undefined,
      })
      setMessageBody('')
      setSubject('')
      await loadMessages()
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch (err: unknown) {
      console.error('Failed to send message:', err)
      alert(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isSent = (message: DirectorMentorMessage) =>
    message.sender.id === user?.id?.toString()

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center text-och-steel">Loading conversation...</div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-bold text-white">
          Chat with {otherUser.name}
        </h3>
        <p className="text-sm text-och-steel">{otherUser.email}</p>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="text-center text-och-steel py-8">
            No messages yet. Start the conversation (e.g. about a student case
            or change of track).
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
                  {isSent(message) ? 'You' : message.sender_name ?? message.sender.name}
                </div>
                {message.subject && (
                  <div className="text-xs opacity-80 mb-1">
                    Re: {message.subject}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">{message.body}</div>
                <div className="text-xs opacity-70 mt-1">
                  {formatTime(message.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10 space-y-2">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (e.g. Student X - change of track)"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-och-steel text-sm"
        />
        <div className="flex gap-2">
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
            disabled={isSending || !messageBody.trim()}
            className="bg-och-gold text-black hover:bg-och-gold/90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
