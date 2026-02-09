'use client'

import { useState, useEffect } from 'react'
import { sponsorClient, SponsorCohort } from '@/services/sponsorClient'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Users, FileText, TrendingUp, Plus, ChevronRight, Loader2 } from 'lucide-react'
import { EnrollStudentsModal } from './EnrollStudentsModal'

export function CohortsList() {
  const [cohorts, setCohorts] = useState<SponsorCohort[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrollModal, setEnrollModal] = useState<{ cohortId: string; cohortName: string } | null>(null)

  useEffect(() => {
    loadCohorts()
  }, [])

  const loadCohorts = async () => {
    try {
      setLoading(true)
      const data = await sponsorClient.getCohorts({ limit: 50 })
      setCohorts(data.results || [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load cohorts')
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollSuccess = () => {
    setEnrollModal(null)
    loadCohorts()
  }

  if (loading) {
    return (
      <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-12 flex flex-col items-center justify-center min-h-[320px]">
        <Loader2 className="w-10 h-10 text-och-defender animate-spin mb-4" />
        <p className="text-och-steel">Loading cohorts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-och-midnight border border-red-500/30 rounded-xl p-6">
        <p className="text-red-400">Error: {error}</p>
        <Button variant="outline" onClick={loadCohorts} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="bg-och-midnight/60 border border-och-steel/20 rounded-2xl overflow-hidden shadow-lg shadow-black/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-och-steel/20 bg-och-midnight/40">
                <th className="text-left py-4 px-5 text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Cohort
                </th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Track
                </th>
                <th className="text-center py-4 px-5 text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Seats
                </th>
                <th className="text-center py-4 px-5 text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Progress
                </th>
                <th className="text-center py-4 px-5 text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Graduates
                </th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right py-4 px-5 text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-och-steel/10">
              {cohorts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-och-steel">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium text-white/80">No cohorts assigned yet</p>
                    <p className="text-sm mt-1">Contact your program director to get assigned to cohorts.</p>
                  </td>
                </tr>
              ) : (
                cohorts.map((cohort) => (
                  <tr
                    key={cohort.cohort_id}
                    className="hover:bg-och-steel/5 transition-colors group"
                  >
                    <td className="py-4 px-5">
                      <Link
                        href={`/dashboard/sponsor/cohorts/${cohort.cohort_id}`}
                        className="font-semibold text-white hover:text-och-mint transition-colors inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-och-mint focus:ring-offset-2 focus:ring-offset-och-midnight rounded"
                      >
                        {cohort.cohort_name || cohort.name}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </Link>
                    </td>
                    <td className="py-4 px-5 text-och-steel text-sm">
                      {(cohort as { track_name?: string }).track_name || cohort.track_slug || '—'}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="text-white font-medium">
                        {(cohort as { seats_used?: number }).seats_used ?? cohort.students_enrolled ?? 0}
                      </span>
                      <span className="text-och-steel"> / </span>
                      <span className="text-och-steel">
                        {(cohort as { seats_total?: number }).seats_total ?? cohort.target_size ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="text-och-mint font-semibold">
                        {cohort.completion_rate != null ? `${Number(cohort.completion_rate).toFixed(1)}%` : (cohort as { completion_pct?: number }).completion_pct != null ? `${Number((cohort as { completion_pct: number }).completion_pct).toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="text-white font-medium">
                        {(cohort as { graduates_count?: number }).graduates_count ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        cohort.status === 'active'
                          ? 'bg-och-mint/20 text-och-mint'
                          : cohort.status === 'graduated'
                            ? 'bg-och-defender/20 text-och-defender'
                            : 'bg-och-steel/20 text-och-steel'
                      }`}>
                        {cohort.status || 'active'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => setEnrollModal({
                            cohortId: cohort.cohort_id,
                            cohortName: cohort.cohort_name || cohort.name
                          })}
                          className="flex items-center gap-1.5 bg-och-defender hover:bg-och-defender/90"
                        >
                          <Plus className="w-4 h-4" />
                          Enroll
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1.5" asChild>
                          <Link href={`/dashboard/sponsor/cohorts/${cohort.cohort_id}?tab=progress`}>
                            <TrendingUp className="w-4 h-4" />
                            Progress
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1.5" asChild>
                          <Link href={`/dashboard/sponsor/cohorts/${cohort.cohort_id}?tab=reports`}>
                            <FileText className="w-4 h-4" />
                            Report
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {enrollModal && (
        <EnrollStudentsModal
          cohortId={enrollModal.cohortId}
          cohortName={enrollModal.cohortName}
          onClose={() => setEnrollModal(null)}
          onSuccess={handleEnrollSuccess}
        />
      )}
    </>
  )
}
