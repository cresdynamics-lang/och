'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export default function AnalyticsPage() {
  return (
    <RouteGuard>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <AnalyticsDashboard />
      </div>
    </RouteGuard>
  )
}

