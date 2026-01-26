'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import AnalystClient from './analyst-client'

export default function AnalystDashboard() {
  return (
    <RouteGuard>
      <AnalystClient />
    </RouteGuard>
  )
}

