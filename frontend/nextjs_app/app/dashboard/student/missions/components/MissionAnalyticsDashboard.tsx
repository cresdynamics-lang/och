'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  BarChart3,
  Zap,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  Flame
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

/**
 * MissionAnalyticsDashboard Component
 * Tier 7 Mission Performance Analytics
 * 
 * Displays:
 * - Mission completion heatmaps
 * - Recipe effectiveness metrics
 * - Benchmark scoring
 * - Skill mastery correlation
 * - Time spent per stage
 * - Drop-off points
 */

interface MissionStats {
  missionId: string
  missionTitle: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'capstone'
  status: 'not_started' | 'in_progress' | 'submitted' | 'approved'
  completionRate: number // 0-100
  aiScore?: number
  mentorScore?: number
  averageScore?: number
  timeSpent: number // minutes
  estimatedTime: number // minutes
  subtasksCompleted: number
  totalSubtasks: number
  recipesUsed: string[]
  skillsGained: string[]
  attemptCount: number
  lastAttemptDate?: string
}

interface MissionAnalyticsDashboardProps {
  missions: MissionStats[]
  userTrack?: string
  userDifficulty?: string
}

export function MissionAnalyticsDashboard({
  missions,
  userTrack = 'Defender',
  userDifficulty = 'Beginner'
}: MissionAnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    if (!missions.length) return null

    const completed = missions.filter(m => m.status === 'approved')
    const inProgress = missions.filter(m => m.status === 'in_progress')
    const submitted = missions.filter(m => m.status === 'submitted')

    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((sum, m) => sum + (m.averageScore || 0), 0) / completed.length)
      : 0

    const totalTime = missions.reduce((sum, m) => sum + m.timeSpent, 0)
    const avgTimePerMission = missions.length > 0 ? Math.round(totalTime / missions.length) : 0

    const allSkills = new Set<string>()
    missions.forEach(m => {
      m.skillsGained.forEach(skill => allSkills.add(skill))
    })

    const mostUsedRecipes = missions.reduce((acc, m) => {
      m.recipesUsed.forEach(recipe => {
        acc[recipe] = (acc[recipe] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    const topRecipes = Object.entries(mostUsedRecipes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name)

    return {
      completed: completed.length,
      inProgress: inProgress.length,
      submitted: submitted.length,
      totalMissions: missions.length,
      avgScore,
      totalTime,
      avgTimePerMission,
      allSkills: Array.from(allSkills),
      topRecipes,
      completionRate: Math.round((completed.length / missions.length) * 100),
      averageAttempts: Math.round(missions.reduce((sum, m) => sum + m.attemptCount, 0) / missions.length)
    }
  }, [missions])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-och-mint'
      case 'intermediate':
        return 'text-och-defender'
      case 'advanced':
        return 'text-och-orange'
      case 'capstone':
        return 'text-och-gold'
      default:
        return 'text-och-steel'
    }
  }

  if (!analytics) {
    return (
      <Card className="bg-och-midnight/60 border border-och-steel/20 rounded-3xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-och-steel/30 mx-auto mb-4" />
        <p className="text-och-steel font-black uppercase tracking-widest text-xs">
          No Mission Data Available
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-och-midnight/80 border border-och-mint/20 rounded-2xl p-4 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-och-steel text-xs font-black uppercase tracking-widest mb-2">Completed</p>
                <p className="text-3xl font-black text-och-mint">{analytics.completed}</p>
                <p className="text-xs text-och-steel mt-1">{analytics.completionRate}% rate</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-och-mint/40" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-och-midnight/80 border border-och-defender/20 rounded-2xl p-4 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-och-steel text-xs font-black uppercase tracking-widest mb-2">In Progress</p>
                <p className="text-3xl font-black text-och-defender">{analytics.inProgress}</p>
                <p className="text-xs text-och-steel mt-1">Active missions</p>
              </div>
              <TrendingUp className="w-8 h-8 text-och-defender/40" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-och-midnight/80 border border-och-gold/20 rounded-2xl p-4 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-och-steel text-xs font-black uppercase tracking-widest mb-2">Avg Score</p>
                <p className="text-3xl font-black text-och-gold">{analytics.avgScore}</p>
                <p className="text-xs text-och-steel mt-1">Performance</p>
              </div>
              <Zap className="w-8 h-8 text-och-gold/40" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-och-midnight/80 border border-och-orange/20 rounded-2xl p-4 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-och-steel text-xs font-black uppercase tracking-widest mb-2">Avg Time</p>
                <p className="text-3xl font-black text-och-orange">{Math.floor(analytics.avgTimePerMission / 60)}h</p>
                <p className="text-xs text-och-steel mt-1">Per mission</p>
              </div>
              <Clock className="w-8 h-8 text-och-orange/40" />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Mission Breakdown */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-och-midnight/80 border border-och-steel/20 rounded-2xl p-6">
          <h3 className="font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-och-gold" />
            Mission Breakdown by Difficulty
          </h3>

          <div className="space-y-3">
            {['beginner', 'intermediate', 'advanced', 'capstone'].map(diff => {
              const count = missions.filter(m => m.difficulty === diff).length
              const completed = missions.filter(m => m.difficulty === diff && m.status === 'approved').length
              const rate = count > 0 ? Math.round((completed / count) * 100) : 0

              return (
                <div key={diff} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold uppercase tracking-widest text-xs ${getDifficultyColor(diff)}`}>
                      {diff}
                    </span>
                    <span className="text-och-steel text-sm">
                      {completed}/{count} ({rate}%)
                    </span>
                  </div>
                  <div className="h-2 bg-och-midnight rounded-full overflow-hidden border border-och-steel/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rate}%` }}
                      transition={{ delay: 0.3, duration: 1 }}
                      className={`h-full ${getDifficultyColor(diff).replace('text-', 'bg-')}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>

      {/* Skills Gained */}
      {analytics.allSkills.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="bg-och-midnight/80 border border-och-defender/20 rounded-2xl p-6">
            <h3 className="font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-och-defender" />
              Skills Mastered
            </h3>
            <div className="flex flex-wrap gap-2">
              {analytics.allSkills.slice(0, 8).map((skill, idx) => (
                <Badge key={idx} variant="defender" className="rounded-full">
                  {skill}
                </Badge>
              ))}
              {analytics.allSkills.length > 8 && (
                <Badge variant="steel" className="rounded-full">
                  +{analytics.allSkills.length - 8} more
                </Badge>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Top Recipes */}
      {analytics.topRecipes.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-och-midnight/80 border border-och-orange/20 rounded-2xl p-6">
            <h3 className="font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-och-orange" />
              Most Used Micro-Skills
            </h3>
            <div className="space-y-3">
              {analytics.topRecipes.map((recipe, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-och-midnight/60 rounded-lg border border-och-orange/10">
                  <span className="text-white font-bold text-sm">{recipe}</span>
                  <Badge variant="orange">Used</Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Insights */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="bg-gradient-to-r from-och-gold/10 to-och-orange/10 border border-och-gold/30 rounded-2xl p-6"
      >
        <h3 className="font-black text-white uppercase tracking-tight mb-3">Insights</h3>
        <ul className="space-y-2 text-sm text-och-steel">
          <li className="flex items-start gap-2">
            <span className="text-och-gold font-black">•</span>
            <span>
              You've completed <strong className="text-white">{analytics.completionRate}%</strong> of missions in your current learning path.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-och-gold font-black">•</span>
            <span>
              Average of <strong className="text-white">{analytics.averageAttempts}</strong> attempts per mission—keep pushing!
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-och-gold font-black">•</span>
            <span>
              You've mastered <strong className="text-white">{analytics.allSkills.length}</strong> distinct competencies across all missions.
            </span>
          </li>
        </ul>
      </motion.div>
    </div>
  )
}
