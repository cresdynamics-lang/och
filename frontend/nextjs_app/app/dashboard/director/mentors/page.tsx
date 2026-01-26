'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import MentorsListClient from './mentors-list-client'

export default function MentorsPage() {
  return (
    <RouteGuard>
      <MentorsListClient />
    </RouteGuard>
  )
}












