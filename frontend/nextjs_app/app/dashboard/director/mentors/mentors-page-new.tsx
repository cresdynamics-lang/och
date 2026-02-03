'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import MentorAssignmentClient from '@/components/director/MentorAssignmentClient'

export default function MentorsPage() {
  return (
    <RouteGuard>
      <DirectorLayout>
        <MentorAssignmentClient />
      </DirectorLayout>
    </RouteGuard>
  )
}