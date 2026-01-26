'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useCohorts, usePrograms, useCohortDashboard } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'

export default function DirectorClient() {
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null)
  
  const { programs, isLoading: programsLoading } = usePrograms()
  const { cohorts, isLoading: cohortsLoading } = useCohorts({ status: 'active' })
  const { dashboard: dashboardData, isLoading: dashboardLoading } = useCohortDashboard(
    selectedCohortId || ''
  )

  const activeCohorts = Array.isArray(cohorts) ? cohorts.filter(c => c.status === 'active' || c.status === 'running') : []
  const totalSeatsUsed = activeCohorts.reduce((sum, c) => sum + (c.enrolled_count || 0), 0)
  const totalSeatsAvailable = activeCohorts.reduce((sum, c) => sum + c.seat_cap, 0)
  const overallCompletionRate = activeCohorts.length > 0
    ? activeCohorts.reduce((sum, c) => sum + (c.completion_rate || 0), 0) / activeCohorts.length
    : 0

  const handleExportReport = async (cohortId: string, format: 'csv' | 'json' = 'json') => {
    try {
      const blob = await programsClient.exportCohortReport(cohortId, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cohort-report-${cohortId}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const quickActions = [
    { label: 'Create Program', href: '/dashboard/director/programs/new', icon: '➕' },
    { label: 'Create Cohort', href: '/dashboard/director/cohorts/new', icon: '📅' },
    { label: 'Define Rules', href: '/dashboard/director/rules', icon: '📋' },
    { label: 'Assign Mentors', href: '/dashboard/director/mentors', icon: '👥' },
    { label: 'Manage Calendar', href: '/dashboard/director/calendar', icon: '📆' },
    { label: 'View Reports', href: '/dashboard/director/reports', icon: '📊' },
    { label: 'Auto-Graduate', href: '/dashboard/director/graduation', icon: '🎓' },
    { label: 'Certificates', href: '/dashboard/director/certificates', icon: '🏆' },
  ]

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-orange">Program Director Dashboard</h1>
          <p className="text-och-steel">Strategic oversight and program management.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card gradient="leadership">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-och-steel text-sm mb-1">Active Cohorts</p>
                <p className="text-3xl font-bold text-white">
                  {cohortsLoading ? '...' : activeCohorts.length}
                </p>
              </div>
              <Badge variant="orange">Active</Badge>
            </div>
          </Card>

          <Card gradient="leadership">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-och-steel text-sm mb-1">Seat Utilization</p>
                <p className="text-3xl font-bold text-white">
                  {cohortsLoading ? '...' : totalSeatsAvailable > 0
                    ? `${Math.round((totalSeatsUsed / totalSeatsAvailable) * 100)}%`
                    : '0%'}
                </p>
              </div>
              <Badge variant="defender">
                {totalSeatsUsed}/{totalSeatsAvailable}
              </Badge>
            </div>
          </Card>

          <Card gradient="leadership">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-och-steel text-sm mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-white">
                  {cohortsLoading ? '...' : `${Math.round(overallCompletionRate)}%`}
                </p>
              </div>
              <Badge variant="mint">Avg</Badge>
            </div>
          </Card>

          <Card gradient="leadership">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-och-steel text-sm mb-1">Total Programs</p>
                <p className="text-3xl font-bold text-white">
                  {programsLoading ? '...' : programs?.length || 0}
                </p>
              </div>
              <Badge variant="gold">All</Badge>
            </div>
          </Card>
        </div>

        {/* Quick Actions & Cohort List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4 text-white">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-24 w-full"
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="text-xs text-center">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Active Cohorts</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {cohortsLoading ? (
                <p className="text-och-steel">Loading...</p>
              ) : activeCohorts.length === 0 ? (
                <p className="text-och-steel">No active cohorts</p>
              ) : (
                activeCohorts.map((cohort) => (
                  <div
                    key={cohort.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCohortId === cohort.id
                        ? 'bg-och-defender/50 border border-och-defender'
                        : 'bg-och-midnight/50 hover:bg-och-midnight/70'
                    }`}
                    onClick={() => setSelectedCohortId(cohort.id)}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{cohort.name}</span>
                      <Badge variant={cohort.status === 'running' ? 'mint' : 'defender'}>
                        {cohort.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-och-steel mb-2">
                      {cohort.track_name || cohort.track}
                    </div>
                    <ProgressBar
                      value={cohort.completion_rate || 0}
                      variant="orange"
                      showLabel={false}
                    />
                    <div className="flex justify-between text-xs text-och-steel mt-1">
                      <span>{cohort.enrolled_count || 0}/{cohort.seat_cap} seats</span>
                      <span>{Math.round(cohort.completion_rate || 0)}% complete</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Cohort Dashboard Details */}
        {selectedCohortId && dashboardData && (
          <Card className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Cohort Dashboard: {dashboardData.cohort_name}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleExportReport(selectedCohortId, 'json')}
                >
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportReport(selectedCohortId, 'csv')}
                >
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-och-midnight/50 rounded-lg">
                <p className="text-och-steel text-sm mb-1">Enrollments</p>
                <p className="text-2xl font-bold text-white">{dashboardData.enrollments_count}</p>
              </div>
              <div className="p-4 bg-och-midnight/50 rounded-lg">
                <p className="text-och-steel text-sm mb-1">Seat Utilization</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round(dashboardData.seat_utilization)}%
                </p>
              </div>
              <div className="p-4 bg-och-midnight/50 rounded-lg">
                <p className="text-och-steel text-sm mb-1">Mentors Assigned</p>
                <p className="text-2xl font-bold text-white">
                  {dashboardData.mentor_assignments_count}
                </p>
              </div>
              <div className="p-4 bg-och-midnight/50 rounded-lg">
                <p className="text-och-steel text-sm mb-1">Completion %</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round(dashboardData.completion_percentage)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-och-midnight/50 rounded-lg">
                <p className="text-och-steel text-sm mb-2">Payment Status</p>
                <div className="flex justify-between items-center">
                  <span className="text-white">Paid: {dashboardData.payments_complete}</span>
                  <span className="text-och-orange">
                    Pending: {dashboardData.payments_pending}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-och-midnight/50 rounded-lg">
                <p className="text-och-steel text-sm mb-2">Readiness Delta</p>
                <p className="text-2xl font-bold text-white">
                  {dashboardData.readiness_delta > 0 ? '+' : ''}
                  {dashboardData.readiness_delta.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Programs Overview */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Programs Overview</h2>
            <Link href="/dashboard/director/programs/new">
              <Button variant="orange">Create Program</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {programsLoading ? (
              <p className="text-och-steel">Loading programs...</p>
            ) : Array.isArray(programs) && programs.length > 0 ? (
              programs.map((program) => (
                <div key={program.id} className="p-4 bg-och-midnight/50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{program.name}</h3>
                      <p className="text-sm text-och-steel">{program.description}</p>
                    </div>
                    <Badge variant={program.status === 'active' ? 'mint' : 'defender'}>
                      {program.status}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-och-steel">
                    <span>Category: {program.category}</span>
                    <span>Duration: {program.duration_months} months</span>
                    <span>Price: {program.currency} {program.default_price}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-och-steel">No programs found</p>
            )}
          </div>
        </Card>

        <div className="mt-8 flex justify-end gap-4">
          <Link href="/dashboard/analytics">
            <Button variant="outline">View Analytics</Button>
          </Link>
          <Link href="/dashboard/director/reports">
            <Button variant="orange">Generate Reports</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
