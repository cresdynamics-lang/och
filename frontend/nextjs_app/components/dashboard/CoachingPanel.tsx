'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useHabits } from '@/hooks/useHabits'
import { useAuth } from '@/hooks/useAuth'

export function CoachingPanel() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const { habits, todayHabits, logHabit } = useHabits()
  const goals: any[] = []
  const latestReflection: any = null
  const isLoading = false
  const error: string | null = null
  const toggleHabit = async (habitId: string, state: boolean) => {
    await logHabit(habitId, state ? 'completed' : 'missed')
  }
  const completeGoal = async (goalId: string) => {
    // TODO: Implement goal completion
  }
  const submitReflection = async (content: string) => {
    // TODO: Implement reflection submission
  }
  const [reflectionText, setReflectionText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleToggleHabit = async (habitId: string, currentState: boolean) => {
    try {
      await toggleHabit(habitId, !currentState)
    } catch (err: any) {
      alert(err.message || 'Failed to update habit')
    }
  }

  const handleCompleteGoal = async (goalId: string) => {
    try {
      await completeGoal(goalId)
    } catch (err: any) {
      alert(err.message || 'Failed to complete goal')
    }
  }

  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reflectionText.trim()) return

    setSubmitting(true)
    try {
      await submitReflection(reflectionText)
      setReflectionText('')
    } catch (err: any) {
      alert(err.message || 'Failed to submit reflection')
    } finally {
      setSubmitting(false)
    }
  }

  const habitTypes = ['learn', 'practice', 'reflect'] as const
  const getHabitByType = (type: typeof habitTypes[number]) => {
    return todayHabits.find(h => h.name.toLowerCase().includes(type))
  }

  if (isLoading) {
    return (
      <Card className="mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-och-steel/20 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-och-steel/20 rounded"></div>
            <div className="h-4 bg-och-steel/20 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mb-6">
        <div className="text-och-orange">Error loading coaching data: {error}</div>
      </Card>
    )
  }

  const todayGoal = goals.find(g => !g.completed) || goals[0]

  return (
    <Card className="mb-6">
      <h2 className="text-2xl font-bold text-white mb-4">Today's Coaching</h2>

      {/* Habits */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-och-steel mb-3">Daily Habits</h3>
        <div className="space-y-3">
          {habitTypes.map((type) => {
            const habit = getHabitByType(type)
            if (!habit) return null

            return (
              <div key={habit.id} className="flex items-center justify-between p-3 bg-och-midnight/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={habit.todayStatus === 'completed'}
                    onChange={() => handleToggleHabit(habit.id, habit.todayStatus === 'completed')}
                    className="w-5 h-5 rounded border-och-steel/20 bg-och-midnight text-och-defender focus:ring-och-defender"
                  />
                  <div>
                    <div className="font-medium text-white capitalize">{habit.name}</div>
                    <div className="text-sm text-och-steel">
                      Streak: {habit.streakData?.current || 0} days
                    </div>
                  </div>
                </div>
                {(habit.streakData?.current || 0) > 0 && (
                  <Badge variant="mint">{habit.streakData?.current || 0} days</Badge>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Today's Goal */}
      {todayGoal && (
        <div className="mb-6 p-4 bg-och-defender/10 border border-och-defender/20 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{todayGoal.title}</h3>
              <p className="text-sm text-och-steel">{todayGoal.description}</p>
            </div>
            <Badge variant={todayGoal.priority === 'high' ? 'orange' : 'defender'}>
              {todayGoal.priority}
            </Badge>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="defender"
              size="sm"
              onClick={() => handleCompleteGoal(todayGoal.id)}
              disabled={todayGoal.completed}
            >
              {todayGoal.completed ? 'Completed' : 'Mark Complete'}
            </Button>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>
      )}

      {/* Reflection */}
      <div>
        <h3 className="text-lg font-semibold text-och-steel mb-3">Daily Reflection</h3>
        {latestReflection && (
          <div className="mb-3 p-3 bg-och-midnight/50 rounded-lg">
            <p className="text-sm text-och-steel mb-1">Last reflection:</p>
            <p className="text-white text-sm">{latestReflection.content}</p>
            <p className="text-xs text-och-steel mt-2">
              {new Date(latestReflection.created_at).toLocaleDateString()}
            </p>
          </div>
        )}
        <form onSubmit={handleSubmitReflection}>
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="Share your thoughts on today's learning..."
            className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender min-h-[100px] mb-3"
            disabled={submitting}
          />
          <Button
            type="submit"
            variant="defender"
            disabled={!reflectionText.trim() || submitting}
            className="w-full"
          >
            {submitting ? 'Submitting...' : 'Submit Reflection'}
          </Button>
        </form>
      </div>
    </Card>
  )
}
