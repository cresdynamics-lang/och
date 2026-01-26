'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import GraduationClient from './graduation-client'

export default function GraduationPage() {
  return (
    <RouteGuard>
      <GraduationClient />
    </RouteGuard>
  )
}












