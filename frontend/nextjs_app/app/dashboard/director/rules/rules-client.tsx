'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useProgramRules, usePrograms, useCreateProgramRule } from '@/hooks/usePrograms'
import Link from 'next/link'

export default function RulesClient() {
  const { programs } = usePrograms()
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const { rules, isLoading, reload } = useProgramRules(selectedProgramId || undefined)
  const { createRule, isLoading: creating } = useCreateProgramRule()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    program: '',
    attendance_percent: 80,
    portfolio_approved: true,
    feedback_score: 4.0,
    payment_complete: true,
  })

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRule({
        program: formData.program,
        rule: {
          criteria: {
            attendance_percent: formData.attendance_percent,
            portfolio_approved: formData.portfolio_approved,
            feedback_score: formData.feedback_score,
            payment_complete: formData.payment_complete,
          },
          thresholds: {},
          dependencies: [],
        },
        active: true,
      })
      setShowCreateForm(false)
      reload()
    } catch (err) {
      console.error('Failed to create rule:', err)
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-orange">Completion Rules</h1>
            <p className="text-och-steel">Define program success metrics and auto-graduation logic.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard/director">
              <Button variant="outline">Back</Button>
            </Link>
            <Button variant="orange" onClick={() => setShowCreateForm(true)}>
              Create Rule
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <Card className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-white">Create Completion Rule</h2>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Program *</label>
                <select
                  required
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white"
                >
                  <option value="">Select program</option>
                  {programs?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Attendance % *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formData.attendance_percent}
                    onChange={(e) => setFormData({ ...formData, attendance_percent: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Feedback Score *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.feedback_score}
                    onChange={(e) => setFormData({ ...formData, feedback_score: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.portfolio_approved}
                    onChange={(e) => setFormData({ ...formData, portfolio_approved: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Portfolio Approval Required</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.payment_complete}
                    onChange={(e) => setFormData({ ...formData, payment_complete: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Payment Complete Required</span>
                </label>
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="orange" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Rule'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-white mb-2">Filter by Program</label>
          <select
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            className="px-4 py-2 bg-och-midnight/50 border border-och-defender rounded-lg text-white"
          >
            <option value="">All Programs</option>
            {programs?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <Card>
              <p className="text-och-steel">Loading rules...</p>
            </Card>
          ) : rules && rules.length > 0 ? (
            rules.map((rule) => (
              <Card key={rule.id}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {rule.program_name || 'Program Rule'} v{rule.version}
                    </h3>
                    <Badge variant={rule.active ? 'mint' : 'defender'}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {rule.rule.criteria.attendance_percent !== undefined && (
                      <div>
                        <span className="text-och-steel">Attendance:</span>{' '}
                        <span className="text-white">{rule.rule.criteria.attendance_percent}%</span>
                      </div>
                    )}
                    {rule.rule.criteria.feedback_score !== undefined && (
                      <div>
                        <span className="text-och-steel">Feedback Score:</span>{' '}
                        <span className="text-white">{rule.rule.criteria.feedback_score}</span>
                      </div>
                    )}
                    {rule.rule.criteria.portfolio_approved !== undefined && (
                      <div>
                        <span className="text-och-steel">Portfolio:</span>{' '}
                        <span className="text-white">
                          {rule.rule.criteria.portfolio_approved ? 'Required' : 'Not Required'}
                        </span>
                      </div>
                    )}
                    {rule.rule.criteria.payment_complete !== undefined && (
                      <div>
                        <span className="text-och-steel">Payment:</span>{' '}
                        <span className="text-white">
                          {rule.rule.criteria.payment_complete ? 'Required' : 'Not Required'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-och-steel">No rules found. Create one to get started.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

