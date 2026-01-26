'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useCohorts, useProgramRules } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'
import Link from 'next/link'

export default function GraduationClient() {
  const { cohorts } = useCohorts()
  const [selectedCohortId, setSelectedCohortId] = useState<string>('')
  const [selectedRuleId, setSelectedRuleId] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  // Get rules for the selected cohort's program
  const selectedCohort = cohorts?.find(c => c.id === selectedCohortId)
  const { rules } = useProgramRules(selectedCohort?.track ? undefined : undefined)

  const handleAutoGraduate = async () => {
    if (!selectedCohortId) return

    setProcessing(true)
    setResult(null)
    try {
      const result = await programsClient.autoGraduateCohort(
        selectedCohortId,
        selectedRuleId || undefined
      )
      setResult(result)
    } catch (err: any) {
      setResult({ error: err.message || 'Auto-graduation failed' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-orange">Auto-Graduation</h1>
            <p className="text-och-steel">
              Evaluate and auto-graduate students based on completion rules.
            </p>
          </div>
          <Link href="/dashboard/director">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <Card className="mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Select Cohort *</label>
              <select
                value={selectedCohortId}
                onChange={(e) => setSelectedCohortId(e.target.value)}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white"
              >
                <option value="">Select a cohort</option>
                {cohorts?.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name} {cohort.track_name && `(${cohort.track_name})`}
                  </option>
                ))}
              </select>
            </div>

            {selectedCohortId && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Select Rule (Optional - uses active rule if not specified)
                </label>
                <select
                  value={selectedRuleId}
                  onChange={(e) => setSelectedRuleId(e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white"
                >
                  <option value="">Use Active Rule</option>
                  {rules?.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.program_name} v{rule.version}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              variant="orange"
              onClick={handleAutoGraduate}
              disabled={!selectedCohortId || processing}
            >
              {processing ? 'Processing...' : 'Run Auto-Graduation'}
            </Button>
          </div>
        </Card>

        {result && (
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Results</h2>
            {result.error ? (
              <div className="p-4 bg-och-orange/20 border border-och-orange rounded-lg text-och-orange">
                {result.error}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Completed</p>
                    <p className="text-2xl font-bold text-white">{result.completed || 0}</p>
                  </div>
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Incomplete</p>
                    <p className="text-2xl font-bold text-white">{result.incomplete || 0}</p>
                  </div>
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Certificates Generated</p>
                    <p className="text-2xl font-bold text-white">
                      {result.certificates_generated || 0}
                    </p>
                  </div>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="p-4 bg-och-orange/20 border border-och-orange rounded-lg">
                    <p className="text-och-orange font-semibold mb-2">Errors:</p>
                    <ul className="list-disc list-inside text-och-orange text-sm">
                      {result.errors.map((error: string, idx: number) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}












