'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { useCohort, usePrograms, useTracks } from '@/hooks/usePrograms'
import { programsClient, type MentorAssignment } from '@/services/programsClient'
import { useUsers } from '@/hooks/useUsers'

export default function AssignMentorsPage() {
  const params = useParams()
  const router = useRouter()
  const cohortId = params.id as string
  const { cohort, isLoading: loadingCohort } = useCohort(cohortId)
  const { programs, isLoading: loadingPrograms } = usePrograms()

  // Load all tracks first, then we'll find the program from the track
  const { tracks: allTracks, isLoading: loadingTracks } = useTracks(undefined)
  
  // Find the track object from the track ID (cohort.track is a string ID)
  const trackObj = useMemo(() => {
    if (!cohort?.track) return null
    return allTracks.find(t => t.id === cohort.track || t.key === cohort.track) || null
  }, [cohort?.track, allTracks])
  
  // Get tracks for the program if we found the track
  const { tracks } = useTracks(trackObj?.program || undefined)
  
  // Fetch only users with mentor role directly from the API
  const { users: mentorsFromApi, isLoading: loadingUsers } = useUsers({ page: 1, page_size: 200, role: 'mentor' })
  
  // Get program and track info from cohort
  const selectedProgram = useMemo(() => {
    if (!trackObj?.program) return null
    return programs.find(p => p.id === trackObj.program) || null
  }, [trackObj, programs])
  
  const selectedTrack = useMemo(() => {
    if (!cohort?.track) return null
    return trackObj || null
  }, [cohort?.track, trackObj])
  
  const [mentorAssignments, setMentorAssignments] = useState<MentorAssignment[]>([])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state for new assignment
  const [selectedMentorId, setSelectedMentorId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'primary' | 'support' | 'guest'>('support')
  
  // Reassign state
  const [reassigningAssignmentId, setReassigningAssignmentId] = useState<string | null>(null)
  const [newMentorId, setNewMentorId] = useState<string>('')
  
  // Use mentors directly from API (already filtered by role='mentor')
  const mentors = useMemo(() => {
    return mentorsFromApi || []
  }, [mentorsFromApi])

  // Filter out already assigned mentors from dropdown - moved before useEffect
  const availableMentors = useMemo(() => {
    const assignedIds = mentorAssignments
      .filter(a => a.active)
      .map(a => a.mentor?.toString() || a.mentor)
    return mentors.filter(m => !assignedIds.includes(m.id?.toString() || ''))
  }, [mentors, mentorAssignments])

  // Get available mentors for reassignment (includes all mentors except the current one being reassigned)
  const getAvailableMentorsForReassign = useCallback((currentAssignmentId: string) => {
    const currentAssignment = mentorAssignments.find(a => a.id === currentAssignmentId)
    const currentMentorId = currentAssignment?.mentor?.toString() || currentAssignment?.mentor
    
    // Include all mentors except those already assigned (excluding the current one being reassigned)
    const assignedIds = mentorAssignments
      .filter(a => a.active && a.id !== currentAssignmentId)
      .map(a => a.mentor?.toString() || a.mentor)
    
    return mentors.filter(m => {
      const mentorId = m.id?.toString() || ''
      return !assignedIds.includes(mentorId) || mentorId === currentMentorId
    })
  }, [mentors, mentorAssignments])

  // Load existing mentor assignments
  useEffect(() => {
    const loadAssignments = async () => {
      if (!cohortId) return
      setIsLoadingAssignments(true)
      try {
        const assignments = await programsClient.getCohortMentors(cohortId)
        setMentorAssignments(Array.isArray(assignments) ? assignments : [])
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load mentor assignments')
        console.error('Failed to load mentor assignments:', err)
      } finally {
        setIsLoadingAssignments(false)
      }
    }
    loadAssignments()
  }, [cohortId])

  const handleAssignMentor = async () => {
    if (!selectedMentorId) {
      alert('Please select a mentor')
      return
    }

    // Check if mentor is already assigned
    const existing = mentorAssignments.find(
      (assignment) => assignment.mentor === selectedMentorId && assignment.active
    )
    if (existing) {
      alert('This mentor is already assigned to this cohort')
      return
    }

    setIsAssigning(true)
    setError(null)
    try {
      console.log('Assigning mentor:', { cohortId, mentor: selectedMentorId, role: selectedRole })
      
      // Ensure mentor ID is a string
      const mentorId = String(selectedMentorId)
      
      const newAssignment = await programsClient.assignMentor(cohortId, {
        mentor: mentorId,
        role: selectedRole,
      })
      console.log('Mentor assigned/reactivated successfully:', newAssignment)
      // Reload assignments from backend to get updated list
      const assignments = await programsClient.getCohortMentors(cohortId)
      setMentorAssignments(Array.isArray(assignments) ? assignments : [])
      setSelectedMentorId('')
      setSelectedRole('support')
      setError(null)
      alert('Mentor assigned successfully')
    } catch (err: any) {
      console.error('Failed to assign mentor:', err)
      console.error('Error response:', err?.response?.data)
      
      // Extract error message from various possible locations
      let errorMessage = 'Failed to assign mentor'
      
      if (err?.response?.data) {
        const errorData = err.response.data
        
        // Check for field-specific errors
        if (errorData.mentor && Array.isArray(errorData.mentor)) {
          errorMessage = errorData.mentor[0]
        } else if (errorData.mentor) {
          errorMessage = errorData.mentor
        }
        // Check for non-field errors
        else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors[0]
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors
        }
        // Check for general error message
        else if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        }
        // Check for string error
        else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string, mentorName: string) => {
    if (!confirm(`Are you sure you want to remove ${mentorName} from this cohort?`)) {
      return
    }

    try {
      await programsClient.removeMentorAssignment(assignmentId)
      // Reload assignments from backend to get updated list
      const assignments = await programsClient.getCohortMentors(cohortId)
      setMentorAssignments(Array.isArray(assignments) ? assignments : [])
      alert('Mentor removed successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to remove mentor assignment')
      alert(err.message || 'Failed to remove mentor assignment')
      console.error('Failed to remove mentor assignment:', err)
    }
  }

  const handleUpdateRole = async (assignmentId: string, newRole: 'primary' | 'support' | 'guest') => {
    try {
      const updated = await programsClient.updateMentorAssignment(assignmentId, { role: newRole })
      setMentorAssignments(mentorAssignments.map(a => a.id === assignmentId ? updated : a))
      // Reload assignments to ensure we have the latest data
      const assignments = await programsClient.getCohortMentors(cohortId)
      setMentorAssignments(Array.isArray(assignments) ? assignments : [])
    } catch (err: any) {
      setError(err.message || 'Failed to update mentor role')
      alert(err.message || 'Failed to update mentor role')
      console.error('Failed to update mentor role:', err)
    }
  }

  const handleReassignMentor = async (assignmentId: string, newMentorId: string, currentMentorName: string) => {
    if (!newMentorId) {
      alert('Please select a new mentor')
      return
    }

    if (!confirm(`Are you sure you want to reassign ${currentMentorName} to a different mentor?`)) {
      return
    }

    try {
      await programsClient.reassignMentor(assignmentId, newMentorId)
      // Reload assignments to get updated list
      const assignments = await programsClient.getCohortMentors(cohortId)
      setMentorAssignments(Array.isArray(assignments) ? assignments : [])
      alert('Mentor reassigned successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to reassign mentor')
      alert(err.message || 'Failed to reassign mentor')
      console.error('Failed to reassign mentor:', err)
    }
  }

  // Get mentor details for display - moved before conditional returns
  const getMentorDetails = useCallback((mentorId: string) => {
    return mentors.find(m => m.id?.toString() === mentorId.toString())
  }, [mentors])

  if (loadingCohort || loadingUsers || isLoadingAssignments) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (!cohort) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="border-och-orange/50">
            <div className="p-6 text-center">
              <p className="text-och-orange mb-4">Cohort not found</p>
              <Link href="/dashboard/director/cohorts">
                <Button variant="outline">Back to Cohorts</Button>
              </Link>
            </div>
          </Card>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Assign Mentors</h1>
                <p className="text-och-steel">
                  Manage mentor assignments for: <span className="text-white font-medium">{cohort.name}</span>
                </p>
                {/* Program and Track Context */}
                <div className="mt-2 flex items-center gap-4 text-sm">
                  {selectedProgram && (
                    <div className="flex items-center gap-2">
                      <span className="text-och-steel">Program:</span>
                      <Badge variant="defender">{selectedProgram.name}</Badge>
                    </div>
                  )}
                  {selectedTrack && (
                    <div className="flex items-center gap-2">
                      <span className="text-och-steel">Track:</span>
                      <Badge variant="mint">
                        {typeof selectedTrack === 'object' ? selectedTrack.name : 'Loading...'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <Link href={`/dashboard/director/cohorts/${cohortId}`}>
                <Button variant="outline" size="sm">
                  ← Back to Cohort
                </Button>
              </Link>
            </div>
          </div>

          {error && (
            <Card className="mb-6 border-och-orange/50">
              <div className="p-4">
                <p className="text-och-orange">{error}</p>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assign New Mentor */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Assign New Mentor</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Select Mentor *
                    </label>
                    <select
                      value={selectedMentorId}
                      onChange={(e) => setSelectedMentorId(e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="">Choose a mentor...</option>
                      {availableMentors.map((mentor) => (
                        <option key={mentor.id} value={mentor.id}>
                          {mentor.email} {mentor.first_name || mentor.last_name 
                            ? `(${mentor.first_name || ''} ${mentor.last_name || ''})`.trim()
                            : ''}
                        </option>
                      ))}
                    </select>
                    {availableMentors.length === 0 && (
                      <div className="mt-2 p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg">
                        <p className="text-xs text-och-orange mb-1">
                          {mentors.length === 0 
                            ? '⚠️ No mentors found' 
                            : 'All available mentors are already assigned'}
                        </p>
                        {mentors.length === 0 && (
                          <ul className="text-xs text-och-steel list-disc list-inside space-y-1">
                            <li>Check if users have the "mentor" role assigned</li>
                            <li>Users must have an active mentor role in their profile</li>
                            <li>Contact an admin to assign mentor roles to users</li>
                            {mentorsFromApi.length === 0 && (
                              <li>No mentors found in the system - check if users have the mentor role assigned</li>
                            )}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Mentor Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as 'primary' | 'support' | 'guest')}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-defender/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="primary">Primary Mentor</option>
                      <option value="support">Support Mentor</option>
                      <option value="guest">Guest Mentor</option>
                    </select>
                    <p className="text-xs text-och-steel mt-1">
                      Primary: Main mentor responsible. Support: Secondary support. Guest: Occasional sessions.
                    </p>
                  </div>

                  <Button
                    variant="defender"
                    size="sm"
                    onClick={handleAssignMentor}
                    disabled={!selectedMentorId || isAssigning}
                    className="w-full"
                  >
                    {isAssigning ? 'Assigning...' : 'Assign Mentor'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Current Assignments */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Assigned Mentors ({mentorAssignments.filter(a => a.active).length})
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsLoadingAssignments(true)
                      try {
                        const assignments = await programsClient.getCohortMentors(cohortId)
                        setMentorAssignments(Array.isArray(assignments) ? assignments : [])
                        setError(null)
                      } catch (err: any) {
                        setError(err.message || 'Failed to refresh mentor assignments')
                      } finally {
                        setIsLoadingAssignments(false)
                      }
                    }}
                    disabled={isLoadingAssignments}
                  >
                    {isLoadingAssignments ? 'Refreshing...' : '🔄 Refresh'}
                  </Button>
                </div>
                
                {isLoadingAssignments ? (
                  <div className="text-center py-8 text-och-steel">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-defender mx-auto mb-2"></div>
                    <p>Loading assignments...</p>
                  </div>
                ) : mentorAssignments.filter(a => a.active).length === 0 ? (
                  <div className="text-center py-8 text-och-steel">
                    <p>No mentors assigned yet</p>
                    <p className="text-sm mt-2">Assign a mentor using the form on the left</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mentorAssignments
                      .filter(a => a.active)
                      .map((assignment) => {
                        const mentor = getMentorDetails(assignment.mentor?.toString() || assignment.mentor as string)
                        const mentorName = mentor 
                          ? `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim() || mentor.email
                          : assignment.mentor_name || assignment.mentor_email || 'Unknown'
                        
                        return (
                          <div
                            key={assignment.id}
                            className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="text-white font-medium">{mentorName}</p>
                                {mentor?.email && (
                                  <p className="text-xs text-och-steel">{mentor.email}</p>
                                )}
                                <div className="mt-2 space-y-2">
                                  <select
                                    value={assignment.role || 'support'}
                                    onChange={(e) => handleUpdateRole(assignment.id!, e.target.value as 'primary' | 'support' | 'guest')}
                                    className="px-3 py-1 text-xs bg-och-midnight border border-och-steel/20 rounded text-white focus:outline-none focus:border-och-defender"
                                  >
                                    <option value="primary">Primary</option>
                                    <option value="support">Support</option>
                                    <option value="guest">Guest</option>
                                  </select>
                                  
                                  {/* Reassign Section */}
                                  {reassigningAssignmentId === assignment.id ? (
                                    <div className="flex gap-2 items-center">
                                      <select
                                        value={newMentorId}
                                        onChange={(e) => setNewMentorId(e.target.value)}
                                        className="flex-1 px-2 py-1 text-xs bg-och-midnight border border-och-steel/20 rounded text-white focus:outline-none focus:border-och-defender"
                                      >
                                        <option value="">Select new mentor...</option>
                                        {getAvailableMentorsForReassign(assignment.id).map((m) => (
                                          <option key={m.id} value={m.id}>
                                            {m.email} {m.first_name || m.last_name 
                                              ? `(${m.first_name || ''} ${m.last_name || ''})`.trim()
                                              : ''}
                                          </option>
                                        ))}
                                      </select>
                                      <Button
                                        variant="defender"
                                        size="sm"
                                        onClick={() => {
                                          if (newMentorId) {
                                            handleReassignMentor(assignment.id!, newMentorId, mentorName)
                                            setReassigningAssignmentId(null)
                                            setNewMentorId('')
                                          }
                                        }}
                                        disabled={!newMentorId}
                                        className="text-xs"
                                      >
                                        Confirm
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setReassigningAssignmentId(null)
                                          setNewMentorId('')
                                        }}
                                        className="text-xs"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setReassigningAssignmentId(assignment.id!)
                                        setNewMentorId('')
                                      }}
                                      className="text-xs w-full"
                                    >
                                      Reassign Mentor
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    assignment.role === 'primary' ? 'defender' :
                                    assignment.role === 'support' ? 'mint' :
                                    'steel'
                                  }
                                >
                                  {assignment.role || 'support'}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAssignment(assignment.id!, mentorName)}
                                  className="text-och-orange hover:text-och-orange/80 hover:border-och-orange text-xs"
                                  disabled={reassigningAssignmentId === assignment.id}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                            {assignment.assigned_at && (
                              <p className="text-xs text-och-steel">
                                Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Statistics */}
          <Card className="mt-6">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Mentor Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-och-steel mb-1">Total Assigned</p>
                  <p className="text-2xl font-bold text-white">
                    {mentorAssignments.filter(a => a.active).length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-och-steel mb-1">Primary Mentors</p>
                  <p className="text-2xl font-bold text-och-defender">
                    {mentorAssignments.filter(a => a.active && a.role === 'primary').length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-och-steel mb-1">Support Mentors</p>
                  <p className="text-2xl font-bold text-och-mint">
                    {mentorAssignments.filter(a => a.active && a.role === 'support').length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-och-steel mb-1">Available Mentors</p>
                  <p className="text-2xl font-bold text-och-gold">
                    {availableMentors.length}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
