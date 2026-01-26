'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { programsClient } from '@/services/programsClient'
import { djangoClient } from '@/services/djangoClient'
import { useCohorts, usePrograms, useTracks } from '@/hooks/usePrograms'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

interface Mentor {
  id: string | number
  email: string
  name?: string
  first_name?: string
  last_name?: string
  username?: string
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
  activity_over_time?: Array<{
    date: string
    sessions: number
    reviews: number
    feedback: number
  }>
}

// Icon components
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const AwardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const TargetIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const MessageSquareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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

export default function MentorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const mentorId = params.id as string

  const [mentor, setMentor] = useState<Mentor | null>(null)
  const [analytics, setAnalytics] = useState<MentorAnalytics | null>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true)
  
  // Load cohorts, programs, and tracks for assignment details
  const { cohorts, isLoading: cohortsLoading } = useCohorts({ page: 1, pageSize: 500 })
  const { programs, isLoading: programsLoading } = usePrograms()
  const { tracks, isLoading: tracksLoading } = useTracks()

  useEffect(() => {
    if (mentorId) {
      loadMentorData()
      loadMentorAnalytics()
    }
  }, [mentorId])

  useEffect(() => {
    if (mentorId && !cohortsLoading && cohorts.length > 0) {
      loadMentorAssignments()
    }
  }, [mentorId, cohorts, cohortsLoading])

  const loadMentorData = async () => {
    try {
      setIsLoading(true)
      const user = await djangoClient.users.getUser(Number(mentorId))
      setMentor({
        id: user.id,
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        is_mentor: (user as any).is_mentor ?? false,
        mentor_capacity_weekly: (user as any).mentor_capacity_weekly,
        mentor_availability: (user as any).mentor_availability,
        mentor_specialties: (user as any).mentor_specialties,
        roles: user.roles as any,
        account_status: user.account_status,
        is_active: user.is_active,
      })
    } catch (error) {
      console.error('Failed to load mentor:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMentorAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true)
      const data = await programsClient.getMentorAnalytics(mentorId)
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load mentor analytics:', error)
      // Set default analytics structure if API fails
      setAnalytics({
        mentor_id: mentorId,
        mentor_name: mentor?.name || 'Unknown',
        metrics: {
          total_mentees: 0,
          active_cohorts: 0,
          session_completion_rate: 0,
          feedback_average: 0,
          mentee_completion_rate: 0,
          impact_score: 0,
          sessions_scheduled: 0,
          sessions_completed: 0,
          sessions_missed: 0,
          average_session_rating: 0,
          mentee_satisfaction_score: 0,
        },
        assignments: [],
        cohorts: [],
        reviews: [],
        mentee_goals: [],
      })
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  const loadMentorAssignments = async () => {
    if (!mentorId || cohorts.length === 0) return
    
    setIsLoadingAssignments(true)
    try {
      const mentorAssignments: any[] = []
      
      // Fetch assignments from each cohort
      for (const cohort of cohorts) {
        try {
          const cohortAssignments = await programsClient.getCohortMentors(String(cohort.id))
          const mentorAssignment = cohortAssignments.find(
            (assignment: any) => String(assignment.mentor) === String(mentorId)
          )
          
          if (mentorAssignment && mentorAssignment.active) {
            // Get cohort details
            const cohortDetails = cohorts.find(c => String(c.id) === String(cohort.id))
            const track = tracks.find(t => String(t.id) === String(cohort?.track))
            const program = programs.find(p => String(p.id) === String(track?.program))
            
            mentorAssignments.push({
              ...mentorAssignment,
              cohort_details: cohortDetails,
              track: track,
              program: program,
              enrollment_count: cohortDetails?.enrolled_count || 0,
            })
          }
        } catch (err) {
          console.error(`Failed to load assignments for cohort ${cohort.id}:`, err)
        }
      }
      
      setAssignments(mentorAssignments)
      
      // Update analytics with assignment count if available
      if (analytics) {
        setAnalytics({
          ...analytics,
          metrics: {
            ...analytics.metrics,
            active_cohorts: mentorAssignments.length,
          },
        })
      }
    } catch (err) {
      console.error('Failed to load mentor assignments:', err)
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  // Prepare activity chart data
  const activityChartData = useMemo(() => {
    if (!analytics?.activity_over_time || analytics.activity_over_time.length === 0) {
      // Generate mock data for last 30 days if no data available
      const data = []
      const now = new Date()
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sessions: Math.floor(Math.random() * 5),
          reviews: Math.floor(Math.random() * 3),
          feedback: Math.floor(Math.random() * 4),
        })
      }
      return data
    }
    return analytics.activity_over_time.map((item) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: item.sessions,
      reviews: item.reviews,
      feedback: item.feedback,
    }))
  }, [analytics])

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading mentor details...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (!mentor) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">Mentor not found</p>
            <Button onClick={() => router.push('/dashboard/director/mentors')} variant="outline">
              <span className="mr-2"><ArrowLeftIcon /></span>
              Back to Mentors
            </Button>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  const metrics = analytics?.metrics || {
    total_mentees: 0,
    active_cohorts: 0,
    session_completion_rate: 0,
    feedback_average: 0,
    mentee_completion_rate: 0,
    impact_score: 0,
    sessions_scheduled: 0,
    sessions_completed: 0,
    sessions_missed: 0,
    average_session_rating: 0,
    mentee_satisfaction_score: 0,
  }

  const capacityUtilization = mentor.mentor_capacity_weekly
    ? (metrics.sessions_completed / mentor.mentor_capacity_weekly) * 100
    : 0

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              onClick={() => router.push('/dashboard/director/mentors')}
              variant="outline"
              size="sm"
              className="mb-4"
            >
              <span className="mr-2"><ArrowLeftIcon /></span>
              Back to Mentors
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-gold flex items-center gap-3">
                  <UserIcon />
                  {mentor.name || mentor.email}
                </h1>
                <p className="text-och-steel">{mentor.email}</p>
              </div>
              <Badge
                variant={mentor.is_active && mentor.account_status === 'active' ? 'mint' : 'steel'}
              >
                {mentor.account_status || (mentor.is_active ? 'Active' : 'Inactive')}
              </Badge>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-och-steel text-sm">Total Mentees</span>
                  <UsersIcon />
                </div>
                <p className="text-3xl font-bold text-white">{metrics.total_mentees || assignments.reduce((sum, a) => sum + (a.enrollment_count || 0), 0)}</p>
                <p className="text-xs text-och-steel mt-1">Across all cohorts</p>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-och-steel text-sm">Active Cohorts</span>
                  <CalendarIcon />
                </div>
                <p className="text-3xl font-bold text-och-mint">{assignments.length || metrics.active_cohorts}</p>
                <p className="text-xs text-och-steel mt-1">Current assignments</p>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-och-steel text-sm">Session Completion</span>
                  <AwardIcon />
                </div>
                <p className="text-3xl font-bold text-och-gold">
                  {metrics.sessions_scheduled > 0 
                    ? ((metrics.sessions_completed / metrics.sessions_scheduled) * 100).toFixed(0)
                    : '0'
                  }%
                </p>
                <p className="text-xs text-och-steel mt-1">
                  {metrics.sessions_completed} / {metrics.sessions_scheduled} sessions
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-och-steel text-sm">Average Rating</span>
                  <TrendingUpIcon />
                </div>
                <p className="text-3xl font-bold text-och-defender">
                  {metrics.average_session_rating > 0 ? metrics.average_session_rating.toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-och-steel mt-1">Out of 5.0</p>
              </div>
            </Card>
          </div>

          {/* Additional Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-och-steel text-sm">Feedback Average</span>
                </div>
                <p className="text-2xl font-bold text-white">{metrics.feedback_average.toFixed(1)}/5.0</p>
                <ProgressBar value={(metrics.feedback_average / 5) * 100} className="mt-2" />
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-och-steel text-sm">Mentee Satisfaction</span>
                </div>
                <p className="text-2xl font-bold text-white">{metrics.mentee_satisfaction_score.toFixed(0)}%</p>
                <ProgressBar value={metrics.mentee_satisfaction_score} className="mt-2" />
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-och-steel text-sm">Mentee Completion Rate</span>
                </div>
                <p className="text-2xl font-bold text-white">{metrics.mentee_completion_rate.toFixed(0)}%</p>
                <ProgressBar value={metrics.mentee_completion_rate} className="mt-2" />
              </div>
            </Card>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Activity Chart */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Activity Over Time</h2>
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={activityChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#33FFC1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#33FFC1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0648A8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0648A8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="date" stroke="#64748B" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="sessions"
                        stroke="#33FFC1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSessions)"
                        name="Sessions"
                      />
                      <Area
                        type="monotone"
                        dataKey="reviews"
                        stroke="#0648A8"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorReviews)"
                        name="Reviews"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Session Statistics */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Session Statistics</h2>
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                    data={[
                      { name: 'Completed', value: metrics.sessions_completed, color: '#33FFC1' },
                      { name: 'Scheduled', value: metrics.sessions_scheduled, color: '#0648A8' },
                      { name: 'Missed', value: metrics.sessions_missed, color: '#EF4444' },
                    ]} 
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="name" stroke="#64748B" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {[
                        { name: 'Completed', value: metrics.sessions_completed, color: '#33FFC1' },
                        { name: 'Scheduled', value: metrics.sessions_scheduled, color: '#0648A8' },
                        { name: 'Missed', value: metrics.sessions_missed, color: '#EF4444' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Mentor Information */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Mentor Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-och-steel text-sm mb-1">Email</p>
                    <p className="text-white">{mentor.email}</p>
                  </div>
                  <div>
                    <p className="text-och-steel text-sm mb-1">Username</p>
                    <p className="text-white">{mentor.username || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-och-steel text-sm mb-1">Weekly Capacity</p>
                    <p className="text-white">{mentor.mentor_capacity_weekly || 0} hours/week</p>
                  </div>
                  {mentor.mentor_specialties && mentor.mentor_specialties.length > 0 && (
                    <div>
                      <p className="text-och-steel text-sm mb-2">Specialties</p>
                      <div className="flex flex-wrap gap-2">
                        {mentor.mentor_specialties.map((specialty, idx) => (
                          <Badge key={idx} variant="defender">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Performance Metrics</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-och-steel text-sm">Capacity Utilization</span>
                      <span className="text-white font-semibold">{capacityUtilization.toFixed(0)}%</span>
                    </div>
                    <ProgressBar value={Math.min(capacityUtilization, 100)} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-och-steel text-sm">Feedback Average</span>
                      <span className="text-white font-semibold">{metrics.feedback_average.toFixed(1)}/5.0</span>
                    </div>
                    <ProgressBar value={(metrics.feedback_average / 5) * 100} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-och-steel text-sm">Mentee Satisfaction</span>
                      <span className="text-white font-semibold">{metrics.mentee_satisfaction_score.toFixed(0)}%</span>
                    </div>
                    <ProgressBar value={metrics.mentee_satisfaction_score} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-och-steel text-sm">Mentee Completion Rate</span>
                      <span className="text-white font-semibold">{metrics.mentee_completion_rate.toFixed(0)}%</span>
                    </div>
                    <ProgressBar value={metrics.mentee_completion_rate} />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Detailed Assignments */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Cohort Assignments</h2>
                <Badge variant="defender">{assignments.length} Active</Badge>
              </div>
              
              {isLoadingAssignments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-och-steel">No active cohort assignments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => {
                    const cohort = assignment.cohort_details
                    const track = assignment.track
                    const program = assignment.program
                    
                    return (
                      <div
                        key={assignment.id}
                        className="p-5 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-mint/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{cohort?.name || assignment.cohort_name}</h3>
                              <Badge 
                                variant={
                                  assignment.role === 'primary' ? 'defender' : 
                                  assignment.role === 'support' ? 'mint' : 'steel'
                                }
                              >
                                {assignment.role?.charAt(0).toUpperCase() + assignment.role?.slice(1) || 'Support'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                              {program && (
                                <div>
                                  <p className="text-och-steel text-xs mb-1">Program</p>
                                  <p className="text-white text-sm font-medium">{program.name}</p>
                                </div>
                              )}
                              {track && (
                                <div>
                                  <p className="text-och-steel text-xs mb-1">Track</p>
                                  <p className="text-white text-sm font-medium">{track.name}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-och-steel text-xs mb-1">Enrollments</p>
                                <p className="text-white text-sm font-medium">{assignment.enrollment_count || 0}</p>
                              </div>
                              <div>
                                <p className="text-och-steel text-xs mb-1">Assigned</p>
                                <p className="text-white text-sm font-medium">
                                  {new Date(assignment.assigned_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {cohort?.status && (
                          <div className="mt-3 pt-3 border-t border-och-steel/20">
                            <div className="flex items-center gap-2">
                              <span className="text-och-steel text-xs">Status:</span>
                              <Badge 
                                variant={
                                  cohort.status === 'active' ? 'mint' :
                                  cohort.status === 'completed' ? 'defender' :
                                  cohort.status === 'upcoming' ? 'gold' : 'steel'
                                }
                                className="text-xs"
                              >
                                {cohort.status}
                              </Badge>
                              {cohort.start_date && (
                                <>
                                  <span className="text-och-steel text-xs">•</span>
                                  <span className="text-och-steel text-xs">
                                    Start: {new Date(cohort.start_date).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Recent Reviews */}
          {analytics?.reviews && analytics.reviews.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Recent Reviews</h2>
                <div className="space-y-3">
                  {analytics.reviews.slice(0, 5).map((review) => (
                    <div
                      key={review.id}
                      className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-semibold">{review.cohort_name}</h3>
                          <p className="text-och-steel text-sm">
                            {new Date(review.reviewed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${i < review.rating ? 'text-och-gold' : 'text-och-steel/30'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-och-steel text-sm">{review.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}


