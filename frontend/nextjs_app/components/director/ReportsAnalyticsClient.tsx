'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'

interface AnalyticsData {
  summary: {
    total_programs: number
    total_tracks: number
    total_cohorts: number
    active_cohorts: number
    total_enrollments: number
    active_enrollments: number
    completed_enrollments: number
    total_mentors: number
    seat_utilization: number
    completion_rate: number
  }
  track_distribution: Array<{
    name: string
    enrollment_count: number
  }>
  monthly_trends: Array<{
    month: string
    enrollments: number
  }>
}

interface CohortPerformance {
  cohorts: Array<{
    id: string
    name: string
    program: string
    track: string
    status: string
    total_enrollments: number
    active_enrollments: number
    completion_rate: number
    seat_utilization: number
    mentor_count: number
  }>
}

export default function ReportsAnalyticsClient() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [cohortPerformance, setCohortPerformance] = useState<CohortPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cohorts' | 'export'>('dashboard')
  const [dateRange, setDateRange] = useState('30')
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
    loadCohortPerformance()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/v1/director/reports/dashboard_analytics/?days=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCohortPerformance = async () => {
    try {
      const response = await fetch('/api/v1/director/reports/cohort_performance/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCohortPerformance(data)
      }
    } catch (error) {
      console.error('Error loading cohort performance:', error)
    }
  }

  const exportData = async (type: 'enrollments' | 'cohorts' | 'analytics') => {
    setExporting(type)
    try {
      const response = await fetch(`/api/v1/director/reports/export_${type}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `${type}_export.${type === 'analytics' ? 'json' : 'csv'}`
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
          <p className="text-och-steel">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
        <p className="text-och-steel">Comprehensive analytics and data export capabilities</p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">
                  Time Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                loadAnalytics()
                loadCohortPerformance()
              }}
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-och-steel/20">
        {[
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'cohorts', label: 'Cohort Performance' },
          { key: 'export', label: 'Export Data' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-och-defender border-b-2 border-och-defender'
                : 'text-och-steel hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && analytics && (
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Programs</p>
                <p className="text-2xl font-bold text-white">{analytics.summary.total_programs}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Active Cohorts</p>
                <p className="text-2xl font-bold text-och-defender">{analytics.summary.active_cohorts}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Total Enrollments</p>
                <p className="text-2xl font-bold text-och-mint">{analytics.summary.total_enrollments}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Seat Utilization</p>
                <p className="text-2xl font-bold text-och-orange">{analytics.summary.seat_utilization}%</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-och-purple">{analytics.summary.completion_rate}%</p>
              </div>
            </Card>
          </div>

          {/* Track Distribution */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Track Distribution</h2>
              <div className="space-y-3">
                {analytics.track_distribution.map((track, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-white">{track.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-och-steel/20 rounded-full h-2">
                        <div
                          className="bg-och-defender h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (track.enrollment_count / Math.max(...analytics.track_distribution.map(t => t.enrollment_count))) * 100)}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-och-steel text-sm w-8">{track.enrollment_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Enrollment Trends</h2>
              <div className="flex items-end gap-2 h-32">
                {analytics.monthly_trends.map((trend, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="bg-och-defender w-full rounded-t"
                      style={{
                        height: `${Math.max(4, (trend.enrollments / Math.max(...analytics.monthly_trends.map(t => t.enrollments))) * 100)}%`
                      }}
                    ></div>
                    <div className="text-xs text-och-steel mt-2 text-center">
                      <div>{trend.month}</div>
                      <div>{trend.enrollments}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Cohort Performance Tab */}
      {activeTab === 'cohorts' && cohortPerformance && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Cohort Performance</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-och-steel/20">
                    <th className="text-left py-3 text-och-steel">Cohort</th>
                    <th className="text-left py-3 text-och-steel">Program</th>
                    <th className="text-left py-3 text-och-steel">Status</th>
                    <th className="text-right py-3 text-och-steel">Enrollments</th>
                    <th className="text-right py-3 text-och-steel">Completion</th>
                    <th className="text-right py-3 text-och-steel">Utilization</th>
                    <th className="text-right py-3 text-och-steel">Mentors</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortPerformance.cohorts.map((cohort) => (
                    <tr key={cohort.id} className="border-b border-och-steel/10">
                      <td className="py-3">
                        <div>
                          <p className="text-white font-semibold">{cohort.name}</p>
                          <p className="text-xs text-och-steel">{cohort.track}</p>
                        </div>
                      </td>
                      <td className="py-3 text-och-steel">{cohort.program}</td>
                      <td className="py-3">
                        <Badge variant={
                          cohort.status === 'running' ? 'mint' :
                          cohort.status === 'active' ? 'defender' :
                          cohort.status === 'closed' ? 'steel' : 'orange'
                        }>
                          {cohort.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-white">{cohort.total_enrollments}</td>
                      <td className="py-3 text-right text-white">{cohort.completion_rate}%</td>
                      <td className="py-3 text-right text-white">{cohort.seat_utilization}%</td>
                      <td className="py-3 text-right text-white">{cohort.mentor_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">Enrollment Data</h3>
              <p className="text-och-steel text-sm mb-4">
                Export detailed enrollment information including user data, cohort assignments, and status.
              </p>
              <Button
                variant="defender"
                onClick={() => exportData('enrollments')}
                disabled={exporting === 'enrollments'}
                className="w-full"
              >
                {exporting === 'enrollments' ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">Cohort Data</h3>
              <p className="text-och-steel text-sm mb-4">
                Export cohort information including performance metrics, mentor assignments, and schedules.
              </p>
              <Button
                variant="defender"
                onClick={() => exportData('cohorts')}
                disabled={exporting === 'cohorts'}
                className="w-full"
              >
                {exporting === 'cohorts' ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">Analytics Data</h3>
              <p className="text-och-steel text-sm mb-4">
                Export comprehensive analytics including trends, distributions, and summary metrics.
              </p>
              <Button
                variant="defender"
                onClick={() => exportData('analytics')}
                disabled={exporting === 'analytics'}
                className="w-full"
              >
                {exporting === 'analytics' ? 'Exporting...' : 'Export JSON'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}