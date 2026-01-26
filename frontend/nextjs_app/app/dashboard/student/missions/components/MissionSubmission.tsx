/**
 * Mission Submission Component
 * Complete submission with reflection
 */
'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { apiGateway } from '@/services/apiGateway'
import { useMissionStore } from '../lib/store/missionStore'

interface MissionSubmissionProps {
  progressId: string
  missionId: string
}

export function MissionSubmission({ progressId, missionId }: MissionSubmissionProps) {
  const router = useRouter()
  const { currentProgress, subtasksProgress } = useMissionStore()
  const [reflection, setReflection] = useState('')
  const [finalEvidenceBundle, setFinalEvidenceBundle] = useState<string[]>([])

  // Collect all evidence from all subtasks
  const allEvidence = Object.values(subtasksProgress).flatMap((p) => p.evidence || [])

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await apiGateway.post(
        `/mission-progress/${progressId}/submit`,
        {
          reflection,
          final_evidence_bundle: allEvidence,
        }
      )
      return response
    },
  })

  useEffect(() => {
    if (submitMutation.isSuccess) {
      router.push(`/dashboard/student/missions/${missionId}/review`)
    }
  }, [submitMutation.isSuccess, router, missionId])

  const handleSubmit = () => {
    if (!reflection.trim()) {
      alert('Please provide a reflection before submitting')
      return
    }
    submitMutation.mutate()
  }

  return (
    <Card className="glass-card p-6">
      <h2 className="text-xl font-bold text-white mb-4">Submit Mission</h2>

      {/* Evidence Summary */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-och-steel mb-2">Evidence Files</h3>
        <div className="space-y-2">
          {allEvidence.length > 0 ? (
            allEvidence.map((url, idx) => (
              <div key={idx} className="text-sm text-och-steel flex items-center gap-2">
                <span>📎</span>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-och-mint hover:underline">
                  Evidence {idx + 1}
                </a>
              </div>
            ))
          ) : (
            <p className="text-sm text-och-steel">No evidence files uploaded</p>
          )}
        </div>
      </div>

      {/* Reflection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-och-steel mb-2">
          Reflection <span className="text-och-error">*</span>
        </label>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={8}
          className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel focus:border-och-mint focus:outline-none"
          placeholder="Reflect on your mission experience. What did you learn? What challenges did you face? How would you approach this differently next time?"
          required
        />
        <p className="text-xs text-och-steel mt-2">
          {reflection.length} characters (minimum 100 recommended)
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-och-steel">
          Once submitted, your mission will be reviewed by AI. Premium users can request mentor review.
        </p>
        <Button
          variant="defender"
          size="lg"
          onClick={handleSubmit}
          disabled={submitMutation.isPending || !reflection.trim()}
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit for Review'}
        </Button>
      </div>
    </Card>
  )
}

