'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export default function AnalystAnalyticsPage() {
  return (
    <RouteGuard>
      <AnalyticsDashboard />
    </RouteGuard>
  )
}
