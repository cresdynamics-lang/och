'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Lock, Play } from 'lucide-react'

interface Mission {
  id: string
  code: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'capstone'
  type?: string
  estimated_time_minutes?: number
  competency_tags?: string[]
  track_key?: string
  track?: string
  status?: string
  progress_percent?: number
  ai_score?: number
  submission_id?: string
  artifacts_uploaded?: number
  artifacts_required?: number
  ai_feedback?: {
    score: number
    strengths: string[]
    gaps: string[]
  }
  is_locked?: boolean
  lock_reason?: 'not_enrolled' | 'wrong_track' | 'pending_profile' | null
  lock_message?: string
}

interface Props {
  missions: Mission[]
  loading: boolean
}

export function MissionsStats({ missions, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const stats = [
    {
      icon: Clock,
      label: 'Total Missions',
      value: missions.length,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Play,
      label: 'Available',
      value: missions.filter(m => !m.is_locked).length,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: CheckCircle2,
      label: 'Completed',
      value: missions.filter(m => m.status === 'completed').length,
      color: 'from-green-500 to-lime-500',
      bgColor: 'bg-green-50',
    },
    {
      icon: Lock,
      label: 'Locked',
      value: missions.filter(m => m.is_locked).length,
      color: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={`${stat.bgColor} rounded-lg p-4 border border-gray-200`}
          >
            <div className="flex items-center gap-3">
              <div className={`bg-gradient-to-br ${stat.color} p-2 rounded-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
