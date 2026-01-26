/**
 * Redesigned Mission Card Component
 * Immersive, command-center style card for OCH Missions
 * Features radial progress, difficulty-aware glow, and skill-impact indicators
 */
'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Clock, 
  BookOpen, 
  Shield, 
  Zap, 
  Target, 
  Award, 
  Lock,
  ChevronRight,
  Flame,
  ArrowUpRight
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RadialProgress } from './shared/RadialProgress'
import { StatusBadge } from './shared/StatusBadge'
import { useMissionStore } from '@/lib/stores/missionStore'
import type { Mission } from '../types'
import clsx from 'clsx'

interface MissionCardEnhancedProps {
  mission: Mission & { gates?: any[]; warnings?: any[]; recipe_recommendations?: any[] }
  onClick?: () => void
  isDragging?: boolean
  provided?: any
}

export function MissionCardEnhanced({
  mission,
  onClick,
  isDragging = false,
  provided,
}: MissionCardEnhancedProps) {
  const router = useRouter()
  const { setCurrentMission } = useMissionStore()

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (mission.status === 'locked') {
      router.push('/dashboard/student/coaching')
      return
    }
    
    if (onClick) {
      onClick()
    } else {
    setCurrentMission(mission)
    router.push(`/dashboard/student/missions/${mission.id}`)
    }
  }
  
  const isLocked = mission.status === 'locked'
  const isCompleted = mission.status === 'approved'
  const isInProgress = mission.status === 'in_progress'

  const getDifficultyTheme = () => {
    switch (mission.difficulty) {
      case 'beginner':
        return { color: 'text-och-mint', border: 'border-och-mint/20', bg: 'bg-och-mint/5', icon: Shield }
      case 'intermediate':
        return { color: 'text-och-orange', border: 'border-och-orange/20', bg: 'bg-och-orange/5', icon: Target }
      case 'advanced':
        return { color: 'text-och-defender', border: 'border-och-defender/20', bg: 'bg-och-defender/5', icon: Zap }
      case 'capstone':
        return { color: 'text-och-gold', border: 'border-och-gold/20', bg: 'bg-och-gold/5', icon: Award }
      default:
        return { color: 'text-och-steel', border: 'border-och-steel/20', bg: 'bg-och-steel/5', icon: Shield }
    }
  }

  const theme = getDifficultyTheme()
  const Icon = isLocked ? Lock : theme.icon

  const cardContent = (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full"
    >
      <Card
        className={clsx(
          "h-full relative overflow-hidden group transition-all duration-500 rounded-[2rem] border backdrop-blur-sm",
          isLocked 
            ? "bg-och-midnight/40 border-och-steel/10 opacity-60 grayscale" 
            : clsx("bg-och-midnight/60", theme.border, "hover:shadow-[0_0_30px_-5px_rgba(0,0,0,0.3)] hover:bg-och-midnight/80"),
          isDragging ? "opacity-50" : ""
        )}
      >
        {/* PROGRESS GLOW (Top) */}
        <div 
          className={clsx(
            "absolute top-0 left-0 w-full h-1 transition-all duration-500",
            isCompleted ? "bg-och-mint" : isInProgress ? "bg-och-defender" : "bg-och-steel/20"
          )} 
        />
        
        <div className="p-6 flex flex-col h-full">
          {/* HEADER: Icon + Progress */}
          <div className="flex items-center justify-between mb-6">
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110", theme.bg, theme.border)}>
              <Icon className={clsx("w-5 h-5", theme.color)} />
            </div>
            
            {!isLocked && (
              <div className="relative">
            <RadialProgress
              percentage={mission.progress_percent || 0}
                  size={44}
              strokeWidth={4}
                  color={isCompleted ? '#10B981' : isInProgress ? '#ef4444' : '#64748b'}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-black text-white">{mission.progress_percent || 0}%</span>
              </div>
              </div>
            )}
          </div>

          {/* TITLE & CODE */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black text-och-steel uppercase tracking-[0.2em]">{mission.code || 'MSN-X'}</span>
              <Badge variant={mission.difficulty as any} className="text-[8px] px-1.5 py-0 font-black tracking-widest leading-none h-4 uppercase">
                {mission.difficulty}
              </Badge>
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight group-hover:text-och-mint transition-colors line-clamp-2 min-h-[2.5rem]">
              {mission.title}
            </h3>
          </div>

          {/* STORY PREVIEW */}
          <p className="text-xs text-och-steel font-medium mb-6 line-clamp-2 italic leading-relaxed">
            "{mission.description || 'Intel briefing pending classification...'}"
          </p>

          {/* META: Time & Recipes */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-och-steel" />
              <div>
                <p className="text-[8px] text-och-steel font-black uppercase tracking-widest leading-none mb-0.5">Estimated</p>
                <p className="text-[10px] text-white font-bold">{Math.ceil((mission.estimated_time_minutes || 60) / 60)}h remaining</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-och-orange" />
              <div>
                <p className="text-[8px] text-och-steel font-black uppercase tracking-widest leading-none mb-0.5">Boosters</p>
                <p className="text-[10px] text-white font-bold">{mission.recipe_recommendations?.length || 0} Recipes</p>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            {/* TAGS/SKILLS */}
            {(mission.competency_tags || mission.tags) && (mission.competency_tags || mission.tags).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(mission.competency_tags || mission.tags).slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-[8px] font-black text-och-mint uppercase tracking-widest px-2 py-0.5 bg-och-mint/10 rounded-full border border-och-mint/20">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* ACTION BUTTON */}
          <Button
              className={clsx(
                "w-full h-12 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group/btn",
              isLocked
                  ? "bg-och-steel/10 border-och-steel/20 text-och-steel cursor-not-allowed" 
                  : isCompleted
                    ? "bg-och-mint/10 border-och-mint/30 text-och-mint hover:bg-och-mint hover:text-black"
                    : "bg-och-defender text-white shadow-lg shadow-och-defender/20 hover:scale-[1.02] active:scale-[0.98]"
              )}
              onClick={handleAction}
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Unlock in Coaching OS
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Review Intel
                  </>
                ) : (
                  <>
                    {isInProgress ? 'Resume Deployment' : 'Deploy Mission'}
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </>
                )}
              </div>
          </Button>
          </div>
        </div>

        {/* LOCKED OVERLAY HINT */}
        {isLocked && mission.gates && mission.gates.length > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-och-midnight/40 backdrop-blur-[2px]">
             <div className="p-3 rounded-full bg-och-midnight border border-och-steel/20 mb-3 shadow-xl">
               <Lock className="w-6 h-6 text-och-steel" />
             </div>
             <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Sector Locked</p>
             <p className="text-[9px] text-och-steel font-bold italic">{mission.gates[0].message}</p>
          </div>
        )}
      </Card>
    </motion.div>
  )

  if (provided) {
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        {cardContent}
      </div>
    )
  }

  return cardContent
}

function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
    </svg>
  )
}
