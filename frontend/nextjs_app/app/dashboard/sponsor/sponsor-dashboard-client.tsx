'use client'

import { useState, useEffect } from 'react'
import { sponsorClient, SponsorDashboardSummary, SponsorCohort } from '@/services/sponsorClient'
import { ROIMetricCard } from '@/components/sponsor/ROIMetricCard'
import { SponsorCohortRow } from '@/components/sponsor/SponsorCohortRow'
import { QuickSeatActions } from '@/components/sponsor/QuickSeatActions'
import { GraduateFunnel } from '@/components/sponsor/GraduateFunnel'
import { ConnectionsRow } from '@/components/sponsor/ConnectionsRow'
import { EnhancedSidebar } from '@/components/sponsor/EnhancedSidebar'

export default function SponsorDashboardClient() {
  const [summary, setSummary] = useState<SponsorDashboardSummary | null>(null)
  const [cohorts, setCohorts] = useState<SponsorCohort[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([])
  const [filters, setFilters] = useState({
    search: '',
    risk: 'all',
    track: 'all',
    status: 'all',
  })

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)

      const [dashboardSummary, cohortsData] = await Promise.all([
        sponsorClient.getSummary(),
        sponsorClient.getCohorts(),
      ])

      setSummary(dashboardSummary as SponsorDashboardSummary)
      setCohorts((cohortsData as any).results || [])
    } catch (err: any) {
      console.error('Dashboard load error:', err)
      setError(err?.message || err?.response?.data?.detail || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCohort = (cohortId: string, checked: boolean) => {
    if (checked) {
      setSelectedCohorts([...selectedCohorts, cohortId])
    } else {
      setSelectedCohorts(selectedCohorts.filter(id => id !== cohortId))
    }
  }

  const handleBulkExport = () => {
    const csv = [
      ['Cohort', 'Seats', 'ROI Score', 'Readiness', 'Graduates', 'Budget Used', 'Risk'],
      ...filteredCohorts.map(c => [
        c.cohort_name,
        `${c.seats_used}/${c.seats_total}`,
        calculateROIScore(c).toFixed(1),
        (c.avg_readiness || 0).toFixed(1),
        `${c.graduates_count || 0}/${c.seats_used}`,
        `Ksh ${c.budget_remaining ? (c.seats_total * 300 - c.budget_remaining) : 0}`,
        getRiskLevel(c),
      ]),
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sponsor-roi-report.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const calculateROIScore = (cohort: SponsorCohort): number => {
    // ROI calculation: readiness (40%) + completion (30%) + graduate rate (30%)
    const readiness = (cohort.avg_readiness || 0) / 100
    const completion = (cohort.completion_pct || 0) / 100
    const graduateRate = cohort.seats_used > 0 ? (cohort.graduates_count || 0) / cohort.seats_used : 0
    
    return (readiness * 0.4 + completion * 0.3 + graduateRate * 0.3) * 10
  }

  const getRiskLevel = (cohort: SponsorCohort): 'low' | 'medium' | 'high' => {
    const riskFlags = cohort.flags?.length || 0
    const atRiskCount = cohort.at_risk_count || 0
    const riskRatio = cohort.seats_used > 0 ? atRiskCount / cohort.seats_used : 0
    
    if (riskFlags >= 3 || riskRatio > 0.2) return 'high'
    if (riskFlags >= 1 || riskRatio > 0.1) return 'medium'
    return 'low'
  }

  // Filter cohorts (support both legacy dashboard shape and API shape)
  const cohortName = (c: SponsorCohort & { cohort_name?: string }) => c.cohort_name ?? c.name ?? ''
  const trackName = (c: SponsorCohort & { track_name?: string }) => (c as any).track_name ?? c.track_slug ?? ''
  const filteredCohorts = cohorts.filter((cohort) => {
    const name = cohortName(cohort)
    const matchesSearch = filters.search === '' || name.toLowerCase().includes(filters.search.toLowerCase())
    const matchesRisk = filters.risk === 'all' || getRiskLevel(cohort as any) === filters.risk
    const matchesTrack = filters.track === 'all' || trackName(cohort) === filters.track
    return matchesSearch && matchesRisk && matchesTrack
  })

  if (loading) {
    return (
      <div className="w-full max-w-7xl py-8 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-och-mint/40 border-t-och-mint rounded-full animate-spin" aria-hidden />
          <p className="text-och-steel text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="bg-och-midnight/80 border border-och-steel/30 rounded-2xl p-8 max-w-md w-full shadow-xl shadow-black/20">
          <div className="rounded-full w-12 h-12 bg-och-orange/20 flex items-center justify-center mb-4">
            <span className="text-2xl" aria-hidden>⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Unable to load dashboard</h2>
          <p className="text-och-steel text-sm mb-6">{error || 'No data available. Sign in or check your connection.'}</p>
          <button
            onClick={loadDashboard}
            className="w-full px-4 py-3 bg-och-defender text-white rounded-xl font-semibold hover:bg-och-defender/90 transition-colors focus:outline-none focus:ring-2 focus:ring-och-mint focus:ring-offset-2 focus:ring-offset-och-midnight"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const seatsUtilization = summary.seats_total > 0 
    ? Math.round((summary.seats_used / summary.seats_total) * 100) 
    : 0

  const budgetTotal = summary.budget_total || 0
  const budgetUsed = summary.budget_used || 0
  const budgetUtilization = budgetTotal > 0
    ? Math.round((budgetUsed / budgetTotal) * 100)
    : summary.budget_used_pct || 0

  return (
    <div className="w-full max-w-7xl py-8 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white tracking-tight">
            Sponsor Dashboard
          </h1>
          <p className="text-och-steel text-base max-w-2xl">
            Manage sponsored students, monitor cohort participation, and oversee financial commitments.
          </p>
        </div>
        
        {/* Hero ROI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <ROIMetricCard
            title="Seats utilized"
            value={summary.seats_used}
            subtitle={`${seatsUtilization}% of ${summary.seats_total} total`}
            trend={seatsUtilization > 0 ? { value: seatsUtilization, direction: 'up', label: '' } : undefined}
            icon="👥"
            roiColor={{ bg: 'bg-och-mint/20' }}
          />
          <ROIMetricCard
            title="Avg readiness"
            value={summary.avg_readiness.toFixed(1)}
            subtitle="Graduate readiness score"
            icon="📊"
            roiColor={{ bg: 'bg-och-defender/20' }}
          />
          <ROIMetricCard
            title="Graduates"
            value={summary.graduates_count}
            subtitle={`Across ${summary.active_cohorts_count} active cohort${summary.active_cohorts_count !== 1 ? 's' : ''}`}
            icon="🎓"
            roiColor={{ bg: 'bg-och-gold/20' }}
          />
          <ROIMetricCard
            title="Budget utilized"
            value={`Ksh ${(budgetUsed / 1000).toFixed(0)}K`}
            subtitle={`${budgetUtilization}% of Ksh ${(budgetTotal / 1000).toFixed(0)}K`}
            trend={{ value: budgetUtilization, direction: budgetUtilization >= 75 ? 'up' : 'neutral' }}
            icon="💰"
            roiColor={{ bg: budgetUtilization >= 75 ? 'bg-och-orange/20' : 'bg-och-gold/20' }}
          />
        </div>

        {/* Connections Row */}
        <ConnectionsRow
          employeesCount={summary.seats_used}
          financeTotal={summary.budget_total}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Cohorts Table - Takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-och-midnight/60 border border-och-steel/20 rounded-2xl overflow-hidden shadow-lg shadow-black/10">
              {/* Table Header with Filters */}
              <div className="p-5 sm:p-6 border-b border-och-steel/20 bg-och-midnight/40">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Sponsored cohorts
                  </h2>
                  
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Search cohorts..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-sm text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-mint focus:border-transparent w-full md:w-44"
                    />
                    
                    <select
                      value={filters.risk}
                      onChange={(e) => setFilters({ ...filters, risk: e.target.value })}
                      className="px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-mint"
                    >
                      <option value="all">Risk: All</option>
                      <option value="high">Risk: High</option>
                      <option value="medium">Risk: Medium</option>
                      <option value="low">Risk: Low</option>
                    </select>
                    
                    <select
                      value={filters.track}
                      onChange={(e) => setFilters({ ...filters, track: e.target.value })}
                      className="px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-och-mint"
                    >
                      <option value="all">Track: All</option>
                      {Array.from(new Set(cohorts.map(c => (c as any).track_name).filter(Boolean))).map((track: string) => (
                        <option key={track} value={track}>{track}</option>
                      ))}
                    </select>
                    
                    <button
                      onClick={handleBulkExport}
                      className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/90 transition-colors text-sm font-semibold flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-och-mint focus:ring-offset-2 focus:ring-offset-och-midnight"
                    >
                      Export ROI report
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedCohorts.length > 0 && (
                <div className="px-6 py-3 bg-och-mint/10 border-b border-och-mint/20 flex items-center justify-between">
                  <span className="text-sm font-medium text-och-mint">
                    {selectedCohorts.length} cohort{selectedCohorts.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCohorts([])}
                      className="px-3 py-1 text-sm text-och-steel hover:text-white"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        console.log('Bulk action on:', selectedCohorts)
                        setSelectedCohorts([])
                      }}
                      className="px-4 py-1 bg-och-defender text-white rounded text-sm hover:bg-och-defender/80 transition-colors"
                    >
                      Bulk Assign
                    </button>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-och-midnight border-b border-och-steel/20">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedCohorts.length === filteredCohorts.length && filteredCohorts.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCohorts(filteredCohorts.map(c => c.cohort_id))
                            } else {
                              setSelectedCohorts([])
                            }
                          }}
                          className="w-5 h-5 text-och-mint border-och-steel/20 rounded focus:ring-och-mint"
                        />
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Cohort
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        ROI Score
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Seats
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Readiness
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Graduates
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Budget Used
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Risk
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                    {filteredCohorts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-8 py-8 text-center text-och-steel">
                          No cohorts found
                        </td>
                      </tr>
                    ) : (
                      filteredCohorts.map((cohort) => (
                        <SponsorCohortRow
                          key={cohort.cohort_id}
                          cohort={{
                            cohort_id: cohort.cohort_id,
                            cohort_name: cohortName(cohort) || cohort.name,
                            track: trackName(cohort) || undefined,
                            seats_used: (cohort as any).seats_used ?? cohort.students_enrolled ?? 0,
                            seats_total: (cohort as any).seats_total ?? cohort.target_size ?? 0,
                            roi_score: calculateROIScore(cohort as any),
                            readiness_avg: (cohort as any).avg_readiness ?? 0,
                            graduates_ready: (cohort as any).graduates_count ?? 0,
                            graduates_total: (cohort as any).seats_used ?? cohort.students_enrolled ?? 0,
                            budget_used: (cohort as any).budget_remaining
                              ? ((cohort as any).seats_total * 300 - (cohort as any).budget_remaining)
                              : ((cohort as any).seats_used ?? cohort.students_enrolled ?? 0) * 300,
                            budget_total: ((cohort as any).seats_total ?? cohort.target_size ?? 0) * 300,
                            risk_level: getRiskLevel(cohort as any),
                          }}
                          selected={selectedCohorts.includes(cohort.cohort_id)}
                          onSelect={handleSelectCohort}
                          currency="Ksh"
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Enhanced Sidebar - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <EnhancedSidebar />
            </div>
          </div>
        </div>
    </div>
  )
}

