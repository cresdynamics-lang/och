'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import EmployerClient from './employer-client'

export default function EmployerDashboard() {
  return (
    <RouteGuard>
      <EmployerClient />
    </RouteGuard>
  )
}

