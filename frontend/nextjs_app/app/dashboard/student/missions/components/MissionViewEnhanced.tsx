/**
 * Redesigned Mission View Component (Immersive View)
 * Integrated Command Center for Active Missions
 * Features 4-zone layout: Briefing, Terminal (Subtasks), Intelligence (Recipes), and Status
 */
'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Check, 
  AlertCircle, 
  ChevronLeft, 
  Clock, 
  Target, 
  Sparkles, 
  Rocket, 
  Save,
  Pause,
  Play,
  ArrowRight,
  Monitor,
  Hexagon
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TimerDisplay } from './shared/TimerDisplay'
import { SubtaskViewEnhanced } from './SubtaskViewEnhanced'
import { RecipeSidebarEnhanced } from './RecipeSidebarEnhanced'
import { MissionRecipeRecommendations } from '@/components/recipes/MissionRecipeRecommendations'
import { useMissionProgress } from '../hooks/useMissionProgress'
import { apiGateway } from '@/services/apiGateway'
import { useMissionStore } from '@/lib/stores/missionStore'
import type { Mission } from '../types'
import clsx from 'clsx'

interface MissionViewEnhancedProps {
  missionId: string
}

export function MissionViewEnhanced({ missionId }: MissionViewEnhancedProps) {
  const { currentMission, setCurrentMission, currentSubtask, setCurrentSubtask, setSubtasks } = useMissionStore()
  const [isPaused, setIsPaused] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const { isOffline, lastSaved } = useMissionProgress()

  const { data: missionData, isLoading } = useQuery<Mission>({
    queryKey: ['mission', missionId],
    queryFn: async () => {
      const response = await apiGateway.get<Mission>(`/student/missions/${missionId}`)
      return response
    },
  })

  useEffect(() => {
    if (missionData) {
      setCurrentMission(missionData)
      // If the mission has subtasks, load them into the store
      const missionSubtasks = (missionData as any).subtasks
      if (missionSubtasks && missionSubtasks.length > 0) {
        setSubtasks(missionSubtasks)
      } else {
        // Create mock subtasks if none exist for demo/compatibility
        setSubtasks([
          { id: 0, title: 'Tactical Reconnaissance', description: 'Analyze the sector for anomalies and persistent threats.' },
          { id: 1, title: 'Terminal Deployment', description: 'Configure the secure environment for payload analysis.' },
          { id: 2, title: 'Final Intelligence Commit', description: 'Synthesize findings and upload evidence to the command hub.' }
        ])
      }
      setTimeRemaining((missionData.estimated_time_minutes || 60) * 60)
    }
  }, [missionData, setCurrentMission, setSubtasks, missionId])

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-12">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-3xl border-4 border-och-defender/20 animate-spin" />
          <div className="absolute inset-4 rounded-2xl border-4 border-och-mint/40 animate-spin [animation-direction:reverse]" />
          <Hexagon className="absolute inset-0 m-auto w-8 h-8 text-och-defender animate-pulse" />
        </div>
        <p className="text-och-steel font-black uppercase tracking-[0.2em] text-sm animate-pulse">Initializing Terminal...</p>
      </div>
    )
  }

  if (!missionData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-12">
        <Card className="p-12 bg-och-midnight/60 border border-och-defender/30 rounded-[3rem] text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-och-defender mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Deployment Failed</h2>
          <p className="text-och-steel font-medium italic mb-8 leading-relaxed">"The requested mission parameters could not be established. Verification required."</p>
          <Button variant="defender" className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Return to Control</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 1. MISSION BRIEFING ZONE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 xl:p-12 bg-gradient-to-br from-och-midnight to-white/5 rounded-[2.5rem] border border-och-steel/10 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none select-none">
          <Rocket className="w-48 h-48 text-och-defender" />
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="defender" className="text-[10px] font-black tracking-widest px-3 py-1 bg-och-defender/20 border border-och-defender/30">
                ACTIVE DEPLOYMENT
              </Badge>
              <div className="h-4 w-px bg-och-steel/20" />
              <div className="flex items-center gap-2 text-och-steel text-[10px] font-black uppercase tracking-widest">
                <Monitor className="w-3 h-3" />
                Sector: {missionData.track?.toUpperCase() || 'CORE'}
              </div>
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-black text-white uppercase tracking-tighter mb-6 leading-none">
              {missionData.title}
            </h1>
            
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-och-steel/10 text-och-steel">
                  <Clock className="w-4 h-4" />
              </div>
                <div>
                  <p className="text-[9px] text-och-steel font-black uppercase tracking-widest leading-none mb-1">Time Elapsed</p>
          <TimerDisplay
            timeLeft={timeRemaining}
            isPaused={isPaused}
            onPause={() => setIsPaused(true)}
            onResume={() => setIsPaused(false)}
                    className="!p-0 !bg-transparent !border-0 font-black text-white text-base tracking-widest"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-och-mint/10 text-och-mint">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] text-och-steel font-black uppercase tracking-widest leading-none mb-1">Success Criteria</p>
                  <p className="text-base font-black text-white tracking-widest uppercase">
                    {missionData.objectives?.length || 0} Objectives
                  </p>
                </div>
        </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-och-gold/10 text-och-gold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] text-och-steel font-black uppercase tracking-widest leading-none mb-1">Expected Gain</p>
                  <p className="text-base font-black text-white tracking-widest uppercase">
                    +45 Readiness
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PAUSE / SAVE ACTIONS */}
          <div className="flex gap-2 w-full lg:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 lg:flex-none h-14 px-8 rounded-2xl border-och-steel/20 bg-och-midnight/40 text-och-steel font-black uppercase tracking-widest hover:border-white transition-all"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
              {isPaused ? 'RESUME' : 'PAUSE'}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 lg:flex-none h-14 px-8 rounded-2xl border-och-mint/20 bg-och-mint/5 text-och-mint font-black uppercase tracking-widest hover:bg-och-mint hover:text-black transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              SYNC PROGRESS
            </Button>
          </div>
        </div>

        {/* RECIPE RECOMMENDATIONS - Before mission description */}
        <div className="mt-8 relative z-10">
          <MissionRecipeRecommendations missionId={missionId} />
        </div>

        {/* MISSION BRIEF CONTENT */}
        <div className="mt-12 grid grid-cols-1 xl:grid-cols-2 gap-12 relative z-10">
          <div className="space-y-6">
            <h4 className="text-xs font-black text-och-steel uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-och-defender animate-pulse" />
              Strategic Intel Briefing
            </h4>
            <p className="text-slate-300 text-sm font-medium leading-relaxed italic border-l-2 border-och-defender/30 pl-6 py-2">
              "{missionData.description}"
            </p>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-xs font-black text-och-steel uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-och-mint" />
              Operational Objectives
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {missionData.objectives?.map((obj, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-och-steel/5 hover:border-och-mint/30 transition-all group">
                   <div className="w-6 h-6 rounded-lg bg-och-midnight/80 border border-och-steel/20 flex items-center justify-center group-hover:bg-och-mint group-hover:text-black transition-all">
                      <Check className="w-3.5 h-3.5" />
                   </div>
                   <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">{obj}</span>
                </div>
              ))}
                  </div>
          </div>
        </div>
      </motion.div>

      {/* 2. OPERATIONAL TERMINAL (4-Zone Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[700px]">
        {/* LEFT: SUBTASK TERMINAL (70%) */}
        <div className="lg:col-span-8">
          <SubtaskViewEnhanced missionId={missionId} />
        </div>

        {/* RIGHT: INTELLIGENCE & RECIPES (30%) */}
        <div className="lg:col-span-4 space-y-8 flex flex-col">
          {/* SKILL HEATMAP PREVIEW */}
          <Card className="p-8 rounded-[2.5rem] bg-gradient-to-br from-och-midnight to-och-defender/5 border border-och-steel/10 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-och-steel uppercase tracking-widest flex items-center gap-2">
                <Target className="w-3 h-3 text-och-defender" /> Skill Alignment
              </h4>
              <Badge variant="defender" className="text-[8px] font-black">+12% VELOCITY</Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                 <div className="absolute inset-0 rounded-full border-4 border-och-steel/10" />
                 <div className="absolute inset-0 rounded-full border-4 border-och-defender border-t-transparent animate-spin-slow" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-black text-white">82%</span>
                 </div>
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-white font-black uppercase tracking-tight mb-1">Threat Hunting Proficiency</p>
                <div className="w-full h-1.5 bg-och-steel/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '82%' }}
                    className="h-full bg-och-defender shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  />
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-och-steel font-medium italic leading-relaxed">
              "This mission targets your Behavioral Analysis gap. Completion will synchronize your Readiness Score to 750+."
            </p>
          </Card>

          {/* RECIPE ENGINE (MICRO-BOOSTERS) */}
          <RecipeSidebarEnhanced
            recipeIds={missionData.recipe_recommendations || ['rec-01', 'rec-02']}
            className="flex-1"
          />
        </div>
      </div>

      {/* OFFLINE / AUTO-SAVE INDICATORS */}
      <AnimatePresence>
      {isOffline && (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-och-orange/90 backdrop-blur-md text-black rounded-full shadow-2xl flex items-center gap-3 z-50 border border-white/20"
        >
            <Shield className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">OFFLINE MODE • LOCAL SYNC ACTIVE</span>
        </motion.div>
      )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: lastSaved ? 0.6 : 0 }}
        className="fixed bottom-8 right-8 flex items-center gap-2 text-[8px] font-black text-och-steel uppercase tracking-widest z-50 bg-och-midnight/80 px-3 py-1.5 rounded-full border border-och-steel/10 backdrop-blur-md"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-och-mint animate-pulse" />
        MISSION TELEMETRY ENCRYPTED & SAVED
      </motion.div>
    </div>
  )
}
