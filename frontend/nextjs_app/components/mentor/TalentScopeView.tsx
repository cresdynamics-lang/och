'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { useMentorMentees } from '@/hooks/useMentorMentees'
import type { AssignedMentee } from '@/services/types/mentor'

export function TalentScopeView() {
  const { user } = useAuth()
  const router = useRouter()
  const mentorId = user?.id?.toString()
  const { mentees } = useMentorMentees(mentorId)
  const [selectedCohort, setSelectedCohort] = useState<string>('all')

  // Group mentees by cohort
  const menteesByCohort = useMemo(() => {
    const grouped: Record<string, AssignedMentee[]> = {}
    mentees.forEach((mentee) => {
      const cohort = mentee.cohort || 'Unassigned'
      if (!grouped[cohort]) {
        grouped[cohort] = []
      }
      grouped[cohort].push(mentee)
    })
    return grouped
  }, [mentees])

  // Get unique cohorts
  const cohorts = useMemo(() => {
    return ['all', ...Object.keys(menteesByCohort).sort()]
  }, [menteesByCohort])

  // Filter mentees by selected cohort
  const filteredMentees = useMemo(() => {
    if (selectedCohort === 'all') {
      return mentees
    }
    return menteesByCohort[selectedCohort] || []
  }, [selectedCohort, mentees, menteesByCohort])

  const handleMenteeClick = (menteeId: string) => {
    router.push(`/dashboard/mentor/analytics/${menteeId}`)
  }

  if (!mentorId) return null

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">TalentScope Mentor View</h2>
        <p className="text-sm text-och-steel">
          Select a cohort and click on a mentee to view their detailed analytics.
        </p>
      </div>

      {/* Cohort Filter */}
      {cohorts.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-white mb-2">Filter by Cohort</label>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            {cohorts.map((cohort) => (
              <option key={cohort} value={cohort}>
                {cohort === 'all' ? 'All Cohorts' : cohort}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Mentees Grid by Cohort */}
      {filteredMentees.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            {selectedCohort === 'all' ? 'All Mentees' : `Cohort: ${selectedCohort}`} ({filteredMentees.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMentees.map((mentee) => (
                <div
                  key={mentee.id}
                  onClick={() => handleMenteeClick(mentee.id)}
                  className="p-4 rounded-lg border cursor-pointer transition-all hover:border-och-mint/50 bg-och-midnight/50 border-och-steel/20 hover:bg-och-midnight"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white mb-1">{mentee.name}</h4>
                      {mentee.cohort && (
                        <p className="text-xs text-och-steel mb-1">Cohort: {mentee.cohort}</p>
                      )}
                      {mentee.track && (
                        <p className="text-xs text-och-steel">Track: {mentee.track}</p>
                      )}
                    </div>
                    {mentee.avatar_url && (
                      <img
                        src={mentee.avatar_url}
                        alt={mentee.name}
                        className="w-10 h-10 rounded-full border border-och-steel/20"
                      />
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-och-steel/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-och-steel">Readiness Score</span>
                      <span className="text-sm font-bold text-white">{mentee.readiness_score.toFixed(1)}%</span>
                </div>
                    <div className="w-full h-2 bg-och-midnight rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          mentee.readiness_score >= 80 ? 'bg-och-mint' :
                          mentee.readiness_score >= 60 ? 'bg-och-defender' :
                          mentee.readiness_score >= 40 ? 'bg-och-gold' : 'bg-och-orange'
                        }`}
                        style={{ width: `${mentee.readiness_score}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className={`px-2 py-0.5 rounded ${
                        mentee.risk_level === 'low' ? 'bg-och-mint/20 text-och-mint' :
                        mentee.risk_level === 'medium' ? 'bg-och-gold/20 text-och-gold' :
                        'bg-och-orange/20 text-och-orange'
                      }`}>
                        {mentee.risk_level} risk
                      </span>
                      {mentee.missions_completed !== undefined && (
                        <span className="text-och-steel">{mentee.missions_completed} missions</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-och-mint text-center">
                    Click to view detailed analytics →
                  </div>
                </div>
              ))}
            </div>
          </div>
      )}

      {filteredMentees.length === 0 && mentees.length > 0 && (
        <div className="text-och-steel text-sm py-4">
          No mentees found in the selected cohort.
        </div>
      )}

      {mentees.length === 0 && (
        <div className="text-och-steel text-sm py-4">
          No mentees assigned yet.
        </div>
      )}
    </Card>
  )
}



