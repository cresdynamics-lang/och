/**
 * AI Coaching Service Client
 * Handles AI coaching endpoints and sentiment analysis
 */

import { apiGateway } from './apiGateway'
import type {
  DailyNudge,
  SentimentAnalysis,
  Reflection,
  AICoachMessage,
  LearningPlan,
} from './types/coaching'

export const coachingClient = {
  /**
   * Get daily personalized nudges for a mentee
   */
  async getDailyNudges(menteeId: string): Promise<DailyNudge[]> {
    return apiGateway.get(`/aicoach/mentees/${menteeId}/daily-nudges`)
  },

  /**
   * Analyze sentiment of a reflection
   */
  async analyzeSentiment(reflectionId: string, content: string): Promise<SentimentAnalysis> {
    return apiGateway.post(`/reflections/${reflectionId}/analyze-sentiment`, { content })
  },

  /**
   * Get AI coach messages/conversation
   */
  async getCoachMessages(menteeId: string): Promise<AICoachMessage[]> {
    return apiGateway.get(`/aicoach/mentees/${menteeId}/messages`)
  },

  /**
   * Request new learning plan
   */
  async requestLearningPlan(menteeId: string, preferences?: {
    focus_areas?: string[]
    difficulty?: string
    duration?: string
  }): Promise<LearningPlan> {
    return apiGateway.post(`/aicoach/mentees/${menteeId}/learning-plans`, preferences || {})
  },

  /**
   * Refresh recommendations
   */
  async refreshRecommendations(menteeId: string): Promise<{
    learning_plan: LearningPlan
    next_actions: string[]
  }> {
    return apiGateway.post(`/aicoach/mentees/${menteeId}/refresh-recommendations`)
  },
}

