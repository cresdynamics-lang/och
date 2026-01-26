'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
// Using native textarea since Textarea component may not exist
import { Loader2, Send, X } from 'lucide-react'
import { marketplaceClient, type MarketplaceProfile } from '@/services/marketplaceClient'

interface ContactModalProps {
  open: boolean
  onClose: () => void
  profile: MarketplaceProfile | null
  onSuccess?: () => void
}

export function ContactModal({ open, onClose, profile, onSuccess }: ContactModalProps) {
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile) return
    
    if (!message.trim()) {
      setError('Please enter a message')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      await marketplaceClient.logInterest(profile.id, 'contact_request', {
        message: message.trim(),
        subject: subject.trim() || 'Contact Request',
      })
      
      // Reset form
      setMessage('')
      setSubject('')
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
      
      // Close modal
      onClose()
    } catch (err: any) {
      console.error('Failed to send contact request:', err)
      setError(err.message || 'Failed to send contact request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setMessage('')
      setSubject('')
      setError(null)
      onClose()
    }
  }

  if (!profile) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-och-midnight border-och-defender/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Contact {profile.mentee_name || profile.mentee_email}
          </DialogTitle>
          <DialogDescription className="text-och-steel">
            Send a message to this student. They will be notified and can view your contact details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Subject (Optional)
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Job Opportunity, Interview Invitation"
              className="bg-och-midnight/50 border-och-defender/30 text-white"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message to the student..."
              className="w-full min-h-32 px-4 py-2 bg-och-midnight/50 border border-och-defender/30 rounded-lg text-white placeholder:text-och-steel focus:outline-none focus:ring-2 focus:ring-och-gold/50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              required
            />
            <p className="text-xs text-och-steel mt-1">
              This message will be visible to the student along with your company information.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              disabled={loading || !message.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Contact Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
