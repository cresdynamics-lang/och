'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import CalendarManagementClient from '@/components/director/CalendarManagementClient'

export default function CalendarPage() {
  return (
    <RouteGuard>
      <DirectorLayout>
        <CalendarManagementClient />
      </DirectorLayout>
    </RouteGuard>
  )
}