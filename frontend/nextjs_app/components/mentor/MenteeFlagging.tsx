'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useMenteeFlags } from '@/hooks/useMenteeFlags'
import { useMentorMentees } from '@/hooks/useMentorMentees'
import { useAuth } from '@/hooks/useAuth'
import type { MenteeFlag } from '@/services/types/mentor'

type FlagType = 'struggling' | 'at_risk' | 'needs_attention' | 'technical_issue'
type FlagSeverity = 'low' | 'medium' | 'high' | 'critical'

export function MenteeFlagging() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const { mentees, isLoading: menteesLoading } = useMentorMentees(mentorId)
  const { flags, isLoading, error, flagMentee } = useMenteeFlags(mentorId)
  const [showFlagForm, setShowFlagForm] = useState(false)
  const [formData, setFormData] = useState({
    mentee_id: '',
    flag_type: 'struggling' as FlagType,
    severity: 'medium' as FlagSeverity,
    description: '',
  })
  const [menteeSearchQuery, setMenteeSearchQuery] = useState('')
  const [showMenteeDropdown, setShowMenteeDropdown] = useState(false)
  const menteeDropdownRef = useRef<HTMLDivElement>(null)
  const menteeInputRef = useRef<HTMLInputElement>(null)

  // Filter mentees based on search query
  const filteredMentees = useMemo(() => {
    if (!menteeSearchQuery.trim()) {
      return mentees
    }
    const query = menteeSearchQuery.toLowerCase()
    return mentees.filter((mentee) => {
      const nameMatch = mentee.name.toLowerCase().includes(query)
      const emailMatch = mentee.email.toLowerCase().includes(query)
      const cohortMatch = mentee.cohort?.toLowerCase().includes(query)
      const trackMatch = mentee.track?.toLowerCase().includes(query)
      return nameMatch || emailMatch || cohortMatch || trackMatch
    })
  }, [mentees, menteeSearchQuery])

  // Get selected mentee details
  const selectedMentee = useMemo(() => {
    return mentees.find(m => (m.user_id || m.id) === formData.mentee_id)
  }, [mentees, formData.mentee_id])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menteeDropdownRef.current &&
        !menteeDropdownRef.current.contains(event.target as Node) &&
        menteeInputRef.current &&
        !menteeInputRef.current.contains(event.target as Node)
      ) {
        setShowMenteeDropdown(false)
      }
    }

    if (showMenteeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showMenteeDropdown])

  const handleSubmit = async () => {
    if (!formData.mentee_id || !formData.description.trim()) return
    try {
      await flagMentee(formData)
      setShowFlagForm(false)
      setFormData({
        mentee_id: '',
        flag_type: 'struggling',
        severity: 'medium',
        description: '',
      })
      setMenteeSearchQuery('')
      setShowMenteeDropdown(false)
    } catch (err) {
      // Error handled by hook
    }
  }

  const handleCancel = () => {
    setShowFlagForm(false)
    setFormData({
      mentee_id: '',
      flag_type: 'struggling',
      severity: 'medium',
      description: '',
    })
    setMenteeSearchQuery('')
    setShowMenteeDropdown(false)
  }

  const severityColors: Record<MenteeFlag['severity'], 'mint' | 'gold' | 'orange'> = {
    low: 'mint',
    medium: 'gold',
    high: 'orange',
    critical: 'orange',
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Mentee Flags</h2>
          <p className="text-sm text-och-steel">
            Flag mentees who are struggling or need attention.
          </p>
        </div>
        <Button variant="defender" onClick={() => showFlagForm ? handleCancel() : setShowFlagForm(true)}>
          {showFlagForm ? 'Cancel' : '+ Flag Mentee'}
        </Button>
      </div>

      {showFlagForm && (
        <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg space-y-3">
          {/* Searchable Mentee Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-white mb-2">
              Select Mentee <span className="text-och-steel text-xs">(from your assigned cohorts)</span>
            </label>
            <div className="relative">
              <input
                ref={menteeInputRef}
                type="text"
                value={showMenteeDropdown || !selectedMentee ? menteeSearchQuery : `${selectedMentee.name}${selectedMentee.cohort ? ` (${selectedMentee.cohort})` : ''}`}
                onChange={(e) => {
                  setMenteeSearchQuery(e.target.value)
                  setShowMenteeDropdown(true)
                  if (selectedMentee) {
                    setFormData({ ...formData, mentee_id: '' })
                  }
                }}
                onFocus={() => {
                  setShowMenteeDropdown(true)
                  if (selectedMentee) {
                    setMenteeSearchQuery('')
                    setFormData({ ...formData, mentee_id: '' })
                  }
                }}
                placeholder={menteesLoading ? "Loading mentees..." : selectedMentee ? "Click to change mentee or search..." : "Search mentees by name, email, cohort, or track..."}
                className="w-full px-3 py-2 pr-10 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender placeholder-och-steel"
                disabled={menteesLoading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-och-steel pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Dropdown List */}
            {showMenteeDropdown && !menteesLoading && (
              <div
                ref={menteeDropdownRef}
                className="absolute z-50 w-full mt-1 bg-och-midnight border border-och-steel/20 rounded-lg shadow-lg max-h-60 overflow-auto"
              >
                {filteredMentees.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-och-steel">
                    {menteeSearchQuery ? 'No mentees found matching your search.' : 'No mentees assigned to your cohorts.'}
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredMentees.map((mentee) => (
                      <div
                        key={mentee.id}
                        onClick={() => {
                          setFormData({ ...formData, mentee_id: mentee.user_id || mentee.id })
                          setMenteeSearchQuery('')
                          setShowMenteeDropdown(false)
                        }}
                        className={`px-4 py-2 cursor-pointer hover:bg-och-midnight/80 transition-colors ${
                          formData.mentee_id === (mentee.user_id || mentee.id) ? 'bg-och-defender/20 border-l-2 border-och-defender' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{mentee.name}</div>
                            <div className="text-xs text-och-steel mt-0.5">
                              {mentee.email}
                              {mentee.cohort && ` • ${mentee.cohort}`}
                              {mentee.track && ` • ${mentee.track}`}
                            </div>
                          </div>
                          {mentee.readiness_score !== undefined && (
                            <div className="ml-2 text-xs text-och-mint">
                              {mentee.readiness_score.toFixed(0)}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {menteesLoading && (
              <div className="mt-2 text-xs text-och-steel">Loading mentees from assigned cohorts...</div>
            )}

            {!menteesLoading && mentees.length > 0 && (
              <div className="mt-2 text-xs text-och-steel">
                {filteredMentees.length} mentee{filteredMentees.length !== 1 ? 's' : ''} found
                {menteeSearchQuery && ` matching "${menteeSearchQuery}"`}
              </div>
            )}
          </div>
          <select
            value={formData.flag_type}
            onChange={(e) => setFormData({ ...formData, flag_type: e.target.value as FlagType })}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            <option value="struggling">Struggling</option>
            <option value="at_risk">At Risk</option>
            <option value="needs_attention">Needs Attention</option>
            <option value="technical_issue">Technical Issue</option>
          </select>
          <select
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value as FlagSeverity })}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Describe the issue..."
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          />
          <Button variant="defender" onClick={handleSubmit}>Submit Flag</Button>
        </div>
      )}

      {isLoading && <div className="text-och-steel text-sm">Loading flags...</div>}
      {error && <div className="text-och-orange text-sm">Error: {error}</div>}

      {!isLoading && !error && flags.length === 0 && (
        <div className="text-och-steel text-sm">No flags raised.</div>
      )}

      {!isLoading && !error && flags.length > 0 && (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div key={flag.id} className="p-4 bg-och-midnight/50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">{flag.mentee_name}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={severityColors[flag.severity]} className="text-xs capitalize">
                      {flag.severity}
                    </Badge>
                    {flag.flag_type && (
                      <Badge variant="defender" className="text-xs capitalize">
                        {flag.flag_type.replace('_', ' ')}
                      </Badge>
                    )}
                    <Badge variant="mint" className="text-xs capitalize">
                      {flag.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-xs text-och-steel">
                  {new Date(flag.raised_at).toLocaleString()}
                </div>
              </div>
              <p className="text-sm text-white mt-2">{flag.description}</p>
              {flag.resolution_notes && (
                <div className="mt-3 p-2 bg-och-midnight rounded">
                  <div className="text-xs text-och-steel mb-1">Resolution Notes:</div>
                  <p className="text-sm text-white">{flag.resolution_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}


