'use client'

import { useState, useEffect, useCallback } from 'react'
import { subscriptionClient } from '@/services/subscriptionClient'
import type { Subscription, Usage } from '@/services/types/subscription'

export function useSubscription(menteeId: string | undefined) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!menteeId) return

    setIsLoading(true)
    setError(null)

    try {
      const [subData, usageData] = await Promise.all([
        subscriptionClient.getSubscription(menteeId),
        subscriptionClient.getUsage(menteeId),
      ])

      setSubscription(subData)
      setUsage(usageData)
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription data')
    } finally {
      setIsLoading(false)
    }
  }, [menteeId])

  const upgrade = useCallback(async (tier: 'premium' | 'enterprise') => {
    if (!menteeId) return

    try {
      const result = await subscriptionClient.upgrade(menteeId, tier)
      // Redirect to checkout
      if (result.checkout_url) {
        window.location.href = result.checkout_url
      }
      return result
    } catch (err: any) {
      throw new Error(err.message || 'Failed to upgrade subscription')
    }
  }, [menteeId])

  const downloadInvoice = useCallback(async (invoiceId: string) => {
    try {
      const blob = await subscriptionClient.downloadInvoice(invoiceId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      throw new Error(err.message || 'Failed to download invoice')
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    subscription,
    usage,
    isLoading,
    error,
    reload: loadData,
    upgrade,
    downloadInvoice,
  }
}

