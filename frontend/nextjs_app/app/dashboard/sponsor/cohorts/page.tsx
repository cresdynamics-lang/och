'use client'

import { CohortsList } from '@/components/sponsor/CohortsList'

export default function SponsorCohortsPage() {
  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Cohorts</h1>
        <p className="text-och-steel">
          View and manage all sponsored cohorts.
        </p>
      </div>
      
      <CohortsList />
    </div>
  )
}
