'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MissionsPending } from '@/components/mentor/MissionsPending'
import { MissionsReviewed } from '@/components/mentor/MissionsReviewed'
import { MissionReviewForm } from '@/components/mentor/MissionReviewForm'
import { CapstoneScoringForm } from '@/components/mentor/CapstoneScoringForm'
import { mentorClient } from '@/services/mentorClient'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { MissionSubmission, CapstoneProject } from '@/services/types/mentor'

function ReviewsPageInner() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedSubmission, setSelectedSubmission] = useState<MissionSubmission | null>(null)
  const [selectedCapstone, setSelectedCapstone] = useState<CapstoneProject | null>(null)
  const [capstones, setCapstones] = useState<CapstoneProject[]>([])
  const [loadingCapstones, setLoadingCapstones] = useState(false)
  const [loadingSubmission, setLoadingSubmission] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const loadCapstones = useCallback(async () => {
    if (!mentorId) return
    setLoadingCapstones(true)
    try {
      const data = await mentorClient.getCapstoneProjects(mentorId, { status: 'pending_scoring' })
      const list = Array.isArray(data) ? data : (data as any)?.results ?? (data as any)?.data ?? []
      setCapstones(Array.isArray(list) ? list : [])
    } catch (err: any) {
      if (err?.status === 404 || err?.response?.status === 404) {
        console.log('[loadCapstones] No capstones found for mentor (404) - this is normal')
      } else {
        console.error('Failed to load capstones:', err)
      }
      setCapstones([])
    } finally {
      setLoadingCapstones(false)
    }
  }, [mentorId])

  useEffect(() => {
    loadCapstones()
  }, [loadCapstones])

  useEffect(() => {
    const submissionId = searchParams.get('submission')
    if (!submissionId) return
    if (selectedSubmission?.id === submissionId) return

    let cancelled = false
    setLoadingSubmission(true)
    setSubmissionError(null)

    mentorClient
      .getMissionSubmission(submissionId)
      .then((data) => {
        if (cancelled) return
        setSelectedSubmission(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : typeof err === 'string' ? err : 'Failed to load submission'
        setSubmissionError(message)
      })
      .finally(() => {
        if (cancelled) return
        setLoadingSubmission(false)
      })

    return () => {
      cancelled = true
    }
  }, [searchParams, selectedSubmission?.id])

  if (loadingSubmission && !selectedSubmission) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <div className="text-och-steel text-sm">Loading submission…</div>
      </div>
    )
  }

  if (submissionError && !selectedSubmission) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <div className="text-och-orange text-sm">Error: {submissionError}</div>
      </div>
    )
  }

  if (selectedSubmission) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <MissionReviewForm
          submission={selectedSubmission}
          onReviewComplete={() => setSelectedSubmission(null)}
        />
      </div>
    )
  }

  if (selectedCapstone) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <CapstoneScoringForm
          capstone={selectedCapstone}
          onScoringComplete={() => {
            setSelectedCapstone(null)
            loadCapstones()
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-och-mint">Reviews</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/mentor/profile?tab=guide')}>
            Guide
          </Button>
          <Button
            variant="defender"
            onClick={() => router.push('/dashboard/mentor/missions')}
            className="flex items-center gap-2 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Mission Hall
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <MissionsPending onReviewClick={(submission) => setSelectedSubmission(submission)} />

        <MissionsReviewed />

        <Card className="bg-och-midnight border border-och-steel/20 rounded-xl overflow-hidden p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Capstone Projects</h2>
            <button
              onClick={loadCapstones}
              className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-opacity-90 text-sm"
            >
              {loadingCapstones ? 'Loading...' : 'Refresh Capstones'}
            </button>
          </div>

          {(capstones ?? []).length === 0 && !loadingCapstones && (
            <div className="text-och-steel text-sm">No capstones pending scoring.</div>
          )}

          {(capstones ?? []).length > 0 && (
            <div className="space-y-3">
              {(capstones ?? []).map((capstone) => (
                <div
                  key={capstone.id}
                  className="p-4 bg-och-midnight/50 rounded-lg flex justify-between items-center hover:bg-och-midnight/70 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">{capstone.title}</h3>
                      <span className="px-2 py-1 bg-och-orange/20 text-och-orange text-xs rounded">
                        Capstone
                      </span>
                    </div>
                    <p className="text-sm text-och-steel mt-1">
                      <span className="text-white font-medium">{capstone.mentee_name}</span> • Submitted:{' '}
                      {new Date(capstone.submitted_at).toLocaleString()}
                    </p>
                    {capstone.rubric_id && (
                      <p className="text-xs text-och-mint mt-1">✓ Rubric assigned for scoring</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCapstone(capstone)}
                    className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-opacity-90 text-sm shrink-0"
                  >
                    Score with Rubric
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function ReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8 text-och-steel">
          Loading reviews…
        </div>
      }
    >
      <ReviewsPageInner />
    </Suspense>
  )
}
