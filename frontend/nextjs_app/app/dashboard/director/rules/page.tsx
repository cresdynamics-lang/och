'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import ProgramRulesClient from '@/components/director/ProgramRulesClient'

export default function RulesPage() {
  return (
    <RouteGuard>
      <DirectorLayout>
        <ProgramRulesClient />
      </DirectorLayout>
    </RouteGuard>
  )
}