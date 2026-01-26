'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import RulesClient from './rules-client'

export default function RulesPage() {
  return (
    <RouteGuard>
      <RulesClient />
    </RouteGuard>
  )
}












