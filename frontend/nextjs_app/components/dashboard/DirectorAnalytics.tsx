'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useDirectorDashboard } from '@/hooks/usePrograms'

export function DirectorAnalytics() {
  const { dashboard, isLoading, error } = useDirectorDashboard()

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-och-steel">Loading analytics...</p>
        </div>
      </Card>
    )
  }

  if (error || !dashboard) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-och-orange">Error loading analytics: {error}</p>
        </div>
      </Card>
    )
  }

  const { hero_metrics, cohort_table, programs } = dashboard

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h2>
        <p className="text-och-steel">Comprehensive insights into your programs and cohorts</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card gradient="leadership">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-och-steel text-sm mb-1">Active Programs</p>
              <p className="text-3xl font-bold text-white">{hero_metrics.active_programs}</p>
            </div>
            <Badge variant="gold">Programs</Badge>
          </div>
        </Card>

        <Card gradient="leadership">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-och-steel text-sm mb-1">Active Cohorts</p>
              <p className="text-3xl font-bold text-white">{hero_metrics.active_cohorts}</p>
            </div>
            <Badge variant="orange">Active</Badge>
          </div>
        </Card>

        <Card gradient="leadership">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-och-steel text-sm mb-1">Seat Utilization</p>
              <p className="text-3xl font-bold text-white">{hero_metrics.seat_utilization}%</p>
            </div>
            <Badge variant="defender">
              {hero_metrics.seats_used}/{hero_metrics.seats_available}
            </Badge>
          </div>
        </Card>

        <Card gradient="leadership">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-och-steel text-sm mb-1">Avg Readiness</p>
              <p className="text-3xl font-bold text-white">{hero_metrics.avg_readiness}%</p>
            </div>
            <Badge variant="mint">Readiness</Badge>
          </div>
        </Card>

        <Card gradient="leadership">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-och-steel text-sm mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-white">
                {hero_metrics.avg_completion_rate}%
              </p>
            </div>
            <Badge variant="mint">Avg</Badge>
          </div>
        </Card>

        <Card gradient="leadership">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-och-steel text-sm mb-1">Revenue per Seat</p>
              <p className="text-3xl font-bold text-white">
                ${hero_metrics.revenue_per_seat.toFixed(0)}
              </p>
            </div>
            <Badge variant="gold">Revenue</Badge>
          </div>
        </Card>
      </div>

      {/* Cohort Performance */}
      <Card>
        <h3 className="text-xl font-bold text-white mb-4">Cohort Performance Overview</h3>
        {cohort_table.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-och-steel">No cohort data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cohort_table.map((cohort) => (
              <div
                key={cohort.id}
                className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{cohort.name}</h4>
                    <p className="text-sm text-och-steel">
                      {cohort.program_name} • {cohort.track_name}
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-och-steel mb-1">Seats</p>
                    <p className="text-sm font-semibold text-white">
                      {cohort.seats_used}/{cohort.seats_total}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-och-steel mb-1">Readiness Delta</p>
                    <p
                      className={`text-sm font-semibold ${
                        cohort.readiness_delta > 0 ? 'text-och-mint' : 'text-och-orange'
                      }`}
                    >
                      {cohort.readiness_delta > 0 ? '+' : ''}
                      {cohort.readiness_delta.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-och-steel mb-1">Completion</p>
                    <div className="w-24">
                      <ProgressBar value={cohort.completion_rate} variant="orange" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-och-steel mb-1">Mentor Coverage</p>
                    <p className="text-sm font-semibold text-white">{cohort.mentor_coverage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Programs Summary */}
      <Card>
        <h3 className="text-xl font-bold text-white mb-4">Programs Summary</h3>
        {programs && programs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((program) => (
              <div
                key={program.id}
                className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-semibold text-white">{program.name}</h4>
                  <Badge variant={program.status === 'active' ? 'mint' : 'defender'}>
                    {program.status}
                  </Badge>
                </div>
                <p className="text-sm text-och-steel mb-3">{program.description}</p>
                <div className="flex gap-4 text-xs text-och-steel">
                  <span>Category: {program.category}</span>
                  <span>Duration: {program.duration_months} months</span>
                  <span>
                    Price: {program.currency} {program.default_price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-och-steel">No programs found</p>
          </div>
        )}
      </Card>
    </div>
  )
}



