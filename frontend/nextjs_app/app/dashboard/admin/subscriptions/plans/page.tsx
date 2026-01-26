'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import PlansManagementClient from './plans-management-client'

export default function PlansPage() {
  return (
    <RouteGuard>
      <AdminLayout>
        <PlansManagementClient />
      </AdminLayout>
    </RouteGuard>
  )
}















































































