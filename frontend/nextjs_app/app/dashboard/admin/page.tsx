'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import OverviewClient from './overview-client'

export default function AdminDashboard() {
  return (
    <RouteGuard>
      <AdminLayout>
        <OverviewClient />
      </AdminLayout>
    </RouteGuard>
  )
}

