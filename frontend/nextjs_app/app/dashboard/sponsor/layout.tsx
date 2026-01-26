'use client'

import { SponsorNavigation } from '@/components/navigation/SponsorNavigation'
import { SponsorHeader } from '@/components/navigation/SponsorHeader'

export default function SponsorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-och-midnight flex">
      <SponsorNavigation />
      <div className="flex-1 flex flex-col lg:ml-64">
        <SponsorHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
