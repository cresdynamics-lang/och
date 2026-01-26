'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/hooks/useAuth'
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
import type { AnalyticsFilter } from '@/services/types/analytics'

export function AnalyticsDashboard() {
  const { user } = useAuth()
  
  // Check if user is analyst or admin (platform-wide analytics)
  const userRoles = user?.roles || []
  const isAnalyst = userRoles.some((ur: any) => {
    const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
    return roleName?.toLowerCase().trim() === 'analyst'
  })
  const isAdmin = userRoles.some((ur: any) => {
    const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
    return roleName?.toLowerCase().trim() === 'admin'
  })
  
  // For analysts/admins, show platform analytics; for others, show mentee-specific
  const menteeId = (isAnalyst || isAdmin) ? undefined : user?.id?.toString()
  const [filter, setFilter] = useState<AnalyticsFilter>({})
  const [exporting, setExporting] = useState(false)

  const {
    readinessScores,
    heatmapData,
    skillMastery,
    behavioralTrends,
    isLoading,
    error,
    exportReport,
  } = useAnalytics(menteeId, filter)

  const handleExport = async (format: 'pdf' | 'csv') => {
    setExporting(true)
    try {
      await exportReport(format)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  // Prepare heatmap data for visualization
  const heatmapChartData = heatmapData.map(skill => ({
    name: skill.skill_name,
    mastery: skill.mastery_level,
    category: skill.category,
  }))

  // Group by category for better visualization
  const masteryByCategory = skillMastery.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, typeof skillMastery>)

  const COLORS = ['#0648A8', '#33FFC1', '#C89C15', '#F55F28', '#A8B0B8']
  
  // Check if this is platform-wide analytics (no menteeId)
  const isPlatformAnalytics = !menteeId

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center text-och-steel">Loading analytics...</div>
      </Card>
    )
  }

  if (error && !isPlatformAnalytics) {
    return (
      <Card className="p-8 border-och-orange">
        <div className="text-och-orange">{error}</div>
      </Card>
    )
  }

  // For platform-wide analytics (analyst/admin), show platform metrics
  if (isPlatformAnalytics) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-mint">Platform Analytics</h1>
            <p className="text-och-steel">Platform-wide performance and insights</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <p className="text-och-steel text-sm mb-1">Total Users</p>
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-och-steel/20 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-och-steel/20 rounded w-16"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-och-steel">--</p>
                  <Badge variant="steel" className="mt-2">No data</Badge>
                </>
              )}
            </Card>
            <Card>
              <p className="text-och-steel text-sm mb-1">Active Sessions</p>
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-och-steel/20 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-och-steel/20 rounded w-16"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-och-steel">--</p>
                  <Badge variant="steel" className="mt-2">No data</Badge>
                </>
              )}
            </Card>
            <Card>
              <p className="text-och-steel text-sm mb-1">Courses Completed</p>
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-och-steel/20 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-och-steel/20 rounded w-16"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-och-steel">--</p>
                  <Badge variant="steel" className="mt-2">No data</Badge>
                </>
              )}
            </Card>
            <Card>
              <p className="text-och-steel text-sm mb-1">Mentorship Sessions</p>
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-och-steel/20 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-och-steel/20 rounded w-16"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-och-steel">--</p>
                  <Badge variant="steel" className="mt-2">No data</Badge>
                </>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-2xl font-bold mb-4 text-white">User Engagement</h2>
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div>
                    <div className="h-4 bg-och-steel/20 rounded w-32 mb-2"></div>
                    <div className="h-2 bg-och-steel/20 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-och-steel/20 rounded w-36 mb-2"></div>
                    <div className="h-2 bg-och-steel/20 rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-och-steel">No user engagement data available</p>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-2xl font-bold mb-4 text-white">Course Performance</h2>
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div>
                    <div className="h-4 bg-och-steel/20 rounded w-28 mb-2"></div>
                    <div className="h-2 bg-och-steel/20 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-och-steel/20 rounded w-24 mb-2"></div>
                    <div className="h-2 bg-och-steel/20 rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-och-steel">No course performance data available</p>
                </div>
              )}
            </Card>
          </div>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Activity Trends</h2>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse text-och-steel">Loading chart...</div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-och-steel">No activity trend data available</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  // Check if we have any data
  const hasData = readinessScores.length > 0 || heatmapData.length > 0 || skillMastery.length > 0 || behavioralTrends.length > 0

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
      {/* Filters and Export */}
      <Card>
        <div className="p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            <select
              value={filter.track_id || ''}
              onChange={(e) => setFilter({ ...filter, track_id: e.target.value || undefined })}
              className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
            >
              <option value="">All Tracks</option>
              <option value="1">Cybersecurity Fundamentals</option>
              <option value="2">Network Security</option>
            </select>
            <select
              value={filter.skill_category || ''}
              onChange={(e) => setFilter({ ...filter, skill_category: e.target.value || undefined })}
              className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
            >
              <option value="">All Categories</option>
              <option value="security">Security</option>
              <option value="networking">Networking</option>
              <option value="programming">Programming</option>
            </select>
            <input
              type="date"
              value={filter.start_date || ''}
              onChange={(e) => setFilter({ ...filter, start_date: e.target.value || undefined })}
              className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
            />
            <input
              type="date"
              value={filter.end_date || ''}
              onChange={(e) => setFilter({ ...filter, end_date: e.target.value || undefined })}
              className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={exporting || !hasData}
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button
              variant="mint"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={exporting || !hasData}
            >
              {exporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </Card>

      {!hasData && !isLoading && (
        <Card className="p-8">
          <div className="text-center">
            <p className="text-och-steel mb-4">No analytics data available yet.</p>
            <p className="text-sm text-och-steel">Analytics data will appear here as activity is tracked.</p>
          </div>
        </Card>
      )}

      {/* Readiness Over Time */}
      {readinessScores.length > 0 && (
        <Card>
          <h3 className="text-2xl font-bold mb-4 text-white">Readiness Scores Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={readinessScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#A8B0B8" opacity={0.3} />
              <XAxis dataKey="date" stroke="#A8B0B8" />
              <YAxis stroke="#A8B0B8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0A0A0C', border: '1px solid #A8B0B8', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#33FFC1"
                strokeWidth={2}
                name="Readiness Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Skills Heatmap */}
      {heatmapChartData.length > 0 && (
        <Card>
          <h3 className="text-2xl font-bold mb-4 text-white">Skills Mastery Heatmap</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={heatmapChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#A8B0B8" opacity={0.3} />
              <XAxis dataKey="name" stroke="#A8B0B8" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#A8B0B8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0A0A0C', border: '1px solid #A8B0B8', borderRadius: '8px' }}
              />
              <Bar dataKey="mastery" name="Mastery Level">
                {heatmapChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Skill Mastery by Category */}
      {Object.keys(masteryByCategory).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(masteryByCategory).map(([category, skills]) => (
            <Card key={category}>
              <h3 className="text-xl font-bold mb-4 text-white">{category}</h3>
              <div className="space-y-3">
                {skills.map((skill) => (
                  <div key={skill.skill_id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white">{skill.skill_name}</span>
                      <span className="text-sm text-och-steel">{skill.mastery_percentage}%</span>
                    </div>
                    <div className="w-full bg-och-midnight rounded-full h-2">
                      <div
                        className="bg-och-mint h-2 rounded-full transition-all"
                        style={{ width: `${skill.mastery_percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-och-steel mt-1">
                      {skill.hours_practiced} hours practiced
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Behavioral Trends */}
      {behavioralTrends.length > 0 && (
        <Card>
          <h3 className="text-2xl font-bold mb-4 text-white">Behavioral Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={behavioralTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#A8B0B8" opacity={0.3} />
              <XAxis dataKey="date" stroke="#A8B0B8" />
              <YAxis stroke="#A8B0B8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0A0A0C', border: '1px solid #A8B0B8', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="missions_completed"
                stroke="#33FFC1"
                strokeWidth={2}
                name="Missions Completed"
              />
              <Line
                type="monotone"
                dataKey="hours_studied"
                stroke="#0648A8"
                strokeWidth={2}
                name="Hours Studied"
              />
              <Line
                type="monotone"
                dataKey="reflections_count"
                stroke="#C89C15"
                strokeWidth={2}
                name="Reflections"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
      </div>
    </div>
  )
}

