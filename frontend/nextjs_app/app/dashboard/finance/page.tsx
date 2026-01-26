'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import FinanceDashboardClient from './finance-client'

export default function FinanceDashboard() {
  return (
    <RouteGuard>
      <FinanceDashboardClient />
    </RouteGuard>
  )
}

