/**
 * Coaching Sidebar Component
 * Re-imagined as a "Mission Roadmap" that guides the student through their coaching journey
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Flame, 
  Target, 
  Sparkles, 
  BookOpen, 
  ChevronRight, 
  Layout, 
  Award,
  CircleDot,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RadialAlignment } from './RadialAlignment'
import { useCoachingStore } from '@/lib/coaching/store'
import clsx from 'clsx'

interface CoachingSidebarProps {
  onNavigate?: (section: 'overview' | 'habits' | 'goals' | 'reflect') => void
  activeSection?: string
}

export function CoachingSidebar({ onNavigate, activeSection = 'overview' }: CoachingSidebarProps) {
  const { metrics } = useCoachingStore()
  
  const roadmapSteps = [
    { id: 'overview', label: 'Mission Control', icon: Layout, status: 'current' },
    { id: 'habits', label: 'Core Habits', icon: Flame, status: 'todo' },
    { id: 'goals', label: 'Tactical Goals', icon: Target, status: 'todo' },
    { id: 'reflect', label: 'Insight Lab', icon: BookOpen, status: 'todo' },
  ] as const
  
  return (
      <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden lg:flex flex-col w-72 h-[calc(100vh-8rem)] sticky top-24 gap-8 pr-6"
      >
      {/* 1. Journey Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-4 h-4 text-och-gold" />
          <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">Growth Status</span>
        </div>
        <div className="p-6 rounded-2xl bg-och-steel/5 border border-och-steel/10 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
            <RadialAlignment score={metrics?.alignmentScore || 0} size="md" showLabel={false} />
          </div>
          <p className="text-2xl font-black text-white mb-1">{metrics?.alignmentScore || 0}%</p>
          <p className="text-[10px] text-och-steel uppercase tracking-widest font-bold">Identity Alignment</p>
          <div className="mt-4 w-full bg-och-steel/10 h-1 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics?.alignmentScore || 0}%` }}
              className="h-full bg-och-mint"
            />
          </div>
        </div>
        </div>
        
      {/* 2. Roadmap Navigation */}
      <nav className="flex-1 space-y-1">
        <div className="flex items-center gap-2 mb-4 px-2">
          <CircleDot className="w-4 h-4 text-och-defender" />
          <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">Mission Roadmap</span>
        </div>
        
        {roadmapSteps.map((step, idx) => {
          const isActive = activeSection === step.id
          const Icon = step.icon
          
          return (
            <button
              key={step.id}
              onClick={() => onNavigate?.(step.id)}
              className={clsx(
                "w-full group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
                isActive 
                  ? "bg-och-defender/10 border border-och-defender/30 text-white" 
                  : "text-och-steel hover:bg-och-steel/5 border border-transparent"
              )}
            >
              <div className="relative">
                {/* Vertical Line Connector */}
                {idx < roadmapSteps.length - 1 && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-och-steel/20" />
                )}
                <div className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  isActive ? "bg-och-defender text-white shadow-lg shadow-och-defender/20" : "bg-och-steel/10 text-och-steel group-hover:bg-och-steel/20"
                )}>
                  <Icon className="w-4 h-4" />
              </div>
              </div>
              <div className="flex-1 text-left">
                <p className={clsx(
                  "text-xs font-black uppercase tracking-widest",
                  isActive ? "text-white" : "text-och-steel group-hover:text-slate-300"
                )}>
                  {step.label}
                </p>
                {isActive && (
                  <motion.p 
                    layoutId="active-label"
                    className="text-[9px] text-och-mint font-bold italic"
                  >
                    Active Now
                  </motion.p>
                )}
              </div>
              {isActive && <ChevronRight className="w-3 h-3 text-och-defender" />}
            </button>
          )
        })}
      </nav>

      {/* 3. Daily Summary Footer */}
      <div className="mt-auto p-6 rounded-2xl bg-gradient-to-br from-och-orange/10 to-transparent border border-och-orange/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-och-orange/20 flex items-center justify-center">
            <Flame className="w-4 h-4 text-och-orange" />
            </div>
          <div>
            <p className="text-[10px] text-och-steel uppercase tracking-widest font-black">Daily Heat</p>
            <p className="text-sm font-black text-white">{(metrics as any)?.habits_streak || 0} Day Streak</p>
          </div>
        </div>
        <p className="text-[9px] text-och-steel italic">"The Defender tracks consistency. Your current momentum is prime."</p>
      </div>
    </motion.aside>
  )
}
