/**
 * AI Coach Hook
 * Manages AI conversation state and contextual nudges
 */
import { useState, useEffect } from 'react'
import { useCoachingStore } from '@/lib/coaching/store'
import { aiCoachAPI } from '@/lib/coaching/api'
import type { AICoachMessage } from '@/lib/coaching/types'

export function useAICOach() {
  const { aiMessages, addAIMessage, setAIMessages } = useCoachingStore()
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    // Load conversation history
    const loadHistory = async () => {
      try {
        const userId = 'current-user' // TODO: Get from auth
        const history = await aiCoachAPI.getHistory(userId, 50)
        setAIMessages(history)
      } catch (error) {
        console.error('Failed to load AI coach history:', error)
      }
    }
    
    loadHistory()
  }, [setAIMessages])
  
  const sendMessage = async (
    message: string,
    context?: AICoachMessage['context'],
    metadata?: AICoachMessage['metadata']
  ) => {
    setIsLoading(true)
    
    try {
      const response = await aiCoachAPI.sendMessage(message, context, metadata)
      addAIMessage(response as any)
      return response
    } catch (error) {
      console.error('Failed to send message to AI coach:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }
  
  const getContextualNudge = async (
    context: AICoachMessage['context'],
    metadata?: AICoachMessage['metadata']
  ) => {
    try {
      const nudge = await aiCoachAPI.getContextualNudge(context, metadata)
      addAIMessage(nudge)
      return nudge
    } catch (error) {
      console.error('Failed to get contextual nudge:', error)
      throw error
    }
  }
  
  return {
    messages: aiMessages,
    isLoading,
    sendMessage,
    getContextualNudge,
  }
}

