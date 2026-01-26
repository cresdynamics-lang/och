'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Trophy,
  Sparkles,
  Target,
  Zap,
  Award,
  BookOpen,
  Share2,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

/**
 * MissionCompletionFlow Component
 * Tier 7 Mission Completion Screen
 * 
 * Displays:
 * - Score summary
 * - Recipe mastery achievements
 * - Portfolio auto-update notification
 * - Next recommended mission
 * - Completion stats
 */

interface MissionCompletionFlowProps {
  missionId: string
  missionTitle: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'capstone'
  aiScore?: number
  mentorScore?: number
  recipesCompleted?: string[]
  portfolioUpdated?: boolean
  nextMissionId?: string
  nextMissionTitle?: string
  completionTime?: number // in minutes
  subtasksCompleted?: number
  totalSubtasks?: number
}

export function MissionCompletionFlow({
  missionId,
  missionTitle,
  difficulty,
  aiScore,
  mentorScore,
  recipesCompleted = [],
  portfolioUpdated = true,
  nextMissionId,
  nextMissionTitle,
  completionTime,
  subtasksCompleted = 0,
  totalSubtasks = 0
}: MissionCompletionFlowProps) {
  const [showConfetti, setShowConfetti] = useState(true)
  const [finalScore, setFinalScore] = useState(0)

  useEffect(() => {
    // Calculate final score (average of AI and mentor scores)
    if (aiScore || mentorScore) {
      const score = Math.round(((aiScore || 0) + (mentorScore || 0)) / (aiScore && mentorScore ? 2 : 1))
      setFinalScore(score)
    }
  }, [aiScore, mentorScore])

  const getDifficultyConfig = (diff: string) => {
    switch (diff) {
      case 'beginner':
        return { color: 'text-och-mint', icon: Target }
      case 'intermediate':
        return { color: 'text-och-defender', icon: Zap }
      case 'advanced':
        return { color: 'text-och-orange', icon: Award }
      case 'capstone':
        return { color: 'text-och-gold', icon: Trophy }
      default:
        return { color: 'text-och-steel', icon: Target }
    }
  }

  const diffConfig = getDifficultyConfig(difficulty)
  const DiffIcon = diffConfig.icon

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 relative overflow-hidden py-8 px-4">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        {showConfetti && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -100, opacity: 1 }}
                animate={{ y: window.innerHeight + 100, opacity: 0 }}
                transition={{ duration: 3, delay: i * 0.2, ease: "easeIn" }}
                className="absolute left-1/2 w-2 h-2 bg-och-gold rounded-full"
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}
          </>
        )}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-8">
        {/* Success Header */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-och-gold/30 to-och-orange/30 border-2 border-och-gold mb-6 relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2 }}
              className="absolute inset-0 rounded-full border border-och-gold/20"
            />
            <CheckCircle2 className="w-10 h-10 text-och-gold relative z-10" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 uppercase tracking-tight">
            Mission <span className="text-och-gold">Complete</span>
          </h1>
          <p className="text-lg text-och-steel font-medium">{missionTitle}</p>
        </motion.div>

        {/* Score Section */}
        {(aiScore || mentorScore) && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-och-midnight/80 border border-och-gold/30 rounded-3xl p-8">
              <div className="text-center mb-6">
                <p className="text-och-steel font-black uppercase tracking-widest text-xs mb-4">
                  Performance Score
                </p>
                <div className="flex items-end justify-center gap-4 mb-6">
                  <div className="text-6xl font-black text-och-gold">{finalScore}</div>
                  <div className="text-2xl text-och-steel font-bold">/100</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {aiScore && (
                  <div className="bg-och-defender/10 rounded-2xl p-4 border border-och-defender/30">
                    <p className="text-och-steel text-xs font-black uppercase tracking-widest mb-2">AI Review</p>
                    <p className="text-2xl font-black text-och-defender">{aiScore}</p>
                  </div>
                )}
                {mentorScore && (
                  <div className="bg-och-orange/10 rounded-2xl p-4 border border-och-orange/30">
                    <p className="text-och-steel text-xs font-black uppercase tracking-widest mb-2">Mentor Score</p>
                    <p className="text-2xl font-black text-och-orange">{mentorScore}</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4"
        >
          {subtasksCompleted > 0 && (
            <Card className="bg-och-midnight/60 border border-och-mint/20 rounded-2xl p-4">
              <p className="text-och-steel text-xs font-black uppercase tracking-widest mb-2">Subtasks</p>
              <p className="text-xl font-black text-och-mint">{subtasksCompleted}/{totalSubtasks}</p>
            </Card>
          )}
          {completionTime && (
            <Card className="bg-och-midnight/60 border border-och-defender/20 rounded-2xl p-4">
              <p className="text-och-steel text-xs font-black uppercase tracking-widest mb-2">Time Spent</p>
              <p className="text-xl font-black text-och-defender">
                {Math.floor(completionTime / 60)}h {completionTime % 60}m
              </p>
            </Card>
          )}
          {recipesCompleted.length > 0 && (
            <Card className="bg-och-midnight/60 border border-och-orange/20 rounded-2xl p-4">
              <p className="text-och-steel text-xs font-black uppercase tracking-widest mb-2">Boosters Used</p>
              <p className="text-xl font-black text-och-orange">{recipesCompleted.length}</p>
            </Card>
          )}
          <Card className="bg-och-midnight/60 border border-och-gold/20 rounded-2xl p-4">
            <p className="text-och-steel text-xs font-black uppercase tracking-widest mb-2">Difficulty</p>
            <div className="flex items-center gap-2">
              <DiffIcon className={`w-4 h-4 ${diffConfig.color}`} />
              <p className={`text-sm font-black ${diffConfig.color}`}>{difficulty.toUpperCase()}</p>
            </div>
          </Card>
        </motion.div>

        {/* Portfolio Update Notification */}
        {portfolioUpdated && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-och-mint/20 to-och-defender/20 border border-och-mint/40 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-och-mint/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-och-mint" />
              </div>
              <div className="flex-1">
                <p className="font-black text-white uppercase tracking-tight mb-1">Portfolio Updated</p>
                <p className="text-sm text-och-steel">
                  Your mission artifacts and completion certificate have been automatically added to your portfolio.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recipe Mastery */}
        {recipesCompleted.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-och-midnight/80 border border-och-orange/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-och-orange" />
                <h3 className="font-black text-white uppercase tracking-tight">Micro-Skill Mastery</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {recipesCompleted.map((recipe, idx) => (
                  <Badge key={idx} variant="orange" className="rounded-full">
                    {recipe}
                  </Badge>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Next Mission */}
        {nextMissionId && nextMissionTitle && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-och-defender/10 to-och-gold/10 border border-och-gold/40 rounded-2xl p-6">
              <p className="text-och-steel text-xs font-black uppercase tracking-widest mb-3">Recommended Next</p>
              <h3 className="text-white font-black text-lg mb-4">{nextMissionTitle}</h3>
              <Link href={`/dashboard/student/missions/${nextMissionId}`}>
                <Button
                  className="w-full font-black uppercase tracking-widest"
                  variant="gold"
                >
                  Continue Mission Path
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Link href="/dashboard/student/portfolio">
            <Button
              className="w-full font-black uppercase tracking-widest"
              variant="defender"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              View Portfolio
            </Button>
          </Link>
          <Link href="/dashboard/student/missions">
            <Button
              className="w-full font-black uppercase tracking-widest"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              More Missions
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
