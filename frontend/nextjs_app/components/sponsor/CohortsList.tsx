'use client'

import { useState, useEffect } from 'react'
import { sponsorClient, SponsorCohort } from '@/services/sponsorClient'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Users, FileText, TrendingUp, Plus } from 'lucide-react'

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

  const handleEnrollStudents = (cohortId: string) => {
    // TODO: Open enrollment modal or navigate to enrollment page
    console.log('Enroll students for cohort:', cohortId)
  }

  const handleGenerateReport = (cohortId: string) => {
    // TODO: Generate and download report
    console.log('Generate report for cohort:', cohortId)
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
            <div
              key={cohort.cohort_id}
              className="bg-och-slate-900 rounded-lg p-4 border border-och-slate-700"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link
                    href={`/dashboard/sponsor/cohorts/${cohort.cohort_id}`}
                    className="hover:text-och-mint transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-och-mint mb-2">
                      {cohort.cohort_name}
                    </h3>
                  </Link>
                  <div className="text-sm text-och-steel mb-3">{cohort.track_name}</div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
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

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEnrollStudents(cohort.cohort_id)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Enroll Students
                    </Button>
                    
                    <Link href={`/dashboard/sponsor/cohorts/${cohort.cohort_id}?tab=progress`}>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Track Progress
                      </Button>
                    </Link>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateReport(cohort.cohort_id)}
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Generate Report
                    </Button>
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

