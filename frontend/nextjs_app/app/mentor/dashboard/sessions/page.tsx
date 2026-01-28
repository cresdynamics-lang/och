'use client'

import { SessionManagement } from '@/components/mentor/SessionManagement'

export default function SessionsPage() {
  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Session Management</h1>
        <p className="text-och-steel">
          Schedule group mentorship sessions, manage attendance, and upload recordings.
        </p>
      </div>

      <SessionManagement />
    </div>
  )
}


