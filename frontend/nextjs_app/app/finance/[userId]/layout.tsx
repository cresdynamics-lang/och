'use client'

import type { ReactNode } from 'react'
import { FinanceNavigation } from '@/components/navigation/FinanceNavigation'
import { DashboardHeader } from '@/components/navigation/DashboardHeader'

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-och-midnight flex">
      <FinanceNavigation />
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

