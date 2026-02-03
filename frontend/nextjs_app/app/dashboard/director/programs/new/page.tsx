'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import CreateProgramForm from '@/components/director/CreateProgramForm'

export default function CreateProgramPage() {
  return (
    <RouteGuard>
      <DirectorLayout>
        <CreateProgramForm />
      </DirectorLayout>
    </RouteGuard>
  )
}