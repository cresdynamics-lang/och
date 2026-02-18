'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StudentOnboardingFlow } from './onboarding-flow'

export default function StudentOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
          <Card className="p-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-och-defender animate-spin mx-auto mb-4" />
              <p className="text-och-steel">Loading onboarding...</p>
            </div>
          </Card>
        </div>
      }
    >
      <StudentOnboardingFlow />
    </Suspense>
  )
}
