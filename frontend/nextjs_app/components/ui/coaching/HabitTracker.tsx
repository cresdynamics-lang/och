/**
 * Habit Tracker Component
 * Displays 3 core habits + custom habits with streak tracking
 */
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, CheckCircle, Circle, Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StreakFlame } from './StreakFlame'
import { useCoachingStore } from '@/lib/coaching/store'
import { getToday } from '@/lib/coaching/utils'
import type { Habit, HabitLog } from '@/lib/coaching/types'

interface HabitItemProps {
  habit: Habit & { todayStatus?: 'completed' | 'pending' | 'skipped' }
  onLog: (habitId: string, status: HabitLog['status']) => void
}

function HabitItem({ habit, onLog }: HabitItemProps) {
  const isCompleted = habit.todayStatus === 'completed'
  const isSkipped = habit.todayStatus === 'skipped'
  
  const handleClick = () => {
    if (isCompleted) {
      onLog(habit.id, 'skipped')
    } else if (isSkipped) {
      onLog(habit.id, 'missed')
    } else {
      onLog(habit.id, 'completed')
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-center p-4 hover:bg-slate-800/50 transition-all border-l-4 border-indigo-500/50 rounded-r-lg"
    >
      <Button
        variant="outline"
        size="sm"
        className={`flex-1 text-left justify-between bg-transparent border-0 ${
          isCompleted ? 'text-emerald-400' : isSkipped ? 'text-amber-400' : 'text-slate-400'
        }`}
        onClick={handleClick}
      >
        <span className="font-medium">{habit.name}</span>
        <div className="text-right space-y-1">
          <p className="text-sm capitalize">{habit.frequency}</p>
          <p className="text-xs opacity-75">
            Streak: {habit.streak}d {habit.streak > 0 && '🔥'}
          </p>
        </div>
      </Button>
      
      {/* Status Indicator */}
      {isCompleted ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <CheckCircle className="w-6 h-6 text-emerald-500 ml-2" />
        </motion.div>
      ) : (
        <Circle className="w-6 h-6 text-slate-600 ml-2" />
      )}
    </motion.div>
  )
}

export function HabitTracker() {
  const { habits, habitLogs, logHabit, getTodayHabits } = useCoachingStore()
  const [showAddModal, setShowAddModal] = useState(false)
  
  const todayHabits = getTodayHabits()
  const coreHabits = todayHabits.filter(h => h.type === 'core')
  const customHabits = todayHabits.filter(h => h.type === 'custom')
  const completedCount = todayHabits.filter(h => h.todayStatus === 'completed').length
  const totalCount = todayHabits.length
  
  const handleLogHabit = async (habitId: string, status: HabitLog['status']) => {
    await logHabit(habitId, status)
  }
  
  // Initialize core habits if they don't exist
  const hasCoreHabits = coreHabits.length > 0
  if (!hasCoreHabits && habits.length === 0) {
    // This would typically be done via API on mount
    // For now, we'll show empty state
  }
  
  return (
    <Card className="lg:col-span-1 col-span-full h-[420px] overflow-hidden group glass-card">
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <Flame className="w-6 h-6 text-orange-500" />
          <h3 className="text-xl font-bold text-slate-100">Habits</h3>
          <Badge variant="steel" className="ml-auto bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
            {completedCount}/{totalCount || todayHabits.length} Today
          </Badge>
        </div>
      </div>
      
      <div className="p-0 space-y-3 overflow-y-auto max-h-[320px]">
        <AnimatePresence>
          {coreHabits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              onLog={handleLogHabit}
            />
          ))}
        </AnimatePresence>
        
        {customHabits.map((habit) => (
          <HabitItem
            key={habit.id}
            habit={habit}
            onLog={handleLogHabit}
          />
        ))}
        
        {/* Streak Display */}
        {coreHabits.length > 0 && coreHabits[0].streak > 0 && (
          <div className="flex justify-center py-4">
            <StreakFlame 
              streak={coreHabits[0].streak} 
              size="md"
              isAtRisk={false}
            />
          </div>
        )}
        
        {/* Add Custom Habit Button */}
        <div className="p-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Habit
          </Button>
        </div>
        
        {todayHabits.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No habits yet. Add your first habit!</p>
          </div>
        )}
      </div>
    </Card>
  )
}


