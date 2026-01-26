'use client'

import { ReactNode } from 'react'
import { AdminNavigation } from '@/components/navigation/AdminNavigation'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-och-midnight">
      <AdminNavigation />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

