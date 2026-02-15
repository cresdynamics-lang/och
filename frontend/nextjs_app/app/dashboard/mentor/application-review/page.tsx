'use client'

import { ApplicationReviews } from '@/components/mentor/ApplicationReviews'

export default function ApplicationReviewPage() {
  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-och-mint">Application Review</h1>
        <p className="text-och-steel mt-1">
          Review and grade student applications assigned to you. Send interview invites and attach support documents when grading.
        </p>
      </div>
      <ApplicationReviews />
    </div>
  )
}
