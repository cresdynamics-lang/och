'use client'

import { useState, useEffect } from 'react'
import { directorClient } from '@/services/directorClient'
import { useDirectorStore } from '@/stores/directorStore'
import { DirectorHeader } from '@/components/director/DirectorHeader'
import { MetricCard } from '@/components/director/MetricCard'
import { PriorityAlert } from '@/components/director/PriorityAlert'
import { CohortRow } from '@/components/director/CohortRow'
import { QuickActionsSidebar } from '@/components/director/QuickActionsSidebar'

interface DashboardData {
  hero: {
    active_programs: number
    active_cohorts: number
    seats_used: string
    avg_readiness: number
    completion_rate: string
  }
  alerts: Array<{
    priority: 'high' | 'medium' | 'low'
    title: string
    action: string
    cohort_id?: string
  }>
  quick_stats: {
    missions_bottlenecked: number
    seats_overdue: number
    graduates_ready: number
  }
}

export default function DirectorDashboardClient() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [cohorts, setCohorts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { selectedCohorts, setSelected, clearSelection, filters, setFilter } = useDirectorStore()

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [dashboard, cohortsData] = await Promise.all([
        directorClient.getDashboard(),
        directorClient.getCohortsTable()
      ])
      
      setDashboardData(dashboard as DashboardData)
      setCohorts(cohortsData as any[])
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard')
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter cohorts based on filters
  const filteredCohorts = cohorts.filter((cohort) => {
    const matchesSearch = filters.search === '' || 
      cohort.name.toLowerCase().includes(filters.search.toLowerCase())
    const matchesRisk = filters.risk === 'all' ||
      (filters.risk === 'high' && cohort.risk_score >= 7) ||
      (filters.risk === 'medium' && cohort.risk_score >= 4 && cohort.risk_score < 7) ||
      (filters.risk === 'low' && cohort.risk_score < 4)
    return matchesSearch && matchesRisk
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-6 max-w-md shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error || 'No data available'}</p>
          <button
            onClick={loadDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Parse seats used
  const seatsMatch = dashboardData.hero.seats_used.match(/(\d+)\/(\d+)/)
  const seatsUsed = seatsMatch ? parseInt(seatsMatch[1]) : 0
  const seatsTotal = seatsMatch ? parseInt(seatsMatch[2]) : 0
  const seatsPct = seatsTotal > 0 ? Math.round((seatsUsed / seatsTotal) * 100) : 0

  // Calculate readiness trend (mock - should come from API)
  const readinessTrend = { value: 3.2, direction: 'up' as const }
  const completionTrend = { value: 1.2, direction: 'down' as const }

  // Note: Mobile view handled via responsive CSS classes

  return (
    <div className="min-h-screen bg-gray-50">
      <DirectorHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Active Cohorts"
            value={dashboardData.hero.active_cohorts}
            trend={{ value: 2, direction: 'up' }}
            status="good"
          />
          <MetricCard
            title="Seats Filled"
            value={`${seatsUsed}/${seatsTotal}`}
            trend={{ value: seatsPct, direction: 'neutral' }}
            status={seatsPct >= 90 ? 'warning' : 'good'}
          />
          <MetricCard
            title="Avg Readiness"
            value={dashboardData.hero.avg_readiness.toFixed(1)}
            trend={readinessTrend}
            status={dashboardData.hero.avg_readiness >= 70 ? 'good' : 'warning'}
          />
          <MetricCard
            title="Completion Rate"
            value={dashboardData.hero.completion_rate}
            trend={completionTrend}
            status={parseFloat(dashboardData.hero.completion_rate) >= 70 ? 'good' : 'danger'}
          />
        </div>

        {/* Priority Alerts */}
        {dashboardData.alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🚨 Quick Scan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-4">
              {dashboardData.alerts.map((alert, idx) => (
                <PriorityAlert
                  key={idx}
                  priority={alert.priority}
                  title={alert.title}
                  cohort={alert.cohort_id ? `Cohort ID: ${alert.cohort_id.slice(0, 8)}` : undefined}
                  actions={[
                    { label: alert.action, href: alert.cohort_id ? `/dashboard/director/cohorts/${alert.cohort_id}` : undefined },
                  ]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Cohorts Table - Takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Table Header with Filters */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Cohorts Overview</h2>
                  
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Search: Cyber..."
                      value={filters.search}
                      onChange={(e) => setFilter('search', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <select
                      value={filters.risk}
                      onChange={(e) => setFilter('risk', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Risk: All</option>
                      <option value="high">Risk: High</option>
                      <option value="medium">Risk: Medium</option>
                      <option value="low">Risk: Low</option>
                    </select>
                    
                    <select
                      value={filters.status}
                      onChange={(e) => setFilter('status', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="running">Status: Running</option>
                      <option value="active">Status: Active</option>
                      <option value="all">Status: All</option>
                    </select>
                    
                    <button
                      onClick={() => {
                        // Export CSV
                        const csv = [
                          ['Name', 'Seats', 'Readiness', 'Completion', 'Risk'],
                          ...filteredCohorts.map(c => [
                            c.name,
                            c.seats_used,
                            c.readiness,
                            c.completion,
                            c.risk_score,
                          ]),
                        ].map(row => row.join(',')).join('\n')
                        
                        const blob = new Blob([csv], { type: 'text/csv' })
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'cohorts-export.csv'
                        a.click()
                        window.URL.revokeObjectURL(url)
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedCohorts.length > 0 && (
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedCohorts.length} cohort{selectedCohorts.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => clearSelection()}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        // Bulk approve
                        console.log('Bulk approve:', selectedCohorts)
                        clearSelection()
                      }}
                      className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Bulk Approve
                    </button>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedCohorts.length === filteredCohorts.length && filteredCohorts.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              filteredCohorts.forEach(c => setSelected(c.cohort_id, true))
                            } else {
                              clearSelection()
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Readiness Δ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Complete
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mentors
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Next
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCohorts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                          No cohorts found
                        </td>
                      </tr>
                    ) : (
                      filteredCohorts.map((cohort) => {
                        // Calculate risk score from risk flags
                        const riskScore = cohort.risk_flags?.length || 0
                        const completionPct = parseFloat(cohort.completion_pct?.toString() || '0')
                        const readinessAvg = parseFloat(cohort.readiness_avg?.toString() || '0')
                        
                        // Determine risk level
                        let calculatedRisk = riskScore
                        if (completionPct < 60) calculatedRisk += 2
                        if (readinessAvg < 60) calculatedRisk += 2
                        
                        return (
                          <CohortRow
                            key={cohort.cohort_id || cohort.id}
                            cohort={{
                              cohort_id: cohort.cohort_id || cohort.id,
                              name: cohort.cohort_name || cohort.name || 'Unnamed Cohort',
                              seats_used: `${cohort.seats_used_total || 0}/${cohort.seat_cap || 0}`,
                              readiness: readinessAvg,
                              completion: `${completionPct.toFixed(0)}%`,
                              mentor_coverage: `${cohort.mentor_coverage_pct || 0}%`,
                              risk_score: calculatedRisk,
                              next_milestone: cohort.next_milestone?.title || cohort.next_milestone || 'N/A',
                              risk_flags: cohort.risk_flags || [],
                            }}
                            selected={selectedCohorts.includes(cohort.cohort_id || cohort.id)}
                            onSelect={setSelected}
                          />
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar - Takes 1 column */}
          <div className="lg:col-span-1">
            <QuickActionsSidebar />
          </div>
        </div>
      </main>
    </div>
  )
}

