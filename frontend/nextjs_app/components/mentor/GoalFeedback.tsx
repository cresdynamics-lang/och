'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useMenteeGoals } from '@/hooks/useMenteeGoals'
import { useAuth } from '@/hooks/useAuth'

export function GoalFeedback() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const { goals, isLoading, error, provideFeedback } = useMenteeGoals(mentorId)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  const handleSubmitFeedback = async (goalId: string) => {
    if (!feedbackText.trim()) return
    try {
      await provideFeedback(goalId, feedbackText)
      setSelectedGoal(null)
      setFeedbackText('')
    } catch (err) {
      // Error handled by hook
    }
  }

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white">Goal Feedback</h2>
        <p className="text-sm text-och-steel">
          Provide feedback on mentee goals (Professional tier only).
        </p>
      </div>

      {isLoading && <div className="text-och-steel text-sm">Loading goals...</div>}
      {error && <div className="text-och-orange text-sm">Error: {error}</div>}

      {!isLoading && !error && goals.length === 0 && (
        <div className="text-och-steel text-sm">No goals requiring feedback.</div>
      )}

      {!isLoading && !error && goals.length > 0 && (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="p-4 bg-och-midnight/50 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
                  <p className="text-sm text-och-steel mt-1">{goal.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="defender" className="text-xs capitalize">{goal.goal_type}</Badge>
                    <Badge variant="mint" className="text-xs capitalize">{goal.status}</Badge>
                  </div>
                </div>
                <div className="text-right text-xs text-och-steel">
                  <div>Mentee: {goal.mentee_name}</div>
                  <div>Target: {new Date(goal.target_date).toLocaleDateString()}</div>
                </div>
              </div>

              {goal.mentor_feedback ? (
                <div className="p-3 bg-och-midnight rounded">
                  <div className="text-xs text-och-steel mb-1">
                    Feedback provided: {new Date(goal.mentor_feedback.provided_at).toLocaleString()}
                  </div>
                  <p className="text-sm text-white">{goal.mentor_feedback.feedback}</p>
                </div>
              ) : (
                <div>
                  {selectedGoal === goal.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        rows={4}
                        placeholder="Provide feedback on this goal..."
                        className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedGoal(null)
                          setFeedbackText('')
                        }}>
                          Cancel
                        </Button>
                        <Button variant="defender" size="sm" onClick={() => handleSubmitFeedback(goal.id)}>
                          Submit Feedback
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setSelectedGoal(goal.id)}>
                      Provide Feedback
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}


