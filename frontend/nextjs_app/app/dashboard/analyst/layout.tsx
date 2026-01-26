'use client'

import type { ReactNode } from 'react'
import { AnalystNavigation } from '@/components/navigation/AnalystNavigation'
import { DashboardHeader } from '@/components/navigation/DashboardHeader'

export default function AnalystLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-och-midnight flex">
      <AnalystNavigation />
      <div className="flex-1 flex flex-col lg:ml-64">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
