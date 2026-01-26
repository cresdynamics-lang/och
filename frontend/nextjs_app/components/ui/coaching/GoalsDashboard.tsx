/**
 * Goals Dashboard Component
 * Displays daily/weekly/monthly goals with progress bars
 */
'use client'

import { motion } from 'framer-motion'
import { Target, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { useCoachingStore } from '@/lib/coaching/store'
import type { Goal } from '@/lib/coaching/types'

interface GoalProgressProps {
  goal: Goal
}

function GoalProgress({ goal }: GoalProgressProps) {
  const progress = Math.min(100, Math.round((goal.current / goal.target) * 100))
  
  const getVariant = () => {
    if (progress >= 80) return 'mint'
    if (progress >= 50) return 'gold'
    if (progress >= 25) return 'orange'
    return 'defender'
  }
  
  const getTypeColor = () => {
    switch (goal.type) {
      case 'daily': return 'text-blue-400'
      case 'weekly': return 'text-purple-400'
      case 'monthly': return 'text-indigo-400'
      default: return 'text-slate-400'
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2 p-4 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="steel" className={`text-xs capitalize ${getTypeColor()}`}>
              {goal.type}
            </Badge>
            <h4 className="text-sm font-semibold text-slate-200">{goal.title}</h4>
          </div>
          {goal.description && (
            <p className="text-xs text-slate-400 mb-2">{goal.description}</p>
          )}
        </div>
        <span className="text-sm font-bold text-slate-300">{progress}%</span>
      </div>
      
      <ProgressBar 
        value={progress} 
        variant={getVariant()}
        showLabel={false}
      />
      
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{goal.current} / {goal.target}</span>
        {((goal as any).dueDate || (goal as any).due_date) && (
          <span>Due: {new Date((goal as any).dueDate || (goal as any).due_date || '').toLocaleDateString()}</span>
        )}
      </div>
      
      {/* Mentor Feedback (7-tier only) */}
      {((goal as any).mentorFeedback || (goal as any).mentor_feedback) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg"
        >
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-indigo-300 mb-1">Mentor Feedback</p>
              <p className="text-xs text-indigo-200/80">{(goal as any).mentorFeedback || (goal as any).mentor_feedback}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export function GoalsDashboard() {
  const { getActiveGoals } = useCoachingStore()
  const activeGoals = getActiveGoals()
  
  const dailyGoals = activeGoals.filter(g => g.type === 'daily')
  const weeklyGoals = activeGoals.filter(g => g.type === 'weekly')
  const monthlyGoals = activeGoals.filter(g => g.type === 'monthly')
  
  return (
    <Card className="lg:col-span-1 col-span-full h-[420px] overflow-hidden glass-card">
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-indigo-400" />
          <h3 className="text-xl font-bold text-slate-100">Goals</h3>
          <Badge variant="steel" className="ml-auto bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
            {activeGoals.length} Active
          </Badge>
        </div>
      </div>
      
      <div className="p-4 space-y-4 overflow-y-auto max-h-[320px]">
        {dailyGoals.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Daily</h4>
            {dailyGoals.map(goal => (
              <GoalProgress key={goal.id} goal={goal} />
            ))}
          </div>
        )}
        
        {weeklyGoals.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Weekly</h4>
            {weeklyGoals.map(goal => (
              <GoalProgress key={goal.id} goal={goal} />
            ))}
          </div>
        )}
        
        {monthlyGoals.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Monthly</h4>
            {monthlyGoals.map(goal => (
              <GoalProgress key={goal.id} goal={goal} />
            ))}
          </div>
        )}
        
        {activeGoals.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No active goals. Set your first goal!</p>
          </div>
        )}
      </div>
    </Card>
  )
}


