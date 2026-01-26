'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsers } from '@/hooks/useUsers'
import { djangoClient } from '@/services/djangoClient'
import { programsClient, type Cohort, type MentorAssignment } from '@/services/programsClient'
import type { User } from '@/services/types'

interface MentorWithAssignments extends User {
  assigned_cohorts?: MentorAssignment[]
  active_assignments_count?: number
  mentor_capacity_weekly?: number
  mentor_availability?: any
  mentor_specialties?: string[]
  is_mentor?: boolean
}

export default function MentorsPage() {
  const router = useRouter()
  const [mentors, setMentors] = useState<MentorWithAssignments[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMentor, setSelectedMentor] = useState<MentorWithAssignments | null>(null)
  const [selectedCohort, setSelectedCohort] = useState<string>('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, MentorAssignment[]>>({})

  // Fetch mentors using role filter
  const { users: allUsers, isLoading: usersLoading, refetch: refetchUsers } = useUsers({
    page: 1,
    page_size: 100,
    role: 'mentor',
    search: searchQuery || undefined,
  })

  useEffect(() => {
    loadMentors()
    loadCohorts()
    loadMentorAssignments()
  }, [allUsers, searchQuery])

  const loadMentors = async () => {
    try {
      setIsLoading(true)
      // Filter mentors from the fetched users
      const mentorsList = allUsers.filter((u) =>
        u.roles?.some((r: any) => r.role === 'mentor')
      )
      setMentors(mentorsList)
    } catch (error) {
      console.error('Error loading mentors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCohorts = async () => {
    try {
      const response = await programsClient.getCohorts({
        page: 1,
        pageSize: 200,
      })
      // Filter for active cohorts only
      const activeCohorts = (response.results || []).filter(
        (c) => c.status === 'active' || c.status === 'running'
      )
      setCohorts(activeCohorts)
    } catch (error) {
      console.error('Error loading cohorts:', error)
    }
  }

  const loadMentorAssignments = async () => {
    try {
      const map: Record<string, MentorAssignment[]> = {}
      
      // Load all mentor assignments from the API
      try {
        const allAssignments = await programsClient.getMentorAssignments()
        // Group assignments by mentor ID
        for (const assignment of allAssignments) {
          const mentorId = assignment.mentor?.toString() || assignment.mentor
          if (mentorId && assignment.active) {
            if (!map[mentorId]) {
              map[mentorId] = []
            }
            map[mentorId].push(assignment)
          }
        }
      } catch (error) {
        // If bulk fetch fails, try individual fetches
        for (const mentor of mentors) {
          try {
            const assignments = await programsClient.getMentorAssignments(mentor.id.toString())
            map[mentor.id.toString()] = assignments.filter((a: MentorAssignment) => a.active)
          } catch (err) {
            console.error(`Error loading assignments for mentor ${mentor.id}:`, err)
            map[mentor.id.toString()] = []
          }
        }
      }
      
      setAssignmentsMap(map)
    } catch (error) {
      console.error('Error loading mentor assignments:', error)
    }
  }

  // Update assignments when mentors change
  useEffect(() => {
    if (mentors.length > 0) {
      loadMentorAssignments()
    }
  }, [mentors])

  const handleAssignCohort = async () => {
    if (!selectedMentor || !selectedCohort) {
      alert('Please select both a mentor and a cohort')
      return
    }

    // Check if mentor is already assigned to this cohort
    const existingAssignment = assignmentsMap[selectedMentor.id.toString()]?.find(
      (a) => a.cohort === selectedCohort
    )

    if (existingAssignment) {
      alert('This mentor is already assigned to the selected cohort')
      return
    }

    setIsAssigning(true)
    try {
      await programsClient.assignMentor(selectedCohort, {
        mentor: selectedMentor.id.toString(),
        role: 'support',
        active: true,
      })

      alert('Mentor assigned to cohort successfully!')
      setShowAssignModal(false)
      setSelectedMentor(null)
      setSelectedCohort('')
      await loadMentorAssignments()
      await refetchUsers()
    } catch (error: any) {
      console.error('Error assigning mentor:', error)
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        error.message ||
        'Failed to assign mentor'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsAssigning(false)
    }
  }


  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          mentor.email?.toLowerCase().includes(query) ||
          mentor.first_name?.toLowerCase().includes(query) ||
          mentor.last_name?.toLowerCase().includes(query) ||
          mentor.username?.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [mentors, searchQuery])

  // Get available cohorts (not assigned to selected mentor)
  const availableCohorts = useMemo(() => {
    if (!selectedMentor) return cohorts
    const assignedCohortIds = new Set(
      (assignmentsMap[selectedMentor.id.toString()] || []).map((a) => a.cohort)
    )
    return cohorts.filter((c) => !assignedCohortIds.has(c.id))
  }, [cohorts, selectedMentor, assignmentsMap])

  // Get available mentors (for assignment)
  const availableMentors = useMemo(() => {
    return mentors.filter((m) => m.is_active && m.account_status === 'active')
  }, [mentors])

  return (
    <RouteGuard requiredRoles={['admin']}>
      <AdminLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Mentor Management</h1>
              <p className="text-och-steel mt-1">Manage mentors and their cohort assignments</p>
            </div>
            <Button
              onClick={() => {
                setSelectedMentor(null)
                setSelectedCohort('')
                setShowAssignModal(true)
              }}
              variant="gold"
            >
              Assign Cohort to Mentor
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-och-steel text-sm">Total Mentors</div>
              <div className="text-2xl font-bold text-white mt-1">{mentors.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-och-steel text-sm">Active Mentors</div>
              <div className="text-2xl font-bold text-och-mint mt-1">
                {mentors.filter((m) => m.is_active && m.account_status === 'active').length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-och-steel text-sm">Assigned Cohorts</div>
              <div className="text-2xl font-bold text-och-defender mt-1">
                {Object.values(assignmentsMap).reduce((sum, assignments) => sum + assignments.length, 0)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-och-steel text-sm">Available Cohorts</div>
              <div className="text-2xl font-bold text-och-gold mt-1">{cohorts.length}</div>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-och-steel"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search mentors by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                />
              </div>
            </div>
          </Card>

          {/* Mentors Grid */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Mentors</h2>
            {isLoading || usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
              </div>
            ) : filteredMentors.length === 0 ? (
              <Card className="p-12">
                <div className="text-center text-och-steel">
                  {searchQuery ? 'No mentors found matching your search.' : 'No mentors found.'}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMentors.map((mentor) => {
                  const assignments = assignmentsMap[mentor.id.toString()] || []
                  const mentorName = mentor.first_name && mentor.last_name
                    ? `${mentor.first_name} ${mentor.last_name}`
                    : mentor.email

                  return (
                    <Link
                      key={mentor.id}
                      href={`/dashboard/admin/users/mentors/${mentor.id}`}
                      className="block"
                    >
                      <Card className="p-5 hover:border-och-mint/50 transition-all duration-200 hover:shadow-lg hover:shadow-och-mint/10 group h-full cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white group-hover:text-och-mint transition-colors">
                              {mentorName}
                            </h3>
                            <Badge
                              variant={
                                mentor.is_active && mentor.account_status === 'active'
                                  ? 'mint'
                                  : 'steel'
                              }
                              className="text-xs"
                            >
                              {mentor.account_status === 'active' && mentor.is_active
                                ? 'Active'
                                : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-och-steel">{mentor.email}</p>
                        </div>
                        <svg
                          className="w-5 h-5 text-och-steel group-hover:text-och-mint transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>

                      <div className="space-y-2 mt-4">
                        {mentor.mentor_capacity_weekly && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-och-steel">Weekly Capacity</span>
                            <span className="text-white font-medium">{mentor.mentor_capacity_weekly} hrs</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-och-steel">Assigned Cohorts</span>
                          <Badge variant="defender" className="text-xs">
                            {assignments.length}
                          </Badge>
                        </div>
                        {assignments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-och-steel/20">
                            <p className="text-xs text-och-steel mb-2">Cohorts:</p>
                            <div className="flex flex-wrap gap-1">
                              {assignments.slice(0, 3).map((assignment) => (
                                <Badge key={assignment.id} variant="steel" className="text-xs">
                                  {assignment.cohort_name || assignment.cohort}
                                </Badge>
                              ))}
                              {assignments.length > 3 && (
                                <Badge variant="steel" className="text-xs">
                                  +{assignments.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-och-steel/20">
                        <div className="flex items-center justify-between text-xs text-och-steel">
                          <span>Click to view details</span>
                          <span className="group-hover:text-och-mint transition-colors">→</span>
                        </div>
                      </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Assign Cohort Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAssignModal(false)}>
              <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Assign Cohort to Mentor
                </h2>

                <div className="space-y-4">
                  {!selectedMentor ? (
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">
                        Select Mentor
                      </label>
                      <select
                        value=""
                        onChange={(e) => {
                          const mentor = availableMentors.find(
                            (m) => m.id.toString() === e.target.value
                          )
                          setSelectedMentor(mentor || null)
                          setSelectedCohort('')
                        }}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      >
                        <option value="">-- Select a mentor --</option>
                        {availableMentors.map((mentor) => (
                          <option key={mentor.id} value={mentor.id.toString()}>
                            {mentor.first_name && mentor.last_name
                              ? `${mentor.first_name} ${mentor.last_name} (${mentor.email})`
                              : mentor.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-och-steel mb-2">
                          Mentor
                        </label>
                        <div className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white">
                          {selectedMentor.first_name && selectedMentor.last_name
                            ? `${selectedMentor.first_name} ${selectedMentor.last_name}`
                            : selectedMentor.email}
                          <span className="text-och-steel ml-2">({selectedMentor.email})</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedMentor(null)
                            setSelectedCohort('')
                          }}
                          className="text-xs text-och-mint hover:text-och-mint/80 mt-1"
                        >
                          Change mentor
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-och-steel mb-2">
                          Select Cohort
                        </label>
                        <select
                          value={selectedCohort}
                          onChange={(e) => setSelectedCohort(e.target.value)}
                          className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        >
                          <option value="">-- Select a cohort --</option>
                          {availableCohorts.map((cohort) => (
                            <option key={cohort.id} value={cohort.id}>
                              {cohort.name} ({cohort.track_name || cohort.track})
                            </option>
                          ))}
                        </select>
                        {availableCohorts.length === 0 && (
                          <p className="text-sm text-och-steel mt-1">
                            This mentor is already assigned to all available cohorts.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedMentor(null)
                      setSelectedCohort('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gold"
                    onClick={handleAssignCohort}
                    disabled={isAssigning || !selectedMentor || !selectedCohort}
                  >
                    {isAssigning ? 'Assigning...' : 'Assign'}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
