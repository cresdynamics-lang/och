'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import CreateCohortClient from './create-cohort-client'

export default function CreateCohortPage() {
  return (
    <RouteGuard>
      <CreateCohortClient />
    </RouteGuard>
  )
}












