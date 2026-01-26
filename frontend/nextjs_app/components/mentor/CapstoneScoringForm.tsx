'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { mentorClient } from '@/services/mentorClient'
import type { CapstoneProject } from '@/services/types/mentor'

interface CapstoneScoringFormProps {
  capstone: CapstoneProject
  onScoringComplete: () => void
}

export function CapstoneScoringForm({ capstone, onScoringComplete }: CapstoneScoringFormProps) {
  const [overallScore, setOverallScore] = useState(0)
  const [scoreBreakdown, setScoreBreakdown] = useState({
    technical_quality: 0,
    problem_solving: 0,
    documentation: 0,
    presentation: 0,
    innovation: 0,
  })
  const [feedback, setFeedback] = useState('')
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [newRecommendation, setNewRecommendation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addRecommendation = () => {
    if (!newRecommendation.trim() || recommendations.includes(newRecommendation)) return
    setRecommendations([...recommendations, newRecommendation])
    setNewRecommendation('')
  }

  const removeRecommendation = (rec: string) => {
    setRecommendations(recommendations.filter(r => r !== rec))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      await mentorClient.scoreCapstone(capstone.id, {
        overall_score: overallScore,
        score_breakdown: scoreBreakdown,
        feedback,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
      })
      onScoringComplete()
    } catch (err: any) {
      setError(err.message || 'Failed to submit score')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Capstone Scoring: {capstone.title}</h2>
        <p className="text-sm text-och-steel">
          Mentee: {capstone.mentee_name}
        </p>
        <p className="text-xs text-och-steel">
          Submitted: {new Date(capstone.submitted_at).toLocaleString()}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-och-orange/25 border border-och-orange text-white rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Project Links */}
      <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Project Links</h3>
        {capstone.project_url && (
          <div className="mb-2">
            <a href={capstone.project_url} target="_blank" rel="noopener noreferrer" className="text-och-mint hover:underline text-sm">
              Project URL: {capstone.project_url}
            </a>
          </div>
        )}
        {capstone.repository_url && (
          <div className="mb-2">
            <a href={capstone.repository_url} target="_blank" rel="noopener noreferrer" className="text-och-mint hover:underline text-sm">
              Repository: {capstone.repository_url}
            </a>
          </div>
        )}
        {capstone.documentation_url && (
          <div>
            <a href={capstone.documentation_url} target="_blank" rel="noopener noreferrer" className="text-och-mint hover:underline text-sm">
              Documentation: {capstone.documentation_url}
            </a>
          </div>
        )}
        <div className="mt-3">
          <p className="text-sm text-och-steel">{capstone.description}</p>
        </div>
      </div>

      {/* Overall Score */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">Overall Score (0-100)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={overallScore}
          onChange={(e) => setOverallScore(parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
        />
      </div>

      {/* Score Breakdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-3">Score Breakdown (0-100 each)</label>
        <div className="space-y-3">
          {Object.entries(scoreBreakdown).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs text-och-steel mb-1 capitalize">{key.replace('_', ' ')}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={value}
                onChange={(e) => setScoreBreakdown({ ...scoreBreakdown, [key]: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">Feedback</label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
          placeholder="Provide detailed feedback on the capstone project..."
        />
      </div>

      {/* Recommendations */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">Recommendations</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newRecommendation}
            onChange={(e) => setNewRecommendation(e.target.value)}
            placeholder="Add a recommendation..."
            className="flex-1 px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
            onKeyPress={(e) => e.key === 'Enter' && addRecommendation()}
          />
          <Button variant="outline" size="sm" onClick={addRecommendation}>Add</Button>
        </div>
        <div className="space-y-1">
          {recommendations.map((rec) => (
            <div key={rec} className="p-2 bg-och-midnight/50 rounded flex justify-between items-center">
              <span className="text-sm text-white">{rec}</span>
              <Button variant="outline" size="sm" onClick={() => removeRecommendation(rec)}>Remove</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onScoringComplete}>Cancel</Button>
        <Button variant="defender" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Score'}
        </Button>
      </div>
    </Card>
  )
}


