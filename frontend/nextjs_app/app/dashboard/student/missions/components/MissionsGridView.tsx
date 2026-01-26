'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Shield,
  Zap,
  Award,
  Clock,
  Lock,
  AlertCircle,
  CheckCircle2,
  Play,
} from 'lucide-react'

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
  status?: string
  is_locked?: boolean
  lock_reason?: string
  lock_message?: string
}

interface Props {
  missions: Mission[]
  loading: boolean
  onMissionClick: (missionId: string) => void
}

const DIFFICULTY_CONFIG = {
  beginner: {
    icon: Shield,
    color: 'from-emerald-500 to-teal-500',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'START',
  },
  intermediate: {
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    badge: 'bg-blue-100 text-blue-700',
    label: 'BUILD',
  },
  advanced: {
    icon: Award,
    color: 'from-orange-500 to-red-500',
    badge: 'bg-orange-100 text-orange-700',
    label: 'MASTER',
  },
  capstone: {
    icon: Award,
    color: 'from-purple-500 to-pink-500',
    badge: 'bg-purple-100 text-purple-700',
    label: 'ELITE',
  },
}

const TRACK_CONFIG = {
  defender: { badge: 'bg-red-100 text-red-700', label: '🛡️ Defender' },
  offensive: { badge: 'bg-orange-100 text-orange-700', label: '⚔️ Offensive' },
  grc: { badge: 'bg-blue-100 text-blue-700', label: '📋 GRC' },
  innovation: { badge: 'bg-purple-100 text-purple-700', label: '💡 Innovation' },
  leadership: { badge: 'bg-pink-100 text-pink-700', label: '👥 Leadership' },
}

export function MissionsGridView({ missions, loading, onMissionClick }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-och-midnight/40 rounded-xl h-40 animate-pulse border border-och-steel/10" />
        ))}
      </div>
    )
  }

  if (missions.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="mx-auto h-16 w-16 text-och-steel/40 mb-4" />
        <h3 className="text-lg font-semibold text-och-steel mb-2">No missions found</h3>
        <p className="text-och-steel/70 text-sm">Try adjusting your filters or check back later</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {missions.map((mission, index) => {
        const diffKey = (mission.difficulty || 'beginner') as keyof typeof DIFFICULTY_CONFIG
        const diffConfig = DIFFICULTY_CONFIG[diffKey] || DIFFICULTY_CONFIG.beginner
        const trackConfig = TRACK_CONFIG[mission.track_key as keyof typeof TRACK_CONFIG] || TRACK_CONFIG.defender
        const DiffIcon = diffConfig.icon

        return (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.25 }}
          >
            <Card
              className={`h-full flex flex-col overflow-hidden transition-all duration-300 ${
                mission.is_locked 
                  ? 'opacity-60 cursor-not-allowed bg-och-midnight/30 border-och-steel/10' 
                  : 'cursor-pointer hover:shadow-lg hover:shadow-och-defender/20 hover:-translate-y-0.5 bg-och-midnight/50 border-och-steel/20 hover:border-och-steel/40'
              }`}
              onClick={() => !mission.is_locked && onMissionClick(mission.id)}
            >
              {/* Compact Header with gradient */}
              <div className={`bg-gradient-to-r ${diffConfig.color} p-3 text-white flex-shrink-0`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <DiffIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="font-mono text-xs font-bold truncate">{mission.code}</span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug line-clamp-2">{mission.title}</h3>
                  </div>
                  {mission.is_locked && (
                    <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-full p-1.5 mt-0.5">
                      <Lock className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Content */}
              <div className="flex-1 p-3 flex flex-col gap-2">
                {/* Track Badge - Single compact row */}
                <div className="flex gap-2 items-center flex-wrap">
                  <Badge className={`${trackConfig.badge} text-[11px] py-0.5`}>
                    {trackConfig.label}
                  </Badge>
                  <Badge className={`${diffConfig.badge} text-[11px] py-0.5 font-semibold`}>
                    {diffConfig.label}
                  </Badge>
                </div>

                {/* Competency Tags - Compact */}
                {mission.competency_tags && mission.competency_tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {mission.competency_tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded bg-och-steel/10 text-och-steel"
                      >
                        {tag}
                      </span>
                    ))}
                    {mission.competency_tags.length > 2 && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-och-steel/10 text-och-steel">
                        +{mission.competency_tags.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Time Estimate - Compact */}
                {mission.estimated_time_minutes && (
                  <div className="flex items-center gap-1.5 text-och-steel/70 text-xs">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{mission.estimated_time_minutes < 60 ? `${mission.estimated_time_minutes}m` : `${Math.floor(mission.estimated_time_minutes / 60)}h`}</span>
                  </div>
                )}
              </div>

              {/* Action Button - Compact */}
              <div className="px-3 pb-3 flex-shrink-0">
                <button
                  onClick={() => !mission.is_locked && onMissionClick(mission.id)}
                  disabled={mission.is_locked}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    mission.is_locked
                      ? 'bg-och-steel/10 text-och-steel/50 cursor-not-allowed'
                      : 'bg-och-defender text-white hover:bg-och-defender/90 active:scale-95'
                  }`}
                >
                  {mission.status === 'completed' ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </>
                  ) : mission.is_locked ? (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Locked
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      Start
                    </>
                  )}
                </button>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}