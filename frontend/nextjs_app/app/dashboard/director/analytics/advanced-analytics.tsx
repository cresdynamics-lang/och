'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SimpleChart, MetricCard } from '@/components/ui/Charts'
import { apiClient } from '@/services/apiClient'

interface AdvancedAnalyticsProps {
  onClose: () => void
}

export default function AdvancedAnalytics({ onClose }: AdvancedAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('funnel')
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = async (type: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<any>(`/api/v1/programs/director/advanced-analytics/${type}/`)
      setData(response)
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics(activeTab.replace('-', '_'))
  }, [activeTab])

  const tabs = [
    { id: 'funnel', label: 'Enrollment Funnel' },
    { id: 'cohort-comparison', label: 'Cohort Comparison' },
    { id: 'mentor-analytics', label: 'Mentor Analytics' },
    { id: 'revenue-analytics', label: 'Revenue Analytics' },
    { id: 'predictive-analytics', label: 'Predictive Analytics' }
  ]

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
          <p className="text-och-steel">Loading analytics...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-och-orange mb-4">{error}</p>
          <Button variant="defender" size="sm" onClick={() => loadAnalytics(activeTab.replace('-', '_'))}>
            Retry
          </Button>
        </div>
      )
    }

    if (!data) return null

    switch (activeTab) {
      case 'funnel':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.conversion_rates && Object.entries(data.conversion_rates).map(([key, value]: [string, any]) => (
                <Card key={key}>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                    <p className="text-2xl font-bold text-och-defender">{value.toFixed(1)}%</p>
                  </div>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              {data.funnel?.map((stage: any, index: number) => (
                <div key={stage.stage} className="flex items-center gap-4 p-4 bg-och-midnight/30 rounded-lg">
                  <div className="w-8 h-8 bg-och-defender rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{stage.stage}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-och-steel">{stage.count} users</span>
                      <Badge variant="defender">{stage.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'cohort-comparison':
        return (
          <div className="space-y-6">
            {data.benchmarks && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Avg Completion Rate</p>
                    <p className="text-2xl font-bold text-och-mint">{data.benchmarks.avg_completion_rate.toFixed(1)}%</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Avg Seat Utilization</p>
                    <p className="text-2xl font-bold text-och-defender">{data.benchmarks.avg_seat_utilization.toFixed(1)}%</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Avg Attendance</p>
                    <p className="text-2xl font-bold text-och-orange">{data.benchmarks.avg_attendance.toFixed(1)}%</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Avg Satisfaction</p>
                    <p className="text-2xl font-bold text-och-gold">{data.benchmarks.avg_satisfaction.toFixed(1)}/5</p>
                  </div>
                </Card>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-och-steel/20">
                    <th className="text-left p-3 text-och-steel text-sm font-semibold">Cohort</th>
                    <th className="text-left p-3 text-och-steel text-sm font-semibold">Program</th>
                    <th className="text-left p-3 text-och-steel text-sm font-semibold">Completion Rate</th>
                    <th className="text-left p-3 text-och-steel text-sm font-semibold">Seat Utilization</th>
                    <th className="text-left p-3 text-och-steel text-sm font-semibold">Attendance</th>
                    <th className="text-left p-3 text-och-steel text-sm font-semibold">Satisfaction</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cohorts?.map((cohort: any) => (
                    <tr key={cohort.cohort_id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                      <td className="p-3 text-white font-medium">{cohort.name}</td>
                      <td className="p-3 text-och-steel">{cohort.program}</td>
                      <td className="p-3">
                        <Badge variant={cohort.completion_rate > 80 ? 'mint' : cohort.completion_rate > 60 ? 'defender' : 'orange'}>
                          {cohort.completion_rate}%
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={cohort.seat_utilization > 90 ? 'mint' : cohort.seat_utilization > 70 ? 'defender' : 'orange'}>
                          {cohort.seat_utilization}%
                        </Badge>
                      </td>
                      <td className="p-3 text-och-steel">{cohort.avg_attendance}%</td>
                      <td className="p-3 text-och-steel">{cohort.avg_satisfaction}/5</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'mentor-analytics':
        return (
          <div className="space-y-6">
            {data.summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Total Mentors</p>
                    <p className="text-2xl font-bold text-white">{data.summary.total_mentors}</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Avg Utilization</p>
                    <p className="text-2xl font-bold text-och-defender">{data.summary.avg_utilization.toFixed(1)}%</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Over Capacity</p>
                    <p className="text-2xl font-bold text-och-orange">{data.summary.over_capacity}</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Under Utilized</p>
                    <p className="text-2xl font-bold text-och-mint">{data.summary.under_utilized}</p>
                  </div>
                </Card>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-och-steel/20">
                    <th className="text-left p-3 text-och-steel text-sm font-semibold">Mentor</th>
                    <th className="text-left p-3 text-och-steel text-sm font-semibold">Total Mentees</th>
                    <th className="text-left p-3 text-och-steel text-sm font-semibold">Utilization</th>
                    <th className="text-left p-3 text-och-steel text-sm font-semibold">Sessions</th>
                    <th className="text-left p-3 text-och-steel text-sm font-semibold">Satisfaction</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mentors?.map((mentor: any) => (
                    <tr key={mentor.mentor_id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                      <td className="p-3">
                        <div>
                          <p className="text-white font-medium">{mentor.name}</p>
                          <p className="text-och-steel text-sm">{mentor.email}</p>
                        </div>
                      </td>
                      <td className="p-3 text-white">{mentor.total_mentees}</td>
                      <td className="p-3">
                        <Badge variant={mentor.utilization > 100 ? 'orange' : mentor.utilization > 80 ? 'mint' : 'defender'}>
                          {mentor.utilization.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="p-3 text-och-steel">{mentor.sessions_completed}</td>
                      <td className="p-3 text-och-steel">{mentor.avg_satisfaction}/5</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'revenue-analytics':
        return (
          <div className="space-y-6">
            {data.summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-och-mint">${data.summary.total_revenue.toLocaleString()}</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Avg Revenue/Program</p>
                    <p className="text-2xl font-bold text-och-defender">${data.summary.avg_revenue_per_program.toLocaleString()}</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm mb-1">Paid Enrollments</p>
                    <p className="text-2xl font-bold text-och-orange">{data.summary.total_paid_enrollments}</p>
                  </div>
                </Card>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Revenue by Program</h3>
                  <div className="space-y-3">
                    {data.program_revenue?.map((program: any) => (
                      <div key={program.program_id} className="flex justify-between items-center p-3 bg-och-midnight/30 rounded">
                        <div>
                          <p className="text-white font-medium">{program.program_name}</p>
                          <p className="text-och-steel text-sm">{program.enrollments} enrollments</p>
                        </div>
                        <p className="text-och-mint font-bold">${program.total_revenue.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Monthly Trends</h3>
                  <div className="space-y-3">
                    {data.monthly_trends?.map((month: any) => (
                      <div key={month.month} className="flex justify-between items-center p-3 bg-och-midnight/30 rounded">
                        <div>
                          <p className="text-white font-medium">{month.month}</p>
                          <p className="text-och-steel text-sm">{month.enrollments} enrollments</p>
                        </div>
                        <p className="text-och-defender font-bold">${month.revenue.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )

      case 'predictive-analytics':
        return (
          <div className="space-y-6">
            {data.trend_analysis && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Trend Analysis</h3>
                  <div className="flex items-center gap-4">
                    <Badge variant={data.trend_analysis.trend_direction === 'increasing' ? 'mint' : data.trend_analysis.trend_direction === 'decreasing' ? 'orange' : 'defender'}>
                      {data.trend_analysis.trend_direction}
                    </Badge>
                    <span className="text-white font-bold text-xl">{data.trend_analysis.trend_percentage}%</span>
                  </div>
                </div>
              </Card>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Predictions</h3>
                  <div className="space-y-3">
                    {data.predictions?.map((prediction: any) => (
                      <div key={prediction.month} className="flex justify-between items-center p-3 bg-och-midnight/30 rounded">
                        <div>
                          <p className="text-white font-medium">{prediction.month}</p>
                          <p className="text-och-steel text-sm">Confidence: {prediction.confidence}%</p>
                        </div>
                        <p className="text-och-defender font-bold">{prediction.predicted_enrollments} enrollments</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Risk Factors</h3>
                  <div className="space-y-3">
                    {data.risk_factors?.map((risk: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-och-midnight/30 rounded">
                        <Badge variant={risk.severity === 'high' ? 'orange' : risk.severity === 'medium' ? 'defender' : 'mint'}>
                          {risk.severity}
                        </Badge>
                        <p className="text-white">{risk.factor}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <h4 className="text-white font-semibold mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      {data.recommendations?.map((rec: string, index: number) => (
                        <li key={index} className="text-och-steel text-sm flex items-start gap-2">
                          <span className="text-och-defender">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-och-midnight border border-och-steel/20 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-och-steel/20">
          <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        
        <div className="flex border-b border-och-steel/20">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-och-defender text-och-defender'
                  : 'border-transparent text-och-steel hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}