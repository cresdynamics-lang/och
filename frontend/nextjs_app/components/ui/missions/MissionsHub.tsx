/**
 * Missions Hub Component
 * Immersive command center for OCH students to manage their missions
 * Follows the OCH dark theme and hierarchical progression
 */
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  Target, 
  Shield, 
  Lock, 
  ChevronRight, 
  Search, 
  Filter,
  Flame,
  LayoutGrid,
  List,
  Sparkles,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  BarChart3,
  Rocket,
  ArrowUpRight,
  Hexagon,
  FileCode,
  AlertTriangle
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useMissions } from '@/app/dashboard/student/missions/hooks/useMissions'
import { MissionCardEnhanced } from '@/app/dashboard/student/missions/components/MissionCardEnhanced'
import { MissionViewEnhanced } from '@/app/dashboard/student/missions/components/MissionViewEnhanced'
import { RecipeSidebarEnhanced } from '@/app/dashboard/student/missions/components/RecipeSidebarEnhanced'
import type { Mission, MXPTier, MissionStatus } from '@/app/dashboard/student/missions/types'
import clsx from 'clsx'

export function MissionsHub() {
  const { funnel, missions } = useMissions()
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState<MXPTier>('beginner')
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter missions based on tier and search
  const filteredMissions = useMemo(() => {
    if (!missions.data) return []
    return missions.data.filter(m => {
      // Mapping tier IDs to mission difficulty
      const tierMap: Record<string, string[]> = {
        'beginner': ['beginner', 'foundation'],
        'intermediate': ['intermediate'],
        'advanced': ['advanced'],
        'mastery': ['mastery', 'expert'],
        'capstone': ['capstone']
      }
      
      const difficulty = m.difficulty?.toLowerCase() || 'beginner'
      const matchesTier = tierMap[selectedTier]?.includes(difficulty) || 
                          (selectedTier === 'beginner' && !m.difficulty)
      
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.competency_tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            m.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      
      return matchesTier && matchesSearch
    })
  }, [missions.data, selectedTier, searchQuery])

  const tiers = [
    { id: 'beginner', label: 'Tiers 1-2', sub: 'Foundations & Orientation', icon: Shield, locked: false, phase: 'Phase 2' },
    { id: 'intermediate', label: 'Tier 3', sub: 'Applied Capabilities', icon: Target, locked: false, phase: 'Phase 3' },
    { id: 'advanced', label: 'Tier 4', sub: 'Complex Workflows', icon: Zap, locked: true, phase: 'Phase 4' },
    { id: 'mastery', label: 'Tier 5', sub: 'Mastery & Capstone', icon: Award, locked: true, phase: 'Phase 5' },
  ] as const

  const readinessStats = [
    { label: 'Readiness Score', value: '742', trend: '+14', icon: BarChart3, color: 'text-och-mint' },
    { label: 'Skill Heatmap', value: '82%', icon: Rocket, color: 'text-och-defender' },
    { label: 'Approved Evidence', value: funnel.data?.approved || 0, icon: FileCode, color: 'text-och-gold' },
  ]

  return (
    <div className="space-y-8">
      
      {/* 1. MISSION CONTROL HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-och-defender/10 border border-och-defender/20 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-och-defender/5 animate-pulse group-hover:bg-och-defender/10 transition-colors" />
            <Hexagon className="w-8 h-8 text-och-defender relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Mission Control</h1>
              <Badge variant="defender" className="text-[10px] font-black tracking-widest px-2 py-0.5 animate-pulse">
                OPERATIONAL
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-och-steel text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-och-mint" />
                {funnel.data?.track_name || 'Defender'} Track 
              </p>
              <div className="h-4 w-px bg-och-steel/20" />
              <p className="text-och-steel text-xs font-black uppercase tracking-[0.2em]">
                {funnel.data?.cohort_name || 'Global Cohort'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
          {readinessStats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="flex-1 min-w-[200px] xl:min-w-[240px] px-6 py-4 rounded-2xl bg-och-steel/5 border border-och-steel/10 flex items-center gap-4 hover:border-och-steel/20 transition-all group">
                <div className={clsx("p-2.5 rounded-xl bg-current/10 transition-transform group-hover:scale-110", stat.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-och-steel font-black uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white leading-none">{stat.value}</span>
                    {stat.trend && (
                      <span className="text-[10px] text-och-mint font-bold flex items-center gap-0.5">
                        <ArrowUpRight className="w-2 h-2" />
                        {stat.trend}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 2. PROGRESSION SIDEBAR */}
        <aside className="lg:col-span-3 space-y-3 sticky top-24">
          <div className="flex items-center gap-2 mb-6 px-2">
            <Sparkles className="w-4 h-4 text-och-gold" />
            <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">Hierarchy: Progression Tiers</span>
          </div>
          
          <div className="space-y-2">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => !tier.locked && setSelectedTier(tier.id as MXPTier)}
                disabled={tier.locked}
                className={clsx(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                  selectedTier === tier.id 
                    ? "bg-och-defender/10 border-och-defender/40 text-white" 
                    : tier.locked 
                      ? "bg-transparent border-transparent opacity-30 cursor-not-allowed" 
                      : "bg-transparent border-transparent text-och-steel hover:bg-och-steel/5"
                )}
              >
                {selectedTier === tier.id && (
                  <motion.div 
                    layoutId="active-tier-glow"
                    className="absolute inset-0 bg-gradient-to-r from-och-defender/10 to-transparent"
                  />
                )}
                
                <div className={clsx(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all relative z-10",
                  selectedTier === tier.id 
                    ? "bg-och-defender text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                    : "bg-och-steel/10 group-hover:bg-och-steel/20"
                )}>
                  {tier.locked ? <Lock className="w-5 h-5" /> : <tier.icon className="w-5 h-5" />}
                </div>
                
                <div className="text-left flex-1 relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-black uppercase tracking-widest leading-none">{tier.label}</p>
                    <Badge variant="steel" className="text-[8px] py-0 px-1 opacity-70">{tier.phase}</Badge>
                  </div>
                  <p className="text-[10px] font-bold text-och-steel group-hover:text-slate-400 transition-colors">{tier.sub}</p>
                </div>
                
                {!tier.locked && (
                  <ChevronRight className={clsx(
                    "w-4 h-4 transition-all relative z-10", 
                    selectedTier === tier.id ? "translate-x-0 text-och-defender" : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                  )} />
                )}
              </button>
            ))}
          </div>

          {/* AI COACH INTELLIGENCE CARD */}
          <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-och-gold/20 to-transparent border border-och-gold/20 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Sparkles className="w-32 h-32 text-och-gold" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="gold" className="text-[8px] px-2 py-0.5 font-black tracking-widest">AI INTELLIGENCE</Badge>
                <div className="flex-1 h-px bg-och-gold/20" />
              </div>
              <h4 className="text-sm font-black text-white mb-2 uppercase tracking-tight">Recommended Intel</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-6 italic">
                "Based on your latest Log Analysis performance, I recommend 
                <span className="text-och-gold font-bold mx-1">MAL-04: Ransomware Triage</span> 
                to bridge your Gap in Behavioral Analysis."
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-[10px] font-black uppercase tracking-widest border-och-gold/30 text-och-gold hover:bg-och-gold hover:text-black transition-all"
              >
                Engage Mission
                <ArrowUpRight className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </div>

          {/* RECIPE ENGINE QUICK ACCESS */}
          <div 
            onClick={() => router.push('/dashboard/student/coaching/recipes')}
            className="mt-4 p-5 rounded-2xl bg-och-steel/5 border border-och-steel/10 flex items-center justify-between group cursor-pointer hover:border-och-mint/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-och-mint/10 text-och-mint">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-och-steel font-black uppercase tracking-widest">Recipe Engine</p>
                <p className="text-[11px] text-white font-bold">12 Active Boosters</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-och-steel group-hover:text-och-mint transition-colors" />
          </div>
        </aside>

        {/* 3. MISSION TERMINAL */}
        <main className="lg:col-span-9 space-y-8">
          {/* MISSION HALL ACCESS */}
          <div className="flex justify-end mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/student/missions/hall')}
              className="border-och-gold/30 text-och-gold hover:bg-och-gold hover:text-black transition-all duration-300 shadow-lg shadow-och-gold/10"
            >
              <Hexagon className="w-4 h-4 mr-2" />
              Mission Hall - All Director Missions
            </Button>
          </div>

          {/* TERMINAL BAR (Filters & Search) */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-och-midnight/50 p-4 rounded-3xl border border-och-steel/10 backdrop-blur-md shadow-2xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-och-steel" />
              <input 
                type="text" 
                placeholder="SEARCH MISSIONS, CODES, OR REQUIRED SKILLS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-och-midnight/80 border border-och-steel/20 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white placeholder:text-och-steel/50 focus:border-och-defender/50 outline-none transition-all shadow-inner uppercase tracking-wider"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-och-midnight/80 rounded-2xl border border-och-steel/20 p-1 shadow-inner">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    "p-2.5 rounded-xl transition-all", 
                    viewMode === 'grid' ? "bg-och-steel/20 text-white shadow-lg" : "text-och-steel hover:text-white"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    "p-2.5 rounded-xl transition-all", 
                    viewMode === 'list' ? "bg-och-steel/20 text-white shadow-lg" : "text-och-steel hover:text-white"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <Button variant="outline" className="border-och-steel/20 text-och-steel text-[10px] font-black uppercase tracking-widest h-[46px] px-6 rounded-2xl hover:border-och-defender transition-all">
                <Filter className="w-4 h-4 mr-2" />
                Filter Intel
              </Button>
            </div>
          </div>

          {/* MISSION DEPLOYMENT GRID */}
          {missions.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[320px] rounded-[2rem] bg-och-steel/5 animate-pulse border border-och-steel/10" />
              ))}
            </div>
          ) : filteredMissions.length > 0 ? (
            <div className={clsx(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                : "flex flex-col gap-4"
            )}>
              <AnimatePresence mode="popLayout">
                {filteredMissions.map((mission) => (
                  <motion.div
                    key={mission.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MissionCardEnhanced 
                      mission={mission} 
                      onClick={() => setSelectedMissionId(mission.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-och-steel/10 rounded-[3rem]">
              <div className="w-24 h-24 rounded-full bg-och-steel/5 flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border border-och-steel/10 animate-ping" />
                <AlertTriangle className="w-12 h-12 text-och-steel/30" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">No Active Missions</h3>
              <p className="text-och-steel text-sm max-w-md italic font-medium">
                "The current sector is clear. Adjust your filters or escalate to a higher progression tier to find new challenges."
              </p>
            </div>
          )}

          {/* RECENT FEEDBACK BAR */}
          <div className="mt-12 p-8 rounded-[2.5rem] bg-gradient-to-r from-och-midnight to-och-steel/5 border border-och-steel/10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-och-mint" />
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Mission Feedback Hub</h3>
              </div>
              <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest border-och-steel/20 h-8">
                View All Evidence
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-och-steel/10 hover:border-och-mint/20 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="mint" className="text-[9px] font-black">AI SCORED • 88%</Badge>
                  <span className="text-[10px] text-och-steel font-bold">2H AGO</span>
                </div>
                <h4 className="text-sm font-black text-white mb-2 uppercase tracking-wide group-hover:text-och-mint transition-colors">Log Analysis 101</h4>
                <p className="text-xs text-och-steel line-clamp-2">"Foundational correctness verified. Identified 4/5 threats. Improvement needed in TTP mapping."</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-och-steel/10 hover:border-och-defender/20 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="defender" className="text-[9px] font-black">MENTOR REVIEWED • PASS</Badge>
                  <span className="text-[10px] text-och-steel font-bold">1D AGO</span>
                </div>
                <h4 className="text-sm font-black text-white mb-2 uppercase tracking-wide group-hover:text-och-defender transition-colors">Ransomware Triage</h4>
                <p className="text-xs text-och-steel line-clamp-2">"Excellent evidence of professional response. Video walk-through was exceptionally clear."</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 4. IMMERSIVE OVERLAYS */}
      <AnimatePresence>
        {selectedMissionId && (
          <MissionOverlay 
            missionId={selectedMissionId} 
            onClose={() => setSelectedMissionId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Mission Overlay (Full Screen Immersive View)
 */
function MissionOverlay({ missionId, onClose }: { missionId: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-och-midnight/95 backdrop-blur-xl overflow-y-auto"
    >
      <div className="relative min-h-screen">
        {/* Close Header */}
        <div className="sticky top-0 z-10 w-full p-6 flex justify-between items-center bg-och-midnight/80 backdrop-blur-md border-b border-och-steel/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-och-defender/10 border border-och-defender/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-och-defender" />
            </div>
            <div>
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest leading-none mb-1">Mission Active</p>
              <h2 className="text-lg font-black text-white uppercase tracking-tighter">Analyzing Deployment Protocol</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-xl bg-och-steel/10 text-och-steel hover:bg-och-defender hover:text-white transition-all group"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
        </div>

        {/* Use the existing MissionViewEnhanced but styled for immersion */}
        <div className="max-w-[1400px] mx-auto p-8">
          <MissionViewEnhanced missionId={missionId} />
        </div>
      </div>
    </motion.div>
  )
}
