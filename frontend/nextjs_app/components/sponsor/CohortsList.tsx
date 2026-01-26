'use client'

import { useState, useEffect } from 'react'
import { sponsorClient, SponsorCohort } from '@/services/sponsorClient'
import Link from 'next/link'

export function CohortsList() {
  const [cohorts, setCohorts] = useState<SponsorCohort[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCohorts()
  }, [])

  const loadCohorts = async () => {
    try {
      setLoading(true)
      const data = await sponsorClient.getCohorts({ limit: 20 })
      setCohorts(data.results)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load cohorts')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
        <div className="text-och-steel">Loading cohorts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
        <div className="text-red-400">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
      <h2 className="text-2xl font-bold text-och-mint mb-6">Sponsored Cohorts</h2>
      
      {cohorts.length === 0 ? (
        <div className="text-och-steel">No cohorts found</div>
      ) : (
        <div className="space-y-4">
          {cohorts.map((cohort) => (
            <Link
              key={cohort.cohort_id}
              href={`/dashboard/sponsor/cohorts/${cohort.cohort_id}`}
              className="block bg-och-slate-900 rounded-lg p-4 border border-och-slate-700 hover:border-och-mint transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-och-mint mb-2">
                    {cohort.cohort_name}
                  </h3>
                  <div className="text-sm text-och-steel mb-3">{cohort.track_name}</div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-och-steel">Seats</div>
                      <div className="text-och-mint font-semibold">
                        {cohort.seats_used} / {cohort.seats_total}
                      </div>
                    </div>
                    <div>
                      <div className="text-och-steel">Completion</div>
                      <div className="text-och-mint font-semibold">
                        {cohort.completion_pct?.toFixed(1) || 'N/A'}%
                      </div>
                    </div>
                    <div>
                      <div className="text-och-steel">Readiness</div>
                      <div className="text-och-mint font-semibold">
                        {cohort.avg_readiness?.toFixed(1) || 'N/A'}%
                      </div>
                    </div>
                    <div>
                      <div className="text-och-steel">Graduates</div>
                      <div className="text-och-mint font-semibold">{cohort.graduates_count}</div>
                    </div>
                  </div>
                </div>
                
                {cohort.flags && cohort.flags.length > 0 && (
                  <div className="ml-4">
                    {cohort.flags.map((flag) => (
                      <span
                        key={flag}
                        className="inline-block bg-yellow-900/30 text-yellow-400 text-xs px-2 py-1 rounded mr-1"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

