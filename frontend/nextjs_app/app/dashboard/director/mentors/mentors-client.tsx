'use client'

import { useState, useEffect, useMemo } from 'react'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useCohorts, useTracks, usePrograms } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'
import Link from 'next/link'

interface Mentor {
  id: string | number
  email: string
  name?: string
  first_name?: string
  last_name?: string
  username?: string
  active_assignments?: number
  total_mentees?: number
  max_capacity?: number
  capacity_utilization?: number
  session_completion_rate?: number
  feedback_average?: number
  impact_score?: number
  flags?: string[]
  cohorts?: Array<{ id: string; name: string }>
  skills?: string[]
  availability?: string
  is_mentor?: boolean
  mentor_capacity_weekly?: number
  mentor_availability?: any
  mentor_specialties?: string[]
  roles?: Array<{ id: number; role: string; role_id: number; scope: string; scope_ref?: string }>
  account_status?: string
  is_active?: boolean
}

interface MentorAnalytics {
  mentor_id: string
  mentor_name: string
  metrics: {
    total_mentees: number
    active_cohorts: number
    session_completion_rate: number
    feedback_average: number
    mentee_completion_rate: number
    impact_score: number
    sessions_scheduled: number
    sessions_completed: number
    sessions_missed: number
    average_session_rating: number
    mentee_satisfaction_score: number
  }
  assignments: Array<{
    id: string
    cohort_id: string
    cohort_name: string
    role: string
    mentees_count: number
    start_date: string
    end_date?: string
  }>
  cohorts: Array<{ id: string; name: string }>
  reviews: Array<{
    id: string
    cohort_id: string
    cohort_name: string
    rating: number
    feedback: string
    reviewed_at: string
  }>
  mentee_goals: Array<{
    mentee_id: string
    mentee_name: string
    goal_id: string
    goal_title: string
    status: string
    progress: number
  }>
}

interface MentorshipCycle {
  duration_weeks: number
  frequency: 'weekly' | 'bi-weekly' | 'monthly'
  milestones: string[]
  goals: string[]
  program_type: 'builders' | 'leaders' | 'custom'
}

export default function MentorsClient() {
  const { cohorts, isLoading: cohortsLoading } = useCohorts()
  const { tracks } = useTracks()
  const { programs } = usePrograms()
  
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<string>('all')
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all')
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('all')

  const ITEMS_PER_PAGE = 20

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to first page on search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  const [assignmentMode, setAssignmentMode] = useState<'list' | 'assign' | 'auto-match' | 'cycle' | 'missions' | 'sessions' | 'goals' | 'rubrics' | 'conflicts' | 'audit'>('list')
  const [selectedCohortId, setSelectedCohortId] = useState<string>('')
  const [selectedTrackId, setSelectedTrackId] = useState<string>('')
  const [selectedMentorId, setSelectedMentorId] = useState<string>('')
  const [assignmentRole, setAssignmentRole] = useState<'primary' | 'support' | 'guest'>('support')
  const [isAssigning, setIsAssigning] = useState(false)

  // Mentorship Cycle Configuration
  const [mentorshipCycle, setMentorshipCycle] = useState<MentorshipCycle>({
    duration_weeks: 12,
    frequency: 'bi-weekly',
    milestones: [],
    goals: [],
    program_type: 'builders',
  })
  const [newMilestone, setNewMilestone] = useState('')
  const [newGoal, setNewGoal] = useState('')

  // Reassignment
  const [reassigningAssignmentId, setReassigningAssignmentId] = useState<string | null>(null)
  const [newMentorId, setNewMentorId] = useState<string>('')

  // Cycle Closure
  const [closingCohortId, setClosingCohortId] = useState<string | null>(null)
  const [closingMentorId, setClosingMentorId] = useState<string | null>(null)

  // Notifications
  const [notificationMode, setNotificationMode] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'reminder' | 'update' | 'announcement'>('reminder')

  // Mission Review Oversight
  const [missionReviews, setMissionReviews] = useState<any[]>([])
  const [selectedMissionReview, setSelectedMissionReview] = useState<any>(null)
  const [premiumTierFilter, setPremiumTierFilter] = useState(true)

  // Session Management
  const [cohortSessions, setCohortSessions] = useState<any[]>([])
  const [selectedCohortForSessions, setSelectedCohortForSessions] = useState<string>('')

  // Goal Tracking
  const [menteeGoals, setMenteeGoals] = useState<any[]>([])
  const [selectedCohortForGoals, setSelectedCohortForGoals] = useState<string>('')

  // Rubric Management
  const [rubrics, setRubrics] = useState<any[]>([])
  const [selectedTrackForRubric, setSelectedTrackForRubric] = useState<string>('')

  // Conflict Resolution
  const [conflicts, setConflicts] = useState<any[]>([])

  // Audit Trail
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditFilters, setAuditFilters] = useState({ start_date: '', end_date: '', action_type: '' })

  // Mentor Analytics
  const [mentorAnalytics, setMentorAnalytics] = useState<MentorAnalytics | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)

  useEffect(() => {
    loadMentors()
  }, [searchQuery])

  useEffect(() => {
    if (assignmentMode === 'missions' && selectedCohortId) {
      loadMissionReviews()
    }
  }, [assignmentMode, selectedCohortId, premiumTierFilter])

  useEffect(() => {
    if (assignmentMode === 'sessions' && selectedCohortForSessions) {
      loadCohortSessions()
    }
  }, [assignmentMode, selectedCohortForSessions])

  useEffect(() => {
    if (assignmentMode === 'goals' && selectedCohortForGoals) {
      loadCohortGoals()
    }
  }, [assignmentMode, selectedCohortForGoals])

  useEffect(() => {
    if (assignmentMode === 'rubrics' && selectedTrackForRubric) {
      loadTrackRubrics()
    }
  }, [assignmentMode, selectedTrackForRubric])

  useEffect(() => {
    if (assignmentMode === 'conflicts') {
      loadConflicts()
    }
  }, [assignmentMode])

  useEffect(() => {
    if (assignmentMode === 'audit') {
      loadAuditLogs()
    }
  }, [assignmentMode, auditFilters])

  const loadMentors = async () => {
    setIsLoading(true)
    try {
      const data = await programsClient.listMentors(searchQuery || undefined)
      // Transform User data to Mentor format
      const mentorsData = data.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        is_mentor: user.is_mentor,
        mentor_capacity_weekly: user.mentor_capacity_weekly || 10,
        mentor_availability: user.mentor_availability || {},
        mentor_specialties: user.mentor_specialties || [],
        roles: user.roles || [],
        account_status: user.account_status,
        is_active: user.is_active,
        // Set default values for analytics fields (will be calculated if available)
        active_assignments: 0,
        total_mentees: 0,
        max_capacity: user.mentor_capacity_weekly || 10,
        capacity_utilization: 0,
        session_completion_rate: 0,
        feedback_average: 0,
        impact_score: 0,
        flags: [],
        cohorts: [],
        skills: user.mentor_specialties || [],
        availability: 'Available',
      }))
      setMentors(mentorsData)
    } catch (err) {
      console.error('Failed to load mentors:', err)
      setMentors([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadMentorAnalytics = async (mentorId: string) => {
    setIsLoadingAnalytics(true)
    try {
      const data = await programsClient.getMentorAnalytics(mentorId)
      setMentorAnalytics(data)
    } catch (err) {
      console.error('Failed to load mentor analytics:', err)
      setMentorAnalytics(null)
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  const loadMissionReviews = async () => {
    try {
      const data = await programsClient.getMissionReviews(selectedCohortId || undefined, premiumTierFilter)
      setMissionReviews(data)
    } catch (err) {
      console.error('Failed to load mission reviews:', err)
      setMissionReviews([])
    }
  }

  const loadCohortSessions = async () => {
    try {
      const data = await programsClient.getCohortSessions(selectedCohortForSessions)
      setCohortSessions(data)
    } catch (err) {
      console.error('Failed to load cohort sessions:', err)
      setCohortSessions([])
    }
  }

  const loadCohortGoals = async () => {
    try {
      const data = await programsClient.getCohortGoals(selectedCohortForGoals)
      setMenteeGoals(data)
    } catch (err) {
      console.error('Failed to load cohort goals:', err)
      setMenteeGoals([])
    }
  }

  const loadTrackRubrics = async () => {
    try {
      const data = await programsClient.getTrackRubrics(selectedTrackForRubric)
      setRubrics(data)
    } catch (err) {
      console.error('Failed to load track rubrics:', err)
      setRubrics([])
    }
  }

  const loadConflicts = async () => {
    try {
      const data = await programsClient.getMentorConflicts()
      setConflicts(data)
    } catch (err) {
      console.error('Failed to load conflicts:', err)
      setConflicts([])
    }
  }

  const loadAuditLogs = async () => {
    try {
      const data = await programsClient.getMentorshipAuditLogs(auditFilters)
      setAuditLogs(data)
    } catch (err) {
      console.error('Failed to load audit logs:', err)
      setAuditLogs([])
    }
  }

  const handleAutoMatch = async () => {
    if (!selectedCohortId) {
      alert('Please select a cohort')
      return
    }
    
    setIsAssigning(true)
    try {
      const result = await programsClient.autoMatchMentors(
        selectedCohortId,
        selectedTrackId || undefined,
        assignmentRole
      )
      alert(`Successfully assigned ${result.assignments.length} mentors`)
      setAssignmentMode('list')
      await loadMentors()
    } catch (err: any) {
      alert(err.message || 'Failed to auto-match mentors')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleManualAssign = async () => {
    if (!selectedCohortId || !selectedMentorId) {
      alert('Please select both cohort and mentor')
      return
    }
    
    setIsAssigning(true)
    try {
      await programsClient.assignMentor(selectedCohortId, {
        mentor: selectedMentorId,
        role: assignmentRole,
      })
      alert('Mentor assigned successfully')
      setAssignmentMode('list')
      await loadMentors()
    } catch (err: any) {
      alert(err.message || 'Failed to assign mentor')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this mentor assignment?')) {
      return
    }
    
    try {
      await programsClient.removeMentorAssignment(assignmentId)
      await loadMentors()
      if (mentorAnalytics && selectedMentorId) {
        await loadMentorAnalytics(selectedMentorId)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove assignment')
    }
  }

  const handleReassign = async () => {
    if (!reassigningAssignmentId || !newMentorId) {
      alert('Please select a new mentor')
      return
    }
    
    try {
      await programsClient.reassignMentor(reassigningAssignmentId, newMentorId)
      alert('Mentor reassigned successfully')
      setReassigningAssignmentId(null)
      setNewMentorId('')
      await loadMentors()
      if (mentorAnalytics && selectedMentorId) {
        await loadMentorAnalytics(selectedMentorId)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reassign mentor')
    }
  }

  const handleApproveCycleClosure = async () => {
    if (!closingCohortId || !closingMentorId) {
      alert('Missing cohort or mentor information')
      return
    }
    
    if (!confirm('Approve closure of this mentorship cycle? This will finalize all feedback and generate a closure report.')) {
      return
    }
    
    try {
      await programsClient.approveCycleClosure(closingCohortId, closingMentorId)
      alert('Cycle closure approved successfully')
      setClosingCohortId(null)
      setClosingMentorId(null)
      await loadMentors()
      if (mentorAnalytics && selectedMentorId) {
        await loadMentorAnalytics(selectedMentorId)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve cycle closure')
    }
  }

  const handleSendNotification = async () => {
    if (!selectedCohortId || !notificationMessage) {
      alert('Please select a cohort and enter a message')
      return
    }
    
    try {
      await programsClient.sendCohortNotification(selectedCohortId, {
        type: notificationType,
        message: notificationMessage,
      })
      alert('Notification sent successfully')
      setNotificationMode(false)
      setNotificationMessage('')
    } catch (err: any) {
      alert(err.message || 'Failed to send notification')
    }
  }

  const addMilestone = () => {
    if (newMilestone.trim()) {
      setMentorshipCycle({
        ...mentorshipCycle,
        milestones: [...mentorshipCycle.milestones, newMilestone.trim()],
      })
      setNewMilestone('')
    }
  }

  const removeMilestone = (index: number) => {
    setMentorshipCycle({
      ...mentorshipCycle,
      milestones: mentorshipCycle.milestones.filter((_, i) => i !== index),
    })
  }

  const addGoal = () => {
    if (newGoal.trim()) {
      setMentorshipCycle({
        ...mentorshipCycle,
        goals: [...mentorshipCycle.goals, newGoal.trim()],
      })
      setNewGoal('')
    }
  }

  const removeGoal = (index: number) => {
    setMentorshipCycle({
      ...mentorshipCycle,
      goals: mentorshipCycle.goals.filter((_, i) => i !== index),
    })
  }

  const filteredMentors = useMemo(() => {
    return mentors.filter(mentor => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const mentorName = mentor.name || `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim() || mentor.email
        return (
          mentorName.toLowerCase().includes(query) ||
          mentor.email.toLowerCase().includes(query) ||
          (mentor.first_name && mentor.first_name.toLowerCase().includes(query)) ||
          (mentor.last_name && mentor.last_name.toLowerCase().includes(query))
        )
      }
      return true
    })
  }, [mentors, searchQuery])

  const mentorsWithFlags = useMemo(() => {
    return filteredMentors.filter(m => m.flags && m.flags.length > 0)
  }, [filteredMentors])

  const selectedCohort = useMemo(() => {
    return cohorts?.find(c => c.id === selectedCohortId)
  }, [cohorts, selectedCohortId])

  return (
    <DirectorLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1 text-white">Mentor Management</h1>
              <p className="text-sm text-och-steel">Orchestrate mentorship programs and track performance</p>
            </div>
            <Link href="/dashboard/director">
              <Button variant="outline" size="sm">← Back to Dashboard</Button>
            </Link>
          </div>

          {/* Main Navigation Dropdown */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="relative">
              <select
                value={assignmentMode}
                onChange={(e) => setAssignmentMode(e.target.value as any)}
                className="appearance-none bg-och-midnight/80 border border-och-steel/30 rounded-lg px-4 py-2.5 pr-10 text-white text-sm font-medium focus:outline-none focus:border-och-defender focus:ring-1 focus:ring-och-defender cursor-pointer transition-all"
              >
                <option value="list" className="bg-och-midnight text-white">📊 All Mentors</option>
                <option value="assign" className="bg-och-midnight text-white">👤 Manual Assignment</option>
                <option value="auto-match" className="bg-och-midnight text-white">🎯 Auto-Match</option>
                <option value="cycle" className="bg-och-midnight text-white">🔄 Mentorship Cycles</option>
                <option value="missions" className="bg-och-midnight text-white">📝 Mission Reviews</option>
                <option value="sessions" className="bg-och-midnight text-white">📅 Session Management</option>
                <option value="goals" className="bg-och-midnight text-white">🎯 Goal Tracking</option>
                <option value="rubrics" className="bg-och-midnight text-white">📋 Rubrics & Scoring</option>
                <option value="conflicts" className="bg-och-midnight text-white">⚠️ Conflict Resolution</option>
                <option value="audit" className="bg-och-midnight text-white">📜 Audit Trail</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Quick Actions */}
            {(assignmentMode === 'assign' || assignmentMode === 'auto-match') && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="bg-och-midnight/80 border border-och-steel/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-och-defender cursor-pointer"
                  disabled={cohortsLoading}
                >
                  <option value="" className="bg-och-midnight text-white">Select Cohort</option>
                  {cohorts?.map((cohort) => (
                    <option key={cohort.id} value={cohort.id} className="bg-och-midnight text-white">
                      {cohort.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Mentorship Cycle Definition */}
        {assignmentMode === 'cycle' && (
          <Card className="mb-6 border-och-defender/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Mentorship Cycle Configuration</h2>
                  <p className="text-sm text-och-steel">Define cycles, milestones, and goals per cohort</p>
                </div>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="bg-och-midnight/80 border border-och-steel/30 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-och-defender cursor-pointer"
                  disabled={cohortsLoading}
                >
                  <option value="" className="bg-och-midnight text-white">Select Cohort</option>
                  {cohorts?.map((cohort) => (
                    <option key={cohort.id} value={cohort.id} className="bg-och-midnight text-white">
                      {cohort.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Duration (Weeks) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={mentorshipCycle.duration_weeks}
                      onChange={(e) => setMentorshipCycle({ ...mentorshipCycle, duration_weeks: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-och-midnight/80 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender focus:ring-1 focus:ring-och-defender transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Session Frequency *
                    </label>
                    <select
                      value={mentorshipCycle.frequency}
                      onChange={(e) => setMentorshipCycle({ ...mentorshipCycle, frequency: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-och-midnight/80 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender focus:ring-1 focus:ring-och-defender cursor-pointer transition-all"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Program Type Template
                  </label>
                  <select
                    value={mentorshipCycle.program_type}
                    onChange={(e) => setMentorshipCycle({ ...mentorshipCycle, program_type: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-och-midnight/80 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender focus:ring-1 focus:ring-och-defender cursor-pointer transition-all"
                  >
                    <option value="builders">Builders (Default)</option>
                    <option value="leaders">Leaders</option>
                    <option value="custom">Custom</option>
                  </select>
                  <p className="text-xs text-och-steel mt-1">
                    Select a template or use custom configuration
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Milestones
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newMilestone}
                      onChange={(e) => setNewMilestone(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addMilestone()}
                      placeholder="Add milestone (e.g., Week 4: Skills Assessment)"
                      className="flex-1 px-4 py-2.5 bg-och-midnight/80 border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:outline-none focus:border-och-defender focus:ring-1 focus:ring-och-defender transition-all"
                    />
                    <Button variant="outline" onClick={addMilestone}>Add</Button>
                  </div>
                  <div className="space-y-2">
                    {mentorshipCycle.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-och-midnight/50 rounded-lg">
                        <span className="text-white">{milestone}</span>
                        <Button variant="outline" size="sm" onClick={() => removeMilestone(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Goals
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                      placeholder="Add goal (e.g., Complete portfolio review)"
                      className="flex-1 px-4 py-2.5 bg-och-midnight/80 border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:outline-none focus:border-och-defender focus:ring-1 focus:ring-och-defender transition-all"
                    />
                    <Button variant="outline" onClick={addGoal}>Add</Button>
                  </div>
                  <div className="space-y-2">
                    {mentorshipCycle.goals.map((goal, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-och-midnight/50 rounded-lg">
                        <span className="text-white">{goal}</span>
                        <Button variant="outline" size="sm" onClick={() => removeGoal(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedCohortId && (
                  <div className="flex gap-3 pt-4 border-t border-och-steel/20">
                    <Button variant="outline" size="sm" onClick={() => setAssignmentMode('list')}>
                      Cancel
                    </Button>
                    <Button variant="defender" size="sm" onClick={async () => {
                      try {
                        await programsClient.saveMentorshipCycle(selectedCohortId, mentorshipCycle)
                        alert('Mentorship cycle configuration saved successfully')
                        setAssignmentMode('list')
                      } catch (err: any) {
                        alert(err.message || 'Failed to save mentorship cycle configuration')
                      }
                    }}>
                      Save Configuration
                    </Button>
                  </div>
                )}
                {!selectedCohortId && (
                  <div className="p-4 bg-och-mint/10 border border-och-mint/30 rounded-lg">
                    <p className="text-sm text-och-steel">Please select a cohort from the dropdown above to configure mentorship cycles</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Manual Assignment / Auto-Match Form */}
        {(assignmentMode === 'assign' || assignmentMode === 'auto-match') && (
          <Card className="mb-6 border-och-defender/20">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">
                  {assignmentMode === 'auto-match' ? '🎯 Auto-Match Mentors' : '👤 Manual Assignment'}
                </h2>
                <p className="text-sm text-och-steel">
                  {assignmentMode === 'auto-match' 
                    ? 'Automatically match mentors to mentees based on compatibility algorithms'
                    : 'Manually assign mentors to cohorts and tracks'}
                </p>
              </div>
              
              <div className="space-y-5">
                {!selectedCohortId && (
                  <div className="p-4 bg-och-mint/10 border border-och-mint/30 rounded-lg">
                    <p className="text-sm text-och-steel">Please select a cohort from the dropdown above to continue</p>
                  </div>
                )}
                {selectedCohortId && (
                  <>

                {assignmentMode === 'auto-match' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Track (Optional - for track-specific matching)
                      </label>
                      <select
                        value={selectedTrackId}
                        onChange={(e) => setSelectedTrackId(e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="">All tracks</option>
                        {tracks?.map((track) => (
                          <option key={track.id} value={track.id}>
                            {track.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Assignment Role
                      </label>
                      <select
                        value={assignmentRole}
                        onChange={(e) => setAssignmentRole(e.target.value as any)}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="primary">Primary</option>
                        <option value="support">Support</option>
                        <option value="guest">Guest</option>
                      </select>
                    </div>

                    <div className="bg-och-mint/10 border border-och-mint/30 rounded-lg p-4">
                      <p className="text-sm text-och-steel mb-2">
                        <strong>Auto-Match Algorithm:</strong> Matches mentors to mentees based on:
                      </p>
                      <ul className="text-xs text-och-steel space-y-1 list-disc list-inside">
                        <li>Skills overlap from Profiling Module (profiling.matching_features)</li>
                        <li>Mentor availability and capacity</li>
                        <li>Track alignment</li>
                        <li>Career alignment and preferences</li>
                        <li>Personality compatibility (if available)</li>
                      </ul>
                      <p className="text-xs text-och-steel mt-2">
                        <strong>Weighted Scoring:</strong> The algorithm uses weighted factors to generate optimal matches.
                      </p>
                    </div>
                  </>
                )}

                {assignmentMode === 'assign' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Select Mentor *
                      </label>
                      <select
                        required
                        value={selectedMentorId}
                        onChange={(e) => setSelectedMentorId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-och-midnight/80 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender focus:ring-1 focus:ring-och-defender cursor-pointer transition-all"
                      >
                        <option value="">Select a mentor</option>
                        {mentors.map((mentor) => (
                          <option key={mentor.id} value={mentor.id}>
                                        {mentor.name || `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim() || mentor.email} ({mentor.total_mentees || 0} mentees, {(mentor.capacity_utilization || 0).toFixed(0)}% capacity)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Assignment Role
                      </label>
                      <select
                        value={assignmentRole}
                        onChange={(e) => setAssignmentRole(e.target.value as any)}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="primary">Primary</option>
                        <option value="support">Support</option>
                        <option value="guest">Guest</option>
                      </select>
                    </div>
                  </>
                )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAssignmentMode('list')}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="defender"
                        size="sm"
                        onClick={assignmentMode === 'auto-match' ? handleAutoMatch : handleManualAssign}
                        disabled={isAssigning || (assignmentMode === 'assign' && !selectedMentorId)}
                      >
                        {isAssigning ? 'Processing...' : assignmentMode === 'auto-match' ? 'Run Auto-Match' : 'Assign Mentor'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Mentors List View */}
        {assignmentMode === 'list' && (
          <>
            {/* Search and Filters */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="🔍 Search mentors by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 bg-och-midnight/80 border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:outline-none focus:border-och-defender focus:ring-1 focus:ring-och-defender transition-all"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {selectedCohortId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNotificationMode(true)}
                >
                  📧 Notify
                </Button>
              )}
            </div>

            {/* Notification Modal */}
            {notificationMode && (
              <Card className="mb-6 border-och-defender/50">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Send Cohort Notification</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Select Cohort
                      </label>
                      <select
                        value={selectedCohortId}
                        onChange={(e) => setSelectedCohortId(e.target.value)}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="">Select a cohort</option>
                        {cohorts?.map((cohort) => (
                          <option key={cohort.id} value={cohort.id}>
                            {cohort.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Notification Type
                      </label>
                      <select
                        value={notificationType}
                        onChange={(e) => setNotificationType(e.target.value as any)}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      >
                        <option value="reminder">Reminder</option>
                        <option value="update">Update</option>
                        <option value="announcement">Announcement</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Message *
                      </label>
                      <textarea
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        placeholder="Enter notification message..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => {
                        setNotificationMode(false)
                        setNotificationMessage('')
                      }}>
                        Cancel
                      </Button>
                      <Button variant="defender" onClick={handleSendNotification}>
                        Send Notification
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Alerts for Mentors with Flags */}
            {mentorsWithFlags.length > 0 && (
              <div className="mb-6 p-4 bg-och-orange/10 border border-och-orange/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">⚠️</span>
                  <h3 className="text-base font-semibold text-och-orange">
                    Attention Required ({mentorsWithFlags.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {mentorsWithFlags.slice(0, 3).map((mentor) => (
                    <div key={mentor.id} className="flex items-center justify-between p-2.5 bg-och-midnight/50 rounded-lg">
                      <span className="text-sm text-white">
                        {mentor.name || `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim() || mentor.email}
                      </span>
                      <div className="flex gap-2">
                        {(mentor.flags || []).map((flag) => (
                          <Badge key={flag} variant="orange" className="text-xs">
                            {flag.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mentors Grid */}
            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-och-defender border-t-transparent mx-auto mb-4"></div>
                <p className="text-sm text-och-steel">Loading mentors...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    onClick={() => {
                      setSelectedMentorId(String(mentor.id))
                      loadMentorAnalytics(String(mentor.id))
                    }}
                    className="cursor-pointer"
                  >
                    <Card
                      className={`transition-all hover:border-och-defender/50 hover:shadow-lg hover:shadow-och-defender/10 ${
                        mentor.flags && mentor.flags.length > 0 ? 'border-och-orange/30' : 'border-och-steel/20'
                      }`}
                    >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">
                            {mentor.name || `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim() || mentor.email}
                          </h3>
                          <p className="text-sm text-och-steel">{mentor.email}</p>
                        </div>
                        {mentor.flags && mentor.flags.length > 0 && (
                          <Badge variant="orange">⚠️</Badge>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-och-steel">Capacity Utilization</span>
                            <span className={`font-medium ${
                              (mentor.capacity_utilization || 0) > 100 ? 'text-och-orange' :
                              (mentor.capacity_utilization || 0) > 80 ? 'text-och-gold' :
                              'text-white'
                            }`}>
                              {(mentor.capacity_utilization || 0).toFixed(0)}%
                            </span>
                          </div>
                          <ProgressBar
                            value={Math.min(mentor.capacity_utilization || 0, 100)}
                            variant={(mentor.capacity_utilization || 0) > 100 ? 'orange' : 'mint'}
                            className="h-2"
                          />
                          <p className="text-xs text-och-steel mt-1">
                            {mentor.total_mentees || 0} / {mentor.max_capacity || mentor.mentor_capacity_weekly || 10} mentees
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-och-steel">Session Completion</p>
                            <p className="text-white font-semibold">{(mentor.session_completion_rate || 0).toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-och-steel">Feedback Avg</p>
                            <p className="text-white font-semibold">{(mentor.feedback_average || 0).toFixed(1)}/5.0</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-och-steel text-sm mb-1">Impact Score</p>
                          <div className="flex items-center gap-2">
                            <ProgressBar value={mentor.impact_score || 0} variant="defender" className="flex-1 h-2" />
                            <span className="text-white font-semibold text-sm">{(mentor.impact_score || 0).toFixed(0)}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-och-steel text-xs mb-1">Active Assignments</p>
                          <p className="text-white font-medium">{mentor.active_assignments || 0} cohorts</p>
                        </div>
                        
                        {mentor.mentor_capacity_weekly && (
                          <div>
                            <p className="text-och-steel text-xs mb-1">Weekly Capacity</p>
                            <p className="text-white font-medium">{mentor.mentor_capacity_weekly} hours/week</p>
                          </div>
                        )}

                        {mentor.cohorts && mentor.cohorts.length > 0 && (
                          <div>
                            <p className="text-och-steel text-xs mb-1">Cohorts</p>
                            <div className="flex flex-wrap gap-1">
                              {mentor.cohorts.slice(0, 3).map((cohort) => (
                                <Badge key={cohort.id} variant="defender" className="text-xs">
                                  {cohort.name}
                                </Badge>
                              ))}
                              {mentor.cohorts.length > 3 && (
                                <Badge variant="steel" className="text-xs">
                                  +{mentor.cohorts.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}

            {filteredMentors.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-och-steel mb-4">No mentors found</p>
                {searchQuery && (
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* Mentor Analytics Modal/Sidebar */}
        {selectedMentorId && mentorAnalytics && (() => {
          const selectedMentor = mentors.find(m => String(m.id) === selectedMentorId)
          if (!selectedMentor) return null
          return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedMentor?.name || selectedMentor?.email || 'Mentor'}</h2>
                    <p className="text-och-steel">{selectedMentor?.email || ''}</p>
                  </div>
                  <Button variant="outline" onClick={() => {
                    setSelectedMentorId('')
                    setMentorAnalytics(null)
                  }}>
                    Close
                  </Button>
                </div>

                {isLoadingAnalytics ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-defender mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading analytics...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Performance Metrics */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Performance Analytics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Total Mentees</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.total_mentees}</p>
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Active Cohorts</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.active_cohorts}</p>
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Session Completion</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.session_completion_rate.toFixed(0)}%</p>
                            <ProgressBar value={mentorAnalytics.metrics.session_completion_rate} variant="mint" className="mt-2 h-2" />
                            <p className="text-xs text-och-steel mt-1">
                              {mentorAnalytics.metrics.sessions_completed} / {mentorAnalytics.metrics.sessions_scheduled} sessions
                            </p>
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Feedback Average</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.feedback_average.toFixed(1)}</p>
                            <p className="text-xs text-och-steel mt-1">out of 5.0</p>
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Mentee Completion</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.mentee_completion_rate.toFixed(0)}%</p>
                            <ProgressBar value={mentorAnalytics.metrics.mentee_completion_rate} variant="defender" className="mt-2 h-2" />
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Impact Score</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.impact_score.toFixed(0)}</p>
                            <ProgressBar value={mentorAnalytics.metrics.impact_score} variant="gold" className="mt-2 h-2" />
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Sessions Missed</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.sessions_missed}</p>
                            {mentorAnalytics.metrics.sessions_missed > 0 && (
                              <Badge variant="orange" className="mt-2">⚠️ Below SLA</Badge>
                            )}
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Avg Session Rating</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.average_session_rating.toFixed(1)}</p>
                            <p className="text-xs text-och-steel mt-1">out of 5.0</p>
                          </div>
                        </Card>
                        <Card>
                          <div className="p-4">
                            <p className="text-och-steel text-sm mb-1">Mentee Satisfaction</p>
                            <p className="text-2xl font-bold text-white">{mentorAnalytics.metrics.mentee_satisfaction_score.toFixed(0)}%</p>
                            <ProgressBar value={mentorAnalytics.metrics.mentee_satisfaction_score} variant="mint" className="mt-2 h-2" />
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* Assignments with Reassignment */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Active Assignments</h3>
                      <div className="space-y-2">
                        {mentorAnalytics.assignments.map((assignment) => (
                          <div key={assignment.id} className="p-4 bg-och-midnight/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-white font-medium">{assignment.cohort_name}</p>
                                <p className="text-sm text-och-steel">
                                  Role: {assignment.role} • {assignment.mentees_count} mentees
                                </p>
                                {assignment.start_date && (
                                  <p className="text-xs text-och-steel">
                                    {new Date(assignment.start_date).toLocaleDateString()} - {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'Ongoing'}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={assignment.role === 'primary' ? 'mint' : 'defender'}>
                                  {assignment.role}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReassigningAssignmentId(assignment.id)
                                    setNewMentorId('')
                                  }}
                                >
                                  Reassign
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAssignment(assignment.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                            {reassigningAssignmentId === assignment.id && (
                              <div className="mt-3 p-3 bg-och-midnight rounded-lg border border-och-defender/30">
                                <label className="block text-sm font-medium text-white mb-2">
                                  Select New Mentor
                                </label>
                                <div className="flex gap-2">
                                  <select
                                    value={newMentorId}
                                    onChange={(e) => setNewMentorId(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                  >
                                    <option value="">Select mentor...</option>
                                    {mentors.filter(m => String(m.id) !== selectedMentorId).map((mentor) => (
                                      <option key={mentor.id} value={mentor.id}>
                                        {mentor.name || `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim() || mentor.email} ({(mentor.capacity_utilization || 0).toFixed(0)}% capacity)
                                      </option>
                                    ))}
                                  </select>
                                  <Button variant="defender" size="sm" onClick={handleReassign} disabled={!newMentorId}>
                                    Confirm
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => setReassigningAssignmentId(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mentor Reviews */}
                    {mentorAnalytics.reviews && mentorAnalytics.reviews.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Mentor Reviews</h3>
                        <div className="space-y-2">
                          {mentorAnalytics.reviews.map((review) => (
                            <div key={review.id} className="p-4 bg-och-midnight/50 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-white font-medium">{review.cohort_name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-och-gold text-sm">⭐ {review.rating}/5</span>
                                    <span className="text-xs text-och-steel">
                                      {new Date(review.reviewed_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-och-steel mt-2">{review.feedback}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mentee Goals Management */}
                    {mentorAnalytics.mentee_goals && mentorAnalytics.mentee_goals.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Mentee Goals</h3>
                        <div className="space-y-2">
                          {mentorAnalytics.mentee_goals.map((goal) => (
                            <div key={goal.goal_id} className="p-4 bg-och-midnight/50 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-white font-medium">{goal.goal_title}</p>
                                  <p className="text-sm text-och-steel">Mentee: {goal.mentee_name}</p>
                                  <div className="mt-2">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-och-steel">Progress</span>
                                      <span className="text-white">{goal.progress}%</span>
                                    </div>
                                    <ProgressBar value={goal.progress} variant="mint" className="h-2" />
                                  </div>
                                  <Badge variant={goal.status === 'completed' ? 'mint' : 'defender'} className="mt-2">
                                    {goal.status}
                                  </Badge>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    const updates = prompt('Enter goal updates (JSON format):')
                                    if (updates) {
                                      try {
                                        await programsClient.updateMenteeGoal(goal.mentee_id, goal.goal_id, JSON.parse(updates))
                                        alert('Goal updated successfully')
                                        await loadMentorAnalytics(selectedMentorId)
                                      } catch (err) {
                                        alert('Failed to update goal')
                                      }
                                    }
                                  }}
                                >
                                  Adjust
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cycle Closure Approval */}
                    {mentorAnalytics.assignments.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Cycle Closure</h3>
                        <div className="space-y-2">
                          {mentorAnalytics.assignments.map((assignment) => (
                            <div key={assignment.id} className="p-4 bg-och-midnight/50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white font-medium">{assignment.cohort_name}</p>
                                  <p className="text-sm text-och-steel">
                                    Check all feedback submitted and flag missing sessions before closure
                                  </p>
                                </div>
                                <Button
                                  variant="defender"
                                  size="sm"
                                  onClick={() => {
                                    setClosingCohortId(assignment.cohort_id)
                                    setClosingMentorId(selectedMentorId)
                                  }}
                                >
                                  Approve Closure
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cohorts */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Cohorts</h3>
                      <div className="flex flex-wrap gap-2">
                        {mentorAnalytics.cohorts.map((cohort) => (
                          <Link key={cohort.id} href={`/dashboard/director/cohorts/${cohort.id}`}>
                            <Badge variant="defender" className="cursor-pointer hover:bg-och-defender/80">
                              {cohort.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
          )
        })()}

        {/* Cycle Closure Confirmation Modal */}
        {closingCohortId && closingMentorId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Approve Cycle Closure</h3>
                <p className="text-och-steel mb-4">
                  This will finalize all feedback and generate a closure report. Are you sure?
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => {
                    setClosingCohortId(null)
                    setClosingMentorId(null)
                  }}>
                    Cancel
                  </Button>
                  <Button variant="defender" onClick={handleApproveCycleClosure}>
                    Approve Closure
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Mission Review Oversight Section */}
        {assignmentMode === 'missions' && (
          <Card className="mb-6 border-och-defender/20">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">📝 Mission Review & Assessment</h2>
                <p className="text-sm text-och-steel">Oversee Premium tier reviews, scoring, and rubrics</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white mb-2">Filter by Cohort</label>
                    <select
                      value={selectedCohortId}
                      onChange={(e) => setSelectedCohortId(e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="">All Cohorts</option>
                      {cohorts?.map((cohort) => (
                        <option key={cohort.id} value={cohort.id}>
                          {cohort.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      id="premium-only"
                      checked={premiumTierFilter}
                      onChange={(e) => setPremiumTierFilter(e.target.checked)}
                      className="w-4 h-4 rounded border-och-steel/20 bg-och-midnight/50 text-och-defender focus:ring-och-defender"
                    />
                    <label htmlFor="premium-only" className="text-sm text-white">
                      Premium Tier Only ($7 tier)
                    </label>
                  </div>
                </div>

                <div className="bg-och-mint/10 border border-och-mint/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Mission Review Entitlement</h3>
                  <p className="text-xs text-och-steel">
                    Mission mentor reviews are strictly for learners on the $7 Premium tier. Lower tiers rely on AI feedback only.
                    The system automatically filters submissions based on tier entitlement.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Pending Reviews</h3>
                  {missionReviews.length === 0 ? (
                    <div className="text-center py-8 text-och-steel">
                      <p>No pending mission reviews</p>
                    </div>
                  ) : (
                    missionReviews.map((review) => (
                      <div key={review.id} className="p-4 bg-och-midnight/50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-white font-medium">{review.mission_title}</h4>
                              <Badge variant={review.mentee_tier === 'premium' ? 'mint' : 'orange'}>
                                {review.mentee_tier}
                              </Badge>
                              {review.mentee_tier !== 'premium' && (
                                <Badge variant="orange">AI Review Only</Badge>
                              )}
                            </div>
                            <p className="text-sm text-och-steel">
                              Mentee: {review.mentee_name} • Cohort: {review.cohort_name}
                            </p>
                            <p className="text-xs text-och-steel mt-1">
                              Submitted: {new Date(review.submitted_at).toLocaleDateString()}
                            </p>
                            {review.sla_deadline && (
                              <p className={`text-xs mt-1 ${
                                new Date(review.sla_deadline) < new Date() ? 'text-och-orange' : 'text-och-steel'
                              }`}>
                                SLA Deadline: {new Date(review.sla_deadline).toLocaleDateString()}
                                {new Date(review.sla_deadline) < new Date() && ' (OVERDUE)'}
                              </p>
                            )}
                          </div>
                          {review.mentee_tier === 'premium' && (
                            <Button
                              variant="defender"
                              size="sm"
                              onClick={() => setSelectedMissionReview(review)}
                            >
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Review Execution Requirements</h3>
                  <div className="space-y-2 text-sm text-och-steel">
                    <p>✓ Mentors must provide detailed analysis with pass/fail grade</p>
                    <p>✓ Comments required for all submissions</p>
                    <p>✓ Skill tags must be applied based on demonstrated competencies</p>
                    <p>✓ Scores recorded using defined rubrics per track</p>
                    <p>✓ All feedback tracked in central mentor_reviews entity</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Session Management Section */}
        {assignmentMode === 'sessions' && (
          <Card className="mb-6 border-och-defender/20">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">📅 Session Management</h2>
                <p className="text-sm text-och-steel">Oversee mentorship sessions with calendar integration</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Select Cohort</label>
                  <select
                    value={selectedCohortForSessions}
                    onChange={(e) => {
                      setSelectedCohortForSessions(e.target.value)
                      // Load sessions for this cohort
                    }}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="">Select a cohort</option>
                    {cohorts?.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-och-mint/10 border border-och-mint/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Calendar Integration</h3>
                  <p className="text-xs text-och-steel">
                    Sessions use real-time calendar integration (Google Calendar, Outlook) with time-zone normalization
                    to prevent conflicts. All events are time-zone aware and automatically synchronized.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Upcoming Sessions</h3>
                  {cohortSessions.length === 0 ? (
                    <div className="text-center py-8 text-och-steel">
                      <p>No sessions scheduled</p>
                    </div>
                  ) : (
                    cohortSessions.map((session) => (
                      <div key={session.id} className="p-4 bg-och-midnight/50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-white font-medium">{session.title}</h4>
                            <p className="text-sm text-och-steel mt-1">
                              {new Date(session.scheduled_at).toLocaleString()} ({session.timezone})
                            </p>
                            <p className="text-xs text-och-steel">
                              Duration: {session.duration_minutes} minutes • Type: {session.meeting_type}
                            </p>
                            {session.meeting_link && (
                              <a
                                href={session.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-och-mint hover:underline mt-1 inline-block"
                              >
                                Join Session
                              </a>
                            )}
                          </div>
                          <Badge variant={session.status === 'scheduled' ? 'defender' : 'mint'}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Goal Tracking Review Section */}
        {assignmentMode === 'goals' && (
          <Card className="mb-6 border-och-defender/20">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">🎯 Goal Tracking & Review</h2>
                <p className="text-sm text-och-steel">Monitor SMART goals and achievement ratios</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Select Cohort</label>
                  <select
                    value={selectedCohortForGoals}
                    onChange={(e) => {
                      setSelectedCohortForGoals(e.target.value)
                      // Load goals for this cohort
                    }}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="">Select a cohort</option>
                    {cohorts?.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-och-mint/10 border border-och-mint/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">SMART Goals</h3>
                  <p className="text-xs text-och-steel">
                    Mentees set measurable SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goals.
                    Mentors are required to review mentee progress, and overall goal achievement ratios are tracked.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Mentee Goals Overview</h3>
                  {menteeGoals.length === 0 ? (
                    <div className="text-center py-8 text-och-steel">
                      <p>No goals tracked for this cohort</p>
                    </div>
                  ) : (
                    menteeGoals.map((goal) => (
                      <div key={goal.id} className="p-4 bg-och-midnight/50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{goal.title}</h4>
                            <p className="text-sm text-och-steel mt-1">
                              Mentee: {goal.mentee_name} • Status: {goal.status}
                            </p>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-och-steel">Progress</span>
                                <span className="text-white">{goal.progress}%</span>
                              </div>
                              <ProgressBar value={goal.progress} variant="mint" className="h-2" />
                            </div>
                            {goal.mentor_feedback && (
                              <p className="text-xs text-och-steel mt-2">
                                Mentor Feedback: {goal.mentor_feedback}
                              </p>
                            )}
                          </div>
                          <Badge variant={goal.status === 'completed' ? 'mint' : goal.status === 'in_progress' ? 'defender' : 'steel'}>
                            {goal.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Rubric Management Section */}
        {assignmentMode === 'rubrics' && (
          <Card className="mb-6 border-och-defender/20">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">📋 Scoring & Rubrics</h2>
                <p className="text-sm text-och-steel">Manage scoring rubrics per track</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Select Track</label>
                  <select
                    value={selectedTrackForRubric}
                    onChange={(e) => {
                      setSelectedTrackForRubric(e.target.value)
                      // Load rubrics for this track
                    }}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="">Select a track</option>
                    {tracks?.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-och-mint/10 border border-och-mint/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Rubric Requirements</h3>
                  <p className="text-xs text-och-steel">
                    Mentors must use defined rubrics when scoring capstone projects and missions.
                    Scoring breakdown can be customized per track to align with learning objectives.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Track Rubrics</h3>
                  {rubrics.length === 0 ? (
                    <div className="text-center py-8 text-och-steel">
                      <p>No rubrics defined for this track</p>
                      <Button variant="outline" className="mt-4" onClick={() => {
                        // Add new rubric
                      }}>
                        Create Rubric
                      </Button>
                    </div>
                  ) : (
                    rubrics.map((rubric) => (
                      <div key={rubric.id} className="p-4 bg-och-midnight/50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-white font-medium">{rubric.name}</h4>
                            <p className="text-sm text-och-steel mt-1">
                              Type: {rubric.type} • Weight: {rubric.weight}%
                            </p>
                            <div className="mt-3 space-y-2">
                              {rubric.criteria?.map((criterion: any, idx: number) => (
                                <div key={idx} className="text-xs text-och-steel">
                                  <span className="text-white">{criterion.name}:</span> {criterion.max_points} points
                                </div>
                              ))}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Conflict Resolution Section */}
        {assignmentMode === 'conflicts' && (
          <Card className="mb-6 border-och-defender/20">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">⚠️ Conflict Resolution</h2>
                <p className="text-sm text-och-steel">Detect and resolve scheduling conflicts</p>
              </div>

              <div className="space-y-6">
                <div className="bg-och-orange/10 border border-och-orange/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Conflict Detection</h3>
                  <p className="text-xs text-och-steel">
                    The system automatically detects when mentors are double-booked or have scheduling conflicts.
                    You will be notified and can adjust assignments if a mentor becomes unavailable.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Active Conflicts</h3>
                  {conflicts.length === 0 ? (
                    <div className="text-center py-8 text-och-steel">
                      <p>No conflicts detected</p>
                    </div>
                  ) : (
                    conflicts.map((conflict) => (
                      <div key={conflict.id} className="p-4 bg-och-orange/10 border border-och-orange/30 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-white font-medium">{conflict.mentor_name}</h4>
                            <p className="text-sm text-och-steel mt-1">
                              Type: {conflict.type} • Severity: {conflict.severity}
                            </p>
                            <p className="text-xs text-och-steel mt-1">
                              {conflict.description}
                            </p>
                            <p className="text-xs text-och-steel mt-1">
                              Detected: {new Date(conflict.detected_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="defender" size="sm" onClick={() => {
                              // Resolve conflict
                            }}>
                              Resolve
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => {
                              // View details
                            }}>
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Audit Trail Section */}
        {assignmentMode === 'audit' && (
          <Card className="mb-6 border-och-defender/20">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">📜 Audit Trail & Compliance</h2>
                <p className="text-sm text-och-steel">Review data access and changes for compliance</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Start Date</label>
                    <input
                      type="date"
                      value={auditFilters.start_date}
                      onChange={(e) => setAuditFilters({ ...auditFilters, start_date: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">End Date</label>
                    <input
                      type="date"
                      value={auditFilters.end_date}
                      onChange={(e) => setAuditFilters({ ...auditFilters, end_date: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Action Type</label>
                    <select
                      value={auditFilters.action_type}
                      onChange={(e) => setAuditFilters({ ...auditFilters, action_type: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="">All Actions</option>
                      <option value="assignment">Assignment</option>
                      <option value="session">Session</option>
                      <option value="review">Review</option>
                      <option value="goal">Goal</option>
                      <option value="flag">Flag</option>
                    </select>
                  </div>
                </div>

                <div className="bg-och-mint/10 border border-och-mint/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Audit Requirements</h3>
                  <p className="text-xs text-och-steel">
                    All mentorship data, including session notes, feedback, and assignments, maintains an audit trail
                    for access and changes, aligning with consent and privacy policies.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Audit Logs</h3>
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-8 text-och-steel">
                      <p>No audit logs found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-4 bg-och-midnight/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-white font-medium">{log.action}</h4>
                                <Badge variant="steel" className="text-xs">
                                  {log.action_type}
                                </Badge>
                              </div>
                              <p className="text-sm text-och-steel mt-1">
                                User: {log.user_name} • Resource: {log.resource_type}
                              </p>
                              <p className="text-xs text-och-steel mt-1">
                                {new Date(log.timestamp).toLocaleString()}
                              </p>
                              {log.changes && (
                                <p className="text-xs text-och-steel mt-2">
                                  Changes: {JSON.stringify(log.changes)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DirectorLayout>
  )
}
