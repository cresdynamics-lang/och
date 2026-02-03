'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import ReportsAnalyticsClient from '@/components/director/ReportsAnalyticsClient'

export default function ReportsPage() {
  return (
    <RouteGuard>
      <DirectorLayout>
        <ReportsAnalyticsClient />
      </DirectorLayout>
    </RouteGuard>
  )
}