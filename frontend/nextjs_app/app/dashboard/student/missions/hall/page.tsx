/**
 * Mission Hall - Complete View of All Director-Defined Missions
 * Shows all missions without tier restrictions or filtering
 */
'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Search,
  Filter,
  LayoutGrid,
  List,
  ChevronRight,
  Hexagon,
  Crown,
  Trophy,
  Zap,
  Shield,
  Target,
  Award,
  Flame,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileCode,
  Rocket,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useMissions } from '../hooks/useMissions'
import { MissionCardEnhanced } from '../components/MissionCardEnhanced'
import { MissionViewEnhanced } from '../components/MissionViewEnhanced'
import { clsx } from 'clsx'

type MXPTier = 'beginner' | 'intermediate' | 'advanced' | 'mastery' | 'capstone'

export default function MissionHallPage() {
  const router = useRouter()
  const { missions, funnel } = useMissions()
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'code' | 'difficulty' | 'type'>('difficulty')

  // All missions from director - no filtering restrictions
  const allMissions = useMemo(() => {
    if (!missions.data) return []

    let filtered = missions.data.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.competency_tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            m.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesSearch
    })

    // Sort missions
    filtered.sort((a, b) => {
      if (sortBy === 'code') {
        return (a.code || '').localeCompare(b.code || '')
      } else if (sortBy === 'difficulty') {
        const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'capstone': 4 }
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
      } else if (sortBy === 'type') {
        return (a.mission_type || '').localeCompare(b.mission_type || '')
      }
      return 0
    })

    return filtered
  }, [missions.data, searchQuery, sortBy])

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return Shield
      case 'intermediate': return Target
      case 'advanced': return Zap
      case 'capstone': return Award
      default: return Shield
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'text-och-mint'
      case 'intermediate': return 'text-och-gold'
      case 'advanced': return 'text-och-defender'
      case 'capstone': return 'text-purple-400'
      default: return 'text-och-steel'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-steel/5 to-och-defender/5">
      <div className="container mx-auto px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/student/missions')}
              className="text-och-steel hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Mission Control
            </Button>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-8 h-8 text-och-gold" />
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Mission Hall</h1>
              <Badge variant="gold" className="text-[10px] font-black tracking-widest px-3 py-1">
                DIRECTOR'S VAULT
              </Badge>
            </div>
            <p className="text-och-steel text-sm font-bold uppercase tracking-wider">
              Complete Archive of All Program Director Missions
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest">Total Missions</p>
              <p className="text-2xl font-black text-och-gold">{missions.data?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* HALL CONTROLS */}
        <div className="bg-och-midnight/50 p-6 rounded-[2rem] border border-och-steel/10 backdrop-blur-md shadow-2xl mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">

            {/* SEARCH */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-och-steel" />
              <input
                type="text"
                placeholder="SEARCH ALL MISSIONS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-och-midnight/80 border border-och-steel/20 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-white placeholder:text-och-steel/50 focus:border-och-gold/50 outline-none transition-all uppercase tracking-wider"
              />
            </div>

            {/* SORT & VIEW CONTROLS */}
            <div className="flex items-center gap-4">

              {/* Sort */}
              <div className="flex bg-och-midnight/80 rounded-xl border border-och-steel/20 p-1 shadow-inner">
                <button
                  onClick={() => setSortBy('difficulty')}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                    sortBy === 'difficulty' ? "bg-och-gold text-black shadow-lg" : "text-och-steel hover:text-white"
                  )}
                >
                  Difficulty
                </button>
                <button
                  onClick={() => setSortBy('code')}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                    sortBy === 'code' ? "bg-och-gold text-black shadow-lg" : "text-och-steel hover:text-white"
                  )}
                >
                  Code
                </button>
                <button
                  onClick={() => setSortBy('type')}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                    sortBy === 'type' ? "bg-och-gold text-black shadow-lg" : "text-och-steel hover:text-white"
                  )}
                >
                  Type
                </button>
              </div>

              {/* View Mode */}
              <div className="flex bg-och-midnight/80 rounded-xl border border-och-steel/20 p-1 shadow-inner">
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    "p-2.5 rounded-lg transition-all",
                    viewMode === 'grid' ? "bg-och-steel/20 text-white shadow-lg" : "text-och-steel hover:text-white"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    "p-2.5 rounded-lg transition-all",
                    viewMode === 'list' ? "bg-och-steel/20 text-white shadow-lg" : "text-och-steel hover:text-white"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MISSION GRID */}
        {missions.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
              <div key={i} className="h-[400px] rounded-[2rem] bg-och-steel/5 animate-pulse border border-och-steel/10" />
            ))}
          </div>
        ) : allMissions.length > 0 ? (
          <div className={clsx(
            viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
              : "flex flex-col gap-4"
          )}>
            <AnimatePresence mode="popLayout">
              {allMissions.map((mission) => {
                const DifficultyIcon = getDifficultyIcon(mission.difficulty)
                return (
                  <motion.div
                    key={mission.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-och-midnight to-och-steel/5 border border-och-steel/10 hover:border-och-gold/30 transition-all duration-300 shadow-xl hover:shadow-och-gold/10">
                      {/* Mission Header */}
                      <div className="p-6 border-b border-och-steel/10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={clsx(
                              "w-12 h-12 rounded-xl flex items-center justify-center",
                              getDifficultyColor(mission.difficulty),
                              "bg-current/10"
                            )}>
                              <DifficultyIcon className="w-6 h-6" />
                            </div>
                            <div>
                              <Badge variant="steel" className="text-[8px] font-black tracking-widest mb-1">
                                {mission.code}
                              </Badge>
                              <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-och-gold transition-colors">
                                {mission.title}
                              </h3>
                            </div>
                          </div>
                          <Badge
                            variant={mission.difficulty === 'capstone' ? 'gold' : mission.difficulty === 'advanced' ? 'defender' : 'mint'}
                            className="text-[8px] font-black tracking-widest"
                          >
                            {mission.difficulty.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Mission Meta */}
                        <div className="flex items-center gap-4 text-xs text-och-steel font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Hexagon className="w-3 h-3" />
                            {mission.track_name || 'General'}
                          </span>
                          {mission.estimated_time && (
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {mission.estimated_time}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mission Content */}
                      <div className="p-6">
                        <p className="text-sm text-och-steel line-clamp-3 mb-4 italic">
                          {mission.brief || mission.description}
                        </p>

                        {/* Tags */}
                        {(mission.competency_tags || mission.tags) && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {(mission.competency_tags || mission.tags || []).slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="steel" className="text-[9px] font-bold">
                                {tag}
                              </Badge>
                            ))}
                            {((mission.competency_tags || mission.tags || []).length > 3) && (
                              <Badge variant="steel" className="text-[9px] font-bold">
                                +{((mission.competency_tags || mission.tags || []).length - 3)} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Status & Action */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {mission.status === 'approved' ? (
                              <CheckCircle2 className="w-4 h-4 text-och-mint" />
                            ) : mission.status === 'in_progress' ? (
                              <Rocket className="w-4 h-4 text-och-gold" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-och-steel" />
                            )}
                            <span className="text-xs font-black text-och-steel uppercase tracking-widest">
                              {mission.status.replace('_', ' ')}
                            </span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMissionId(mission.id)}
                            className="border-och-gold/30 text-och-gold hover:bg-och-gold hover:text-black transition-all text-[10px] font-black uppercase tracking-widest"
                          >
                            View Mission
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>

                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-och-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-och-steel/10 rounded-[3rem]">
            <div className="w-24 h-24 rounded-full bg-och-steel/5 flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 rounded-full border border-och-steel/10 animate-ping" />
              <AlertTriangle className="w-12 h-12 text-och-steel/30" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">No Missions Found</h3>
            <p className="text-och-steel text-sm max-w-md italic font-medium">
              "No missions match your search criteria. Try adjusting your filters or contact the program director."
            </p>
          </div>
        )}

        {/* MISSION OVERLAY */}
        <AnimatePresence>
          {selectedMissionId && (
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
                    <div className="w-10 h-10 rounded-xl bg-och-gold/10 border border-och-gold/20 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-och-gold" />
                    </div>
                    <div>
                      <p className="text-[10px] text-och-steel font-black uppercase tracking-widest leading-none mb-1">Mission Hall</p>
                      <h2 className="text-lg font-black text-white uppercase tracking-tighter">Director Mission Archive</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMissionId(null)}
                    className="p-3 rounded-xl bg-och-steel/10 text-och-steel hover:bg-och-defender hover:text-white transition-all group"
                  >
                    <ChevronRight className="w-6 h-6 rotate-180" />
                  </button>
                </div>

                {/* Mission View */}
                <div className="max-w-[1400px] mx-auto p-8">
                  <MissionViewEnhanced missionId={selectedMissionId} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
