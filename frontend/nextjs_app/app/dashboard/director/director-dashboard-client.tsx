'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DirectorSidebar } from '@/components/dashboard/DirectorSidebar'
import { ActionCenter } from '@/components/dashboard/ActionCenter'
import { CreateProgramView } from '@/components/dashboard/CreateProgramView'
import { ViewProgramsView } from '@/components/dashboard/ViewProgramsView'
import { DirectorAnalytics } from '@/components/dashboard/DirectorAnalytics'
import {
  useDirectorDashboard,
  useCohorts,
  usePrograms,
} from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'
import type { DirectorAlert } from '@/services/programsClient'

type ViewType = 'dashboard' | 'create-program' | 'view-programs' | 'analytics'

interface PendingRequest {
  id: string
  type: 'enrollment' | 'mentor_assignment' | 'cohort_placement'
  title: string
  description: string
  cohortName?: string
  userName?: string
  timestamp: string
  onApprove?: () => void
  onReject?: () => void
}

interface Review {
  id: string
  type: 'cohort_placement' | 'enrollment_review'
  title: string
  description: string
  cohortName: string
  count: number
  timestamp: string
  onReview?: () => void
}

export default function DirectorDashboardClient() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState<ViewType>('dashboard')
  const { dashboard, isLoading, error, reload } = useDirectorDashboard()
  const { cohorts, reload: reloadCohorts } = useCohorts()
  const { programs, reload: reloadPrograms } = usePrograms()

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [reviews, setReviews] = useState<Review[]>([])

  // Load pending requests and reviews from API
  useEffect(() => {
    const loadActionItems = async () => {
      try {
        // TODO: Replace with actual API endpoints when available
        // For now, we'll generate mock data based on cohorts
        const mockRequests: PendingRequest[] = []
        const mockReviews: Review[] = []

        // Generate mock enrollment requests
        if (cohorts && cohorts.length > 0) {
          cohorts.slice(0, 3).forEach((cohort, idx) => {
            mockRequests.push({
              id: `req-${idx}`,
              type: 'enrollment',
              title: 'Enrollment Request',
              description: `New student enrollment request pending approval for ${cohort.name}`,
              cohortName: cohort.name,
              userName: `Student ${idx + 1}`,
              timestamp: new Date(Date.now() - idx * 3600000).toISOString(),
              onApprove: async () => {
                // TODO: Implement actual approval logic
                console.log('Approving enrollment request', `req-${idx}`)
                setPendingRequests((prev) => prev.filter((r) => r.id !== `req-${idx}`))
              },
              onReject: async () => {
                // TODO: Implement actual rejection logic
                console.log('Rejecting enrollment request', `req-${idx}`)
                setPendingRequests((prev) => prev.filter((r) => r.id !== `req-${idx}`))
              },
            })
          })

          // Generate mock cohort placement reviews
          cohorts.slice(0, 2).forEach((cohort, idx) => {
            mockReviews.push({
              id: `review-${idx}`,
              type: 'cohort_placement',
              title: 'Cohort Placement Reviews',
              description: `Multiple cohort placement reviews pending for ${cohort.name}`,
              cohortName: cohort.name,
              count: Math.floor(Math.random() * 10) + 1,
              timestamp: new Date(Date.now() - idx * 7200000).toISOString(),
              onReview: () => {
                console.log('Opening review panel for', cohort.name)
                // Could navigate to cohort detail page
              },
            })
          })
        }

        setPendingRequests(mockRequests)
        setReviews(mockReviews)
      } catch (err) {
        console.error('Error loading action items:', err)
      }
    }

    if (cohorts) {
      loadActionItems()
    }
  }, [cohorts])

  // Refresh data when switching views
  useEffect(() => {
    if (activeView === 'view-programs') {
      reloadPrograms()
    } else if (activeView === 'dashboard') {
      reload()
      reloadCohorts()
    }
  }, [activeView, reload, reloadPrograms, reloadCohorts])

  if (isLoading && activeView === 'dashboard' && !dashboard) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-och-mint text-4xl mb-4">⏳</div>
          <p className="text-och-steel text-lg">Loading director dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && activeView === 'dashboard' && !dashboard) {
    return (
      <div className="min-h-screen bg-och-midnight p-6">
        <Card className="border-och-orange/50">
          <div className="text-center py-8">
            <p className="text-och-orange mb-4 font-semibold">Error loading dashboard</p>
            <p className="text-och-steel mb-4">{error}</p>
            <Button onClick={reload} variant="outline">
              🔄 Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const alerts: DirectorAlert[] = dashboard?.alerts || []

  // Render main content based on active view
  const renderMainContent = () => {
    switch (activeView) {
      case 'create-program':
        return <CreateProgramView />
      case 'view-programs':
        return <ViewProgramsView />
      case 'analytics':
        return <DirectorAnalytics />
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-mint">
                Welcome back{user?.first_name ? `, ${user.first_name}` : ''}!
              </h1>
              <p className="text-och-steel">Command center for programs, cohorts, and outcomes</p>
            </div>

            {/* Hero Metrics - Compact */}
            {dashboard && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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

            {/* Action Center - Priority Section */}
            <ActionCenter
              alerts={alerts}
              pendingRequests={pendingRequests}
              reviews={reviews}
            />

            {/* Quick Actions */}
            <Card className="border-och-defender/30">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>⚡</span>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="defender"
                  className="flex items-center justify-center gap-2 py-4"
                  onClick={() => setActiveView('create-program')}
                >
                  <span className="text-xl">➕</span>
                  <span>Create Program</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 py-4"
                  onClick={() => setActiveView('view-programs')}
                >
                  <span className="text-xl">📋</span>
                  <span>View Programs</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 py-4"
                  onClick={() => setActiveView('analytics')}
                >
                  <span className="text-xl">📈</span>
                  <span>Analytics</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 py-4"
                  onClick={() => window.location.href = '/dashboard/director/cohorts/new'}
                >
                  <span className="text-xl">📅</span>
                  <span>Create Cohort</span>
                </Button>
              </div>
            </Card>

            {/* Recent Cohorts - Compact View */}
            {dashboard && dashboard.cohort_table.length > 0 && (
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Recent Cohorts</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveView('analytics')}
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {dashboard.cohort_table.slice(0, 5).map((cohort) => (
                    <div
                      key={cohort.id}
                      className="p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-defender/50 transition-colors cursor-pointer"
                      onClick={() => {
                        // Navigate to cohort detail
                        window.location.href = `/dashboard/director/cohorts/${cohort.id}`
                      }}
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
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight flex">
      {/* Sidebar */}
      <DirectorSidebar
        activeView={activeView}
        onViewChange={(view) => setActiveView(view as ViewType)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">{renderMainContent()}</div>
      </div>
    </div>
  )
}

