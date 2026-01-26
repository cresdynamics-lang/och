'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import DirectorDashboardClient from './dashboard-client'

export default function DirectorDashboardPage() {
  return (
    <RouteGuard>
      <DirectorDashboardClient />
    </RouteGuard>
  )
}

