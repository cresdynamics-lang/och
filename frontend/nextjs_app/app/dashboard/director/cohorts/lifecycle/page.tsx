'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import CohortLifecycleClient from '@/components/director/CohortLifecycleClient'

export default function CohortLifecyclePage() {
  return (
    <RouteGuard>
      <DirectorLayout>
        <CohortLifecycleClient />
      </DirectorLayout>
    </RouteGuard>
  )
}