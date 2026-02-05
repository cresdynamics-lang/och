/**
 * Coaching API Client
 * Handles all API calls for the coaching system
 */

const API_BASE = '/api/coaching'

export const habitsAPI = {
  async getAll() {
    try {
      const response = await fetch(`${API_BASE}/habits`)
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch habits:', error)
      return []
    }
  },

  async getLogs(habitId: string) {
    try {
      const response = await fetch(`${API_BASE}/habits/${habitId}/logs`)
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch habit logs:', error)
      return []
    }
  },

  async create(habit: any) {
    const response = await fetch(`${API_BASE}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habit)
    })
    return await response.json()
  },

  async update(id: string, habit: any) {
    const response = await fetch(`${API_BASE}/habits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habit)
    })
    return await response.json()
  }
}

export const goalsAPI = {
  async getAll() {
    try {
      const response = await fetch(`${API_BASE}/goals`)
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch goals:', error)
      return []
    }
  },

  async create(goal: any) {
    const response = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal)
    })
    return await response.json()
  },

  async update(id: string, goal: any) {
    const response = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal)
    })
    return await response.json()
  }
}

export const reflectionsAPI = {
  async getAll() {
    try {
      const response = await fetch(`${API_BASE}/reflections`)
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch reflections:', error)
      return []
    }
  },

  async create(reflection: any) {
    const response = await fetch(`${API_BASE}/reflections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reflection)
    })
    return await response.json()
  }
}

export const metricsAPI = {
  async getMetrics() {
    try {
      const response = await fetch(`${API_BASE}/metrics`)
      if (!response.ok) {
        return {
          alignmentScore: 0,
          totalStreakDays: 0,
          activeHabits: 0,
          completedGoals: 0,
          reflectionCount: 0
        }
      }
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      return {
        alignmentScore: 0,
        totalStreakDays: 0,
        activeHabits: 0,
        completedGoals: 0,
        reflectionCount: 0
      }
    }
  }
}