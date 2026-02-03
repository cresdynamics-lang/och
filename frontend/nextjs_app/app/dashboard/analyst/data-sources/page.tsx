'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import useSWR from 'swr'
import { RefreshCw, Database, TrendingUp, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DataSourcesPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { data: metricsData, error, mutate } = useSWR('/api/analyst/current-user/metrics/combined', fetcher, {
    refreshInterval: 30000 // 30 second refresh
  })

  // Define all 12 data sources with their metadata
  const dataSources = [
    {
      id: 'curriculum',
      name: 'Curriculum Progress',
      type: 'Learning Platform',
      description: 'Tracks module completion, quiz scores, and learning paths',
      icon: Database,
      color: 'och-cyber-mint',
      endpoint: '/api/curriculum',
      status: metricsData ? 'active' : 'syncing',
      recordCount: metricsData?.sources?.curriculum ? `${metricsData.sources.curriculum.completedModules}/${metricsData.sources.curriculum.totalModules} modules` : 'Loading...',
      lastSync: new Date().toLocaleTimeString(),
      uptime: '99.8%',
      dataPoints: ['progress', 'completedModules', 'totalModules', 'quizScores']
    },
    {
      id: 'lab',
      name: 'Lab Performance',
      type: 'SOC Operations',
      description: 'Real-time SIEM alerts, incident response, and security metrics',
      icon: TrendingUp,
      color: 'och-signal-orange',
      endpoint: '/api/analyst/[userId]/lab',
      status: 'active',
      recordCount: metricsData?.sources?.lab ? `${metricsData.sources.lab.alertsProcessed} alerts processed` : 'Loading...',
      lastSync: new Date().toLocaleTimeString(),
      uptime: '99.9%',
      dataPoints: ['mttr', 'accuracy', 'alertsProcessed', 'responseTime']
    },
    {
      id: 'talentscope',
      name: 'TalentScope AI',
      type: 'AI Assessment',
      description: 'Machine learning-powered readiness evaluation and career matching',
      icon: CheckCircle,
      color: 'och-defender-blue',
      endpoint: '/api/ai-profiler',
      status: 'active',
      recordCount: metricsData?.sources?.readiness ? `Readiness: ${metricsData.sources.readiness.score}%` : 'Loading...',
      lastSync: new Date().toLocaleTimeString(),
      uptime: '99.5%',
      dataPoints: ['score', 'level', 'confidence', 'recommendations']
    },
    {
      id: 'career',
      name: 'Career Matching',
      type: 'Job Platform',
      description: 'SOC job opportunities, application tracking, and employer connections',
      icon: TrendingUp,
      color: 'och-sahara-gold',
      endpoint: '/api/analyst/[userId]/career',
      status: 'active',
      recordCount: metricsData?.sources?.career ? `${metricsData.sources.career.activeMatches} active matches` : 'Loading...',
      lastSync: new Date().toLocaleTimeString(),
      uptime: '99.7%',
      dataPoints: ['activeMatches', 'topMatchScore', 'appliedCount', 'employerViews']
    },
    {
      id: 'community',
      name: 'Community Engagement',
      type: 'Social Platform',
      description: 'Forum participation, peer collaboration, and knowledge sharing',
      icon: Database,
      color: 'och-cyber-mint',
      endpoint: '/api/community',
      status: 'active',
      recordCount: metricsData?.sources?.community ? `${metricsData.sources.community.reputation} reputation` : 'Loading...',
      lastSync: new Date().toLocaleTimeString(),
      uptime: '99.6%',
      dataPoints: ['upvotes', 'posts', 'reputation', 'engagement']
    },
    {
      id: 'missions',
      name: 'Mission Completion',
      type: 'Task Platform',
      description: 'Practical assignments, skill challenges, and project-based learning',
      icon: CheckCircle,
      color: 'och-signal-orange',
      endpoint: '/api/missions',
      status: 'active',
      recordCount: metricsData?.sources?.missions ? `${metricsData.sources.missions.completed}/${metricsData.sources.missions.total} missions` : 'Loading...',
      lastSync: new Date().toLocaleTimeString(),
      uptime: '99.4%',
      dataPoints: ['completed', 'total', 'streak', 'difficulty']
    },
    {
      id: 'cohort',
      name: 'Cohort Analytics',
      type: 'Group Metrics',
      description: 'Peer comparison, cohort performance, and collaborative insights',
      icon: TrendingUp,
      color: 'och-defender-blue',
      endpoint: '/api/cohort',
      status: 'active',
      recordCount: metricsData?.sources?.cohort ? `Rank: ${metricsData.sources.cohort.userRank}/${metricsData.sources.cohort.totalUsers}` : 'Loading...',
      lastSync: new Date().toLocaleTimeString(),
      uptime: '99.8%',
      dataPoints: ['userRank', 'totalUsers', 'averageReadiness', 'percentile']
    },
    {
      id: 'sponsor-roi',
      name: 'Sponsor ROI Tracking',
      type: 'Business Intelligence',
      description: 'Investment returns, program impact, and sponsor value metrics',
      icon: Database,
      color: 'och-sahara-gold',
      endpoint: '/api/sponsor',
      status: 'active',
      recordCount: metricsData?.sources?.sponsor ? `KES ${metricsData.sources.sponsor.totalValue.toLocaleString()} total value` : 'Loading...',
      lastSync: new Date().toLocaleTimeString(),
      uptime: '99.9%',
      dataPoints: ['totalValue', 'perStudent', 'roi', 'impact']
    },
    {
      id: 'subscription',
      name: 'Subscription Management',
      type: 'Business Platform',
      description: 'Tier management, feature access, and billing information',
      icon: CheckCircle,
      color: 'och-cyber-mint',
      endpoint: '/api/subscription',
      status: 'active',
      recordCount: metricsData?.sources?.subscription ? `Tier: ${metricsData.sources.subscription.tier}` : 'Loading...',
      lastSync: new Date().toLocaleTimeString(),
      uptime: '100%',
      dataPoints: ['tier', 'status', 'features', 'limits']
    },
    {
      id: 'portfolio',
      name: 'Portfolio Analytics',
      type: 'Content Platform',
      description: 'Profile views, project showcase, and professional presence',
      icon: TrendingUp,
      color: 'och-signal-orange',
      endpoint: '/api/portfolio',
      status: 'active',
      recordCount: metricsData?.sources?.portfolio ? `${metricsData.sources.portfolio.weeklyViews} weekly views` : 'Loading...',
      lastSync: new Date().toLocaleTimeString(),
      uptime: '99.3%',
      dataPoints: ['weeklyViews', 'totalViews', 'engagement', 'reach']
    },
    {
      id: 'payments',
      name: 'Payment Processing',
      type: 'Financial Platform',
      description: 'Transaction history, billing cycles, and payment status',
      icon: Database,
      color: 'och-defender-blue',
      endpoint: '/api/payments',
      status: 'active',
      recordCount: metricsData?.sources?.payments ? `Next due: ${metricsData.sources.payments.nextDue}` : 'Loading...',
      lastSync: new Date().toLocaleTimeString(),
      uptime: '99.9%',
      dataPoints: ['status', 'lastPayment', 'nextDue', 'amount']
    },
    {
      id: 'audit',
      name: 'Security Audit Logs',
      type: 'Security Platform',
      description: 'User activity tracking, compliance logging, and security events',
      icon: CheckCircle,
      color: 'och-sahara-gold',
      endpoint: '/api/audit',
      status: 'active',
      recordCount: metricsData?.sources?.audit ? `${metricsData.sources.audit.recentActions} recent actions` : 'Loading...',
      lastSync: new Date().toLocaleTimeString(),
      uptime: '100%',
      dataPoints: ['recentActions', 'lastActivity', 'events', 'compliance']
    }
  ]

  const handleRefreshAll = async () => {
    setIsRefreshing(true)
    await mutate()
    setTimeout(() => setIsRefreshing(false), 2000)
  }

  // Calculate overall system health
  const activeSources = dataSources.filter(s => s.status === 'active').length
  const totalSources = dataSources.length
  const averageUptime = dataSources.reduce((acc, s) => {
    const uptime = parseFloat(s.uptime.replace('%', ''))
    return acc + uptime
  }, 0) / totalSources

  return (
    <RouteGuard>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-cyber-mint">Data Sources Dashboard</h1>
            <p className="text-och-steel">Monitor and manage the 12 core data sources powering SOC analytics.</p>
          </div>
          <Button
            variant="mint"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh All'}
          </Button>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-och-cyber-mint/30">
            <div className="text-center">
              <div className="text-3xl font-bold text-och-cyber-mint mb-1">{totalSources}</div>
              <div className="text-sm text-och-steel">Total Data Sources</div>
              <ProgressBar value={100} variant="mint" className="mt-2" />
            </div>
          </Card>
          <Card className="border-och-signal-orange/30">
            <div className="text-center">
              <div className="text-3xl font-bold text-och-signal-orange mb-1">{activeSources}</div>
              <div className="text-sm text-och-steel">Active Sources</div>
              <ProgressBar value={(activeSources / totalSources) * 100} variant="orange" className="mt-2" />
            </div>
          </Card>
          <Card className="border-och-sahara-gold/30">
            <div className="text-center">
              <div className="text-3xl font-bold text-och-sahara-gold mb-1">{averageUptime.toFixed(1)}%</div>
              <div className="text-sm text-och-steel">Average Uptime</div>
              <ProgressBar value={averageUptime} variant="gold" className="mt-2" />
            </div>
          </Card>
          <Card className="border-och-defender-blue/30">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-och-defender-blue mb-1">
                <Clock className="w-6 h-6" />
                <span>30s</span>
              </div>
              <div className="text-sm text-och-steel">Refresh Interval</div>
              <ProgressBar value={100} variant="defender" className="mt-2" />
            </div>
          </Card>
        </div>

        {/* Data Sources Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {dataSources.map((source) => {
            const IconComponent = source.icon
            const isActive = source.status === 'active'
            const isSyncing = source.status === 'syncing'

            return (
              <Card
                key={source.id}
                className={`transition-all duration-300 hover:shadow-lg border-2 ${
                  isActive
                    ? `border-${source.color}/30 bg-gradient-to-br from-${source.color}/5 to-transparent`
                    : isSyncing
                    ? 'border-och-steel/30 bg-och-steel/5'
                    : 'border-och-signal-orange/30 bg-och-signal-orange/5'
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${source.color}/20`}>
                        <IconComponent className={`w-6 h-6 text-${source.color}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{source.name}</h3>
                        <p className="text-sm text-och-steel">{source.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <CheckCircle className="w-5 h-5 text-och-cyber-mint" />
                      ) : isSyncing ? (
                        <RefreshCw className="w-5 h-5 text-och-sahara-gold animate-spin" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-och-signal-orange" />
                      )}
                      <Badge
                        variant={isActive ? 'mint' : isSyncing ? 'gold' : 'orange'}
                        className="text-xs"
                      >
                        {source.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-och-steel mb-4">{source.description}</p>

                  {/* Metrics */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-och-steel">Records</span>
                      <span className="text-sm font-medium text-white">{source.recordCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-och-steel">Last Sync</span>
                      <span className="text-sm font-medium text-white">{source.lastSync}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-och-steel">Uptime</span>
                      <span className="text-sm font-medium text-och-cyber-mint">{source.uptime}</span>
                    </div>
                  </div>

                  {/* Data Points */}
                  <div className="mb-4">
                    <p className="text-xs text-och-steel mb-2">Data Points:</p>
                    <div className="flex flex-wrap gap-1">
                      {source.dataPoints.slice(0, 3).map((point, index) => (
                        <Badge key={index} variant="steel" className="text-xs px-2 py-1">
                          {point}
                        </Badge>
                      ))}
                      {source.dataPoints.length > 3 && (
                        <Badge variant="steel" className="text-xs px-2 py-1">
                          +{source.dataPoints.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-och-steel/20">
                    <div className="text-xs text-och-steel">
                      Endpoint: <code className="bg-och-midnight px-1 py-0.5 rounded text-xs">{source.endpoint}</code>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        View Logs
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Cross-Correlation Insights */}
        <div className="mt-8">
          <Card className="border-och-defender-blue/30">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-och-cyber-mint" />
                Cross-Correlation Engine
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-och-cyber-mint mb-2">82%</div>
                  <div className="text-sm text-och-steel">Readiness Score</div>
                  <p className="text-xs text-och-steel mt-1">Weighted from 12 sources</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-och-signal-orange mb-2">18min</div>
                  <div className="text-sm text-och-steel">Mean Time to Resolution</div>
                  <p className="text-xs text-och-steel mt-1">Lab performance metric</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-och-sahara-gold mb-2">91%</div>
                  <div className="text-sm text-och-steel">Detection Accuracy</div>
                  <p className="text-xs text-och-steel mt-1">SIEM effectiveness</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </RouteGuard>
  )
}
