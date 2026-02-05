/**
 * Coaching Utility Functions
 */

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getToday(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

/**
 * Get streak emoji based on streak count
 */
export function getStreakEmoji(streakDays: number): string {
  if (streakDays === 0) return '💤'
  if (streakDays < 7) return '🔥'
  if (streakDays < 30) return '⚡'
  if (streakDays < 100) return '💪'
  return '🏆'
}

/**
 * Calculate streak from habit logs
 */
export function calculateStreak(logs: Array<{ date: string; completed: boolean }>): number {
  if (!logs || logs.length === 0) return 0

  const sortedLogs = [...logs].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  let currentDate = new Date(today)

  for (const log of sortedLogs) {
    const logDate = new Date(log.date).toISOString().split('T')[0]
    const expectedDate = currentDate.toISOString().split('T')[0]

    if (logDate === expectedDate && log.completed) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (logDate < expectedDate) {
      break
    }
  }

  return streak
}
