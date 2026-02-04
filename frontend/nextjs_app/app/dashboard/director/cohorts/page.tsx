'use client'

import { useState, useEffect } from 'react'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CohortResponse } from '@/types/api'
import Link from 'next/link'

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<CohortResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCohorts()
  }, [])

  const fetchCohorts = async () => {
    try {
      const response = await fetch('/api/cohorts')
      if (response.ok) {
        const data = await response.json()
        setCohorts(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch cohorts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['program_director', 'admin']}>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-defender"></div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={['program_director', 'admin']}>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Cohorts</h1>
              <p className="text-och-steel">Manage cohort instances and enrollment</p>
            </div>
            <Link href="/dashboard/director/cohorts/new">
              <Button variant="defender" className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Cohort
              </Button>
            </Link>
          </div>

          {cohorts.length === 0 ? (
            <Card className="border-och-steel/20 bg-och-midnight/50">
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-och-midnight/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-och-steel mb-2 text-lg">No cohorts found</p>
                <p className="text-och-steel/70 mb-6">Create your first cohort to get started</p>
                <Link href="/dashboard/director/cohorts/new">
                  <Button variant="defender">
                    Create Your First Cohort
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cohorts.map((cohort) => (
                <Card key={cohort.id} className="border-och-steel/20 bg-och-midnight/50 hover:border-och-defender/50 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{cohort.name}</h3>
                        <p className="text-sm text-och-mint">
                          {cohort.track.name} • {cohort.track.program.name}
                        </p>
                      </div>
                      <div className="text-xs text-och-steel bg-och-steel/10 px-2 py-1 rounded">
                        {cohort.status}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-och-steel">Start Date:</span>
                        <span className="text-white">{new Date(cohort.start_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-och-steel">Mode:</span>
                        <span className="text-white capitalize">{cohort.mode}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-och-steel">Enrollment:</span>
                        <span className="text-white">{cohort.enrollment_count}/{cohort.seat_cap}</span>
                      </div>
                    </div>

                    <div className="w-full bg-och-midnight/50 rounded-full h-2 mb-4">
                      <div 
                        className="bg-gradient-to-r from-och-mint to-och-defender h-2 rounded-full transition-all duration-300"
                        style={{ width: `${cohort.seat_utilization}%` }}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-och-defender/50 text-och-defender hover:bg-och-defender hover:text-white"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 border-och-steel/50 text-och-steel hover:border-och-mint hover:text-och-mint"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}