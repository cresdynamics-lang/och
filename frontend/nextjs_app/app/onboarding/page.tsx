'use client'

import { Suspense } from 'react'
import OnboardingOrchestrator from './orchestrator'

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint"></div>
      </div>
    }>
      <OnboardingOrchestrator />
    </Suspense>
  )
}