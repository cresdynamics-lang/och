'use client'

import { CohortsList } from '@/components/sponsor/CohortsList'

export default function SponsorCohortsPage() {
  return (
    <div className="w-full max-w-7xl py-8 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white tracking-tight">
          Sponsored cohorts
        </h1>
        <p className="text-och-steel text-base max-w-2xl">
          View cohorts, enroll students, track progress, and generate reports.
        </p>
      </div>

      <CohortsList />
    </div>
  )
}
