/**
 * Habits Service Client
 * Handles habits, goals, and reflections
 */

import { apiGateway } from './apiGateway'
import type { Habit, DailyGoal, HabitReflection } from './types/habits'

export const habitsClient = {
  /**
   * Get today's habits
   */
  async getTodayHabits(menteeId: string): Promise<Habit[]> {
    return apiGateway.get(`/habits/mentees/${menteeId}/today`)
  },

  /**
   * Update habit completion
   */
  async updateHabit(menteeId: string, habitId: string, completed: boolean): Promise<Habit> {
    return apiGateway.patch(`/habits/mentees/${menteeId}/habits/${habitId}`, { completed })
  },

  /**
   * Get today's goals
   */
  async getTodayGoals(menteeId: string): Promise<DailyGoal[]> {
    return apiGateway.get(`/goals/mentees/${menteeId}/today`)
  },

  /**
   * Complete goal
   */
  async completeGoal(menteeId: string, goalId: string): Promise<DailyGoal> {
    return apiGateway.post(`/goals/mentees/${menteeId}/goals/${goalId}/complete`, {})
  },

  /**
   * Get latest reflection
   */
  async getLatestReflection(menteeId: string): Promise<HabitReflection | null> {
    return apiGateway.get(`/reflections/mentees/${menteeId}/latest`)
  },

  /**
   * Submit reflection
   */
  async submitReflection(menteeId: string, content: string): Promise<HabitReflection> {
    return apiGateway.post(`/reflections`, { mentee_id: menteeId, content })
  },
}
