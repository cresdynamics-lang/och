import { useState, useEffect, useCallback } from 'react'
import { sponsorClient, type SponsorProfile, type SponsorMetrics, type SeatEntitlement } from '@/services/sponsorClient'

interface UseSponsorReturn {
  // Authentication
  profile: SponsorProfile | null
  isAuthenticated: boolean
  
  // Data
  metrics: {
    seatUtilization: SponsorMetrics | null
    completionRates: SponsorMetrics | null
    placementMetrics: SponsorMetrics | null
    roiAnalysis: SponsorMetrics | null
  }
  entitlements: SeatEntitlement[]
  invoices: any[]
  
  // Loading states
  loading: {
    profile: boolean
    metrics: boolean
    entitlements: boolean
    invoices: boolean
  }
  
  // Error states
  errors: {
    profile: string | null
    metrics: string | null
    entitlements: string | null
    invoices: string | null
  }
  
  // Actions
  refreshProfile: () => Promise<void>
  refreshMetrics: () => Promise<void>
  refreshEntitlements: () => Promise<void>
  refreshInvoices: () => Promise<void>
  refreshAll: () => Promise<void>
  
  // Cohort actions
  createCohort: (data: any) => Promise<any>
  enrollStudents: (cohortId: string, emails: string[]) => Promise<any>
  sendMessage: (data: any) => Promise<any>
  
  // Billing actions
  createCheckoutSession: (data: any) => Promise<any>
  exportDashboard: () => Promise<any>
}

export function useSponsor(): UseSponsorReturn {
  // State
  const [profile, setProfile] = useState<SponsorProfile | null>(null)
  const [metrics, setMetrics] = useState({
    seatUtilization: null as SponsorMetrics | null,
    completionRates: null as SponsorMetrics | null,
    placementMetrics: null as SponsorMetrics | null,
    roiAnalysis: null as SponsorMetrics | null,
  })
  const [entitlements, setEntitlements] = useState<SeatEntitlement[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  
  const [loading, setLoading] = useState({
    profile: false,
    metrics: false,
    entitlements: false,
    invoices: false,
  })
  
  const [errors, setErrors] = useState({
    profile: null as string | null,
    metrics: null as string | null,
    entitlements: null as string | null,
    invoices: null as string | null,
  })

  // Helper to update loading state
  const setLoadingState = (key: keyof typeof loading, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }))
  }

  // Helper to update error state
  const setErrorState = (key: keyof typeof errors, value: string | null) => {
    setErrors(prev => ({ ...prev, [key]: value }))
  }

  // Profile management
  const refreshProfile = useCallback(async () => {
    try {
      setLoadingState('profile', true)
      setErrorState('profile', null)
      
      const profileData = await sponsorClient.getProfile()
      setProfile(profileData)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load profile'
      setErrorState('profile', message)
      console.error('Failed to refresh profile:', error)
    } finally {
      setLoadingState('profile', false)
    }
  }, [])

  // Metrics management
  const refreshMetrics = useCallback(async () => {
    try {
      setLoadingState('metrics', true)
      setErrorState('metrics', null)
      
      const [seatData, completionData, placementData, roiData] = await Promise.allSettled([
        sponsorClient.getMetrics('seat_utilization'),
        sponsorClient.getMetrics('completion_rates'),
        sponsorClient.getMetrics('placement_metrics'),
        sponsorClient.getMetrics('roi_analysis')
      ])
      
      setMetrics({
        seatUtilization: seatData.status === 'fulfilled' ? seatData.value : null,
        completionRates: completionData.status === 'fulfilled' ? completionData.value : null,
        placementMetrics: placementData.status === 'fulfilled' ? placementData.value : null,
        roiAnalysis: roiData.status === 'fulfilled' ? roiData.value : null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load metrics'
      setErrorState('metrics', message)
      console.error('Failed to refresh metrics:', error)
    } finally {
      setLoadingState('metrics', false)
    }
  }, [])

  // Entitlements management
  const refreshEntitlements = useCallback(async () => {
    try {
      setLoadingState('entitlements', true)
      setErrorState('entitlements', null)
      
      const data = await sponsorClient.getEntitlements()
      setEntitlements(data.entitlements)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load entitlements'
      setErrorState('entitlements', message)
      console.error('Failed to refresh entitlements:', error)
    } finally {
      setLoadingState('entitlements', false)
    }
  }, [])

  // Invoices management
  const refreshInvoices = useCallback(async () => {
    try {
      setLoadingState('invoices', true)
      setErrorState('invoices', null)
      
      const data = await sponsorClient.getInvoices()
      setInvoices(data.invoices)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load invoices'
      setErrorState('invoices', message)
      console.error('Failed to refresh invoices:', error)
    } finally {
      setLoadingState('invoices', false)
    }
  }, [])

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshProfile(),
      refreshMetrics(),
      refreshEntitlements(),
      refreshInvoices()
    ])
  }, [refreshProfile, refreshMetrics, refreshEntitlements, refreshInvoices])

  // Cohort actions
  const createCohort = useCallback(async (data: any) => {
    try {
      const result = await sponsorClient.createCohort(data)
      // Refresh entitlements after creating cohort
      await refreshEntitlements()
      return result
    } catch (error) {
      console.error('Failed to create cohort:', error)
      throw error
    }
  }, [refreshEntitlements])

  const enrollStudents = useCallback(async (cohortId: string, emails: string[]) => {
    try {
      const result = await sponsorClient.enrollStudents(cohortId, { student_emails: emails })
      // Refresh entitlements after enrollment
      await refreshEntitlements()
      return result
    } catch (error) {
      console.error('Failed to enroll students:', error)
      throw error
    }
  }, [refreshEntitlements])

  const sendMessage = useCallback(async (data: any) => {
    try {
      const result = await sponsorClient.sendMessage(data)
      return result
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }, [])

  // Billing actions
  const createCheckoutSession = useCallback(async (data: any) => {
    try {
      const result = await sponsorClient.createCheckoutSession(data)
      return result
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      throw error
    }
  }, [])

  const exportDashboard = useCallback(async () => {
    try {
      const result = await sponsorClient.exportDashboardPDF()
      return result
    } catch (error) {
      console.error('Failed to export dashboard:', error)
      throw error
    }
  }, [])

  // Initialize data on mount
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // Computed values
  const isAuthenticated = profile !== null

  return {
    // Authentication
    profile,
    isAuthenticated,
    
    // Data
    metrics,
    entitlements,
    invoices,
    
    // Loading states
    loading,
    
    // Error states
    errors,
    
    // Actions
    refreshProfile,
    refreshMetrics,
    refreshEntitlements,
    refreshInvoices,
    refreshAll,
    
    // Cohort actions
    createCohort,
    enrollStudents,
    sendMessage,
    
    // Billing actions
    createCheckoutSession,
    exportDashboard,
  }
}