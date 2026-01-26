'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { sponsorClient, SponsorDashboardSummary } from '@/services/sponsorClient'
import { SponsorSummaryCard } from '@/components/sponsor/SponsorSummaryCard'
import { CohortsList } from '@/components/sponsor/CohortsList'

export default function SponsorClient() {
  const { user, isLoading: authLoading } = useAuth()
  const [summary, setSummary] = useState<SponsorDashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      loadSummary()
    }
  }, [authLoading])

  const loadSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading sponsor dashboard summary...')
      const data = await sponsorClient.getSummary()
      console.log('✅ Sponsor dashboard data loaded:', data)
      if (data) {
        setSummary(data)
      } else {
        setError('No data returned from API')
      }
    } catch (err: any) {
      console.error('❌ Sponsor dashboard error:', err)
      console.error('Error object:', err)
      console.error('Error data:', err.data)
      console.error('Error status:', err.status)
      
      // Extract error message from various possible locations
      let errorMsg = 'Failed to load dashboard'
      
      if (err?.data?.detail) {
        errorMsg = err.data.detail
      } else if (err?.data?.error) {
        errorMsg = err.data.error
      } else if (err?.data?.message) {
        errorMsg = err.data.message
      } else if (err?.message) {
        errorMsg = err.message
        // Don't show "HTTP 500" as the message, try to get more details
        if (errorMsg === 'HTTP 500' || errorMsg.includes('HTTP')) {
          errorMsg = 'An error occurred while loading the dashboard. Please check the server logs or try again later.'
        }
      } else if (err?.status === 500) {
        errorMsg = 'Internal server error. Please try again or contact support if the problem persists.'
      }
      
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-och-steel">Loading sponsor dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="text-red-400 font-semibold mb-2">Error Loading Dashboard</div>
          <div className="text-och-steel">{error}</div>
          <button
            onClick={loadSummary}
            className="mt-4 px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Sponsor Dashboard</h1>
          <p className="text-och-steel">
            Welcome{user?.first_name ? `, ${user.first_name}` : ''}! Here's your ROI overview.
          </p>
        </div>

        {summary && (
          <>
            <div className="mb-6">
              <SponsorSummaryCard summary={summary} />
            </div>

            <div className="mb-6">
              <CohortsList />
            </div>
          </>
        )}

        {!summary && !loading && !error && (
          <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
            <div className="text-och-steel mb-4">No sponsor data available</div>
            <button
              onClick={loadSummary}
              className="px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
