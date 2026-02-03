'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'

interface Mentor {
  id: string
  name: string
  email: string
  specialties: string[]
  capacity_weekly: number
  active_assignments: number
  availability: any
}

interface MentorSuggestion extends Mentor {
  mentor_id: string
  match_score: number
  current_load: number
  capacity: number
}

interface MentorAssignment {
  id: string
  mentor: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  role: string
  assigned_at: string
  active: boolean
}

interface Cohort {
  id: string
  name: string
  track: {
    name: string
    key: string
    program: {
      name: string
    }
  }
  seat_cap: number
  status: string
}

export default function MentorAssignmentClient() {
  const { user } = useAuth()
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [selectedCohort, setSelectedCohort] = useState<string>('')
  const [currentAssignments, setCurrentAssignments] = useState<MentorAssignment[]>([])
  const [availableMentors, setAvailableMentors] = useState<Mentor[]>([])
  const [suggestions, setSuggestions] = useState<MentorSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)

  useEffect(() => {
    loadCohorts()
    loadAvailableMentors()
  }, [])

  useEffect(() => {
    if (selectedCohort) {
      loadCohortMentors(selectedCohort)
      loadMentorSuggestions(selectedCohort)
    }
  }, [selectedCohort])

  const loadCohorts = async () => {
    try {
      const response = await fetch('/api/v1/director/cohorts-management/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCohorts(data.results || data)
      }
    } catch (error) {
      console.error('Error loading cohorts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableMentors = async () => {
    try {
      const response = await fetch('/api/v1/director/mentors/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAvailableMentors(data)
      }
    } catch (error) {
      console.error('Error loading mentors:', error)
    }
  }

  const loadCohortMentors = async (cohortId: string) => {
    try {
      const response = await fetch(`/api/v1/director/cohorts-management/${cohortId}/mentors/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentAssignments(data)
      }
    } catch (error) {
      console.error('Error loading cohort mentors:', error)
    }
  }

  const loadMentorSuggestions = async (cohortId: string) => {
    try {
      const response = await fetch(`/api/v1/director/mentors/suggestions/?cohort_id=${cohortId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
      }
    } catch (error) {
      console.error('Error loading mentor suggestions:', error)
    }
  }

  const assignMentor = async (mentorId: string, role: string = 'support') => {
    if (!selectedCohort) return
    
    setAssigning(mentorId)
    try {
      const response = await fetch(`/api/v1/director/cohorts-management/${selectedCohort}/assign_mentor/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          mentor_id: mentorId,
          role
        })
      })

      if (response.ok) {
        // Reload assignments and suggestions
        loadCohortMentors(selectedCohort)
        loadMentorSuggestions(selectedCohort)
      } else {
        const error = await response.json()
        console.error('Failed to assign mentor:', error)
      }
    } catch (error) {
      console.error('Error assigning mentor:', error)
    } finally {
      setAssigning(null)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'primary': return 'defender'
      case 'support': return 'mint'
      case 'guest': return 'orange'
      default: return 'steel'
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'mint'
    if (score >= 60) return 'defender'
    if (score >= 40) return 'orange'
    return 'steel'
  }

  const getCapacityStatus = (current: number, total: number) => {
    const percentage = (current / total) * 100
    if (percentage >= 90) return { color: 'red', label: 'Over Capacity' }
    if (percentage >= 70) return { color: 'orange', label: 'High Load' }
    if (percentage >= 50) return { color: 'yellow', label: 'Moderate Load' }
    return { color: 'green', label: 'Available' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
          <p className="text-och-steel">Loading mentor data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mentor Assignment</h1>
        <p className="text-och-steel">Assign mentors to cohorts and manage mentorship relationships</p>
      </div>

      {/* Cohort Selection */}
      <Card className="mb-6">
        <div className="p-6">
          <label className="block text-sm font-medium text-och-steel mb-2">
            Select Cohort
          </label>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="w-full md:w-auto px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
          >
            <option value="">Choose a cohort...</option>
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name} - {cohort.track.program.name} ({cohort.track.name})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {selectedCohort && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Assignments */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Current Mentors</h2>
              
              {currentAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👥</div>
                  <p className="text-och-steel">No mentors assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-white">
                            {assignment.mentor.first_name} {assignment.mentor.last_name}
                          </h3>
                          <p className="text-sm text-och-steel">{assignment.mentor.email}</p>
                          <p className="text-xs text-och-steel mt-1">
                            Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={getRoleColor(assignment.role) as any}>
                          {assignment.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Mentor Suggestions */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Suggested Mentors</h2>
              
              {suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-och-steel">No mentor suggestions available</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {suggestions.map((suggestion) => {
                    const capacityStatus = getCapacityStatus(suggestion.current_load, suggestion.capacity)
                    
                    return (
                      <div
                        key={suggestion.mentor_id}
                        className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{suggestion.name}</h3>
                            <p className="text-sm text-och-steel">{suggestion.email}</p>
                            
                            <div className="flex flex-wrap gap-1 mt-2">
                              {suggestion.specialties.slice(0, 3).map((specialty, idx) => (
                                <Badge key={idx} variant="steel" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <Badge variant={getMatchScoreColor(suggestion.match_score) as any}>
                              {suggestion.match_score}% match
                            </Badge>
                            <p className="text-xs text-och-steel mt-1">
                              Load: {suggestion.current_load}/{suggestion.capacity}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-xs">
                            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                              capacityStatus.color === 'green' ? 'bg-green-500' :
                              capacityStatus.color === 'yellow' ? 'bg-yellow-500' :
                              capacityStatus.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                            }`}></span>
                            <span className="text-och-steel">{capacityStatus.label}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => assignMentor(suggestion.mentor_id, 'support')}
                              disabled={assigning === suggestion.mentor_id}
                            >
                              {assigning === suggestion.mentor_id ? 'Assigning...' : 'Support'}
                            </Button>
                            <Button
                              size="sm"
                              variant="defender"
                              onClick={() => assignMentor(suggestion.mentor_id, 'primary')}
                              disabled={assigning === suggestion.mentor_id}
                            >
                              {assigning === suggestion.mentor_id ? 'Assigning...' : 'Primary'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* All Available Mentors */}
      {selectedCohort && (
        <Card className="mt-6">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">All Available Mentors</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableMentors.map((mentor) => {
                const capacityStatus = getCapacityStatus(mentor.active_assignments, mentor.capacity_weekly)
                const isAssigned = currentAssignments.some(a => a.mentor.id === mentor.id)
                
                return (
                  <div
                    key={mentor.id}
                    className={`p-4 rounded-lg border ${
                      isAssigned 
                        ? 'border-och-defender/50 bg-och-defender/10' 
                        : 'border-och-steel/20 bg-och-midnight/50'
                    }`}
                  >
                    <div className="mb-3">
                      <h3 className="font-semibold text-white">{mentor.name}</h3>
                      <p className="text-sm text-och-steel">{mentor.email}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mentor.specialties.slice(0, 2).map((specialty, idx) => (
                          <Badge key={idx} variant="steel" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-och-steel">
                        {mentor.active_assignments}/{mentor.capacity_weekly} capacity
                      </span>
                      
                      {isAssigned ? (
                        <Badge variant="defender">Assigned</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => assignMentor(mentor.id, 'support')}
                          disabled={assigning === mentor.id}
                        >
                          {assigning === mentor.id ? 'Assigning...' : 'Assign'}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}