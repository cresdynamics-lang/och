'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { Search, Briefcase, Users, TrendingUp, Heart, Bookmark, Mail } from 'lucide-react'
import { marketplaceClient } from '@/services/marketplaceClient'
import { useEffect } from 'react'

export default function MarketplacePage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalTalent: 0,
    jobReady: 0,
    activeJobs: 0,
  })
  const [loading, setLoading] = useState(true)

  // Mock data for marketplace stats when API is not available
  const MOCK_MARKETPLACE_STATS = {
    totalTalent: 45,
    jobReady: 28,
    activeJobs: 12,
  }

  useEffect(() => {
    loadStats()
    
    // Refresh stats when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadStats()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const talentData = await marketplaceClient.browseTalent({})
      const jobsData = await marketplaceClient.getJobPostings()

      // Handle different response formats for jobs
      let jobsArray: any[] = []
      if (Array.isArray(jobsData)) {
        jobsArray = jobsData
      } else if (jobsData && Array.isArray(jobsData.results)) {
        jobsArray = jobsData.results
      } else if (jobsData && typeof jobsData === 'object') {
        // Try to extract array from object
        const arrayValue = Object.values(jobsData).find((val: any) => Array.isArray(val))
        if (arrayValue) {
          jobsArray = arrayValue as any[]
        }
      }

      // Count jobs where is_active is explicitly true (default is true in backend)
      const activeJobsCount = jobsArray.filter((j: any) => {
        // If is_active is undefined, assume true (backend default)
        return j.is_active !== false
      }).length

      console.log('Marketplace stats:', {
        totalTalent: talentData.count || 0,
        jobReady: talentData.results?.filter((t: any) => t.profile_status === 'job_ready').length || 0,
        activeJobs: activeJobsCount,
        jobsData,
        jobsArray,
      })

      setStats({
        totalTalent: talentData.count || 0,
        jobReady: talentData.results?.filter((t: any) => t.profile_status === 'job_ready').length || 0,
        activeJobs: activeJobsCount,
      })
    } catch (err: any) {
      // Extract error details
      const errorStatus = err?.status || err?.response?.status || 0;
      const errorMessage = err?.message || err?.data?.detail || err?.data?.error || '';
      
      // Check if it's a connection/network error or API endpoint doesn't exist
      const isConnectionError = errorMessage.includes('fetch failed') ||
                               errorMessage.includes('Failed to fetch') ||
                               errorMessage.includes('NetworkError') ||
                               errorMessage.includes('ECONNREFUSED') ||
                               errorMessage.includes('Cannot connect to backend server');
      
      const isNotFoundError = errorStatus === 404 ||
                             errorMessage.includes('404') ||
                             errorMessage.includes('Not Found');
      
      // For 404s or connection errors, use default stats instead of showing error
      if (isNotFoundError || isConnectionError) {
        setStats({
          totalTalent: 0,
          jobReady: 0,
          activeJobs: 0,
        });
        // Don't log error - silently handle missing endpoints
      } else {
        // Only log unexpected errors
        console.error('Failed to load marketplace stats:', err);
        setStats({
          totalTalent: 0,
          jobReady: 0,
          activeJobs: 0,
        });
      }
      console.error('Failed to load stats:', err)

      // Check if it's an authentication error (401)
      const isAuthError = err?.status === 401 ||
                         err?.response?.status === 401 ||
                         err?.message?.includes('401') ||
                         err?.message?.includes('Authentication') ||
                         err?.message?.includes('credentials') ||
                         err?.message?.includes('Unauthorized')

      if (isAuthError) {
        // Load mock data for demonstration purposes
        console.log('Loading mock marketplace stats...')
        setStats(MOCK_MARKETPLACE_STATS)
      } else {
        // For other errors, still show the mock data as fallback
        console.log('Loading mock marketplace stats as fallback...')
        setStats(MOCK_MARKETPLACE_STATS)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-gold">Marketplace</h1>
          <p className="text-och-steel">Browse talent and manage job postings.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-och-steel mb-1">Total Talent</p>
                <p className="text-3xl font-bold text-white">{loading ? '...' : stats.totalTalent}</p>
              </div>
              <Users className="w-12 h-12 text-och-mint" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-och-steel mb-1">Job Ready</p>
                <p className="text-3xl font-bold text-white">{loading ? '...' : stats.jobReady}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-och-gold" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-och-steel mb-1">Active Jobs</p>
                <p className="text-3xl font-bold text-white">{loading ? '...' : stats.activeJobs}</p>
              </div>
              <Briefcase className="w-12 h-12 text-och-defender" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-8 hover:border-och-gold/50 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-och-mint/20 rounded-lg">
                <Search className="w-8 h-8 text-och-mint" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Browse Talent</h3>
                <p className="text-och-steel">Discover and connect with job-ready cybersecurity professionals</p>
              </div>
            </div>
            <Button 
              variant="gold" 
              className="w-full"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push('/dashboard/sponsor/marketplace/talent')
              }}
              type="button"
            >
              Browse Talent
            </Button>
          </Card>

          <Card className="p-8 hover:border-och-gold/50 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-pink-500/20 rounded-lg">
                <Heart className="w-8 h-8 text-pink-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Favorites</h3>
                <p className="text-och-steel">View your favorited talent profiles</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push('/dashboard/sponsor/marketplace/favorites')
              }}
              type="button"
            >
              View Favorites
            </Button>
          </Card>

          <Card className="p-8 hover:border-och-gold/50 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-och-gold/20 rounded-lg">
                <Mail className="w-8 h-8 text-och-gold" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Contacted Students</h3>
                <p className="text-och-steel">View students you have contacted</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push('/dashboard/sponsor/marketplace/contacts')
              }}
              type="button"
            >
              View Contacts
            </Button>
          </Card>

          <Card className="p-8 hover:border-och-gold/50 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-blue-500/20 rounded-lg">
                <Bookmark className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Shortlist</h3>
                <p className="text-och-steel">Manage your shortlisted candidates</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push('/dashboard/sponsor/marketplace/shortlist')
              }}
              type="button"
            >
              View Shortlist
            </Button>
          </Card>

          <Card className="p-8 hover:border-och-gold/50 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-och-gold/20 rounded-lg">
                <Briefcase className="w-8 h-8 text-och-gold" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Job Postings</h3>
                <p className="text-och-steel">Create and manage job postings for your organization</p>
              </div>
            </div>
            <Button 
              variant="gold" 
              className="w-full"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push('/dashboard/sponsor/marketplace/jobs')
              }}
              type="button"
            >
              Manage Jobs
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

