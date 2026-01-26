'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { marketplaceClient } from '@/services/marketplaceClient'
import Link from 'next/link'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await marketplaceClient.adminGetAnalytics()
      setAnalytics(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load analytics')
      console.error('Error loading analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Card className="p-8">
              <p className="text-och-steel text-center">Loading analytics...</p>
            </Card>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  if (error) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Card className="p-4 bg-red-500/10 border-red-500/20">
              <p className="text-red-400">{error}</p>
            </Card>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-gold">Analytics & Insights</h1>
                <p className="text-och-steel">Monitor marketplace health and talent readiness</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={loadAnalytics} variant="outline">
                  Refresh
                </Button>
                <Link href="/dashboard/admin/marketplace">
                  <Button variant="outline">← Back</Button>
                </Link>
              </div>
            </div>
          </div>

          {analytics && (() => {
            // Prepare chart data
            const profileStatusData = analytics.profiles.by_status.map((item: any) => ({
              name: item.profile_status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              value: item.count,
            }))
            
            const tierData = analytics.profiles.by_tier.map((item: any) => ({
              name: item.tier.charAt(0).toUpperCase() + item.tier.slice(1),
              value: item.count,
            }))
            
            const applicationStatusData = analytics.applications.by_status.map((item: any) => ({
              name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
              value: item.count,
            }))
            
            const interestLogData = analytics.interest_logs.by_action.map((item: any) => ({
              name: item.action.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              value: item.count,
            }))
            
            const jobTypeData = analytics.jobs.by_type.map((item: any) => ({
              name: item.job_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              count: item.count,
            }))
            
            const dailyActivityData = analytics.time_series?.daily_activity || []
            const readinessDistributionData = analytics.readiness_distribution || []
            
            // Color palettes
            const COLORS = {
              profile: ['#10B981', '#3B82F6', '#F59E0B'], // mint, blue, orange
              tier: ['#8B5CF6', '#EC4899', '#10B981'], // purple, pink, mint
              application: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
              interest: ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'],
              activity: {
                profiles: '#10B981',
                jobs: '#3B82F6',
                applications: '#F59E0B',
                interest: '#8B5CF6',
              },
            }
            
            return (
              <>
                {/* Profile Statistics */}
                <Card className="p-6 mb-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Profile Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-och-steel mb-1">Total Profiles</p>
                      <p className="text-3xl font-bold text-white">{analytics.profiles.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-och-steel mb-1">Visible Profiles</p>
                      <p className="text-3xl font-bold text-och-mint">{analytics.profiles.visible}</p>
                    </div>
                    <div>
                      <p className="text-sm text-och-steel mb-1">Avg Readiness</p>
                      <p className="text-3xl font-bold text-och-gold">
                        {analytics.profiles.avg_readiness.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-och-steel mb-1">Job Ready</p>
                      <p className="text-3xl font-bold text-och-defender">{analytics.profiles.job_ready_count}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Profile Status Distribution */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Profile Status Distribution</h3>
                      {profileStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={profileStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {profileStatusData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS.profile[index % COLORS.profile.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-och-steel text-center py-8">No data available</p>
                      )}
                    </div>
                    
                    {/* Tier Distribution */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Tier Distribution</h3>
                      {tierData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={tierData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {tierData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS.tier[index % COLORS.tier.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-och-steel text-center py-8">No data available</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Readiness Distribution */}
                  {readinessDistributionData.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Readiness Score Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={readinessDistributionData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="range" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                            labelStyle={{ color: '#F3F4F6' }}
                          />
                          <Legend />
                          <Bar dataKey="count" fill="#F59E0B" name="Profiles" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

              {/* Employer & Job Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Employer Statistics</h2>
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-och-steel mb-1">Total Employers</p>
                      <p className="text-2xl font-bold text-white">{analytics.employers.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-och-steel mb-1">Active Employers</p>
                      <p className="text-2xl font-bold text-och-mint">{analytics.employers.active}</p>
                    </div>
                  </div>
                  {/* Employer Activity Chart */}
                  <div className="mt-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[
                        { name: 'Total', value: analytics.employers.total, fill: '#6B7280' },
                        { name: 'Active', value: analytics.employers.active, fill: '#10B981' },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Bar dataKey="value" name="Employers" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Job Posting Statistics</h2>
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-och-steel mb-1">Total Jobs</p>
                      <p className="text-2xl font-bold text-white">{analytics.jobs.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-och-steel mb-1">Active Jobs</p>
                      <p className="text-2xl font-bold text-och-mint">{analytics.jobs.active}</p>
                    </div>
                  </div>
                  {/* Job Type Distribution */}
                  {jobTypeData.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Job Types</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={jobTypeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                            labelStyle={{ color: '#F3F4F6' }}
                          />
                          <Legend />
                          <Bar dataKey="count" fill="#3B82F6" name="Jobs" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
              </div>

              {/* Application & Interest Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Application Statistics</h2>
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-och-steel mb-1">Total Applications</p>
                      <p className="text-2xl font-bold text-white">{analytics.applications.total}</p>
                    </div>
                  </div>
                  {/* Application Status Distribution */}
                  {applicationStatusData.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Application Status</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={applicationStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {applicationStatusData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS.application[index % COLORS.application.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-och-steel text-center py-8">No applications yet</p>
                  )}
                </Card>

                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Interest Log Statistics</h2>
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-och-steel mb-1">Total Logs</p>
                      <p className="text-2xl font-bold text-white">{analytics.interest_logs.total}</p>
                    </div>
                  </div>
                  {/* Interest Logs by Action */}
                  {interestLogData.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Interest Actions</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={interestLogData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis type="number" stroke="#9CA3AF" />
                          <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                            labelStyle={{ color: '#F3F4F6' }}
                          />
                          <Legend />
                          <Bar dataKey="value" fill="#8B5CF6" name="Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-och-steel text-center py-8">No interest logs yet</p>
                  )}
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="p-6 mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">Recent Activity (Last 30 Days)</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-och-steel mb-1">Profiles Created</p>
                    <p className="text-2xl font-bold text-white">{analytics.recent_activity.profiles_created}</p>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel mb-1">Jobs Posted</p>
                    <p className="text-2xl font-bold text-white">{analytics.recent_activity.jobs_posted}</p>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel mb-1">Applications</p>
                    <p className="text-2xl font-bold text-white">{analytics.recent_activity.applications}</p>
                  </div>
                  <div>
                    <p className="text-sm text-och-steel mb-1">Interest Logs</p>
                    <p className="text-2xl font-bold text-white">{analytics.recent_activity.interest_logs}</p>
                  </div>
                </div>
                
                {/* Daily Activity Trend */}
                {dailyActivityData.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Daily Activity Trend (Last 30 Days)</h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={dailyActivityData}>
                        <defs>
                          <linearGradient id="colorProfiles" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.activity.profiles} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={COLORS.activity.profiles} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.activity.jobs} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={COLORS.activity.jobs} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.activity.applications} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={COLORS.activity.applications} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.activity.interest} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={COLORS.activity.interest} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          tickFormatter={(value) => {
                            const date = new Date(value)
                            return `${date.getMonth() + 1}/${date.getDate()}`
                          }}
                        />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#F3F4F6' }}
                          labelFormatter={(value) => {
                            const date = new Date(value)
                            return date.toLocaleDateString()
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="profiles_created" 
                          stackId="1"
                          stroke={COLORS.activity.profiles} 
                          fill="url(#colorProfiles)" 
                          name="Profiles Created"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="jobs_posted" 
                          stackId="1"
                          stroke={COLORS.activity.jobs} 
                          fill="url(#colorJobs)" 
                          name="Jobs Posted"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="applications" 
                          stackId="1"
                          stroke={COLORS.activity.applications} 
                          fill="url(#colorApplications)" 
                          name="Applications"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="interest_logs" 
                          stackId="1"
                          stroke={COLORS.activity.interest} 
                          fill="url(#colorInterest)" 
                          name="Interest Logs"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </>
            )
          })()}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
