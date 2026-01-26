'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { mentorClient } from '@/services/mentorClient'
import type { MissionSubmission } from '@/services/types/mentor'

interface Mission {
  id?: string
  code?: string
  title?: string
  competencies?: string[]
  success_criteria?: any
}

interface MissionReviewPanelProps {
  mentorId: string
  submission: MissionSubmission
  mission: Mission | null
  onReviewComplete: () => void
}

export function MissionReviewPanel({
  mentorId,
  submission,
  mission,
  onReviewComplete,
}: MissionReviewPanelProps) {
  const [overallStatus, setOverallStatus] = useState<'pass' | 'fail' | 'needs_revision'>('pass')
  const [writtenFeedback, setWrittenFeedback] = useState('')
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([])
  const [recommendedRecipes, setRecommendedRecipes] = useState<string[]>([])
  const [scoreBreakdown, setScoreBreakdown] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  const availableCompetencies = mission?.competencies || []

  const toggleCompetency = (comp: string) => {
    setSelectedCompetencies(prev =>
      prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]
    )
  }

  const handleSubmitReview = async () => {
    setSubmitting(true)
    try {
      await mentorClient.submitMissionReview(submission.id, {
        overall_status: overallStatus,
        feedback: {
          written: writtenFeedback,
        },
        technical_competencies: selectedCompetencies,
        score_breakdown: scoreBreakdown,
        recommended_next_missions: recommendedRecipes,
      })
      onReviewComplete()
    } catch (err) {
      console.error('Failed to submit review:', err)
      alert('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Submission Info */}
      <Card className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Submission Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-och-steel mb-1">Student</p>
            <p className="text-white">{(submission as any).mentee_name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-och-steel mb-1">Submitted At</p>
            <p className="text-white">
              {(submission as any).submitted_at
                ? new Date((submission as any).submitted_at).toLocaleString()
                : 'N/A'}
            </p>
          </div>
          {(submission as any).ai_score && (
            <div>
              <p className="text-och-steel mb-1">AI Score</p>
              <p className="text-white">{(submission as any).ai_score}%</p>
            </div>
          )}
        </div>
      </Card>

      {/* Review Form */}
      <Card className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Mission Review</h2>

        {/* Overall Status */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-och-steel mb-2">
            Overall Status *
          </label>
          <div className="flex gap-3">
            {(['pass', 'fail', 'needs_revision'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setOverallStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  overallStatus === status
                    ? status === 'pass'
                      ? 'bg-och-mint text-och-midnight'
                      : status === 'fail'
                      ? 'bg-och-orange text-white'
                      : 'bg-och-gold text-och-midnight'
                    : 'bg-och-midnight/50 text-och-steel hover:text-white'
                }`}
              >
                {status === 'pass' ? '✓ Pass' : status === 'fail' ? '✗ Fail' : '↻ Needs Revision'}
              </button>
            ))}
          </div>
        </div>

        {/* Written Feedback */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-och-steel mb-2">
            Written Feedback *
          </label>
          <textarea
            value={writtenFeedback}
            onChange={(e) => setWrittenFeedback(e.target.value)}
            placeholder="Provide detailed feedback to guide the student's transformation..."
            rows={6}
            className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:border-och-mint focus:outline-none"
            required
          />
        </div>

        {/* Competency Tagging */}
        {availableCompetencies.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-och-steel mb-2">
              Tag Technical Competencies
            </label>
            <p className="text-xs text-och-steel mb-3">
              Select competencies proven or missed by the student. This updates their TalentScope skill profile.
            </p>
            <div className="flex flex-wrap gap-2">
              {availableCompetencies.map((comp) => (
                <button
                  key={comp}
                  onClick={() => toggleCompetency(comp)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedCompetencies.includes(comp)
                      ? 'bg-och-mint text-och-midnight'
                      : 'bg-och-midnight/50 text-och-steel hover:bg-och-midnight hover:text-white'
                  }`}
                >
                  {comp} {selectedCompetencies.includes(comp) && '✓'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Score Breakdown (for rubric-based scoring) */}
        {mission?.success_criteria && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-och-steel mb-2">
              Score Breakdown (Rubric)
            </label>
            <div className="space-y-3">
              {Object.keys(mission.success_criteria).map((criterion) => (
                <div key={criterion} className="flex items-center gap-3">
                  <label className="text-sm text-white flex-1">{criterion}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scoreBreakdown[criterion] || ''}
                    onChange={(e) =>
                      setScoreBreakdown(prev => ({
                        ...prev,
                        [criterion]: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-20 px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm focus:border-och-mint focus:outline-none"
                    placeholder="0-100"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recipe Recommendations */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-och-steel mb-2">
            Recommend Recipes (Optional)
          </label>
          <p className="text-xs text-och-steel mb-3">
            If skill gaps are detected, recommend focused micro-skill units to help the student complete the mission successfully.
          </p>
          <input
            type="text"
            placeholder="Enter recipe IDs or names (comma-separated)"
            className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:border-och-mint focus:outline-none"
            onChange={(e) => setRecommendedRecipes(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubmitReview}
            variant="defender"
            disabled={submitting || !writtenFeedback.trim()}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
          <Button onClick={onReviewComplete} variant="outline">
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  )
}

