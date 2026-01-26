'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import CreateProgramClient from './create-program-client'

export default function CreateProgramPage() {
  return (
    <RouteGuard>
      <CreateProgramClient />
    </RouteGuard>
  )
}












