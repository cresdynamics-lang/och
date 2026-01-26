'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Star, X } from 'lucide-react'
import { apiGateway } from '@/services/apiGateway'

interface SessionFeedbackFormProps {
  sessionId: string
  sessionTitle: string
  onSubmitted: () => void
  onCancel: () => void
}

export function SessionFeedbackForm({
  sessionId,
  sessionTitle,
  onSubmitted,
  onCancel
}: SessionFeedbackFormProps) {
  const [ratings, setRatings] = useState({
    overall_rating: 0,
    mentor_engagement: 0,
    mentor_preparation: 0,
    session_value: 0
  })
  const [textFields, setTextFields] = useState({
    strengths: '',
    areas_for_improvement: '',
    additional_comments: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRatingClick = (field: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [field]: value }))
  }

  const renderStarRating = (
    field: keyof typeof ratings,
    label: string,
    description?: string
  ) => {
    return (
      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium text-white mb-1">
            {label}
            <span className="text-och-orange ml-1">*</span>
          </label>
          {description && (
            <p className="text-xs text-och-steel">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingClick(field, star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= ratings[field]
                    ? 'fill-och-gold text-och-gold'
                    : 'fill-none text-och-steel hover:text-och-gold/50'
                }`}
              />
            </button>
          ))}
          {ratings[field] > 0 && (
            <span className="text-xs text-white ml-2">{ratings[field]}/5</span>
          )}
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    // Validate required ratings
    if (
      ratings.overall_rating === 0 ||
      ratings.mentor_engagement === 0 ||
      ratings.mentor_preparation === 0 ||
      ratings.session_value === 0
    ) {
      setError('Please provide all required ratings')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await apiGateway.post(`/sessions/${sessionId}/feedback`, {
        overall_rating: ratings.overall_rating,
        mentor_engagement: ratings.mentor_engagement,
        mentor_preparation: ratings.mentor_preparation,
        session_value: ratings.session_value,
        strengths: textFields.strengths.trim(),
        areas_for_improvement: textFields.areas_for_improvement.trim(),
        additional_comments: textFields.additional_comments.trim()
      })

      onSubmitted()
    } catch (err: any) {
      console.error('Failed to submit feedback:', err)
      setError(err.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-och-mint/30">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Session Feedback</h3>
            <p className="text-xs text-och-steel mt-1">{sessionTitle}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="w-3 h-3" />
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-och-orange/10 border border-och-orange/20 rounded-lg">
            <p className="text-xs text-och-orange">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {renderStarRating(
            'overall_rating',
            'Overall Rating',
            'How would you rate this session overall?'
          )}

          {renderStarRating(
            'mentor_engagement',
            'Mentor Engagement',
            'How engaged was your mentor during the session?'
          )}

          {renderStarRating(
            'mentor_preparation',
            'Mentor Preparation',
            'How well-prepared was your mentor?'
          )}

          {renderStarRating(
            'session_value',
            'Session Value',
            'How valuable was this session for your learning?'
          )}

          <div>
            <label className="block text-xs font-medium text-white mb-2">
              What went well? (Strengths)
            </label>
            <textarea
              value={textFields.strengths}
              onChange={(e) =>
                setTextFields(prev => ({ ...prev, strengths: e.target.value }))
              }
              placeholder="What aspects of the session did you find helpful or valuable?"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-och-mint resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white mb-2">
              Areas for Improvement
            </label>
            <textarea
              value={textFields.areas_for_improvement}
              onChange={(e) =>
                setTextFields(prev => ({
                  ...prev,
                  areas_for_improvement: e.target.value
                }))
              }
              placeholder="What could be improved in future sessions?"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-och-mint resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white mb-2">
              Additional Comments
            </label>
            <textarea
              value={textFields.additional_comments}
              onChange={(e) =>
                setTextFields(prev => ({
                  ...prev,
                  additional_comments: e.target.value
                }))
              }
              placeholder="Any other comments or suggestions?"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-och-mint resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-och-steel/20">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="defender"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

