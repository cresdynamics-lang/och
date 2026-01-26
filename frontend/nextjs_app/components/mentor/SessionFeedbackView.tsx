'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Star } from 'lucide-react'
import type { SessionFeedback } from '@/services/types/mentor'
import { apiGateway } from '@/services/apiGateway'

interface SessionFeedbackViewProps {
  sessionId: string
  isMentor: boolean
}

export function SessionFeedbackView({ sessionId, isMentor }: SessionFeedbackViewProps) {
  const [feedback, setFeedback] = useState<SessionFeedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFeedback()
  }, [sessionId])

  const loadFeedback = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiGateway.get<{
        session_id: string
        feedback: SessionFeedback[]
        count: number
      }>(`/sessions/${sessionId}/feedback`)
      setFeedback(response.feedback || [])
    } catch (err: any) {
      console.error('Failed to load feedback:', err)
      setError(err.message || 'Failed to load feedback')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-och-gold text-och-gold'
                : 'fill-none text-och-steel'
            }`}
          />
        ))}
        <span className="ml-2 text-xs text-white">{rating}/5</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-och-mint mx-auto mb-2"></div>
        <p className="text-xs text-och-steel">Loading feedback...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3 bg-och-orange/10 border border-och-orange/20 rounded-lg">
        <p className="text-xs text-och-orange">{error}</p>
      </div>
    )
  }

  if (feedback.length === 0) {
    return (
      <div className="p-3 bg-och-midnight/30 rounded-lg border border-och-steel/20">
        <p className="text-xs text-och-steel">
          {isMentor ? 'No feedback received yet.' : 'No feedback submitted yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {feedback.map((fb) => (
        <Card key={fb.id} className="border-och-mint/20">
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  {isMentor ? fb.mentee_name : 'Your Feedback'}
                </h4>
                <p className="text-xs text-och-steel">
                  Submitted {new Date(fb.submitted_at).toLocaleDateString()}
                </p>
              </div>
              {renderStars(fb.overall_rating)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-och-steel/20">
              <div>
                <p className="text-xs text-och-steel mb-1">Engagement</p>
                {renderStars(fb.mentor_engagement)}
              </div>
              <div>
                <p className="text-xs text-och-steel mb-1">Preparation</p>
                {renderStars(fb.mentor_preparation)}
              </div>
              <div>
                <p className="text-xs text-och-steel mb-1">Value</p>
                {renderStars(fb.session_value)}
              </div>
            </div>

            {fb.strengths && (
              <div>
                <p className="text-xs font-semibold text-white mb-1">Strengths</p>
                <p className="text-xs text-och-steel whitespace-pre-wrap">{fb.strengths}</p>
              </div>
            )}

            {fb.areas_for_improvement && (
              <div>
                <p className="text-xs font-semibold text-white mb-1">Areas for Improvement</p>
                <p className="text-xs text-och-steel whitespace-pre-wrap">{fb.areas_for_improvement}</p>
              </div>
            )}

            {fb.additional_comments && (
              <div>
                <p className="text-xs font-semibold text-white mb-1">Additional Comments</p>
                <p className="text-xs text-och-steel whitespace-pre-wrap">{fb.additional_comments}</p>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

