'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { mentorshipClient } from '@/services/mentorshipClient'

interface MentorAnalytics {
  mentor_id: string
  mentor_name: string
  mentor_email: string
  active_mentees: number
  total_sessions: number
  completed_sessions: number
  cancelled_sessions: number
  session_completion_rate: number
  attendance_rate: number
  feedback_count: number
  avg_overall_rating: number
  avg_mentor_engagement: number
  avg_mentor_preparation: number
  avg_session_value: number
  mentee_satisfaction: number
  goal_achievement_ratio: number
  impact_score: number
  meets_sla: boolean
  performance_tier: 'high' | 'medium' | 'low'
  ranking: number
}

interface AnalyticsSummary {
  total_mentors: number
  avg_impact_score: number
  mentors_meeting_sla: number
  high_performers: number
  needs_improvement: number
}

interface AnalyticsResponse {
  analytics: MentorAnalytics[]
  summary: AnalyticsSummary
}

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="text-yellow-400">★</span>
      ))}
      {hasHalfStar && <span className="text-yellow-400">☆</span>}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="text-gray-300">☆</span>
      ))}
      <span className="text-sm text-white/80 ml-1">({rating.toFixed(1)})</span>
    </div>
  )
}

const PerformanceBadge = ({ tier }: { tier: 'high' | 'medium' | 'low' }) => {
  const colors = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-red-100 text-red-800 border-red-200'
  }

  const labels = {
    high: 'High Performer',
    medium: 'Good',
    low: 'Needs Improvement'
  }

  return (
    <Badge className={`${colors[tier]} border`}>
      {labels[tier]}
    </Badge>
  )
}

const SLABadge = ({ meets }: { meets: boolean }) => {
  return (
    <Badge className={meets ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
      {meets ? 'Meets SLA' : 'Below SLA'}
    </Badge>
  )
}

const MetricCard = ({ title, value, subtitle, icon }: { title: string; value: string | number; subtitle?: string; icon: string }) => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </Card>
)

export default function MentorPerformanceAnalyticsPage() {
  const [analytics, setAnalytics] = useState<MentorAnalytics[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'ranking' | 'impact_score' | 'session_completion_rate' | 'mentee_satisfaction'>('ranking')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await mentorshipClient.getMentorPerformanceAnalytics()
      setAnalytics(response.analytics)
      setSummary(response.summary)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError('Failed to load mentor performance analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const sortedAnalytics = [...analytics].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const exportToCSV = () => {
    if (!analytics.length) return

    const headers = [
      'Ranking', 'Mentor Name', 'Email', 'Active Mentees', 'Total Sessions',
      'Completed Sessions', 'Session Completion Rate (%)', 'Attendance Rate (%)',
      'Feedback Count', 'Avg Overall Rating', 'Mentee Satisfaction',
      'Goal Achievement Ratio (%)', 'Impact Score', 'Performance Tier', 'Meets SLA'
    ]

    const csvContent = [
      headers.join(','),
      ...analytics.map(mentor => [
        mentor.ranking,
        `"${mentor.mentor_name}"`,
        mentor.mentor_email,
        mentor.active_mentees,
        mentor.total_sessions,
        mentor.completed_sessions,
        mentor.session_completion_rate,
        mentor.attendance_rate,
        mentor.feedback_count,
        mentor.avg_overall_rating,
        mentor.mentee_satisfaction,
        mentor.goal_achievement_ratio,
        mentor.impact_score,
        mentor.performance_tier,
        mentor.meets_sla ? 'Yes' : 'No'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'mentor_performance_analytics.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <RouteGuard requiredRoles={['program_director']}>
        <DirectorLayout>
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (error) {
    return (
      <RouteGuard requiredRoles={['program_director']}>
        <DirectorLayout>
          <div className="p-6">
            <Card className="p-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchAnalytics} variant="gold">
                  Try Again
                </Button>
              </div>
            </Card>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requiredRoles={['program_director']}>
      <DirectorLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Mentor Performance Analytics</h1>
              <p className="text-white/80 mt-1">Comprehensive metrics measuring mentor effectiveness and engagement</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={fetchAnalytics} variant="outline">
                🔄 Refresh
              </Button>
              <Button onClick={exportToCSV} variant="gold">
                📊 Export CSV
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Total Mentors"
                value={summary.total_mentors}
                icon="👥"
              />
              <MetricCard
                title="Avg Impact Score"
                value={`${summary.avg_impact_score}/100`}
                icon="📈"
              />
              <MetricCard
                title="Meeting SLA"
                value={`${summary.mentors_meeting_sla}/${summary.total_mentors}`}
                subtitle={`${Math.round((summary.mentors_meeting_sla / summary.total_mentors) * 100)}%`}
                icon="✅"
              />
              <MetricCard
                title="High Performers"
                value={summary.high_performers}
                icon="🏆"
              />
              <MetricCard
                title="Needs Improvement"
                value={summary.needs_improvement}
                icon="⚠️"
              />
            </div>
          )}

          {/* Performance Table */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20">
              <h2 className="text-xl font-semibold text-white">Mentor Performance Rankings</h2>
              <p className="text-sm text-white/80 mt-1">Detailed performance metrics for all active mentors</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="bg-white/5">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider cursor-pointer hover:bg-white/10"
                      onClick={() => handleSort('ranking')}
                    >
                      Rank {sortBy === 'ranking' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider cursor-pointer hover:bg-white/10"
                      onClick={() => handleSort('session_completion_rate')}
                    >
                      Completion Rate {sortBy === 'session_completion_rate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Feedback
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider cursor-pointer hover:bg-white/10"
                      onClick={() => handleSort('mentee_satisfaction')}
                    >
                      Satisfaction {sortBy === 'mentee_satisfaction' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Goal Achievement
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider cursor-pointer hover:bg-white/10"
                      onClick={() => handleSort('impact_score')}
                    >
                      Impact Score {sortBy === 'impact_score' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-white/20">
                  {sortedAnalytics.map((mentor) => (
                    <tr key={mentor.mentor_id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg font-semibold text-white">
                            #{mentor.ranking}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {mentor.mentor_name}
                          </div>
                          <div className="text-sm text-white/70">
                            {mentor.mentor_email}
                          </div>
                          <div className="text-xs text-white/60">
                            {mentor.active_mentees} active mentees
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {mentor.completed_sessions}/{mentor.total_sessions}
                          </div>
                          <div className="text-xs text-white/70">
                            {mentor.cancelled_sessions} cancelled
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            mentor.session_completion_rate >= 80 ? 'bg-green-100 text-green-800' :
                            mentor.session_completion_rate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {mentor.session_completion_rate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-white">
                          {mentor.attendance_rate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {mentor.feedback_count} reviews
                          </div>
                          <StarRating rating={mentor.avg_overall_rating} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className="text-sm font-medium text-white">
                            {mentor.mentee_satisfaction}/5
                          </span>
                          <StarRating rating={mentor.mentee_satisfaction} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-white">
                          {mentor.goal_achievement_ratio}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            mentor.impact_score >= 80 ? 'bg-green-100 text-green-800' :
                            mentor.impact_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {mentor.impact_score}/100
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <PerformanceBadge tier={mentor.performance_tier} />
                          <SLABadge meets={mentor.meets_sla} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {analytics.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-white/70">No mentor performance data available.</p>
              </div>
            )}
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
