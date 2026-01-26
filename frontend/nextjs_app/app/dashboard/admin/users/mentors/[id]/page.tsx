'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { programsClient } from '@/services/programsClient'
import { djangoClient } from '@/services/djangoClient'
import type { User } from '@/services/types'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts'

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

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-5 h-5"} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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

  useEffect(() => {
    if (mentorId) {
      loadMentorData()
      loadMentorAnalytics()
      loadMentorAssignments()
    }
  }, [mentorId])

  const loadMentorData = async () => {
    try {
      setIsLoading(true)
      const user = await djangoClient.users.getUser(Number(mentorId)) as User & {
        is_mentor?: boolean
        mentor_capacity_weekly?: number
        mentor_availability?: any
        mentor_specialties?: string[]
        roles?: Array<{ id: number; role: string; role_id: number; scope: string; scope_ref?: string }>
      }
      setMentor({
        id: user.id,
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        is_mentor: user.is_mentor,
        mentor_capacity_weekly: user.mentor_capacity_weekly,
        mentor_availability: user.mentor_availability,
        mentor_specialties: user.mentor_specialties,
        roles: user.roles as Array<{ id: number; role: string; role_id: number; scope: string; scope_ref?: string }> | undefined,
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
      // Limit activity_over_time to last 90 days to reduce payload size
      if (data?.activity_over_time && Array.isArray(data.activity_over_time)) {
        const sorted = data.activity_over_time.sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        data.activity_over_time = sorted.slice(0, 90)
      }
      // Limit reviews to most recent 10
      if (data?.reviews && Array.isArray(data.reviews)) {
        data.reviews = data.reviews.slice(0, 10)
      }
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load mentor analytics:', error)
      // Set default analytics if API fails
      setAnalytics({
        mentor_id: mentorId,
        mentor_name: mentor?.name || mentor?.email || 'Unknown',
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
      })
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  const loadMentorAssignments = async () => {
    try {
      setIsLoadingAssignments(true)
      const assignmentsData = await programsClient.getMentorAssignments(mentorId)
      setAssignments(assignmentsData.filter((a: any) => a.active))
    } catch (error) {
      console.error('Failed to load mentor assignments:', error)
      setAssignments([])
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  if (isLoading) {
    return (
      <RouteGuard requiredRoles={['admin']}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading mentor details...</p>
            </div>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  if (!mentor) {
    return (
      <RouteGuard requiredRoles={['admin']}>
        <AdminLayout>
          <div className="p-6">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
              <ArrowLeftIcon />
              <span className="ml-2">Back to Mentors</span>
            </Button>
            <Card className="p-12">
              <div className="text-center text-och-steel">
                <p className="text-lg mb-2">Mentor not found</p>
                <p className="text-sm">The mentor you're looking for doesn't exist or has been removed.</p>
              </div>
            </Card>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  const metrics = analytics?.metrics || {
    total_mentees: 0,
    active_cohorts: assignments.length,
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

  const mentorName = mentor.first_name && mentor.last_name
    ? `${mentor.first_name} ${mentor.last_name}`
    : mentor.email

  return (
    <RouteGuard requiredRoles={['admin']}>
      <AdminLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push('/dashboard/admin/users/mentors')}>
                <ArrowLeftIcon />
                <span className="ml-2">Back</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">{mentorName}</h1>
                <p className="text-och-steel mt-1">{mentor.email}</p>
              </div>
            </div>
            <Badge
              variant={mentor.is_active && mentor.account_status === 'active' ? 'mint' : 'steel'}
            >
              {mentor.account_status === 'active' && mentor.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-och-steel text-sm">Total Mentees</span>
                  <UsersIcon />
                </div>
                <p className="text-3xl font-bold text-white">{metrics.total_mentees || 0}</p>
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
                  <StarIcon />
                </div>
                <p className="text-3xl font-bold text-och-defender">
                  {metrics.average_session_rating > 0 ? metrics.average_session_rating.toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-och-steel mt-1">Out of 5.0</p>
              </div>
            </Card>
          </div>

          {/* Assigned Cohorts */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Assigned Cohorts</h2>
              {isLoadingAssignments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-och-mint"></div>
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-8 text-och-steel">
                  <p>No cohort assignments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-defender/40 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {assignment.cohort_name || assignment.cohort}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-och-steel">
                            <span>
                              <span className="font-medium">Role:</span>{' '}
                              <Badge variant="steel" className="ml-1">{assignment.role}</Badge>
                            </span>
                            {assignment.mentees_count !== undefined && (
                              <span>
                                <span className="font-medium">Mentees:</span> {assignment.mentees_count}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/admin/cohorts/${assignment.cohort}`)}
                        >
                          View Cohort
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Performance Metrics - Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Statistics Bar Chart */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Session Statistics</h2>
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: 'Scheduled',
                          value: metrics.sessions_scheduled,
                          color: '#0648A8',
                        },
                        {
                          name: 'Completed',
                          value: metrics.sessions_completed,
                          color: '#33FFC1',
                        },
                        {
                          name: 'Missed',
                          value: metrics.sessions_missed,
                          color: '#EF4444',
                        },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="name" stroke="#64748B" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#33FFC1' }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {[
                          { name: 'Scheduled', value: metrics.sessions_scheduled, color: '#0648A8' },
                          { name: 'Completed', value: metrics.sessions_completed, color: '#33FFC1' },
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

            {/* Session Breakdown Pie Chart */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Session Breakdown</h2>
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: 'Completed',
                            value: metrics.sessions_completed,
                            color: '#33FFC1',
                          },
                          {
                            name: 'Missed',
                            value: metrics.sessions_missed,
                            color: '#EF4444',
                          },
                          {
                            name: 'Pending',
                            value: Math.max(0, metrics.sessions_scheduled - metrics.sessions_completed - metrics.sessions_missed),
                            color: '#0648A8',
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { color: '#33FFC1' },
                          { color: '#EF4444' },
                          { color: '#0648A8' },
                        ].map((entry, index) => (
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

            {/* Performance Metrics Radar Chart */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Performance Overview</h2>
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={[
                      {
                        metric: 'Session Completion',
                        value: metrics.sessions_scheduled > 0
                          ? (metrics.sessions_completed / metrics.sessions_scheduled) * 100
                          : 0,
                        fullMark: 100,
                      },
                      {
                        metric: 'Mentee Completion',
                        value: metrics.mentee_completion_rate,
                        fullMark: 100,
                      },
                      {
                        metric: 'Feedback Score',
                        value: (metrics.feedback_average / 5) * 100,
                        fullMark: 100,
                      },
                      {
                        metric: 'Satisfaction',
                        value: (metrics.mentee_satisfaction_score / 5) * 100,
                        fullMark: 100,
                      },
                      {
                        metric: 'Impact Score',
                        value: metrics.impact_score * 10,
                        fullMark: 100,
                      },
                    ]}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
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

            {/* Performance Metrics Comparison Bar Chart */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Key Performance Indicators</h2>
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: 'Session\nCompletion',
                          value: metrics.sessions_scheduled > 0
                            ? (metrics.sessions_completed / metrics.sessions_scheduled) * 100
                            : 0,
                        },
                        {
                          name: 'Mentee\nCompletion',
                          value: metrics.mentee_completion_rate,
                        },
                        {
                          name: 'Feedback\nAverage',
                          value: (metrics.feedback_average / 5) * 100,
                        },
                        {
                          name: 'Satisfaction\nScore',
                          value: (metrics.mentee_satisfaction_score / 5) * 100,
                        },
                        {
                          name: 'Impact\nScore',
                          value: metrics.impact_score * 10,
                        },
                      ]}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis type="number" domain={[0, 100]} stroke="#64748B" style={{ fontSize: '12px' }} />
                      <YAxis dataKey="name" type="category" stroke="#64748B" style={{ fontSize: '12px' }} width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#33FFC1" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Reviews */}
          {analytics?.reviews && analytics.reviews.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Reviews</h2>
                <div className="space-y-3">
                  {analytics.reviews.slice(0, 5).map((review) => (
                    <div
                      key={review.id}
                      className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-semibold">{review.cohort_name}</h3>
                          <p className="text-sm text-och-steel">{new Date(review.reviewed_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(review.rating)
                                  ? 'text-och-gold fill-och-gold'
                                  : 'text-och-steel'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-white font-semibold">{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      {review.feedback && (
                        <p className="text-sm text-och-steel mt-2">{review.feedback}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Activity Over Time Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Activity Over Time</h2>
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                  </div>
                ) : analytics?.activity_over_time && analytics.activity_over_time.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={analytics.activity_over_time.slice(0, 90).map((item) => ({
                        ...item,
                        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#33FFC1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#33FFC1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0648A8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0648A8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis
                        dataKey="date"
                        stroke="#64748B"
                        style={{ fontSize: '12px' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        content={<CustomTooltip />}
                      />
                      <Legend
                        wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }}
                        iconType="circle"
                      />
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
                ) : (
                  <div className="flex items-center justify-center h-64 text-och-steel">
                    <p>No activity data available</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Ratings Distribution Chart */}
            {analytics?.reviews && analytics.reviews.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Rating Distribution</h2>
                  {isLoadingAnalytics ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={(() => {
                          const ratingCounts: Record<number, number> = {}
                          analytics.reviews.forEach((review) => {
                            const rating = Math.round(review.rating)
                            ratingCounts[rating] = (ratingCounts[rating] || 0) + 1
                          })
                          const chartData = [1, 2, 3, 4, 5].map((rating) => ({
                            rating: `${rating} Star${rating > 1 ? 's' : ''}`,
                            count: ratingCounts[rating] || 0,
                            ratingValue: rating,
                          }))
                          return chartData
                        })()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="rating" stroke="#64748B" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {(() => {
                            const ratingCounts: Record<number, number> = {}
                            analytics.reviews.forEach((review) => {
                              const rating = Math.round(review.rating)
                              ratingCounts[rating] = (ratingCounts[rating] || 0) + 1
                            })
                            const colors: Record<number, string> = {
                              1: '#EF4444',
                              2: '#F59E0B',
                              3: '#FCD34D',
                              4: '#10B981',
                              5: '#33FFC1',
                            }
                            return [1, 2, 3, 4, 5].map((rating, index) => (
                              <Cell key={`cell-${index}`} fill={colors[rating] || '#64748B'} />
                            ))
                          })()}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
