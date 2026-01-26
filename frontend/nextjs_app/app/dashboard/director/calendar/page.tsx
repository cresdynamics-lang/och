'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import CalendarClient from './calendar-client'

export default function CalendarPage() {
  return (
    <RouteGuard>
      <CalendarClient />
    </RouteGuard>
  )
}












