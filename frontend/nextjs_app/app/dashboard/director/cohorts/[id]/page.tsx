'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useCohort, useCohortDashboard, useTracks, useUpdateCohort, useTrack } from '@/hooks/usePrograms'
import { programsClient, type CalendarEvent, type Enrollment, type MentorAssignment, type Track, type CohortMissionAssignment } from '@/services/programsClient'
import { apiGateway } from '@/services/apiGateway'
import { missionsClient, type MissionTemplate } from '@/services/missionsClient'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Target, GraduationCap, Users, ExternalLink } from 'lucide-react'

export default function CohortDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cohortId = params.id as string
  const { cohort, isLoading: loadingCohort, reload: reloadCohort } = useCohort(cohortId)
  const { dashboard, isLoading: loadingDashboard } = useCohortDashboard(cohortId)
  const { tracks, isLoading: tracksLoading } = useTracks()
  const { updateCohort, isLoading: isUpdatingTrack } = useUpdateCohort()
  // Fetch the specific track assigned to this cohort (cohort.track may be object from API)
  const trackId = cohort?.track != null
    ? (typeof cohort.track === 'object' && cohort.track && 'id' in cohort.track
        ? String((cohort.track as { id: string }).id)
        : String(cohort.track))
    : ''
  const { track: fetchedTrack, isLoading: loadingTrack, reload: reloadTrack } = useTrack(trackId)
  
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [mentors, setMentors] = useState<MentorAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTrackAssignmentModal, setShowTrackAssignmentModal] = useState(false)
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([])
  const [trackAssignmentError, setTrackAssignmentError] = useState<string | null>(null)
  const [trackAssignmentSuccess, setTrackAssignmentSuccess] = useState<string | null>(null)
  const [showAddMissionsModal, setShowAddMissionsModal] = useState(false)
  const [missions, setMissions] = useState<MissionTemplate[]>([])
  const [selectedMissionIds, setSelectedMissionIds] = useState<Set<string>>(new Set())
  const [addMissionsLoading, setAddMissionsLoading] = useState(false)
  const [addMissionsError, setAddMissionsError] = useState<string | null>(null)
  const [addMissionsSuccess, setAddMissionsSuccess] = useState<string | null>(null)
  const [cohortMissions, setCohortMissions] = useState<CohortMissionAssignment[]>([])
  const [publicApplications, setPublicApplications] = useState<{ id: string; applicant_type: string; name: string; email: string; status: string; created_at: string }[]>([])
  const [applicationsLoadError, setApplicationsLoadError] = useState<string | null>(null)
  const [curriculumTracks, setCurriculumTracks] = useState<{ id: string; slug: string; name: string; title: string; code: string }[]>([])

  // Calculate derived values - moved before early returns to satisfy Rules of Hooks
  const activeEnrollments = enrollments.filter(e => e.status === 'active')
  const seatPool = (cohort as any)?.seat_pool || { paid: 0, scholarship: 0, sponsored: 0 }
  const seatUtilization = cohort?.seat_utilization || (activeEnrollments.length / (cohort?.seat_cap || 1) * 100)
  const completionRate = cohort?.completion_rate || 0

  // Prepare seat allocation data for pie chart - moved before early returns
  const seatAllocationData = useMemo(() => {
    if (!cohort) return []
    
    const paid = seatPool.paid || 0
    const scholarship = seatPool.scholarship || 0
    const sponsored = seatPool.sponsored || 0
    const total = paid + scholarship + sponsored
    const available = Math.max(0, (cohort.seat_cap || 0) - total)

    return [
      {
        name: 'Paid Seats',
        value: paid,
        color: '#10B981', // mint green
        percentage: total > 0 ? ((paid / total) * 100).toFixed(1) : '0'
      },
      {
        name: 'Scholarship Seats',
        value: scholarship,
        color: '#F59E0B', // gold/orange
        percentage: total > 0 ? ((scholarship / total) * 100).toFixed(1) : '0'
      },
      {
        name: 'Sponsored Seats',
        value: sponsored,
        color: '#3B82F6', // defender blue
        percentage: total > 0 ? ((sponsored / total) * 100).toFixed(1) : '0'
      },
      ...(available > 0 ? [{
        name: 'Available Seats',
        value: available,
        color: '#6B7280', // steel gray
        percentage: ((available / (cohort.seat_cap || 1)) * 100).toFixed(1)
      }] : [])
    ].filter(item => item.value > 0)
  }, [seatPool, cohort?.seat_cap, cohort])

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-och-midnight border border-och-steel/20 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-och-mint text-sm">
            {data.value} seats ({data.payload.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  // Custom label for pie chart
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
      </text>
    )
  }

  useEffect(() => {
    const loadData = async () => {
      if (!cohortId) return
      setIsLoading(true)
      try {
        setApplicationsLoadError(null)
        const [events, enrolls, mentorAssignments, missions, applicationsRes, curriculumTracksRes] = await Promise.all([
          programsClient.getCohortCalendar(cohortId),
          programsClient.getCohortEnrollments(cohortId),
          programsClient.getCohortMentors(cohortId),
          programsClient.getCohortMissions(cohortId),
          apiGateway.get<{ applications: { id: string; applicant_type: string; name: string; email: string; status: string; created_at: string }[] }>(
            '/director/public-applications/',
            { params: { cohort_id: cohortId } }
          ).catch((err: unknown) => {
            const status = (err as { status?: number })?.status
            if (status === 403) setApplicationsLoadError('Permission denied. Directors and admins only.')
            else if (status === 404) setApplicationsLoadError('Applications endpoint not found.')
            return { applications: [] }
          }),
          apiGateway.get<any>('/curriculum/tracks/').catch(() => ({ results: [] })),
        ])
        setCalendarEvents(events)
        setEnrollments(enrolls)
        setMentors(mentorAssignments)
        setCohortMissions(missions)
        setPublicApplications(applicationsRes?.applications ?? [])
        const trackList = curriculumTracksRes?.results || curriculumTracksRes?.data || curriculumTracksRes || []
        setCurriculumTracks(trackList)
      } catch (err) {
        console.error('Failed to load cohort data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [cohortId])

  // Handle track assignment
  const handleAssignTrack = async () => {
    if (selectedTrackIds.length === 0) {
      setTrackAssignmentError('Please select at least one track')
      return
    }

    setTrackAssignmentError(null)
    setTrackAssignmentSuccess(null)

    try {
      await updateCohort(cohortId, { curriculum_tracks: selectedTrackIds })
      
      // Reload cohort data to reflect the changes
      await reloadCohort()
      
      // Reload other data that might be affected
      const [events, enrolls, mentorAssignments] = await Promise.all([
        programsClient.getCohortCalendar(cohortId),
        programsClient.getCohortEnrollments(cohortId),
        programsClient.getCohortMentors(cohortId),
      ])
      setCalendarEvents(events)
      setEnrollments(enrolls)
      setMentors(mentorAssignments)
      
      setTrackAssignmentSuccess('Tracks assigned successfully!')
      setSelectedTrackIds([])
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowTrackAssignmentModal(false)
        setTrackAssignmentSuccess(null)
      }, 2000)
    } catch (err: any) {
      console.error('Failed to assign tracks:', err)
      setTrackAssignmentError(err?.message || 'Failed to assign tracks. Please try again.')
    }
  }

  // Get current track details - prefer fetched track, fallback to tracks array
  const currentTrack = useMemo(() => {
    if (!trackId) return null
    if (fetchedTrack) return fetchedTrack
    if (tracks.length) {
      const foundTrack = tracks.find(t => String(t.id) === trackId)
      if (foundTrack) return foundTrack
    }
    return null
  }, [trackId, fetchedTrack, tracks])

  const openAddMissionsModal = async () => {
    setSelectedMissionIds(new Set())
    setAddMissionsError(null)
    setAddMissionsSuccess(null)
    setShowAddMissionsModal(true)
    try {
      const { results } = await missionsClient.getAllMissionsAdmin()
      setMissions(results)
    } catch (err) {
      console.error('Failed to load missions:', err)
      setAddMissionsError('Failed to load missions.')
    }
  }

  const toggleMission = (missionId: string) => {
    setSelectedMissionIds(prev => {
      const next = new Set(prev)
      if (next.has(missionId)) next.delete(missionId)
      else next.add(missionId)
      return next
    })
  }

  const handleAddMissions = async () => {
    if (!cohortId || selectedMissionIds.size === 0) {
      setAddMissionsError('Select at least one mission.')
      return
    }
    setAddMissionsError(null)
    setAddMissionsLoading(true)
    try {
      await Promise.all(
        Array.from(selectedMissionIds).map(missionId =>
          missionsClient.assignMissionToCohort(missionId, cohortId)
        )
      )
      setAddMissionsSuccess(`Added ${selectedMissionIds.size} mission(s) to this cohort.`)
      setShowAddMissionsModal(false)
      setSelectedMissionIds(new Set())
      const updated = await programsClient.getCohortMissions(cohortId)
      setCohortMissions(updated)
    } catch (err: unknown) {
      setAddMissionsError(err instanceof Error ? err.message : 'Failed to add missions to cohort.')
    } finally {
      setAddMissionsLoading(false)
    }
  }

  if (loadingCohort || isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading cohort...</p>
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
                <h1 className="text-4xl font-bold mb-2 text-och-defender">{cohort.name}</h1>
                <div className="flex items-center gap-3">
                  <Badge variant="defender">{cohort.status}</Badge>
                  <span className="text-och-steel">
                    {cohort.track_name ||
                      (cohort.track && typeof cohort.track === 'object' && 'name' in cohort.track
                        ? (cohort.track as { name: string }).name
                        : null) ||
                      currentTrack?.name ||
                      'N/A'}
                  </span>
                  {cohort.start_date && (
                    <span className="text-och-steel">
                      {new Date(cohort.start_date).toLocaleDateString()} - {cohort.end_date ? new Date(cohort.end_date).toLocaleDateString() : 'Ongoing'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={openAddMissionsModal}
                >
                  <Target className="w-3.5 h-3.5" />
                  Add Missions
                </Button>
                <Link href={`/dashboard/director/cohorts/${cohortId}/edit`}>
                  <Button variant="defender" size="sm">
                    Edit Cohort
                  </Button>
                </Link>
                <Link href="/dashboard/director/cohorts">
                  <Button variant="outline" size="sm">
                    ← Back
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Hero Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Seat Utilization</p>
                <p className="text-2xl font-bold text-white">{seatUtilization.toFixed(1)}%</p>
                <ProgressBar value={seatUtilization} variant="mint" className="mt-2" />
                <p className="text-xs text-och-steel mt-1">
                  {activeEnrollments.length} / {cohort.seat_cap} seats
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-white">{completionRate.toFixed(1)}%</p>
                <ProgressBar value={completionRate} variant="defender" className="mt-2" />
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Mentors Assigned</p>
                <p className="text-2xl font-bold text-white">{mentors.length}</p>
                <p className="text-xs text-och-steel mt-1">
                  Ratio: 1:{Math.round(1 / (cohort.mentor_ratio || 0.1))}
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Upcoming Events</p>
                <p className="text-2xl font-bold text-white">
                  {calendarEvents.filter(e => new Date(e.start_ts) > new Date()).length}
                </p>
                <p className="text-xs text-och-steel mt-1">Next 30 days</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cohort Details */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Cohort Details</h2>
                    <Button
                      variant="defender"
                      size="sm"
                      onClick={() => {
                        setShowTrackAssignmentModal(true)
                        setSelectedTrackIds(cohort.curriculum_tracks && Array.isArray(cohort.curriculum_tracks) ? cohort.curriculum_tracks : [])
                        setTrackAssignmentError(null)
                        setTrackAssignmentSuccess(null)
                      }}
                    >
                      {cohort.curriculum_tracks && Array.isArray(cohort.curriculum_tracks) && cohort.curriculum_tracks.length > 0 ? 'Change Tracks' : 'Assign Tracks'}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-och-steel">Curriculum Tracks</span>
                      <div className="flex flex-col items-end gap-1">
                        {cohort.curriculum_tracks && Array.isArray(cohort.curriculum_tracks) && cohort.curriculum_tracks.length > 0 ? (
                          cohort.curriculum_tracks.map((trackSlug: string) => {
                            const currTrack = curriculumTracks.find(t => t.slug === trackSlug)
                            return (
                              <Badge key={trackSlug} variant="mint" className="text-xs">
                                {currTrack?.title || currTrack?.name || trackSlug}
                              </Badge>
                            )
                          })
                        ) : (
                          <span className="text-och-steel italic text-sm">No curriculum tracks assigned</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Mode</span>
                      <span className="text-white capitalize">{cohort.mode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Start Date</span>
                      <span className="text-white">{cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">End Date</span>
                      <span className="text-white">{cohort.end_date ? new Date(cohort.end_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Seat Capacity</span>
                      <span className="text-white">{cohort.seat_cap}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Mentor Ratio</span>
                      <span className="text-white">1:{Math.round(1 / (cohort.mentor_ratio || 0.1))}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Missions assigned to this cohort */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Missions assigned to this cohort</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={openAddMissionsModal}
                    >
                      <Target className="w-3.5 h-3.5" />
                      Add Missions
                    </Button>
                  </div>
                  {cohortMissions.length === 0 ? (
                    <p className="text-och-steel text-sm">No missions assigned yet. Use &quot;Add Missions&quot; to assign missions to this cohort.</p>
                  ) : (
                    <ul className="space-y-2">
                      {cohortMissions.map((m, i) => (
                        <li key={`${m.id}-${i}`} className="flex items-center justify-between gap-3 py-2 border-b border-och-steel/20 last:border-0">
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/dashboard/director/missions/${m.id}`}
                              className="text-white font-medium hover:text-och-defender truncate block"
                            >
                              {m.title}
                            </Link>
                            <div className="flex items-center gap-2 text-xs text-och-steel mt-0.5">
                              <span>{m.mission_type}</span>
                              <span>·</span>
                              <span>{m.estimated_duration_min} min</span>
                              <span className="capitalize">· {m.assignment_status}</span>
                            </div>
                          </div>
                          <Link href={`/dashboard/director/missions/${m.id}`}>
                            <Button variant="outline" size="sm">
                              View details
                            </Button>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>

              {/* Homepage applications (student/sponsor) */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Homepage Applications</h2>
                    <Link
                      href={`/dashboard/director/applications?cohort_id=${cohortId}`}
                      className="text-sm text-och-mint hover:underline inline-flex items-center gap-1"
                    >
                      View all <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  {applicationsLoadError ? (
                    <p className="text-och-orange text-sm">{applicationsLoadError}</p>
                  ) : publicApplications.length === 0 ? (
                    <p className="text-och-steel text-sm">No applications from homepage yet. When this cohort is published, applications appear here.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-och-steel/20">
                            <th className="text-left py-2 text-xs font-medium text-och-steel">Date</th>
                            <th className="text-left py-2 text-xs font-medium text-och-steel">Type</th>
                            <th className="text-left py-2 text-xs font-medium text-och-steel">Name</th>
                            <th className="text-left py-2 text-xs font-medium text-och-steel">Email</th>
                            <th className="text-left py-2 text-xs font-medium text-och-steel">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {publicApplications.slice(0, 10).map((app) => (
                            <tr key={app.id} className="border-b border-och-steel/10">
                              <td className="py-2 text-och-steel">{new Date(app.created_at).toLocaleDateString()}</td>
                              <td className="py-2">
                                {app.applicant_type === 'student' ? (
                                  <Badge variant="defender" className="gap-0.5 text-xs">
                                    <GraduationCap className="w-3 h-3" /> Student
                                  </Badge>
                                ) : (
                                  <Badge variant="gold" className="gap-0.5 text-xs">
                                    <Users className="w-3 h-3" /> Sponsor
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2 text-white">{app.name || '-'}</td>
                              <td className="py-2 text-och-steel">{app.email || '-'}</td>
                              <td className="py-2"><Badge variant={app.status === 'pending' ? 'steel' : app.status === 'approved' || app.status === 'converted' ? 'defender' : 'orange'}>{app.status}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {publicApplications.length > 10 && (
                        <Link
                          href={`/dashboard/director/applications?cohort_id=${cohortId}`}
                          className="block text-center text-och-mint text-sm mt-2 hover:underline"
                        >
                          View all {publicApplications.length} applications
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Seat Pool Breakdown */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Seat Allocation</h2>
                  
                  {seatAllocationData.length > 0 ? (
                    <>
                      <div className="mb-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={seatAllocationData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={CustomLabel}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {seatAllocationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              formatter={(value, entry: any) => (
                                <span className="text-och-steel text-sm">
                                  {value}: {entry.payload.value} seats ({entry.payload.percentage}%)
                                </span>
                              )}
                              iconType="circle"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Summary Stats */}
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-och-steel/20">
                        {seatAllocationData.map((item) => (
                          <div key={item.name} className="text-center">
                            <div 
                              className="w-3 h-3 rounded-full mx-auto mb-1"
                              style={{ backgroundColor: item.color }}
                            />
                            <p className="text-xs text-och-steel">{item.name}</p>
                            <p className="text-sm font-bold text-white">{item.value}</p>
                            <p className="text-xs text-och-steel">{item.percentage}%</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-och-steel/20">
                        <div className="flex justify-between text-sm">
                          <span className="text-och-steel">Total Allocated:</span>
                          <span className="text-white font-semibold">
                            {(seatPool.paid || 0) + (seatPool.scholarship || 0) + (seatPool.sponsored || 0)} / {cohort.seat_cap}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-och-steel">Available:</span>
                          <span className="text-white font-semibold">
                            {Math.max(0, (cohort.seat_cap || 0) - ((seatPool.paid || 0) + (seatPool.scholarship || 0) + (seatPool.sponsored || 0)))}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-och-steel">
                      <p>No seat allocation data available</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Enrollments */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Enrollments ({enrollments.length})</h2>
                    <Link href={`/dashboard/director/cohorts/${cohortId}/enrollments`}>
                      <Button variant="defender" size="sm">
                        Manage Enrollments
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {enrollments.slice(0, 5).map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between p-3 bg-och-midnight/50 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{enrollment.user_name || enrollment.user_email}</p>
                          <p className="text-xs text-och-steel">{enrollment.enrollment_type} • {enrollment.seat_type}</p>
                        </div>
                        <Badge variant={enrollment.status === 'active' ? 'mint' : 'orange'}>
                          {enrollment.status}
                        </Badge>
                      </div>
                    ))}
                    {enrollments.length > 5 && (
                      <p className="text-sm text-och-steel text-center pt-2">
                        +{enrollments.length - 5} more enrollments
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Calendar Events */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
                    <Button variant="outline" size="sm">
                      View Calendar
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {calendarEvents
                      .filter(e => new Date(e.start_ts) > new Date())
                      .sort((a, b) => new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime())
                      .slice(0, 5)
                      .map((event) => (
                        <div key={event.id} className="p-3 bg-och-midnight/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white font-medium">{event.title}</p>
                              <p className="text-xs text-och-steel">
                                {new Date(event.start_ts).toLocaleString()} • {event.type}
                              </p>
                            </div>
                            <Badge variant="defender">{event.status}</Badge>
                          </div>
                        </div>
                      ))}
                    {calendarEvents.filter(e => new Date(e.start_ts) > new Date()).length === 0 && (
                      <p className="text-sm text-och-steel text-center py-4">No upcoming events</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Analytics & Actions */}
            <div className="space-y-6">
              {/* Analytics Summary */}
              {dashboard && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Analytics Summary</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-och-steel text-sm mb-1">Readiness Score</p>
                        <p className="text-2xl font-bold text-white">{dashboard.readiness_delta.toFixed(1)}%</p>
                        <ProgressBar value={dashboard.readiness_delta} variant="mint" className="mt-2" />
                      </div>
                      <div>
                        <p className="text-och-steel text-sm mb-1">Mentor Coverage</p>
                        <p className="text-2xl font-bold text-white">{dashboard.mentor_assignments_count}</p>
                      </div>
                      <div>
                        <p className="text-och-steel text-sm mb-1">Payments</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-och-steel">Complete</span>
                            <span className="text-white">{dashboard.payments_complete}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-och-steel">Pending</span>
                            <span className="text-och-orange">{dashboard.payments_pending}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Mentors */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Mentors ({mentors.length})</h2>
                    <Link href={`/dashboard/director/cohorts/${cohortId}/assign-mentors`}>
                      <Button variant="defender" size="sm">
                        Assign Mentors
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {mentors.map((mentor) => (
                      <div key={mentor.id} className="p-3 bg-och-midnight/50 rounded-lg">
                        <p className="text-white font-medium">{mentor.mentor_name || mentor.mentor_email}</p>
                        <p className="text-xs text-och-steel capitalize">{mentor.role}</p>
                      </div>
                    ))}
                    {mentors.length === 0 && (
                      <p className="text-sm text-och-steel text-center py-4">No mentors assigned</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      📊 Export Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      🎓 Auto-Graduate
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      📅 Manage Calendar
                    </Button>
                    <Link href={`/dashboard/director/cohorts/${cohortId}/enrollments`} className="w-full">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        👥 Manage Enrollments
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      ⚙️ Program Rules
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Track Assignment Modal */}
        {showTrackAssignmentModal && (
          <div className="fixed inset-0 bg-och-midnight/90 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Assign Curriculum Tracks to Cohort
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowTrackAssignmentModal(false)
                      setSelectedTrackIds([])
                      setTrackAssignmentError(null)
                      setTrackAssignmentSuccess(null)
                    }}
                  >
                    ✕
                  </Button>
                </div>

                <p className="text-sm text-och-steel mb-4">
                  Select one or more curriculum tracks to assign to <span className="text-white font-medium">{cohort.name}</span>
                </p>

                {trackAssignmentError && (
                  <div className="mb-4 p-3 bg-och-orange/20 border border-och-orange/50 rounded text-sm text-och-orange">
                    {trackAssignmentError}
                  </div>
                )}

                {trackAssignmentSuccess && (
                  <div className="mb-4 p-3 bg-och-mint/20 border border-och-mint/50 rounded text-sm text-och-mint">
                    {trackAssignmentSuccess}
                  </div>
                )}

                {curriculumTracks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-och-steel mb-4">No curriculum tracks available</div>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard/director/tracks')}
                    >
                      Create Track
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 max-h-96 overflow-y-auto border border-och-steel/20 rounded-lg">
                      {curriculumTracks.map((track) => (
                        <label
                          key={track.slug}
                          className="flex items-start gap-3 p-3 hover:bg-och-steel/10 cursor-pointer border-b border-och-steel/10 last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTrackIds.includes(track.slug)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTrackIds([...selectedTrackIds, track.slug])
                              } else {
                                setSelectedTrackIds(selectedTrackIds.filter(id => id !== track.slug))
                              }
                            }}
                            className="mt-1 rounded border-och-steel/40 text-och-defender focus:ring-och-defender"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium">{track.title || track.name}</span>
                              <Badge variant="mint" className="text-xs">{track.code}</Badge>
                            </div>
                            <p className="text-xs text-och-steel">{track.slug}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {selectedTrackIds.length > 0 && (
                      <div className="mb-4 p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                        <p className="text-sm text-och-steel mb-2">Selected tracks ({selectedTrackIds.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedTrackIds.map((slug) => {
                            const track = curriculumTracks.find(t => t.slug === slug)
                            return (
                              <Badge key={slug} variant="defender" className="text-xs">
                                {track?.title || track?.name || slug}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-6">
                      <Button
                        variant="defender"
                        onClick={handleAssignTrack}
                        disabled={selectedTrackIds.length === 0 || isUpdatingTrack}
                      >
                        {isUpdatingTrack ? 'Assigning...' : 'Assign Tracks'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowTrackAssignmentModal(false)
                          setSelectedTrackIds([])
                          setTrackAssignmentError(null)
                          setTrackAssignmentSuccess(null)
                        }}
                        disabled={isUpdatingTrack}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Add Missions Modal */}
        <Dialog open={showAddMissionsModal} onOpenChange={setShowAddMissionsModal}>
          <DialogContent className="max-w-md border-och-steel/20 bg-och-midnight">
            <DialogHeader>
              <DialogTitle className="text-white">Add missions to cohort</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {addMissionsError && (
                <p className="text-sm text-red-400" role="alert">{addMissionsError}</p>
              )}
              {addMissionsSuccess && (
                <p className="text-sm text-och-mint" role="status">{addMissionsSuccess}</p>
              )}
              <p className="text-sm text-och-steel">Select one or more missions to assign to this cohort:</p>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-och-steel/20 rounded-lg p-2">
                {missions.length === 0 && !addMissionsError && (
                  <p className="text-sm text-och-steel">Loading missions…</p>
                )}
                {missions.map((m) => (
                  <label
                    key={m.id ?? ''}
                    className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-och-steel/10"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMissionIds.has(m.id ?? '')}
                      onChange={() => toggleMission(m.id ?? '')}
                      className="rounded border-och-steel/40 text-och-defender focus:ring-och-defender"
                    />
                    <span className="text-sm text-white">{m.title ?? m.code ?? 'Untitled'}</span>
                    {m.difficulty && (
                      <span className="text-xs text-och-steel capitalize">{m.difficulty}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowAddMissionsModal(false)}>
                Cancel
              </Button>
              <Button
                variant="defender"
                onClick={handleAddMissions}
                disabled={addMissionsLoading || selectedMissionIds.size === 0}
              >
                {addMissionsLoading ? 'Adding…' : 'Add Missions'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DirectorLayout>
    </RouteGuard>
  )
}


