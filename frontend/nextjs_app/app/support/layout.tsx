'use client'

import type { ReactNode } from 'react'
import { SupportNavigation } from '@/components/navigation/SupportNavigation'
import { DashboardHeader } from '@/components/navigation/DashboardHeader'
import { RouteGuard } from '@/components/auth/RouteGuard'

export default function SupportRootLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard requiredRoles={['support']}>
      <div className="min-h-screen bg-och-midnight flex">
        <SupportNavigation />
        <div className="flex-1 flex flex-col lg:ml-64">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </RouteGuard>
  )
}
