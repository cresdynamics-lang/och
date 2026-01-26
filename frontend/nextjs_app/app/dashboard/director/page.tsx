'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import OverviewClient from './overview-client'

export default function DirectorDashboard() {
  return (
    <RouteGuard>
      <DirectorLayout>
        <OverviewClient />
      </DirectorLayout>
    </RouteGuard>
  )
}
