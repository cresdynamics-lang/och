'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'

interface Program {
  id: string
  name: string
  category: string
}

interface ProgramRule {
  id: string
  program: string
  rule: {
    name: string
    criteria: any
    thresholds: any
    dependencies: string[]
  }
  version: number
  active: boolean
  created_at: string
}

interface RuleTemplate {
  name: string
  criteria: any
  thresholds: any
  dependencies: string[]
}

export default function ProgramRulesClient() {
  const { user } = useAuth()
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [rules, setRules] = useState<ProgramRule[]>([])
  const [templates, setTemplates] = useState<Record<string, RuleTemplate>>({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [customRule, setCustomRule] = useState({
    name: '',
    criteria: {
      attendance_percent: 80,
      portfolio_approved: true,
      feedback_score: 4.0,
      payment_complete: true
    },
    thresholds: {
      min_portfolio_score: 70,
      max_absences: 3
    },
    dependencies: [] as string[]
  })
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState<any>(null)

  useEffect(() => {
    loadPrograms()
    loadTemplates()
  }, [])

  useEffect(() => {
    if (selectedProgram) {
      loadProgramRules(selectedProgram)
    }
  }, [selectedProgram])

  const loadPrograms = async () => {
    try {
      const response = await fetch('/api/v1/director/programs/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.results || data)
      }
    } catch (error) {
      console.error('Error loading programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/v1/director/rules/templates/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const loadProgramRules = async (programId: string) => {
    try {
      const response = await fetch(`/api/v1/director/rules/?program_id=${programId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRules(data.results || data)
      }
    } catch (error) {
      console.error('Error loading rules:', error)
    }
  }

  const createRule = async () => {
    if (!selectedProgram) return

    try {
      const ruleData = selectedTemplate && templates[selectedTemplate] 
        ? templates[selectedTemplate] 
        : customRule

      const response = await fetch('/api/v1/director/rules/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          program_id: selectedProgram,
          rule: ruleData
        })
      })

      if (response.ok) {
        await loadProgramRules(selectedProgram)
        setShowCreateForm(false)
        setSelectedTemplate('')
        setCustomRule({
          name: '',
          criteria: {
            attendance_percent: 80,
            portfolio_approved: true,
            feedback_score: 4.0,
            payment_complete: true
          },
          thresholds: {
            min_portfolio_score: 70,
            max_absences: 3
          },
          dependencies: []
        })
      } else {
        const error = await response.json()
        console.error('Failed to create rule:', error)
      }
    } catch (error) {
      console.error('Error creating rule:', error)
    }
  }

  const testRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/v1/director/rules/${ruleId}/test_rule/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTestResults(data)
      } else {
        const error = await response.json()
        console.error('Failed to test rule:', error)
      }
    } catch (error) {
      console.error('Error testing rule:', error)
    }
  }

  const applyRule = async (ruleId: string) => {
    if (!confirm('This will generate certificates for all eligible enrollments. Continue?')) return

    try {
      const response = await fetch(`/api/v1/director/rules/${ruleId}/apply_rule/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Generated ${data.certificates.length} certificates`)
      } else {
        const error = await response.json()
        console.error('Failed to apply rule:', error)
      }
    } catch (error) {
      console.error('Error applying rule:', error)
    }
  }

  const addDependency = () => {
    const dependency = prompt('Enter dependency name:')
    if (dependency) {
      setCustomRule(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, dependency]
      }))
    }
  }

  const removeDependency = (index: number) => {
    setCustomRule(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
          <p className="text-och-steel">Loading program rules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Program Rules Management</h1>
        <p className="text-och-steel">Define graduation criteria and completion logic for programs</p>
      </div>

      {/* Program Selection */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">
                Select Program
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
              >
                <option value="">Choose a program...</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name} ({program.category})
                  </option>
                ))}
              </select>
            </div>
            
            {selectedProgram && (
              <Button
                variant="defender"
                onClick={() => setShowCreateForm(true)}
              >
                + Create Rule
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Create Rule Form */}
      {showCreateForm && (
        <Card className="mb-6 border-och-defender/50">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Create New Rule</h2>
            
            {/* Template Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-och-steel mb-2">
                Use Template (Optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
              >
                <option value="">Custom Rule</option>
                {Object.entries(templates).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {!selectedTemplate && (
              <div className="space-y-6">
                {/* Rule Name */}
                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={customRule.name}
                    onChange={(e) => setCustomRule(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                    placeholder="e.g., Technical Program Graduation"
                  />
                </div>

                {/* Criteria */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Completion Criteria</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">
                        Minimum Attendance %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customRule.criteria.attendance_percent}
                        onChange={(e) => setCustomRule(prev => ({
                          ...prev,
                          criteria: { ...prev.criteria, attendance_percent: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">
                        Minimum Feedback Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={customRule.criteria.feedback_score}
                        onChange={(e) => setCustomRule(prev => ({
                          ...prev,
                          criteria: { ...prev.criteria, feedback_score: parseFloat(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customRule.criteria.portfolio_approved}
                        onChange={(e) => setCustomRule(prev => ({
                          ...prev,
                          criteria: { ...prev.criteria, portfolio_approved: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-white">Portfolio must be approved</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customRule.criteria.payment_complete}
                        onChange={(e) => setCustomRule(prev => ({
                          ...prev,
                          criteria: { ...prev.criteria, payment_complete: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-white">Payment must be complete</span>
                    </label>
                  </div>
                </div>

                {/* Thresholds */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Thresholds</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">
                        Min Portfolio Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customRule.thresholds.min_portfolio_score}
                        onChange={(e) => setCustomRule(prev => ({
                          ...prev,
                          thresholds: { ...prev.thresholds, min_portfolio_score: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">
                        Max Absences
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={customRule.thresholds.max_absences}
                        onChange={(e) => setCustomRule(prev => ({
                          ...prev,
                          thresholds: { ...prev.thresholds, max_absences: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Dependencies */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-white">Dependencies</h3>
                    <Button variant="outline" size="sm" onClick={addDependency}>
                      + Add Dependency
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {customRule.dependencies.map((dep, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="flex-1 px-3 py-2 bg-och-midnight/50 rounded-lg text-white">
                          {dep}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDependency(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Template Preview */}
            {selectedTemplate && templates[selectedTemplate] && (
              <div className="bg-och-midnight/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Template Preview</h3>
                <pre className="text-sm text-och-steel overflow-auto">
                  {JSON.stringify(templates[selectedTemplate], null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setSelectedTemplate('')
                }}
              >
                Cancel
              </Button>
              <Button variant="defender" onClick={createRule}>
                Create Rule
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Existing Rules */}
      {selectedProgram && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Program Rules</h2>
            
            {rules.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-och-steel">No rules defined for this program</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-lg border ${
                      rule.active 
                        ? 'border-och-defender/50 bg-och-defender/10' 
                        : 'border-och-steel/20 bg-och-midnight/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{rule.rule.name}</h3>
                        <p className="text-sm text-och-steel">Version {rule.version}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {rule.active && <Badge variant="defender">Active</Badge>}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testRule(rule.id)}
                        >
                          Test Rule
                        </Button>
                        {rule.active && (
                          <Button
                            variant="mint"
                            size="sm"
                            onClick={() => applyRule(rule.id)}
                          >
                            Apply Rule
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-och-steel">
                      <p><strong>Criteria:</strong> {Object.keys(rule.rule.criteria).length} requirements</p>
                      <p><strong>Dependencies:</strong> {rule.rule.dependencies.length} items</p>
                      <p><strong>Created:</strong> {new Date(rule.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Test Results */}
      {testResults && (
        <Card className="mt-6">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Rule Test Results</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-och-midnight/50 rounded-lg">
                <p className="text-xs text-och-steel">Total Enrollments</p>
                <p className="text-xl font-bold text-white">{testResults.total_enrollments}</p>
              </div>
              <div className="p-3 bg-och-midnight/50 rounded-lg">
                <p className="text-xs text-och-steel">Eligible</p>
                <p className="text-xl font-bold text-och-mint">{testResults.eligible_count}</p>
              </div>
              <div className="p-3 bg-och-midnight/50 rounded-lg">
                <p className="text-xs text-och-steel">Success Rate</p>
                <p className="text-xl font-bold text-white">
                  {((testResults.eligible_count / testResults.total_enrollments) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {testResults.results.map((result: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      result.eligible 
                        ? 'bg-green-500/20 border border-green-500/30' 
                        : 'bg-red-500/20 border border-red-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold">{result.user_email}</p>
                        <p className="text-sm text-och-steel">{result.cohort_name}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={result.eligible ? 'mint' : 'orange'}>
                          {result.eligible ? 'Eligible' : 'Not Eligible'}
                        </Badge>
                        <p className="text-xs text-och-steel mt-1">Score: {result.score}</p>
                      </div>
                    </div>
                    {result.missing_criteria.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-red-400">Missing:</p>
                        <ul className="text-xs text-red-400 ml-4">
                          {result.missing_criteria.map((criteria: string, idx: number) => (
                            <li key={idx}>• {criteria}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}