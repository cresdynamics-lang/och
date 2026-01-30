'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { PriorityTasksCompact } from '@/components/analyst/PriorityTasksCompact'
import { LiveLabFeedCompact } from '@/components/analyst/LiveLabFeedCompact'
import { ProgressShelfMicro } from '@/components/analyst/ProgressShelfMicro'
import { DashboardErrorBoundary } from '@/components/analyst/ErrorBoundary'
import { LearningPanel } from '@/components/analyst/LearningPanel'
import { LabPanel } from '@/components/analyst/LabPanel'
import { ToolsPanel } from '@/components/analyst/ToolsPanel'
import { ReportsPanel } from '@/components/analyst/ReportsPanel'
import { CareerPanel } from '@/components/analyst/CareerPanel'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface AnalystClientProps {
  userId: string
}

export default function AnalystClient({ userId }: AnalystClientProps) {
  const [isLoading] = useState(false)
  const [currentPanel, setCurrentPanel] = useState('metrics')
  const { data: metricsData, error: metricsError } = useSWR(`/api/analyst/${userId}/metrics/combined`, fetcher, { refreshInterval: 30000 })

  // Listen for hash changes to determine which panel to show
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updatePanel = () => {
      const hash = window.location.hash.replace('#', '')
      const validPanels = ['metrics', 'learning', 'lab', 'tools', 'reports', 'career']
      if (validPanels.includes(hash)) {
        setCurrentPanel(hash)
      } else {
        setCurrentPanel('metrics') // Default to metrics
      }
    }

    updatePanel()
    window.addEventListener('hashchange', updatePanel)
    return () => window.removeEventListener('hashchange', updatePanel)
  }, [])

  // Prepare chart data from metrics
  const readinessTrendData = metricsData?.trends || []
  const performanceData = [
    { name: 'Readiness', value: metricsData?.readiness || 0, color: '#33FFC1' },
    { name: 'MTTR', value: Math.max(0, 100 - (metricsData?.mttr || 0)), color: '#F55F28' }, // Inverse scale
    { name: 'Accuracy', value: metricsData?.accuracy || 0, color: '#0648A8' },
  ]

  const cohortComparisonData = [
    { name: 'Current User', readiness: metricsData?.readiness || 0, cohort: metricsData?.cohortRank ? (metricsData.cohortTotal - metricsData.cohortRank + 1) / metricsData.cohortTotal * 100 : 0 },
    { name: 'Cohort Average', readiness: metricsData?.sources?.cohort?.averageReadiness || 78, cohort: 78 },
    { name: 'Top Performer', readiness: 95, cohort: 95 },
  ]

  return (
    <div className="min-h-screen bg-och-midnight-black text-white">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* CONDITIONAL LAYOUT BASED ON PANEL */}
        {currentPanel === 'metrics' ? (
          // METRICS DASHBOARD - Full content layout without side panel tabs
          <div className="space-y-6">
            {/* SOC OPERATIONS DASHBOARD */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* PRIORITY TASKS */}
          <DashboardErrorBoundary>
            <Suspense fallback={<div className="animate-pulse"><div className="h-64 bg-och-steel-grey/20 rounded-xl"></div></div>}>
              <PriorityTasksCompact userId={userId} />
            </Suspense>
          </DashboardErrorBoundary>

          {/* LIVE LAB FEED */}
          <DashboardErrorBoundary>
            <Suspense fallback={<div className="animate-pulse"><div className="h-64 bg-och-steel-grey/20 rounded-xl"></div></div>}>
              <LiveLabFeedCompact userId={userId} />
            </Suspense>
          </DashboardErrorBoundary>
        </div>

        {/* Core Readiness Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Core Readiness Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <p className="text-och-steel text-sm mb-1">SOC Readiness Score</p>
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-och-steel/20 rounded w-24 mb-2"></div>
                  <div className="h-2 bg-och-steel/20 rounded"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-och-cyber-mint">{metricsData?.readiness || '--'}%</p>
                  <ProgressBar value={metricsData?.readiness || 0} variant="mint" className="mt-2" />
                </>
              )}
            </Card>
            <Card>
              <p className="text-och-steel text-sm mb-1">Mean Time to Resolution</p>
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-och-steel/20 rounded w-32 mb-2"></div>
                  <div className="h-6 bg-och-steel/20 rounded w-20"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-och-sahara-gold">{metricsData?.mttr || '--'}m</p>
                  <Badge variant="steel" className="mt-2">Industry: 45m</Badge>
                </>
              )}
            </Card>
            <Card>
              <p className="text-och-steel text-sm mb-1">Detection Accuracy</p>
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-och-steel/20 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-och-steel/20 rounded w-32"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-och-defender-blue">{metricsData?.accuracy || '--'}%</p>
                  <p className="text-xs text-och-steel mt-1">False positive rate: 2.1%</p>
                </>
              )}
            </Card>
          </div>
          {/* 7-Day Performance Trend */}
          <Card className="md:col-span-2">
            <h3 className="text-xl font-bold mb-4 text-white">7-Day Performance Trend</h3>
            {isLoading || !metricsData ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-pulse text-och-steel">Loading trend data...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={readinessTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1E" />
                  <XAxis dataKey="metric" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0A0C',
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="change"
                    stroke="#33FFC1"
                    strokeWidth={3}
                    dot={{ fill: '#33FFC1', strokeWidth: 2, r: 5 }}
                    name="Performance Change (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Performance Breakdown */}
          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Performance Breakdown</h3>
            {isLoading || !metricsData ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-och-steel/20 rounded mb-2"></div>
                    <div className="h-2 bg-och-steel/20 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-och-steel">SOC Readiness</span>
                    <span className="text-sm font-medium text-och-cyber-mint">{metricsData.readiness}%</span>
                  </div>
                  <ProgressBar value={metricsData.readiness} variant="mint" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-och-steel">Response Time</span>
                    <span className="text-sm font-medium text-och-signal-orange">{metricsData.mttr}min</span>
                  </div>
                  <ProgressBar value={Math.max(0, 100 - (metricsData?.mttr || 0))} variant="orange" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-och-steel">Detection Accuracy</span>
                    <span className="text-sm font-medium text-och-defender-blue">{metricsData.accuracy}%</span>
                  </div>
                  <ProgressBar value={metricsData?.accuracy || 0} variant="defender" />
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Cohort Comparison & Career Insights */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Cohort Performance Comparison */}
          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Cohort Performance Comparison</h3>
            {isLoading || !metricsData ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-pulse text-och-steel">Loading cohort data...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cohortComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1E" />
                  <XAxis dataKey="name" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0A0C',
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="readiness" fill="#33FFC1" name="Readiness Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
            {metricsData && (
              <div className="mt-4 p-3 bg-och-cyber-mint/10 rounded-lg">
                <div className="text-sm text-och-cyber-mint">
                  Your Rank: <span className="font-bold">{metricsData.cohortRank}</span> of {metricsData.cohortTotal} analysts
                </div>
                <div className="text-xs text-och-steel mt-1">
                  Top {Math.round((1 - (metricsData.cohortRank / metricsData.cohortTotal)) * 100)}% of cohort
                </div>
              </div>
            )}
          </Card>

          {/* Career Readiness Forecast */}
          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Career Readiness Forecast</h3>
            {isLoading || !metricsData ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-och-steel/20 rounded mb-2"></div>
                    <div className="h-2 bg-och-steel/20 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-och-defender-blue/10 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-white">MTN SOC L1 Analyst</div>
                    <div className="text-xs text-och-steel">Primary career path</div>
                  </div>
                  <Badge variant="defender" className="text-xs">
                    {Math.max(0, 100 - metricsData.readiness)}% to go
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-och-sahara-gold/10 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-white">Vodacom Security Specialist</div>
                    <div className="text-xs text-och-steel">Alternative path</div>
                  </div>
                  <Badge variant="gold" className="text-xs">
                    {Math.max(0, 95 - (metricsData?.readiness || 0))}% to go
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-och-signal-orange/10 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-white">Ecobank GRC Analyst</div>
                    <div className="text-xs text-och-steel">Growing opportunity</div>
                  </div>
                  <Badge variant="orange" className="text-xs">
                    {Math.max(0, 88 - (metricsData?.readiness || 0))}% to go
                  </Badge>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* MICRO PROGRESS SHELF */}
        <DashboardErrorBoundary>
          <div className="bg-och-steel-grey/80 border border-och-defender-blue/30 rounded-xl p-4">
            <Suspense fallback={<div className="animate-pulse"><div className="h-4 bg-och-steel-grey/30 rounded"></div></div>}>
              <ProgressShelfMicro userId={userId} />
            </Suspense>
          </div>
        </DashboardErrorBoundary>
        </div>

        ) : (
          // SINGLE PANEL VIEW - Only show selected panel content
          <div className="space-y-6">
            {/* Panel Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  window.location.hash = 'metrics'
                  setCurrentPanel('metrics')
                }}
                className="text-och-steel hover:text-och-cyber-mint transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div>
                <h2 className="text-2xl font-bold text-och-cyber-mint uppercase tracking-wider">
                  {currentPanel === 'learning' && '📚 LEARNING'}
                  {currentPanel === 'lab' && '🖥️ SIEM'}
                  {currentPanel === 'tools' && '⚙️ TOOLS'}
                  {currentPanel === 'reports' && '📋 REPORTS'}
                  {currentPanel === 'career' && '🎯 CAREER'}
                </h2>
                <p className="text-och-steel text-sm">
                  {currentPanel === 'learning' && 'Video curriculum and interactive quizzes'}
                  {currentPanel === 'lab' && 'Real-time cybersecurity operations and incident response'}
                  {currentPanel === 'tools' && 'SOC toolkit and security utilities'}
                  {currentPanel === 'reports' && 'Analytics reports and data exports'}
                  {currentPanel === 'career' && 'Job matching and career development'}
                </p>
              </div>
            </div>

            {/* Panel Content */}
            <div className="bg-och-midnight-black/50 rounded-lg border border-och-steel-grey/30 p-6">
              <DashboardErrorBoundary>
                <Suspense fallback={<div className="text-center py-12"><div className="animate-pulse text-och-steel">Loading panel content...</div></div>}>
                  {currentPanel === 'learning' && <LearningPanel userId={userId} />}
                  {currentPanel === 'lab' && <LabPanel userId={userId} />}
                  {currentPanel === 'tools' && <ToolsPanel userId={userId} />}
                  {currentPanel === 'reports' && <ReportsPanel userId={userId} />}
                  {currentPanel === 'career' && <CareerPanel userId={userId} />}
                </Suspense>
              </DashboardErrorBoundary>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
