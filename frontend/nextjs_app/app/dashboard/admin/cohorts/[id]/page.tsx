'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useCohort } from '@/hooks/usePrograms'
import { programsClient, type Enrollment, type MentorAssignment, type Track, type Program } from '@/services/programsClient'
import { apiGateway } from '@/services/apiGateway'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

interface CohortDetailData {
  cohort_id: string
  name: string
  program_name: string
  track_name?: string
  enrollment: {
    active: number
    pending: number
    withdrawn: number
    paid: number
    scholarship: number
    sponsored: number
  }
  mentors: Array<{
    mentor_id: string
    name: string
    sessions_completed: number
    capacity_used: number
  }>
  readiness_distribution: Record<string, number>
  mission_funnel: {
    assigned: number
    in_review: number
    approved: number
    stuck: number
  }
  metrics: {
    readiness_avg: number
    completion_pct: number
    mentor_coverage_pct: number
    portfolio_health_avg: number
  }
  alerts: string[]
}

// Icon components
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const AwardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-och-midnight border border-och-steel/20 rounded-lg p-3 shadow-lg">
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-white text-sm mb-1">
            <span style={{ color: entry.color }}>{entry.name}:</span> {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AdminCohortDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cohortId = params.id as string

  const { cohort, isLoading: loadingCohort } = useCohort(cohortId)
  const [cohortDetail, setCohortDetail] = useState<CohortDetailData | null>(null)
  const [track, setTrack] = useState<Track | null>(null)
  const [program, setProgram] = useState<Program | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [mentors, setMentors] = useState<MentorAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(true)

  useEffect(() => {
    if (cohortId) {
      loadCohortData()
      loadCohortDetail()
    }
  }, [cohortId])

  useEffect(() => {
    if (cohort?.track) {
      loadTrackAndProgram(cohort.track)
    }
  }, [cohort?.track])

  const loadCohortData = async () => {
    try {
      setIsLoading(true)
      const [enrolls, mentorAssignments] = await Promise.all([
        programsClient.getCohortEnrollments(cohortId),
        programsClient.getCohortMentors(cohortId),
      ])
      setEnrollments(enrolls)
      setMentors(mentorAssignments.filter((m: MentorAssignment) => m.active))
    } catch (error) {
      console.error('Failed to load cohort data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCohortDetail = async () => {
    try {
      setIsLoadingDetail(true)
      const data = await programsClient.getDirectorCohortDetail(cohortId)
      setCohortDetail(data)
    } catch (error) {
      console.error('Failed to load cohort detail:', error)
      // Set default structure if API fails
      setCohortDetail({
        cohort_id: cohortId,
        name: cohort?.name || 'Unknown Cohort',
        program_name: '',
        enrollment: {
          active: enrollments.filter((e) => e.status === 'active').length,
          pending: enrollments.filter((e) => e.status === 'pending').length,
          withdrawn: enrollments.filter((e) => e.status === 'withdrawn').length,
          paid: enrollments.filter((e) => e.status === 'active' && e.payment_status === 'paid').length,
          scholarship: enrollments.filter((e) => e.status === 'active' && e.seat_type === 'scholarship').length,
          sponsored: enrollments.filter((e) => e.status === 'active' && e.seat_type === 'sponsored').length,
        },
        mentors: [],
        readiness_distribution: {},
        mission_funnel: {
          assigned: 0,
          in_review: 0,
          approved: 0,
          stuck: 0,
        },
        metrics: {
          readiness_avg: 0,
          completion_pct: 0,
          mentor_coverage_pct: 0,
          portfolio_health_avg: 0,
        },
        alerts: [],
      })
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const loadTrackAndProgram = async (trackId: string) => {
    try {
      const trackData = await programsClient.getTrack(trackId)
      setTrack(trackData)
      if (trackData.program) {
        const programData = await programsClient.getProgram(trackData.program)
        setProgram(programData)
      }
    } catch (error) {
      console.error('Failed to load track/program:', error)
    }
  }

  // Calculate derived values - must be before early returns (Rules of Hooks)
  const detail = cohortDetail || {
    cohort_id: cohortId,
    name: cohort?.name || 'Unknown Cohort',
    program_name: program?.name || '',
    track_name: track?.name || cohort?.track_name || '',
    enrollment: {
      active: enrollments.filter((e) => e.status === 'active').length,
      pending: enrollments.filter((e) => e.status === 'pending').length,
      withdrawn: enrollments.filter((e) => e.status === 'withdrawn').length,
      paid: enrollments.filter((e) => e.status === 'active' && e.payment_status === 'paid').length,
      scholarship: enrollments.filter((e) => e.status === 'active' && e.seat_type === 'scholarship').length,
      sponsored: enrollments.filter((e) => e.status === 'active' && e.seat_type === 'sponsored').length,
    },
    mentors: [],
    readiness_distribution: {},
    mission_funnel: {
      assigned: 0,
      in_review: 0,
      approved: 0,
      stuck: 0,
    },
    metrics: {
      readiness_avg: 0,
      completion_pct: 0,
      mentor_coverage_pct: 0,
      portfolio_health_avg: 0,
    },
    alerts: [],
  }

  const seatUtilization = cohort?.seat_utilization || (detail.enrollment.active / (cohort?.seat_cap || 1)) * 100

  // Prepare enrollment status data for pie chart - must be before early returns
  const enrollmentStatusData = useMemo(() => {
    return [
      {
        name: 'Active',
        value: detail.enrollment.active,
        color: '#33FFC1',
      },
      {
        name: 'Pending',
        value: detail.enrollment.pending,
        color: '#F59E0B',
      },
      {
        name: 'Withdrawn',
        value: detail.enrollment.withdrawn,
        color: '#EF4444',
      },
    ].filter((item) => item.value > 0)
  }, [detail.enrollment])

  // Prepare seat type data for pie chart - must be before early returns
  const seatTypeData = useMemo(() => {
    const total = detail.enrollment.paid + detail.enrollment.scholarship + detail.enrollment.sponsored
    const available = Math.max(0, (cohort?.seat_cap || 0) - total)
    return [
      {
        name: 'Paid',
        value: detail.enrollment.paid,
        color: '#10B981',
      },
      {
        name: 'Scholarship',
        value: detail.enrollment.scholarship,
        color: '#F59E0B',
      },
      {
        name: 'Sponsored',
        value: detail.enrollment.sponsored,
        color: '#0648A8',
      },
      ...(available > 0
        ? [
            {
              name: 'Available',
              value: available,
              color: '#6B7280',
            },
          ]
        : []),
    ].filter((item) => item.value > 0)
  }, [detail.enrollment, cohort?.seat_cap])

  // Prepare readiness distribution data - must be before early returns
  const readinessData = useMemo(() => {
    const dist = detail.readiness_distribution || {}
    return [
      { range: '0-20', value: dist['0-20'] || 0 },
      { range: '21-40', value: dist['21-40'] || 0 },
      { range: '41-60', value: dist['41-60'] || 0 },
      { range: '61-80', value: dist['61-80'] || 0 },
      { range: '81-100', value: dist['81-100'] || 0 },
    ]
  }, [detail.readiness_distribution])

  // Prepare mission funnel data - must be before early returns
  const missionFunnelData = useMemo(() => {
    return [
      { stage: 'Assigned', value: detail.mission_funnel.assigned, color: '#0648A8' },
      { stage: 'In Review', value: detail.mission_funnel.in_review, color: '#F59E0B' },
      { stage: 'Approved', value: detail.mission_funnel.approved, color: '#33FFC1' },
      { stage: 'Stuck', value: detail.mission_funnel.stuck, color: '#EF4444' },
    ]
  }, [detail.mission_funnel])

  // Early returns after all hooks
  if (loadingCohort || isLoading) {
    return (
      <RouteGuard requiredRoles={['admin']}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading cohort details...</p>
            </div>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  if (!cohort) {
    return (
      <RouteGuard requiredRoles={['admin']}>
        <AdminLayout>
          <div className="p-6">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
              <ArrowLeftIcon />
              <span className="ml-2">Back</span>
            </Button>
            <Card className="p-12">
              <div className="text-center text-och-steel">
                <p className="text-lg mb-2">Cohort not found</p>
                <p className="text-sm">The cohort you're looking for doesn't exist or has been removed.</p>
              </div>
            </Card>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requiredRoles={['admin']}>
      <AdminLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeftIcon />
                <span className="ml-2">Back</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">{cohort.name}</h1>
                <div className="flex items-center gap-4 mt-1">
                  {program && (
                    <p className="text-och-steel">
                      <span className="font-medium">Program:</span> {program.name}
                    </p>
                  )}
                  {track && (
                    <p className="text-och-steel">
                      <span className="font-medium">Track:</span> {track.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Badge variant={cohort.status === 'active' || cohort.status === 'running' ? 'mint' : 'steel'}>
              {cohort.status}
            </Badge>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-och-steel text-sm">Total Enrollments</span>
                  <UsersIcon />
                </div>
                <p className="text-3xl font-bold text-white">{detail.enrollment.active}</p>
                <p className="text-xs text-och-steel mt-1">Active students</p>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-och-steel text-sm">Seat Utilization</span>
                  <CalendarIcon />
                </div>
                <p className="text-3xl font-bold text-och-mint">{seatUtilization.toFixed(0)}%</p>
                <p className="text-xs text-och-steel mt-1">
                  {detail.enrollment.active} / {cohort.seat_cap} seats
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-och-steel text-sm">Readiness Score</span>
                  <AwardIcon />
                </div>
                <p className="text-3xl font-bold text-och-gold">{detail.metrics.readiness_avg.toFixed(1)}</p>
                <p className="text-xs text-och-steel mt-1">Average readiness</p>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-och-steel text-sm">Completion Rate</span>
                  <AwardIcon />
                </div>
                <p className="text-3xl font-bold text-och-defender">{detail.metrics.completion_pct.toFixed(0)}%</p>
                <p className="text-xs text-och-steel mt-1">Program completion</p>
              </div>
            </Card>
          </div>

          {/* Cohort Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Cohort Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-och-steel">Mode</span>
                    <span className="text-white capitalize">{cohort.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-och-steel">Start Date</span>
                    <span className="text-white">
                      {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-och-steel">End Date</span>
                    <span className="text-white">
                      {cohort.end_date ? new Date(cohort.end_date).toLocaleDateString() : 'N/A'}
                    </span>
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

            {program && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Program Information</h2>
                  <div className="space-y-3">
                    <div>
                      <span className="text-och-steel text-sm">Program Name</span>
                      <p className="text-white font-medium mt-1">{program.name}</p>
                    </div>
                    <div>
                      <span className="text-och-steel text-sm">Category</span>
                      <p className="text-white font-medium mt-1 capitalize">{program.category}</p>
                    </div>
                    <div>
                      <span className="text-och-steel text-sm">Duration</span>
                      <p className="text-white font-medium mt-1">{program.duration_months} months</p>
                    </div>
                    {program.description && (
                      <div>
                        <span className="text-och-steel text-sm">Description</span>
                        <p className="text-white text-sm mt-1 line-clamp-3">{program.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {track && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Track Information</h2>
                  <div className="space-y-3">
                    <div>
                      <span className="text-och-steel text-sm">Track Name</span>
                      <p className="text-white font-medium mt-1">{track.name}</p>
                    </div>
                    <div>
                      <span className="text-och-steel text-sm">Track Key</span>
                      <p className="text-white font-medium mt-1">{track.key}</p>
                    </div>
                    <div>
                      <span className="text-och-steel text-sm">Type</span>
                      <p className="text-white font-medium mt-1 capitalize">{track.track_type}</p>
                    </div>
                    {track.description && (
                      <div>
                        <span className="text-och-steel text-sm">Description</span>
                        <p className="text-white text-sm mt-1 line-clamp-3">{track.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment Status Distribution */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Enrollment Status</h2>
                {isLoadingDetail ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={enrollmentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {enrollmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Seat Type Distribution */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Seat Allocation</h2>
                {isLoadingDetail ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={seatTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {seatTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Readiness Distribution */}
            {readinessData.some((d) => d.value > 0) && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Readiness Distribution</h2>
                  {isLoadingDetail ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={readinessData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="range" stroke="#64748B" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#33FFC1" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            )}

            {/* Mission Funnel */}
            {missionFunnelData.some((d) => d.value > 0) && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Mission Funnel</h2>
                  {isLoadingDetail ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={missionFunnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="stage" stroke="#64748B" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {missionFunnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Performance Metrics Radar Chart */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Performance Overview</h2>
              {isLoadingDetail ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={[
                    {
                      metric: 'Readiness',
                      value: detail.metrics.readiness_avg,
                      fullMark: 100,
                    },
                    {
                      metric: 'Completion',
                      value: detail.metrics.completion_pct,
                      fullMark: 100,
                    },
                    {
                      metric: 'Mentor Coverage',
                      value: detail.metrics.mentor_coverage_pct,
                      fullMark: 100,
                    },
                    {
                      metric: 'Portfolio Health',
                      value: detail.metrics.portfolio_health_avg,
                      fullMark: 100,
                    },
                    {
                      metric: 'Seat Utilization',
                      value: seatUtilization,
                      fullMark: 100,
                    },
                  ]}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: '#94A3B8', fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: '#64748B', fontSize: 10 }}
                    />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke="#33FFC1"
                      fill="#33FFC1"
                      fillOpacity={0.6}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Assigned Mentors */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Assigned Mentors</h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-och-mint"></div>
                </div>
              ) : mentors.length === 0 ? (
                <div className="text-center py-8 text-och-steel">
                  <p>No mentors assigned to this cohort</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mentors.map((mentor) => (
                    <div
                      key={mentor.id}
                      className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-defender/40 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/admin/users/mentors/${mentor.mentor}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {mentor.mentor_name || mentor.mentor_email || 'Unknown Mentor'}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="steel" className="text-xs">
                              {mentor.role}
                            </Badge>
                            {mentor.active && <Badge variant="mint" className="text-xs">Active</Badge>}
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-och-steel"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Alerts */}
          {detail.alerts && detail.alerts.length > 0 && (
            <Card className="border-och-orange/50">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Alerts & Flags</h2>
                <div className="space-y-2">
                  {detail.alerts.map((alert, index) => (
                    <div key={index} className="p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg">
                      <p className="text-white text-sm">{alert}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
