'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import ReportsClient from './reports-client'

export default function ReportsPage() {
  return (
    <RouteGuard>
      <ReportsClient />
    </RouteGuard>
  )
}












