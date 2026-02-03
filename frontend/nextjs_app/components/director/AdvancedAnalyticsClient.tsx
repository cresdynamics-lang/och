'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'

interface FunnelData {
  funnel: Array<{
    stage: string
    count: number
    percentage: number
  }>
  conversion_rates: {
    inquiry_to_application: number
    application_to_active: number
    active_to_completion: number
  }
}

interface CohortComparison {
  cohorts: Array<{
    cohort_id: string
    name: string
    program: string
    completion_rate: number
    seat_utilization: number
    avg_attendance: number
    avg_satisfaction: number
  }>
  benchmarks: {
    avg_completion_rate: number
    avg_seat_utilization: number
    avg_attendance: number
    avg_satisfaction: number
  }
}

interface MentorAnalytics {
  mentors: Array<{
    mentor_id: string
    name: string
    utilization: number
    total_mentees: number
    avg_satisfaction: number
    sessions_completed: number
  }>
  summary: {
    total_mentors: number
    avg_utilization: number
    over_capacity: number
    under_utilized: number
  }
}

interface PredictiveData {
  predictions: Array<{
    month: string
    predicted_enrollments: number
    confidence: number
  }>
  trend_analysis: {
    trend_percentage: number
    trend_direction: string
  }
  risk_factors: Array<{
    factor: string
    severity: string
  }>
  recommendations: string[]
}

export default function AdvancedAnalyticsClient() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'funnel' | 'cohorts' | 'mentors' | 'revenue' | 'predictive'>('funnel')
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null)
  const [cohortComparison, setCohortComparison] = useState<CohortComparison | null>(null)
  const [mentorAnalytics, setMentorAnalytics] = useState<MentorAnalytics | null>(null)
  const [revenueData, setRevenueData] = useState<any>(null)
  const [predictiveData, setPredictiveData] = useState<PredictiveData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [activeTab])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      switch (activeTab) {
        case 'funnel':
          const funnelResponse = await fetch('/api/v1/director/advanced-analytics/enrollment_funnel/', { headers })
          if (funnelResponse.ok) setFunnelData(await funnelResponse.json())
          break
        
        case 'cohorts':
          const cohortResponse = await fetch('/api/v1/director/advanced-analytics/cohort_comparison/', { headers })
          if (cohortResponse.ok) setCohortComparison(await cohortResponse.json())
          break
        
        case 'mentors':
          const mentorResponse = await fetch('/api/v1/director/advanced-analytics/mentor_analytics/', { headers })
          if (mentorResponse.ok) setMentorAnalytics(await mentorResponse.json())
          break
        
        case 'revenue':
          const revenueResponse = await fetch('/api/v1/director/advanced-analytics/revenue_analytics/', { headers })
          if (revenueResponse.ok) setRevenueData(await revenueResponse.json())
          break
        
        case 'predictive':
          const predictiveResponse = await fetch('/api/v1/director/advanced-analytics/predictive_analytics/', { headers })
          if (predictiveResponse.ok) setPredictiveData(await predictiveResponse.json())
          break
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderFunnelChart = (data: FunnelData) => (
    <div className="space-y-6">
      <div className="space-y-3">
        {data.funnel.map((stage, index) => (
          <div key={stage.stage} className="relative">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">{stage.stage}</span>
              <div className="text-right">
                <span className="text-white font-bold">{stage.count.toLocaleString()}</span>
                <span className="text-och-steel text-sm ml-2">({stage.percentage.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="w-full bg-och-steel/20 rounded-full h-8">
              <div
                className="bg-gradient-to-r from-och-defender to-och-mint h-8 rounded-full flex items-center justify-center"
                style={{ width: `${Math.max(10, stage.percentage)}%` }}
              >
                <span className="text-white text-sm font-medium">{stage.percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card>
          <div className="p-4">
            <p className="text-och-steel text-sm">Inquiry → Application</p>
            <p className="text-xl font-bold text-och-defender">{data.conversion_rates.inquiry_to_application.toFixed(1)}%</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-och-steel text-sm">Application → Active</p>
            <p className="text-xl font-bold text-och-mint">{data.conversion_rates.application_to_active.toFixed(1)}%</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-och-steel text-sm">Active → Completion</p>
            <p className="text-xl font-bold text-och-orange">{data.conversion_rates.active_to_completion.toFixed(1)}%</p>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderCohortComparison = (data: CohortComparison) => (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-och-steel text-sm">Avg Completion Rate</p>
            <p className="text-xl font-bold text-white">{data.benchmarks.avg_completion_rate.toFixed(1)}%</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-och-steel text-sm">Avg Utilization</p>
            <p className="text-xl font-bold text-white">{data.benchmarks.avg_seat_utilization.toFixed(1)}%</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-och-steel text-sm">Avg Attendance</p>
            <p className="text-xl font-bold text-white">{data.benchmarks.avg_attendance.toFixed(1)}%</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-och-steel text-sm">Avg Satisfaction</p>
            <p className="text-xl font-bold text-white">{data.benchmarks.avg_satisfaction.toFixed(1)}/5</p>
          </div>
        </Card>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-och-steel/20">
              <th className="text-left py-3 text-och-steel">Cohort</th>
              <th className="text-right py-3 text-och-steel">Completion</th>
              <th className="text-right py-3 text-och-steel">Utilization</th>
              <th className="text-right py-3 text-och-steel">Attendance</th>
              <th className="text-right py-3 text-och-steel">Satisfaction</th>
            </tr>
          </thead>
          <tbody>
            {data.cohorts.map((cohort) => (
              <tr key={cohort.cohort_id} className="border-b border-och-steel/10">
                <td className="py-3">
                  <div>
                    <p className="text-white font-semibold">{cohort.name}</p>
                    <p className="text-xs text-och-steel">{cohort.program}</p>
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span className={`font-semibold ${
                    cohort.completion_rate >= data.benchmarks.avg_completion_rate ? 'text-och-mint' : 'text-och-orange'
                  }`}>
                    {cohort.completion_rate.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span className={`font-semibold ${
                    cohort.seat_utilization >= data.benchmarks.avg_seat_utilization ? 'text-och-mint' : 'text-och-orange'
                  }`}>
                    {cohort.seat_utilization.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span className={`font-semibold ${
                    cohort.avg_attendance >= data.benchmarks.avg_attendance ? 'text-och-mint' : 'text-och-orange'
                  }`}>
                    {cohort.avg_attendance.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span className={`font-semibold ${
                    cohort.avg_satisfaction >= data.benchmarks.avg_satisfaction ? 'text-och-mint' : 'text-och-orange'
                  }`}>
                    {cohort.avg_satisfaction.toFixed(1)}/5
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderMentorAnalytics = (data: MentorAnalytics) => (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-och-steel text-sm">Total Mentors</p>
            <p className="text-xl font-bold text-white">{data.summary.total_mentors}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-och-steel text-sm">Avg Utilization</p>
            <p className="text-xl font-bold text-white">{data.summary.avg_utilization.toFixed(1)}%</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-och-steel text-sm">Over Capacity</p>
            <p className="text-xl font-bold text-och-orange">{data.summary.over_capacity}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-och-steel text-sm">Under Utilized</p>
            <p className="text-xl font-bold text-och-mint">{data.summary.under_utilized}</p>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.mentors.map((mentor) => (
          <Card key={mentor.mentor_id}>
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-white">{mentor.name}</h3>
                  <p className="text-sm text-och-steel">{mentor.total_mentees} mentees</p>
                </div>
                <Badge variant={
                  mentor.utilization > 100 ? 'orange' :
                  mentor.utilization > 80 ? 'defender' : 'mint'
                }>
                  {mentor.utilization.toFixed(0)}%
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-och-steel">Sessions:</span>
                  <span className="text-white">{mentor.sessions_completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Satisfaction:</span>
                  <span className="text-white">{mentor.avg_satisfaction.toFixed(1)}/5</span>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="w-full bg-och-steel/20 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      mentor.utilization > 100 ? 'bg-och-orange' :
                      mentor.utilization > 80 ? 'bg-och-defender' : 'bg-och-mint'
                    }`}
                    style={{ width: `${Math.min(100, mentor.utilization)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
          <p className="text-och-steel">Loading advanced analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Advanced Analytics</h1>
        <p className="text-och-steel">Deep dive reports and visualizations for comprehensive insights</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-och-steel/20 overflow-x-auto">
        {[
          { key: 'funnel', label: 'Enrollment Funnel', icon: '📊' },
          { key: 'cohorts', label: 'Cohort Comparison', icon: '📈' },
          { key: 'mentors', label: 'Mentor Analytics', icon: '👥' },
          { key: 'revenue', label: 'Revenue Analysis', icon: '💰' },
          { key: 'predictive', label: 'Predictive Insights', icon: '🔮' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'text-och-defender border-b-2 border-och-defender'
                : 'text-och-steel hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <Card>
        <div className="p-6">
          {activeTab === 'funnel' && funnelData && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Enrollment Funnel Analysis</h2>
              {renderFunnelChart(funnelData)}
            </div>
          )}

          {activeTab === 'cohorts' && cohortComparison && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Cohort Performance Comparison</h2>
              {renderCohortComparison(cohortComparison)}
            </div>
          )}

          {activeTab === 'mentors' && mentorAnalytics && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Mentor Utilization Analytics</h2>
              {renderMentorAnalytics(mentorAnalytics)}
            </div>
          )}

          {activeTab === 'revenue' && revenueData && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Revenue Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-och-mint">${revenueData.summary.total_revenue.toLocaleString()}</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm">Paid Enrollments</p>
                    <p className="text-2xl font-bold text-white">{revenueData.summary.total_paid_enrollments}</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <p className="text-och-steel text-sm">Avg per Program</p>
                    <p className="text-2xl font-bold text-och-defender">${revenueData.summary.avg_revenue_per_program.toLocaleString()}</p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'predictive' && predictiveData && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Predictive Insights</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">Trend Analysis</h3>
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl ${
                          predictiveData.trend_analysis.trend_direction === 'increasing' ? 'text-och-mint' :
                          predictiveData.trend_analysis.trend_direction === 'decreasing' ? 'text-och-orange' : 'text-och-steel'
                        }`}>
                          {predictiveData.trend_analysis.trend_direction === 'increasing' ? '📈' :
                           predictiveData.trend_analysis.trend_direction === 'decreasing' ? '📉' : '➡️'}
                        </span>
                        <div>
                          <p className="text-xl font-bold text-white">{predictiveData.trend_analysis.trend_percentage.toFixed(1)}%</p>
                          <p className="text-sm text-och-steel capitalize">{predictiveData.trend_analysis.trend_direction}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">Next 3 Months</h3>
                      <div className="space-y-2">
                        {predictiveData.predictions.map((pred, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-och-steel">{pred.month}</span>
                            <div className="text-right">
                              <span className="text-white font-semibold">{pred.predicted_enrollments}</span>
                              <span className="text-xs text-och-steel ml-2">({pred.confidence}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
                
                {predictiveData.risk_factors.length > 0 && (
                  <Card className="border-och-orange/50">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">Risk Factors</h3>
                      <div className="space-y-2">
                        {predictiveData.risk_factors.map((risk, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Badge variant={risk.severity === 'high' ? 'orange' : 'yellow'}>
                              {risk.severity}
                            </Badge>
                            <span className="text-white">{risk.factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}
                
                <Card>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
                    <ul className="space-y-2">
                      {predictiveData.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-och-mint mt-1">•</span>
                          <span className="text-och-steel">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}