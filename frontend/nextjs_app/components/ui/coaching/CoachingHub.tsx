/**
 * Coaching Hub Component
 * Main dashboard for Coaching OS - redesigned for immersive experience
 * Integrates AI Coach as a core navigation and guidance element
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HabitTracker } from './HabitTracker'
import { GoalsDashboard } from './GoalsDashboard'
import { ReflectionModal } from './ReflectionModal'
import { AICoachChat } from './AICoachChat'
import { RadialAlignment } from './RadialAlignment'
import { CoachingMetrics } from './CoachingMetrics'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useCoachingStore } from '@/lib/coaching/store'
import { 
  Brain, 
  Flame, 
  Target, 
  Sparkles, 
  BookOpen, 
  ChevronRight, 
  Zap,
  TrendingUp,
  Layout,
  MessageSquare,
  type LucideIcon
} from 'lucide-react'
import clsx from 'clsx'

type ActiveSection = 'overview' | 'habits' | 'goals' | 'reflect'

interface CoachingHubProps {
  activeSection: ActiveSection
  setActiveSection: (section: ActiveSection) => void
}

export function CoachingHub({ activeSection, setActiveSection }: CoachingHubProps) {
  const { metrics, habits, goals, reflections, loadAllData, isLoading, error } = useCoachingStore()
  const [reflectionModalOpen, setReflectionModalOpen] = useState(false)

  // Load coaching data on component mount
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Check if user has no data (new user)
  const isNewUser = metrics && metrics.alignmentScore === 0 &&
                    (!habits || habits.length === 0) &&
                    (!goals || goals.length === 0) &&
                    (!reflections || reflections.length === 0)

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-och-midnight p-4 lg:p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-och-defender border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-och-steel">Loading your Coaching OS...</p>
        </div>
      </div>
    )
  }

  // Show error state only for actual API errors, not empty data
  if (error && !metrics) {
    return (
      <div className="min-h-screen bg-och-midnight p-4 lg:p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-xl">⚠️</div>
          <p className="text-white">Failed to load coaching data</p>
          <p className="text-och-steel text-sm">{error}</p>
          <button
            onClick={loadAllData}
            className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-white hover:text-och-midnight transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  const navItems: Array<{ id: ActiveSection; label: string; icon: LucideIcon; color: string }> = [
    { id: 'overview', label: 'Mission Control', icon: Brain, color: 'text-indigo-400' },
    { id: 'habits', label: 'Habit Engine', icon: Flame, color: 'text-och-orange' },
    { id: 'goals', label: 'Goal Tracker', icon: Target, color: 'text-och-mint' },
    { id: 'reflect', label: 'Insight Lab', icon: BookOpen, color: 'text-och-gold' },
  ]
  
  return (
    <div className="min-h-screen bg-och-midnight p-4 lg:p-8 flex flex-col gap-8 overflow-x-hidden">
      
      {/* 1. Guided Navigation Bar (Mobile & Tablet) */}
      <nav className="lg:hidden flex items-center gap-2 p-1 bg-och-steel/5 border border-och-steel/10 rounded-2xl w-full sticky top-4 z-40 backdrop-blur-md overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = activeSection === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={clsx(
                "relative flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 flex-shrink-0",
                isActive ? "bg-och-defender text-white shadow-lg shadow-och-defender/20" : "text-och-steel hover:text-white"
              )}
            >
              <Icon className={clsx("w-4 h-4", isActive ? "text-white" : item.color)} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {item.label.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left/Main Column - 8 cols */}
        <div className="lg:col-span-8 space-y-8">
          
          <AnimatePresence mode="wait">
            {activeSection === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Hero Header - Different for new vs existing users */}
                <header className="relative p-8 rounded-3xl bg-gradient-to-br from-och-defender/20 via-transparent to-och-mint/5 border border-och-defender/30 overflow-hidden shadow-2xl shadow-och-defender/5">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Brain className="w-48 h-48 text-och-defender" />
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <RadialAlignment score={metrics?.alignmentScore || 0} size="lg" />
                    <div className="text-center md:text-left">
                      <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                        <Sparkles className="w-5 h-5 text-och-defender animate-glow-pulse" />
                        <span className="text-xs font-black text-och-defender uppercase tracking-[0.2em]">
                          {isNewUser ? 'Welcome Aboard' : 'Strategy Active'}
                        </span>
                      </div>
                      <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-4 leading-tight">
                        Coaching <span className="text-och-defender italic">OS</span>
                      </h1>
                      <p className="text-och-steel text-lg mb-6 max-w-md leading-relaxed">
                        {isNewUser ? (
                          <>Welcome to your Defender track! Your journey starts here. Let's build the habits and skills that will make you unstoppable in cybersecurity.</>
                        ) : (
                          <>Your Future-You alignment is at <span className="text-och-mint font-bold">{metrics?.alignmentScore || 0}%</span>.
                          Maintaining your <span className="text-och-orange font-bold">{metrics?.totalStreakDays || 0}-day streak</span> is today's priority.</>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        {isNewUser ? (
                          <>
                            <button
                              onClick={() => setActiveSection('habits')}
                              className="px-6 py-2.5 bg-och-defender text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-och-midnight transition-all shadow-lg shadow-och-defender/20"
                            >
                              Start with Habits
                            </button>
                            <button
                              onClick={() => setActiveSection('goals')}
                              className="px-6 py-2.5 bg-och-mint text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-och-midnight transition-all shadow-lg shadow-och-mint/20"
                            >
                              Set Your Goals
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setActiveSection('habits')}
                              className="px-6 py-2.5 bg-och-defender text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-och-midnight transition-all shadow-lg shadow-och-defender/20"
                            >
                              Execute Habits
                            </button>
                            <button
                              onClick={() => setReflectionModalOpen(true)}
                              className="px-6 py-2.5 bg-och-steel/10 text-och-steel text-xs font-black uppercase tracking-widest rounded-xl border border-och-steel/20 hover:border-och-gold hover:text-och-gold transition-all"
                            >
                              Reflect Lab
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </header>

                {/* Top Metrics Row */}
                {isNewUser ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Active Streak', value: `${(metrics as any)?.habits_streak || 14}d`, icon: Flame, color: 'text-och-orange' },
                    { label: 'Goals Meta', value: `${(metrics as any)?.goals_completed || 3}`, icon: Target, color: 'text-och-mint' },
                    { label: 'Reflections', value: `${(metrics as any)?.reflections_count || 12}`, icon: BookOpen, color: 'text-och-gold' },
                    { label: 'Circle Rank', value: 'Elite', icon: Sparkles, color: 'text-och-defender' },
                  ].map((stat, i) => (
                    <Card key={i} className="p-4 border-och-steel/10 bg-och-midnight/40 flex flex-col items-center text-center gap-2 group hover:border-och-defender/30 transition-all">
                      <stat.icon className={clsx("w-5 h-5", stat.color)} />
                      <div className="text-xl font-black text-white">{stat.value}</div>
                      <div className="text-[9px] text-och-steel uppercase font-bold tracking-widest">{stat.label}</div>
                    </Card>
                  ))}

                  {/* Defender Track Overview */}
                  <Card className="p-6 border-och-defender/30 bg-och-midnight/60 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="w-16 h-16 text-och-defender" />
                      </div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-och-defender/20 flex items-center justify-center border border-och-defender/30">
                          <Sparkles className="w-6 h-6 text-och-defender" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wider">Defender Track</h3>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm text-och-steel leading-relaxed">
                          As a Defender, you'll master cybersecurity defense, threat detection, and incident response.
                          Your path includes practical skills in monitoring, forensics, and security operations.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-och-steel/5 rounded-lg border border-och-steel/10">
                            <p className="text-xs font-black text-och-orange uppercase tracking-widest">Priority Skills</p>
                            <p className="text-xs text-och-steel mt-1">SIEM, Log Analysis, Threat Hunting</p>
                          </div>
                          <div className="p-3 bg-och-steel/5 rounded-lg border border-och-steel/10">
                            <p className="text-xs font-black text-och-mint uppercase tracking-widest">Key Habits</p>
                            <p className="text-xs text-och-steel mt-1">Daily Practice, CTF Challenges</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ) : (
                  /* Regular Metrics Row for Existing Users */
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Active Streak', value: `${metrics?.totalStreakDays || 0}d`, icon: Flame, color: 'text-och-orange' },
                      { label: 'Goals Meta', value: `${metrics?.completedGoals || 0}`, icon: Target, color: 'text-och-mint' },
                      { label: 'Reflections', value: `${metrics?.reflectionCount || 0}`, icon: BookOpen, color: 'text-och-gold' },
                      { label: 'Active Habits', value: `${metrics?.activeHabits || 0}`, icon: Sparkles, color: 'text-och-defender' },
                    ].map((stat, i) => (
                      <Card key={i} className="p-4 border-och-steel/10 bg-och-midnight/40 flex flex-col items-center text-center gap-2 group hover:border-och-defender/30 transition-all">
                        <stat.icon className={clsx("w-5 h-5", stat.color)} />
                        <div className="text-xl font-black text-white">{stat.value}</div>
                        <div className="text-[9px] text-och-steel uppercase font-bold tracking-widest">{stat.label}</div>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Habits Preview */}
                  <Card className="p-6 border-och-steel/20 bg-och-midnight/40 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Flame className="w-16 h-16 text-och-orange" />
                    </div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Flame className="w-4 h-4 text-och-orange" /> Habit Engine
                      </h3>
                      <button onClick={() => setActiveSection('habits')} className="text-och-steel hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {['Learn', 'Practice', 'Reflect'].map((habit, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-slate-300 font-medium">{habit}</span>
                          <div className={clsx(
                            "w-5 h-5 rounded-md border flex items-center justify-center",
                            i === 0 ? "bg-och-mint/20 border-och-mint text-och-mint" : "border-och-steel/30 text-transparent"
                          )}>
                            <TrendingUp className="w-3 h-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Goal Focus */}
                  <Card className="p-6 border-och-steel/20 bg-och-midnight/40 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Target className="w-16 h-16 text-och-mint" />
                    </div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Target className="w-4 h-4 text-och-mint" /> Active Goal
                      </h3>
                      <button onClick={() => setActiveSection('goals')} className="text-och-steel hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-white mb-2">Master SIEM Log Analysis</p>
                      <div className="w-full bg-och-steel/10 h-2 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-och-mint" />
                      </div>
                      <div className="flex justify-between text-[9px] text-och-steel font-bold uppercase tracking-widest">
                        <span>Progress</span>
                        <span>65%</span>
                      </div>
                    </div>
                  </Card>
        </div>
      </motion.div>
            )}

            {activeSection === 'habits' && (
              <motion.div
                key="habits"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-och-orange/10 flex items-center justify-center border border-och-orange/30">
                      <Flame className="w-6 h-6 text-och-orange" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-wider italic">Habit Engine</h2>
                  </div>
                  <Badge variant="orange" className="font-black tracking-[0.2em] animate-pulse">Efficiency: High</Badge>
                </div>
        <HabitTracker />
              </motion.div>
            )}

            {activeSection === 'goals' && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-och-mint/10 flex items-center justify-center border border-och-mint/30">
                      <Target className="w-6 h-6 text-och-mint" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-wider italic">Tactical Goals</h2>
                  </div>
                  <Badge variant="mint" className="font-black tracking-[0.2em]">Strategy: Aggressive</Badge>
                </div>
        <GoalsDashboard />
              </motion.div>
            )}

            {activeSection === 'reflect' && (
            <motion.div
                key="reflect"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-och-gold/10 flex items-center justify-center border border-och-gold/30">
                      <BookOpen className="w-6 h-6 text-och-gold" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-wider italic">Insight Lab</h2>
                  </div>
                </div>
                
                <Card className="p-12 text-center border-och-steel/20 bg-och-midnight/40 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-och-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="max-w-md mx-auto space-y-6 relative z-10">
                    <div className="w-20 h-20 rounded-2xl bg-och-gold/10 flex items-center justify-center mx-auto border-2 border-och-gold/30 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-10 h-10 text-och-gold" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Deep Reflection</h3>
                      <p className="text-och-steel text-sm leading-relaxed">
                        Capture your daily wins, blockers, and cognitive state. 
                        Your AI Coach uses this to recalibrate your next 24-hour mission plan.
                      </p>
                    </div>
              <Button
                variant="defender"
                size="lg"
                      className="w-full bg-och-gold text-och-midnight hover:bg-white font-black tracking-widest uppercase rounded-xl transition-all shadow-xl shadow-och-gold/10"
                onClick={() => setReflectionModalOpen(true)}
              >
                      Initialize Lab
              </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right/Side Column - 4 cols (AI Coach Presence) */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          
          {/* AI Coach Persona Card */}
          <Card className="border-och-defender/30 bg-och-midnight/60 backdrop-blur-xl overflow-hidden shadow-2xl shadow-och-defender/5 ring-1 ring-white/5">
            <div className="p-6 border-b border-och-steel/10 bg-gradient-to-r from-och-defender/10 to-transparent">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-och-defender to-och-mint p-0.5 animate-glow-pulse">
                    <div className="w-full h-full rounded-2xl bg-och-midnight flex items-center justify-center shadow-inner">
                      <Sparkles className="w-8 h-8 text-och-defender" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-och-mint border-2 border-och-midnight rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-white uppercase tracking-[0.2em] text-[10px]">Coaching AI</h3>
                    <Badge variant="defender" className="text-[8px] uppercase font-black px-1 leading-none h-4">v2.4-Active</Badge>
                  </div>
                  <p className="text-[10px] text-och-steel uppercase tracking-tighter font-bold italic leading-tight">
                    "Defender Archetype Strategy Engaged"
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Contextual Nudge */}
              <div className="p-3 rounded-2xl bg-och-steel/5 border border-och-steel/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
                  <Zap className="w-12 h-12 text-och-gold" />
                </div>
                <div className="flex items-center gap-2 mb-3 text-och-gold">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Strategy Insight</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed mb-4">
                  Consistency in <span className="text-och-mint font-bold">Log Analysis</span> is high. 
                  However, your <span className="text-och-orange font-bold">Practice habit</span> is at risk. 
                  Log it now to maintain your 92% alignment target.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveSection('habits')}
                    className="px-3 py-1.5 bg-och-defender/20 border border-och-defender/30 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-och-defender hover:text-white transition-all"
                  >
                    Fix Streak
                  </button>
                  <button className="px-3 py-1.5 bg-och-steel/10 text-och-steel text-[9px] font-black uppercase tracking-widest rounded-lg hover:text-white transition-all">
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Weekly Performance Graph Mock */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-och-steel uppercase tracking-widest font-black">Velocity Monitor</span>
                  <span className="text-[10px] text-och-mint font-bold">Trend: +12.4%</span>
                </div>
                <div className="flex items-end gap-2 h-16 px-1">
                  {[40, 60, 45, 80, 70, 90, 85].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className={clsx(
                        "flex-1 rounded-t-sm transition-all duration-500",
                        i === 6 ? "bg-och-mint shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-och-steel/20 hover:bg-och-steel/40"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Chat Interface (Inline instead of floating) */}
              <div className="pt-4 border-t border-och-steel/10">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-3 h-3 text-och-steel" />
                  <span className="text-[9px] font-black text-och-steel uppercase tracking-widest">Interactive Feed</span>
                </div>
                <AICoachChat isInline className="!w-full !h-[320px] !shadow-none !border-0 !bg-transparent" />
              </div>
          </div>
        </Card>
        </div>
      </div>
      
      {/* Reflection Modal */}
      <ReflectionModal
        isOpen={reflectionModalOpen}
        onClose={() => setReflectionModalOpen(false)}
      />
    </div>
  )
}
