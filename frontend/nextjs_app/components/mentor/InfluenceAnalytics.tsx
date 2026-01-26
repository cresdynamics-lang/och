'use client'

import { Card } from '@/components/ui/Card'
import { useMentorInfluence } from '@/hooks/useMentorInfluence'
import { useAuth } from '@/hooks/useAuth'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
const USE_MOCK_DATA = false // Backend is ready

export function InfluenceAnalytics() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const { influence, isLoading, error } = useMentorInfluence(mentorId)

  const formatDateSafe = (iso?: string | null) => {
    if (!iso) return 'N/A'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString()
  }

  // Prepare metrics data for bar chart
  const metricsData = influence ? [
    { name: 'Feedback', value: influence.metrics.total_feedback_given, color: '#10B981' },
    { name: 'Response Time', value: influence.metrics.average_response_time_hours, color: '#3B82F6' },
    { name: 'Improvement', value: influence.metrics.mentee_improvement_rate, color: '#F59E0B' },
    { name: 'Attendance', value: influence.metrics.session_attendance_rate, color: '#8B5CF6' },
    { name: 'Approval', value: influence.metrics.mission_approval_rate, color: '#EF4444' },
  ] : []

  // Prepare correlation data for bar chart
  const correlationData = influence ? [
    { name: 'Feedback→Performance', value: influence.correlation_data.feedback_to_performance, color: '#10B981' },
    { name: 'Sessions→Engagement', value: influence.correlation_data.sessions_to_engagement, color: '#3B82F6' },
    { name: 'Reviews→Quality', value: influence.correlation_data.reviews_to_mission_quality, color: '#F59E0B' },
  ] : []

  // Get trend data from influence analytics if available
  const trendData = (influence?.trend_data || []).map((x: any) => ({
    date: x?.date,
    // support legacy key from older backend responses
    score: typeof x?.score === 'number' ? x.score : (typeof x?.influence_score === 'number' ? x.influence_score : 0),
  }))

  // Custom tooltip style
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-och-midnight border border-och-steel/20 rounded-lg p-3 shadow-lg">
          <p className="text-white text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="mb-6">
      <h2 className="text-2xl font-bold text-white mb-4">Mentor Influence Index</h2>

      {isLoading && (
        <div className="text-och-steel text-sm">Loading analytics...</div>
      )}

      {error && !isLoading && (
        <div className="text-och-orange text-sm">Error loading analytics: {error}</div>
      )}

      {!isLoading && !error && influence && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="p-4 bg-och-midnight/50 rounded-lg">
            <p className="text-xs text-och-steel mb-1">Overall Influence Score</p>
            <p className="text-3xl font-bold text-white">{influence.overall_influence_score}</p>
            <ProgressBar
              value={influence.overall_influence_score}
              variant={influence.overall_influence_score >= 70 ? 'mint' : influence.overall_influence_score >= 40 ? 'gold' : 'orange'}
              className="mt-2"
            />
          </div>

          {/* Influence Score Trend Chart */}
          {trendData.length > 0 && (
            <div className="p-4 bg-och-midnight/50 rounded-lg">
              <h3 className="text-sm font-semibold text-white mb-4">Influence Score Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                    domain={[60, 90]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Influence Score"
                    dot={{ fill: '#10B981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Metrics Bar Chart */}
          {metricsData.length > 0 && (
            <div className="p-4 bg-och-midnight/50 rounded-lg">
              <h3 className="text-sm font-semibold text-white mb-4">Performance Metrics</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metricsData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {metricsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Correlation Data Bar Chart */}
          {correlationData.length > 0 && (
            <div className="p-4 bg-och-midnight/50 rounded-lg">
              <h3 className="text-sm font-semibold text-white mb-4">Correlation Data</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={correlationData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF"
                    style={{ fontSize: '11px' }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                    domain={[0, 1]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {correlationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Period */}
          {influence?.period && (influence.period.start_date || influence.period.end_date) && (
            <div className="text-xs text-och-steel">
              Period: {formatDateSafe(influence.period.start_date)} - {formatDateSafe(influence.period.end_date)}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}




