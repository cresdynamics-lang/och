'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface AnalyticsData {
  successRate: number
  failureRate: number
  totalActions: number
  successActions: number
  failureActions: number
  heatmapData: Array<{ day: string; hour: number; value: number }>
  systemMetrics: {
    uptime: number
    responseTime: number
    errorRate: number
    activeUsers: number
  }
}

interface AnalyticsClientProps {
  data: AnalyticsData
}

export default function AnalyticsClient({ data }: AnalyticsClientProps) {
  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Analytics Dashboard</h1>
          <p className="text-och-steel">Platform performance and insights</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card gradient="defender">
            <p className="text-och-steel text-sm mb-1">Success Rate</p>
            <p className="text-3xl font-bold text-white">{data.successRate}%</p>
            <ProgressBar value={data.successRate} variant="mint" showLabel={false} className="mt-2" />
          </Card>
          <Card gradient="defender">
            <p className="text-och-steel text-sm mb-1">Failure Rate</p>
            <p className="text-3xl font-bold text-white">{data.failureRate}%</p>
            <ProgressBar value={data.failureRate} variant="orange" showLabel={false} className="mt-2" />
          </Card>
          <Card gradient="defender">
            <p className="text-och-steel text-sm mb-1">Total Actions</p>
            <p className="text-3xl font-bold text-white">{data.totalActions.toLocaleString()}</p>
            <Badge variant="mint" className="mt-2">+12%</Badge>
          </Card>
          <Card gradient="defender">
            <p className="text-och-steel text-sm mb-1">Active Users</p>
            <p className="text-3xl font-bold text-white">{data.systemMetrics.activeUsers}</p>
            <Badge variant="defender" className="mt-2">Live</Badge>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Success / Failure Breakdown</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-och-steel">Successful Actions</span>
                  <span className="text-och-mint font-semibold">{data.successActions}</span>
                </div>
                <ProgressBar value={(data.successActions / data.totalActions) * 100} variant="mint" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-och-steel">Failed Actions</span>
                  <span className="text-och-orange font-semibold">{data.failureActions}</span>
                </div>
                <ProgressBar value={(data.failureActions / data.totalActions) * 100} variant="orange" />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">System Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-och-midnight/50 rounded-lg">
                <p className="text-och-steel text-sm mb-1">Uptime</p>
                <p className="text-2xl font-bold text-white">{data.systemMetrics.uptime}%</p>
              </div>
              <div className="p-4 bg-och-midnight/50 rounded-lg">
                <p className="text-och-steel text-sm mb-1">Response Time</p>
                <p className="text-2xl font-bold text-white">{data.systemMetrics.responseTime}ms</p>
              </div>
              <div className="p-4 bg-och-midnight/50 rounded-lg">
                <p className="text-och-steel text-sm mb-1">Error Rate</p>
                <p className="text-2xl font-bold text-white">{data.systemMetrics.errorRate}%</p>
              </div>
              <div className="p-4 bg-och-midnight/50 rounded-lg">
                <p className="text-och-steel text-sm mb-1">Active Users</p>
                <p className="text-2xl font-bold text-white">{data.systemMetrics.activeUsers}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Action Heatmap</h2>
          <div className="grid grid-cols-24 gap-1">
            {data.heatmapData.map((item, idx) => (
              <div
                key={idx}
                className="aspect-square rounded"
                style={{
                  backgroundColor: `rgba(3, 72, 168, ${item.value / 100})`,
                  minWidth: '20px',
                }}
                title={`${item.day} ${item.hour}:00 - ${item.value} actions`}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-between text-xs text-och-steel">
            <span>Mon 00:00</span>
            <span>Sun 23:00</span>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold mb-4 text-white">Chart Placeholder</h2>
          <div className="h-64 bg-och-midnight/50 rounded-lg flex items-center justify-center">
            <p className="text-och-steel">Recharts integration placeholder</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

