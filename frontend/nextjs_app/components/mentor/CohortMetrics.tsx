'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { AssignedMentee } from '@/services/types/mentor'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface CohortMetricsProps {
  mentees: AssignedMentee[]
  mentorId: string
}

interface CohortData {
  cohortName: string
  cohortId: string
  menteeCount: number
  averageReadiness: number
  riskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
  missionCompletionRate: number
  totalMissions: number
  completedMissions: number
  subscriptionTiers: {
    professional: number
    free: number
  }
  mentees: AssignedMentee[]
}

const COLORS = {
  low: '#10b981', // mint
  medium: '#f59e0b', // gold
  high: '#f97316', // orange
  critical: '#ef4444', // red
}

export function CohortMetrics({ mentees, mentorId }: CohortMetricsProps) {
  const [cohortData, setCohortData] = useState<CohortData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null)

  // Group mentees by cohort and calculate metrics
  useEffect(() => {
    const calculateCohortMetrics = () => {
      const cohortMap = new Map<string, AssignedMentee[]>()

      // Group mentees by cohort
      mentees.forEach((mentee) => {
        const cohortKey = mentee.cohort || 'Unassigned'
        if (!cohortMap.has(cohortKey)) {
          cohortMap.set(cohortKey, [])
        }
        cohortMap.get(cohortKey)!.push(mentee)
      })

      // Calculate metrics for each cohort
      const metrics: CohortData[] = Array.from(cohortMap.entries()).map(([cohortName, cohortMentees]) => {
        const totalReadiness = cohortMentees.reduce((sum, m) => sum + (m.readiness_score || 0), 0)
        const averageReadiness = cohortMentees.length > 0 ? Math.round(totalReadiness / cohortMentees.length) : 0

        const riskDistribution = {
          low: cohortMentees.filter((m) => (m.risk_level || 'low') === 'low').length,
          medium: cohortMentees.filter((m) => m.risk_level === 'medium').length,
          high: cohortMentees.filter((m) => m.risk_level === 'high').length,
          critical: 0,
        }

        const totalMissions = cohortMentees.reduce((sum, m) => sum + (m.missions_completed || 0), 0)
        const completedMissions = totalMissions
        const missionCompletionRate = cohortMentees.length > 0 ? Math.round((totalMissions / cohortMentees.length) * 10) / 10 : 0

        const subscriptionTiers = {
          professional: cohortMentees.filter((m) => m.subscription_tier === 'professional').length,
          free: cohortMentees.filter((m) => m.subscription_tier !== 'professional').length,
        }

        return {
          cohortName,
          cohortId: cohortName, // Use cohort name as ID for now
          menteeCount: cohortMentees.length,
          averageReadiness,
          riskDistribution,
          missionCompletionRate,
          totalMissions,
          completedMissions,
          subscriptionTiers,
          mentees: cohortMentees,
        }
      })

      setCohortData(metrics.sort((a, b) => b.averageReadiness - a.averageReadiness))
      setLoading(false)
    }

    if (mentees.length > 0) {
      calculateCohortMetrics()
    } else {
      setLoading(false)
    }
  }, [mentees])

  // Prepare data for charts
  const readinessChartData = useMemo(() => {
    return cohortData.map((cohort) => ({
      name: cohort.cohortName.length > 15 ? cohort.cohortName.substring(0, 15) + '...' : cohort.cohortName,
      fullName: cohort.cohortName,
      readiness: cohort.averageReadiness,
      mentees: cohort.menteeCount,
    }))
  }, [cohortData])

  const riskChartData = useMemo(() => {
    const aggregated = cohortData.reduce(
      (acc, cohort) => ({
        low: acc.low + cohort.riskDistribution.low,
        medium: acc.medium + cohort.riskDistribution.medium,
        high: acc.high + cohort.riskDistribution.high,
        critical: acc.critical + cohort.riskDistribution.critical,
      }),
      { low: 0, medium: 0, high: 0, critical: 0 }
    )

    return [
      { name: 'Low Risk', value: aggregated.low, color: COLORS.low },
      { name: 'Medium Risk', value: aggregated.medium, color: COLORS.medium },
      { name: 'High Risk', value: aggregated.high, color: COLORS.high },
      { name: 'Critical Risk', value: aggregated.critical, color: COLORS.critical },
    ].filter((item) => item.value > 0)
  }, [cohortData])

  const missionChartData = useMemo(() => {
    return cohortData.map((cohort) => ({
      name: cohort.cohortName.length > 15 ? cohort.cohortName.substring(0, 15) + '...' : cohort.cohortName,
      fullName: cohort.cohortName,
      avgMissions: cohort.missionCompletionRate,
      totalMissions: cohort.totalMissions,
    }))
  }, [cohortData])

  const selectedCohortData = useMemo(() => {
    if (!selectedCohort) return null
    return cohortData.find((c) => c.cohortId === selectedCohort)
  }, [selectedCohort, cohortData])

  if (loading) {
    return (
      <div className="text-och-steel text-center py-8">Loading cohort metrics...</div>
    )
  }

  if (cohortData.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <p className="text-och-steel text-center">No cohort data available. Assign mentees to cohorts to see metrics.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-och-steel mb-1">Total Cohorts</div>
          <div className="text-2xl font-bold text-white">{cohortData.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-och-steel mb-1">Total Mentees</div>
          <div className="text-2xl font-bold text-white">{mentees.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-och-steel mb-1">Avg Readiness</div>
          <div className="text-2xl font-bold text-och-mint">
            {cohortData.length > 0
              ? Math.round(cohortData.reduce((sum, c) => sum + c.averageReadiness, 0) / cohortData.length)
              : 0}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-och-steel mb-1">Total Missions</div>
          <div className="text-2xl font-bold text-white">
            {cohortData.reduce((sum, c) => sum + c.totalMissions, 0)}
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Readiness by Cohort */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Average Readiness by Cohort</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={readinessChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#10b981' }}
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'readiness') return [`${value}%`, 'Readiness']
                    return [value, 'Mentees']
                  }}
                />
                <Legend />
                <Bar dataKey="readiness" fill="#10b981" name="Readiness %" radius={[8, 8, 0, 0]} />
                <Bar dataKey="mentees" fill="#3b82f6" name="Mentees" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Overall Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Mission Completion by Cohort */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Mission Completion by Cohort</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={missionChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value}`, 'Avg Missions']}
              />
              <Legend />
              <Bar dataKey="avgMissions" fill="#8b5cf6" name="Avg Missions per Mentee" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Cohort Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cohortData.map((cohort) => (
          <Card
            key={cohort.cohortId}
            className={`cursor-pointer transition-all ${
              selectedCohort === cohort.cohortId ? 'ring-2 ring-och-mint' : 'hover:border-och-mint/50'
            }`}
            onClick={() => setSelectedCohort(selectedCohort === cohort.cohortId ? null : cohort.cohortId)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{cohort.cohortName}</h3>
                <Badge variant="defender">{cohort.menteeCount} mentees</Badge>
              </div>

              <div className="space-y-4">
                {/* Average Readiness */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-och-steel">Average Readiness</span>
                    <span className="text-sm font-semibold text-white">{cohort.averageReadiness}%</span>
                  </div>
                  <ProgressBar
                    value={cohort.averageReadiness}
                    variant={cohort.averageReadiness >= 70 ? 'mint' : cohort.averageReadiness >= 40 ? 'gold' : 'orange'}
                  />
                </div>

                {/* Risk Distribution */}
                <div>
                  <div className="text-sm text-och-steel mb-2">Risk Distribution</div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <div className="text-xs text-och-steel">Low</div>
                      <div className="text-sm font-semibold text-och-mint">{cohort.riskDistribution.low}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-och-steel">Medium</div>
                      <div className="text-sm font-semibold text-och-gold">{cohort.riskDistribution.medium}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-och-steel">High</div>
                      <div className="text-sm font-semibold text-och-orange">{cohort.riskDistribution.high}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-och-steel">Critical</div>
                      <div className="text-sm font-semibold text-red-500">{cohort.riskDistribution.critical}</div>
                    </div>
                  </div>
                </div>

                {/* Mission Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-och-steel/20">
                  <div>
                    <div className="text-xs text-och-steel">Avg Missions</div>
                    <div className="text-lg font-semibold text-white">{cohort.missionCompletionRate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-och-steel">Total Missions</div>
                    <div className="text-lg font-semibold text-white">{cohort.totalMissions}</div>
                  </div>
                </div>

                {/* Subscription Tiers */}
                <div className="pt-2 border-t border-och-steel/20">
                  <div className="text-xs text-och-steel mb-2">Subscription Tiers</div>
                  <div className="flex gap-2">
                    <Badge variant="defender" className="text-xs">
                      Professional: {cohort.subscriptionTiers.professional}
                    </Badge>
                    <Badge variant="steel" className="text-xs">
                      Free: {cohort.subscriptionTiers.free}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Selected Cohort Details */}
      {selectedCohortData && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Detailed View: {selectedCohortData.cohortName}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setSelectedCohort(null)}>
                Close
              </Button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-och-steel mb-2">Mentees in this cohort:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedCohortData.mentees.map((mentee) => (
                  <div
                    key={mentee.id}
                    className="p-3 bg-och-midnight/50 border border-och-steel/20 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{mentee.name}</div>
                        <div className="text-xs text-och-steel">{mentee.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-och-steel">Readiness</div>
                        <div className="text-sm font-semibold text-white">{mentee.readiness_score || 0}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={
                          mentee.risk_level === 'high'
                            ? 'orange'
                            : mentee.risk_level === 'medium'
                            ? 'gold'
                            : 'mint'
                        }
                        className="text-xs"
                      >
                        {mentee.risk_level || 'low'}
                      </Badge>
                      <Badge variant="steel" className="text-xs">
                        {mentee.missions_completed || 0} missions
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

