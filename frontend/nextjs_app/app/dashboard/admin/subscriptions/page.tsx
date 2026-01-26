'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import SubscriptionOverviewClient from './subscription-overview-client'

export default function SubscriptionsPage() {
  return (
    <RouteGuard>
      <AdminLayout>
        <SubscriptionOverviewClient />
      </AdminLayout>
    </RouteGuard>
  )
}
