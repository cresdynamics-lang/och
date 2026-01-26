'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useDirectorDashboard, useCohorts, usePrograms } from '@/hooks/usePrograms'
import { useAuth } from '@/hooks/useAuth'
import { TrackDistributionChart } from '@/components/admin/TrackDistributionChart'

interface PendingAction {
  id: string
  type: 'enrollment' | 'mentor_assignment' | 'cohort_placement' | 'seat_allocation'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  count?: number
  href: string
}

export default function OverviewClient() {
  const { user } = useAuth()
  const { dashboard, isLoading, reload } = useDirectorDashboard()
  const { cohorts, reload: reloadCohorts } = useCohorts()
  const { programs, reload: reloadPrograms } = usePrograms()
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])

  useEffect(() => {
    const loadPendingActions = async () => {
      // TODO: Replace with actual API endpoints
      const actions: PendingAction[] = []
      
      // Mock enrollment approvals
      if (cohorts && cohorts.length > 0) {
        actions.push({
          id: 'enrollment-1',
          type: 'enrollment',
          title: 'Pending Enrollment Approvals',
          description: 'New student enrollment requests awaiting your approval',
          priority: 'high',
          count: 5,
          href: '/dashboard/director/enrollment'
        })
      }

      // Mock mentor assignments
      actions.push({
        id: 'mentor-1',
        type: 'mentor_assignment',
        title: 'Mentor Assignments Needed',
        description: 'Cohorts require mentor assignments or reassignments',
        priority: 'high',
        count: 3,
        href: '/dashboard/director/mentors'
      })

      // Mock seat allocation
      if (cohorts && cohorts.length > 0) {
        const cohortsNeedingSeats = cohorts.filter((c: any) => 
          (c.seats_used || 0) < (c.seat_cap || 0) && c.status === 'active'
        )
        if (cohortsNeedingSeats.length > 0) {
          actions.push({
            id: 'seats-1',
            type: 'seat_allocation',
            title: 'Seat Allocation Available',
            description: 'Scholarship/sponsorship codes can be issued',
            priority: 'high',
            count: cohortsNeedingSeats.length,
            href: '/dashboard/director/enrollment/seats'
          })
        }
      }

      setPendingActions(actions)
    }

    if (cohorts) {
      loadPendingActions()
    }
  }, [cohorts])

  // Track distribution stats from cohorts - MUST be before any conditional returns
  const trackDistribution = useMemo(() => {
    const trackCounts: { [key: string]: number } = {
      Builders: 0,
      Leaders: 0,
      Entrepreneurs: 0,
      Educators: 0,
      Researchers: 0,
    }

    // Count students by track from cohorts
    if (cohorts && Array.isArray(cohorts)) {
      cohorts.forEach((cohort: any) => {
        const trackName = cohort.track_name || cohort.track_key
        if (trackName) {
          // Normalize track name
          const normalizedTrack = trackName
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
          
          // Handle variations
          if (normalizedTrack.includes('Builder')) {
            trackCounts.Builders += cohort.enrolled_count || cohort.seats_used || 0
          } else if (normalizedTrack.includes('Leader')) {
            trackCounts.Leaders += cohort.enrolled_count || cohort.seats_used || 0
          } else if (normalizedTrack.includes('Entrepreneur')) {
            trackCounts.Entrepreneurs += cohort.enrolled_count || cohort.seats_used || 0
          } else if (normalizedTrack.includes('Educator')) {
            trackCounts.Educators += cohort.enrolled_count || cohort.seats_used || 0
          } else if (normalizedTrack.includes('Researcher')) {
            trackCounts.Researchers += cohort.enrolled_count || cohort.seats_used || 0
          }
        }
      })
    }

    const total = Object.values(trackCounts).reduce((sum, count) => sum + count, 0)

    const COLORS: { [key: string]: string } = {
      Builders: '#3B82F6',
      Leaders: '#10B981',
      Entrepreneurs: '#8B5CF6',
      Educators: '#F59E0B',
      Researchers: '#EF4444',
    }

    // If no track data, use mock data based on the image percentages
    if (total === 0) {
      return [
        { name: 'Builders', value: 35, percentage: 35, color: COLORS.Builders },
        { name: 'Leaders', value: 22, percentage: 22, color: COLORS.Leaders },
        { name: 'Entrepreneurs', value: 18, percentage: 18, color: COLORS.Entrepreneurs },
        { name: 'Educators', value: 15, percentage: 15, color: COLORS.Educators },
        { name: 'Researchers', value: 10, percentage: 10, color: COLORS.Researchers },
      ]
    }

    return Object.entries(trackCounts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        color: COLORS[name] || '#6B7280',
      }))
      .filter((track) => track.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [cohorts])

  const alerts = dashboard?.alerts || []
  const highPriorityAlerts = alerts.filter((a: any) => a.severity === 'high' || a.severity === 'critical')

  if (isLoading && !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
          <p className="text-och-steel">Loading director dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-defender">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}!
        </h1>
        <p className="text-och-steel">Command center for programs, cohorts, and mentorship orchestration</p>
      </div>

      {/* High Priority Alerts */}
      {highPriorityAlerts.length > 0 && (
        <Card className="mb-6 border-och-orange/50 bg-och-orange/10">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-xl font-bold text-och-orange">High Priority Alerts</h2>
            </div>
            <div className="space-y-2">
              {highPriorityAlerts.map((alert: any, idx: number) => (
                <div key={idx} className="p-3 bg-och-midnight/50 rounded-lg">
                  <p className="text-white font-semibold">{alert.title}</p>
                  <p className="text-sm text-och-steel">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Priority Actions Section */}
      <Card className="mb-6 border-och-orange/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <h2 className="text-2xl font-bold text-white">Priority Actions</h2>
            </div>
            <Badge variant="orange" className="text-sm">High Priority</Badge>
          </div>
          
          {pendingActions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {pendingActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="block p-4 bg-och-midnight/50 rounded-lg border border-och-orange/30 hover:border-och-orange/60 hover:bg-och-midnight/70 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-och-steel">{action.description}</p>
                    </div>
                    {action.count !== undefined && (
                      <Badge variant="orange" className="ml-2">{action.count}</Badge>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-och-orange text-sm font-medium">
                    <span>Take Action</span>
                    <span>→</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-och-steel">
              <p>No pending priority actions at this time</p>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-och-steel/20">
            <Link href="/dashboard/director/cohorts/new">
              <Button variant="defender" className="w-full flex items-center justify-center gap-2">
                <span className="text-xl">📅</span>
                <span>Create Cohort</span>
              </Button>
            </Link>
            <Link href="/dashboard/director/programs/new">
              <Button variant="defender" className="w-full flex items-center justify-center gap-2">
                <span className="text-xl">➕</span>
                <span>Create Program</span>
              </Button>
            </Link>
            <Link href="/dashboard/director/enrollment">
              <Button variant="defender" className="w-full flex items-center justify-center gap-2">
                <span className="text-xl">✅</span>
                <span>Approve Enrollments</span>
              </Button>
            </Link>
            <Link href="/dashboard/director/mentors">
              <Button variant="defender" className="w-full flex items-center justify-center gap-2">
                <span className="text-xl">👥</span>
                <span>Assign Mentors</span>
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Hero Metrics */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card gradient="leadership" className="col-span-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-och-steel text-sm mb-1">Active Programs</p>
                <p className="text-3xl font-bold text-white">
                  {dashboard.hero_metrics.active_programs}
                </p>
              </div>
            </div>
          </Card>

          <Card gradient="leadership">
            <div>
              <p className="text-och-steel text-sm mb-1">Active Cohorts</p>
              <p className="text-3xl font-bold text-white">
                {dashboard.hero_metrics.active_cohorts}
              </p>
            </div>
          </Card>

          <Card gradient="leadership">
            <div>
              <p className="text-och-steel text-sm mb-1">Seat Utilization</p>
              <p className="text-3xl font-bold text-white">
                {dashboard.hero_metrics.seat_utilization}%
              </p>
            </div>
          </Card>

          <Card gradient="leadership">
            <div>
              <p className="text-och-steel text-sm mb-1">Avg Readiness</p>
              <p className="text-3xl font-bold text-white">
                {dashboard.hero_metrics.avg_readiness}%
              </p>
            </div>
          </Card>

          <Card gradient="leadership">
            <div>
              <p className="text-och-steel text-sm mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-white">
                {dashboard.hero_metrics.avg_completion_rate}%
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Track Distribution Chart */}
      <Card className="mb-6">
        <div className="p-6">
          <TrackDistributionChart data={trackDistribution} />
        </div>
      </Card>

      {/* Recent Cohorts */}
      {dashboard && dashboard.cohort_table && dashboard.cohort_table.length > 0 && (
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Recent Cohorts</h3>
              <Link href="/dashboard/director/cohorts">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dashboard.cohort_table.slice(0, 5).map((cohort: any) => (
                <Link
                  key={cohort.id}
                  href={`/dashboard/director/cohorts/${cohort.id}`}
                  className="block p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-defender/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{cohort.name}</p>
                      <p className="text-xs text-och-steel">
                        {cohort.program_name} • {cohort.track_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-och-steel">Seats</p>
                        <p className="text-sm font-semibold text-white">
                          {cohort.seats_used}/{cohort.seats_total}
                        </p>
                      </div>
                      <Badge
                        variant={
                          cohort.status === 'running'
                            ? 'mint'
                            : cohort.status === 'active'
                            ? 'defender'
                            : 'orange'
                        }
                      >
                        {cohort.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Program Management Guidelines */}
      <Card className="border-och-defender/30">
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>📋</span>
            Program Director Guidelines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-och-defender font-semibold mb-2">Program & Cohort Management</h4>
              <ul className="space-y-1 text-och-steel">
                <li>• Define programs, tracks, and learning goals</li>
                <li>• Create and manage cohorts with seat caps</li>
                <li>• Approve enrollments and override placements</li>
                <li>• Issue scholarship/sponsorship codes</li>
              </ul>
            </div>
            <div>
              <h4 className="text-och-defender font-semibold mb-2">Mentorship & Calendar</h4>
              <ul className="space-y-1 text-och-steel">
                <li>• Assign mentors to cohorts/tracks</li>
                <li>• Auto-generate optimal mentor–mentee matches</li>
                <li>• Configure mentorship cycles and milestones</li>
                <li>• Set calendar milestones and assessments</li>
              </ul>
            </div>
            <div>
              <h4 className="text-och-defender font-semibold mb-2">Curriculum & Assessment</h4>
              <ul className="space-y-1 text-och-steel">
                <li>• Define curriculum structure and modules</li>
                <li>• Publish and adjust missions</li>
                <li>• Modify scoring rules per track</li>
                <li>• Approve assessment windows</li>
              </ul>
            </div>
            <div>
              <h4 className="text-och-defender font-semibold mb-2">Analytics & Reporting</h4>
              <ul className="space-y-1 text-och-steel">
                <li>• View track-level and cohort analytics</li>
                <li>• Monitor mentor performance metrics</li>
                <li>• Export CSV/JSON reports</li>
                <li>• Track completion rates and readiness</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

