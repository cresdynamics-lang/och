/**
 * Review Feedback Component
 * Display AI and Mentor feedback
 */
'use client'

import { useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'
import { useMissionStore } from '@/lib/stores/missionStore'
import type { AIFeedback, MentorReview } from '../types'

interface ReviewFeedbackProps {
  progressId: string
  userTier: 'free' | '$3-starter' | '$7-premium'
}

export function ReviewFeedback({ progressId, userTier }: ReviewFeedbackProps) {
  const { setAIFeedback, setMentorFeedback, aiFeedback, mentorFeedback } = useMissionStore()

  // Fetch AI review
  const { data: aiReviewData, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-review', progressId],
    queryFn: async () => {
      const response = await apiGateway.get<{
        status: string
        ai_score?: number
        ai_feedback?: AIFeedback
      }>(`/mission-progress/${progressId}/ai-review`)
      return response
    },
    refetchInterval: 5000, // Poll every 5s until reviewed
  })

  // Submit for mentor review mutation (Premium only)
  const submitMentorMutation = useMutation({
    mutationFn: async () => {
      const response = await apiGateway.post(
        `/mission-progress/${progressId}/mentor-review`
      )
      return response
    },
  })

  useEffect(() => {
    if (aiReviewData?.ai_feedback) {
      setAIFeedback(aiReviewData.ai_feedback)
    }
  }, [aiReviewData, setAIFeedback])

  if (aiLoading) {
    return (
      <Card className="glass-card p-6 text-center">
        <p className="text-och-steel">AI review in progress...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Review */}
      {aiFeedback && (
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">AI Review</h2>
            <Badge variant="mint">Score: {aiFeedback.score}/100</Badge>
          </div>

          {/* Strengths */}
          {aiFeedback.strengths && aiFeedback.strengths.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-och-mint mb-2">Strengths</h3>
              <ul className="space-y-1">
                {aiFeedback.strengths.map((strength: string, idx: number) => (
                  <li key={idx} className="text-sm text-och-steel flex items-start gap-2">
                    <span className="text-och-mint">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gaps */}
          {aiFeedback.gaps && aiFeedback.gaps.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-och-orange mb-2">Areas for Improvement</h3>
              <ul className="space-y-1">
                {aiFeedback.gaps.map((gap: string, idx: number) => (
                  <li key={idx} className="text-sm text-och-steel flex items-start gap-2">
                    <span className="text-och-orange">→</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {aiFeedback.full_feedback?.suggested_improvements && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-och-steel mb-2">Suggestions</h3>
              <ul className="space-y-1">
                {aiFeedback.full_feedback.suggested_improvements.map((suggestion: string, idx: number) => (
                  <li key={idx} className="text-sm text-och-steel">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Competencies Detected */}
          {aiFeedback.full_feedback?.tagged_competencies && (
            <div>
              <h3 className="text-sm font-semibold text-och-steel mb-2">Competencies Detected</h3>
              <div className="flex flex-wrap gap-2">
                {aiFeedback.full_feedback.tagged_competencies.map((comp: { name: string; level: number }, idx: number) => (
                  <Badge key={idx} variant="steel">
                    {comp.name} (L{comp.level})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Mentor Review (Premium only) */}
      {userTier === '$7-premium' && aiFeedback && (
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Mentor Review</h2>
            {!mentorFeedback && (
              <Button
                variant="defender"
                size="sm"
                onClick={() => submitMentorMutation.mutate()}
                disabled={submitMentorMutation.isPending}
              >
                {submitMentorMutation.isPending ? 'Submitting...' : 'Request Mentor Review'}
              </Button>
            )}
          </div>

          {mentorFeedback ? (
            <div>
              <Badge variant={mentorFeedback.decision === 'pass' ? 'mint' : 'orange'}>
                {mentorFeedback.decision === 'pass' ? '✓ Passed' : '✗ Failed'}
              </Badge>
              {mentorFeedback.comments && (
                <p className="text-och-steel mt-4">{mentorFeedback.comments}</p>
              )}
            </div>
          ) : (
            <p className="text-och-steel">
              Request a mentor review for detailed feedback and rubric scoring.
            </p>
          )}
        </Card>
      )}
    </div>
  )
}

