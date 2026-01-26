"use client"

import { useEffect, useState, useMemo } from "react"
import type { FutureYou, UserTrack, ReadinessWindow } from "@/services/types/profiler"
import { useProfilerIntegration } from "@/hooks/useProfilerIntegration"

interface UseProfilerResult {
  futureYou: FutureYou | null
  tracks: UserTrack[]
  readinessWindow: ReadinessWindow | null
  isLoading: boolean
  error: string | null
  changeTrack: (trackId: string) => Promise<void>
}

export function useProfiler(userId: string | null): UseProfilerResult {
  const { profilerData, loading, error } = useProfilerIntegration(userId)
  const [futureYou, setFutureYou] = useState<FutureYou | null>(null)
  const [tracks, setTracks] = useState<UserTrack[]>([])
  const [readinessWindow, setReadinessWindow] = useState<ReadinessWindow | null>(null)

  useEffect(() => {
    if (!userId) {
      setFutureYou(null)
      setTracks([])
      setReadinessWindow(null)
      return
    }

    // Map profilerIntegration data to expected shape for FutureYouCard
    if (profilerData) {
      const personaName = profilerData.circleInfo
        ? `Circle ${profilerData.circleInfo.circleLevel} - ${profilerData.circleInfo.phaseName}`
        : "Emerging Professional"

      setFutureYou({
        id: profilerData.userId,
        persona_name: personaName,
        description: "Personalized trajectory based on your current progress and achievements.",
        estimated_readiness_date: undefined,
        confidence_score: undefined,
      })

      const difficultyOrder: UserTrack["difficulty"][] = ["beginner", "intermediate", "advanced"]
      const generatedTracks: UserTrack[] = difficultyOrder.map((level, idx) => ({
        id: `${profilerData.userId}-track-${idx + 1}`,
        name: level === "beginner" ? "Foundation" : level === "intermediate" ? "Builder" : "Mastery",
        description: level === "beginner"
          ? "Core skills and fundamentals"
          : level === "intermediate"
          ? "Expanding capabilities and projects"
          : "Advanced topics and leadership",
        difficulty: level,
        estimated_duration: level === "beginner" ? "4-6 weeks" : level === "intermediate" ? "6-8 weeks" : "8-12 weeks",
        current_progress: idx === 0 ? 30 : 0,
      }))
      setTracks(generatedTracks)

      const confidence: ReadinessWindow["confidence"] = profilerData.circleInfo && profilerData.circleInfo.isAdvanced
        ? "high"
        : profilerData.missionsCompleted > 10
        ? "medium"
        : "low"

      setReadinessWindow({
        label: confidence === "high" ? "Ready Soon" : confidence === "medium" ? "On Track" : "Emerging",
        estimated_date: new Date(Date.now() + (confidence === "high" ? 30 : confidence === "medium" ? 60 : 90) * 24 * 60 * 60 * 1000).toISOString(),
        confidence,
        category: confidence === "high" ? "accelerated" : confidence === "medium" ? "standard" : "foundation",
      })
    }
  }, [profilerData, userId])

  const changeTrack = useMemo(() => {
    return async (trackId: string) => {
      // Simulate track change by marking selected track as current and resetting others
      setTracks(prev => prev.map(t => ({
        ...t,
        current_progress: t.id === trackId ? (t.current_progress > 0 ? t.current_progress : 10) : 0,
      })))
      // No API call yet; integrate with real Profiler/Missions service when available
      await new Promise(resolve => setTimeout(resolve, 250))
    }
  }, [])

  return {
    futureYou,
    tracks,
    readinessWindow,
    isLoading: loading,
    error: error ? (error.message || "Failed to load profiler data") : null,
    changeTrack,
  }
}
