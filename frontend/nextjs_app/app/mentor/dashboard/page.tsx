'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import MentorClient from './mentor-client'

export default function MentorDashboard() {
  return (
    <RouteGuard>
      <MentorClient />
    </RouteGuard>
  )
}
