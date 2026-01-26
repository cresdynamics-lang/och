/**
 * Habit-Specific Hook
 * Logic for habit tracking and streaks
 */
import { useMemo } from 'react'
import { useCoachingStore } from '@/lib/coaching/store'
import { calculateStreak, getToday } from '@/lib/coaching/utils'
import type { Habit, HabitLog } from '@/lib/coaching/types'

export function useHabits() {
  const { habits, habitLogs, logHabit } = useCoachingStore()
  
  const todayHabits = useMemo(() => {
    const today = getToday()
    return habits.filter(h => h.isActive).map(habit => {
      const logs = habitLogs.filter(log => log.habitId === habit.id)
      const todayLog = logs.find(log => log.date === today)
      const streakData = calculateStreak(habit, logs)
      
      return {
        ...habit,
        todayStatus: todayLog?.status || ('pending' as const),
        streakData,
        logs,
      }
    })
  }, [habits, habitLogs])
  
  const handleLogHabit = async (habitId: string, status: HabitLog['status']) => {
    await logHabit(habitId, status)
  }
  
  const getHabitStreak = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return null
    
    const logs = habitLogs.filter(log => log.habitId === habitId)
    return calculateStreak(habit, logs)
  }
  
  return {
    habits,
    todayHabits,
    logHabit: handleLogHabit,
    getHabitStreak,
  }
}
