"use client"

import { useState, useEffect, useCallback } from "react"
import type { CreatePostData } from "@/services/types/community"

/**
 * Mission completion data for auto-posting
 */
export interface MissionCompletion {
  missionId: string
  missionName: string
  missionType: string
  score: number
  maxScore: number
  completedAt: string
  circleLevel: number
  phase: number
  badges?: string[]
  portfolioItemId?: string
}

/**
 * Circle advancement data for auto-posting
 */
export interface CircleAdvancement {
  userId: string
  previousCircle: number
  newCircle: number
  previousPhase: number
  newPhase: number
  advancedAt: string
  celebrationType: 'phase' | 'circle'
}

/**
 * Certification earned data
 */
export interface CertificationEarned {
  certificationId: string
  name: string
  issuer: string
  earnedAt: string
  verificationUrl?: string
  portfolioItemId?: string
}

type AchievementType = 'mission' | 'circle' | 'certification' | 'badge'

interface AutoPostConfig {
  enabled: boolean
  minimumMissionScore?: number // Only auto-post if score >= this threshold
  autoPostCircleAdvancement: boolean
  autoPostCertifications: boolean
}

const DEFAULT_CONFIG: AutoPostConfig = {
  enabled: true,
  minimumMissionScore: 80,
  autoPostCircleAdvancement: true,
  autoPostCertifications: true,
}

/**
 * Hook to handle auto-posting achievements from Missions/Portfolio
 */
export function useMissionsIntegration(
  userId: string | null,
  universityId: string | null,
  onCreatePost: (data: CreatePostData) => Promise<void>,
  config: Partial<AutoPostConfig> = {}
) {
  const [pendingPosts, setPendingPosts] = useState<CreatePostData[]>([])
  const [processing, setProcessing] = useState(false)
  const fullConfig: AutoPostConfig = { ...DEFAULT_CONFIG, ...config }

  // Convert mission completion to post data
  const createMissionPost = useCallback((completion: MissionCompletion): CreatePostData => {
    return {
      post_type: 'achievement',
      title: `🎯 Completed: ${completion.missionName}`,
      content: `Just completed the **${completion.missionName}** mission with a score of ${completion.score}/${completion.maxScore}! 🎉\n\nThis mission was part of Circle ${completion.circleLevel}, Phase ${completion.phase}.`,
      tags: ['achievement', 'mission', `circle-${completion.circleLevel}`],
      achievement_data: {
        type: 'mission',
        mission_id: completion.missionId,
        mission_name: completion.missionName,
        score: completion.score,
        circle_level: completion.circleLevel,
        phase: completion.phase,
        portfolio_item_id: completion.portfolioItemId,
        badges_earned: completion.badges,
      } as any,
    }
  }, [])

  // Convert circle advancement to post data
  const createCirclePost = useCallback((advancement: CircleAdvancement): CreatePostData => {
    const isCircleAdvance = advancement.celebrationType === 'circle'
    
    return {
      post_type: 'achievement',
      title: isCircleAdvance 
        ? `🏆 Advanced to Circle ${advancement.newCircle}!`
        : `⭐ Completed Phase ${advancement.newPhase}!`,
      content: isCircleAdvance
        ? `I just advanced from Circle ${advancement.previousCircle} to **Circle ${advancement.newCircle}**! 🚀\n\nExcited for the new challenges ahead!`
        : `Just completed Phase ${advancement.previousPhase} and moved to **Phase ${advancement.newPhase}** in Circle ${advancement.newCircle}! 📈`,
      tags: ['achievement', 'circle-advancement', `circle-${advancement.newCircle}`],
      achievement_data: {
        type: 'circle',
        circle_level: advancement.newCircle,
        phase: advancement.newPhase,
        previous_circle: advancement.previousCircle,
        previous_phase: advancement.previousPhase,
      } as any,
    }
  }, [])

  // Convert certification to post data
  const createCertificationPost = useCallback((cert: CertificationEarned): CreatePostData => {
    return {
      post_type: 'achievement',
      title: `📜 Earned: ${cert.name}`,
      content: `Proud to announce that I've earned the **${cert.name}** certification from ${cert.issuer}! 🎓\n\n${cert.verificationUrl ? `[Verify Certificate](${cert.verificationUrl})` : ''}`,
      tags: ['achievement', 'certification', cert.issuer.toLowerCase().replace(/\s+/g, '-')],
      achievement_data: {
        type: 'certification',
        certification_name: cert.name,
        issuer: cert.issuer,
        verification_url: cert.verificationUrl,
        portfolio_item_id: cert.portfolioItemId,
      } as any,
    }
  }, [])

  // Handle incoming achievement events
  const handleAchievement = useCallback((
    type: AchievementType,
    data: MissionCompletion | CircleAdvancement | CertificationEarned
  ) => {
    if (!fullConfig.enabled || !userId) return

    let postData: CreatePostData | null = null

    switch (type) {
      case 'mission':
        const mission = data as MissionCompletion
        if (mission.score >= (fullConfig.minimumMissionScore || 0)) {
          postData = createMissionPost(mission)
        }
        break
      
      case 'circle':
        if (fullConfig.autoPostCircleAdvancement) {
          postData = createCirclePost(data as CircleAdvancement)
        }
        break
      
      case 'certification':
        if (fullConfig.autoPostCertifications) {
          postData = createCertificationPost(data as CertificationEarned)
        }
        break
    }

    if (postData) {
      setPendingPosts(prev => [...prev, postData!])
    }
  }, [userId, fullConfig, createMissionPost, createCirclePost, createCertificationPost])

  // Process pending posts
  useEffect(() => {
    if (pendingPosts.length === 0 || processing) return

    const processNext = async () => {
      setProcessing(true)
      const [next, ...rest] = pendingPosts
      
      try {
        await onCreatePost(next)
        setPendingPosts(rest)
      } catch (err) {
        console.error('Failed to create achievement post:', err)
        // Could implement retry logic here
        setPendingPosts(rest)
      } finally {
        setProcessing(false)
      }
    }

    processNext()
  }, [pendingPosts, processing, onCreatePost])

  // Listen for achievement events from the global event bus
  useEffect(() => {
    const handleEvent = (event: CustomEvent<{ type: AchievementType; data: any }>) => {
      handleAchievement(event.detail.type, event.detail.data)
    }

    window.addEventListener('och:achievement', handleEvent as EventListener)
    window.addEventListener('och:mission-complete', handleEvent as EventListener)
    window.addEventListener('och:circle-advance', handleEvent as EventListener)
    window.addEventListener('och:certification-earned', handleEvent as EventListener)

    return () => {
      window.removeEventListener('och:achievement', handleEvent as EventListener)
      window.removeEventListener('och:mission-complete', handleEvent as EventListener)
      window.removeEventListener('och:circle-advance', handleEvent as EventListener)
      window.removeEventListener('och:certification-earned', handleEvent as EventListener)
    }
  }, [handleAchievement])

  return {
    pendingPosts: pendingPosts.length,
    processing,
    handleAchievement,
    // Manual trigger functions for testing
    triggerMissionComplete: (data: MissionCompletion) => handleAchievement('mission', data),
    triggerCircleAdvance: (data: CircleAdvancement) => handleAchievement('circle', data),
    triggerCertificationEarned: (data: CertificationEarned) => handleAchievement('certification', data),
  }
}

/**
 * Utility to emit achievement events (for Missions/Portfolio engines to call)
 */
export const AchievementEmitter = {
  emitMissionComplete: (data: MissionCompletion) => {
    window.dispatchEvent(new CustomEvent('och:mission-complete', { 
      detail: { type: 'mission', data } 
    }))
  },

  emitCircleAdvance: (data: CircleAdvancement) => {
    window.dispatchEvent(new CustomEvent('och:circle-advance', { 
      detail: { type: 'circle', data } 
    }))
  },

  emitCertificationEarned: (data: CertificationEarned) => {
    window.dispatchEvent(new CustomEvent('och:certification-earned', { 
      detail: { type: 'certification', data } 
    }))
  },
}

