'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import SubscriptionClient from './subscription-client'

export default function SubscriptionPage() {
  return (
    <RouteGuard>
      <SubscriptionClient />
    </RouteGuard>
  )
}

