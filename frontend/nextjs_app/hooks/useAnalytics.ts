'use client'

import { useState, useEffect, useCallback } from 'react'
import { analyticsClient } from '@/services/analyticsClient'
import type {
  ReadinessScore,
  SkillHeatmapData,
  SkillMastery,
  BehavioralTrend,
  AnalyticsFilter,
} from '@/services/types/analytics'

export function useAnalytics(menteeId: string | undefined, filter?: AnalyticsFilter) {
  const [readinessScores, setReadinessScores] = useState<ReadinessScore[]>([])
  const [heatmapData, setHeatmapData] = useState<SkillHeatmapData[]>([])
  const [skillMastery, setSkillMastery] = useState<SkillMastery[]>([])
  const [behavioralTrends, setBehavioralTrends] = useState<BehavioralTrend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // If no menteeId, provide mock/empty data for platform-wide analytics
      if (!menteeId) {
        // For platform-wide analytics (analyst/admin), return empty arrays
        // The component will handle displaying appropriate content
        setReadinessScores([])
        setHeatmapData([])
        setSkillMastery([])
        setBehavioralTrends([])
        setIsLoading(false)
        return
      }

      const [readiness, heatmap, mastery, trends] = await Promise.all([
        analyticsClient.getReadinessOverTime(menteeId, filter),
        analyticsClient.getSkillsHeatmap(menteeId, filter),
        analyticsClient.getSkillMastery(menteeId, filter?.skill_category),
        analyticsClient.getBehavioralTrends(menteeId, filter),
      ])

      setReadinessScores(readiness)
      setHeatmapData(heatmap)
      setSkillMastery(mastery)
      setBehavioralTrends(trends)
    } catch (err: any) {
      console.error('Analytics load error:', err)
      // For 404 or API errors, provide fallback empty data instead of showing error
      if (err?.status === 404 || err?.message?.includes('404')) {
        setReadinessScores([])
        setHeatmapData([])
        setSkillMastery([])
        setBehavioralTrends([])
        setError(null) // Don't show error for missing data
      } else {
        setError(err.message || 'Failed to load analytics')
      }
    } finally {
      setIsLoading(false)
    }
  }, [menteeId, filter])

  const exportReport = useCallback(async (format: 'pdf' | 'csv') => {
    if (!menteeId) return

    try {
      const blob = await analyticsClient.exportReport(menteeId, format, filter)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      throw new Error(err.message || 'Failed to export report')
    }
  }, [menteeId, filter])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    readinessScores,
    heatmapData,
    skillMastery,
    behavioralTrends,
    isLoading,
    error,
    reload: loadData,
    exportReport,
  }
}
