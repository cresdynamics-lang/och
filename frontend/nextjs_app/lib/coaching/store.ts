import { create } from 'zustand'

interface Habit {
  id: string
  [key: string]: any
}

interface Goal {
  id: string
  [key: string]: any
}

interface Reflection {
  id: string
  [key: string]: any
}

interface Metrics {
  alignmentScore: number
  totalStreakDays: number
  activeHabits: number
  completedGoals: number
  reflectionCount: number
}

interface HabitLog {
  id: string
  habit_id: string
  [key: string]: any
}

interface CoachingState {
  habits: Habit[]
  goals: Goal[]
  reflections: Reflection[]
  metrics: Metrics | null
  habitLogs: HabitLog[]
  isLoading: boolean
  error: string | null
  setHabits: (habits: Habit[]) => void
  setGoals: (goals: Goal[]) => void
  setReflections: (reflections: Reflection[]) => void
  setMetrics: (metrics: Metrics) => void
  setHabitLogs: (logs: HabitLog[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useCoachingStore = create<CoachingState>((set) => ({
  habits: [],
  goals: [],
  reflections: [],
  metrics: null,
  habitLogs: [],
  isLoading: false,
  error: null,
  setHabits: (habits) => set({ habits }),
  setGoals: (goals) => set({ goals }),
  setReflections: (reflections) => set({ reflections }),
  setMetrics: (metrics) => set({ metrics }),
  setHabitLogs: (habitLogs) => set({ habitLogs }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}))
