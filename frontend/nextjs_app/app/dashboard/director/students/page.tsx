'use client'

import { DirectorLayout } from '@/components/director/DirectorLayout'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { StudentsManagementClient } from './students-client'

export default function StudentsPage() {
  return (
    <RouteGuard allowedRoles={['program_director', 'admin']}>
      <DirectorLayout>
        <StudentsManagementClient />
      </DirectorLayout>
    </RouteGuard>
  )
}