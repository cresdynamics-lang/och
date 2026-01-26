'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  User,
  Star,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Award,
  TrendingUp,
  BookOpen,
  Clock,
  FileText
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'

/**
 * MentorReviewSection Component
 * Tier 7 Mentor Review System
 * 
 * Features:
 * - Mentor feedback display per subtask
 * - Rubric scoring
 * - Competency assessment
 * - Recipe recommendations from mentor
 * - Resubmission tracking
 */

interface MentorComment {
  subtaskId: string
  subtaskTitle: string
  comment: string
  score?: number
  recommendedRecipes?: string[]
  timestamp?: string
}

interface RubricScore {
  category: string
  score: number
  maxScore: number
  feedback: string
}

interface MentorReviewData {
  mentorId: string
  mentorName: string
  mentorTitle?: string
  mentorAvatar?: string
  overallScore: number
  maxScore: number
  status: 'pending' | 'approved' | 'changes_requested' | 'rejected'
  comments: MentorComment[]
  rubricScores: RubricScore[]
  generalFeedback: string
  recommendedRecipes?: string[]
  resubmissionAllowed: boolean
  reviewDate?: string
}

interface MentorReviewSectionProps {
  progressId: string
  missionId: string
  userTier?: string
}

export function MentorReviewSection({
  progressId,
  missionId,
  userTier = '$7-premium'
}: MentorReviewSectionProps) {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  // Fetch mentor review
  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['mentor-review', progressId],
    queryFn: async () => {
      try {
        const response = await apiGateway.get<MentorReviewData>(
          `/student/missions/${missionId}/mentor-review`
        )
        return response
      } catch (err) {
        console.error('Failed to fetch mentor review:', err)
        return null
      }
    },
    refetchInterval: 5000, // Poll until review is complete
  })

  // Premium tier check
  if (userTier !== '$7-premium') {
    return (
      <Card className="bg-och-midnight/80 border border-och-orange/30 rounded-2xl p-6">
        <div className="text-center space-y-4">
          <Star className="w-12 h-12 text-och-orange mx-auto" />
          <h3 className="font-black text-white uppercase tracking-tight">Mentor Review</h3>
          <p className="text-och-steel text-sm">
            Unlock human mentor feedback by upgrading to our Premium tier.
          </p>
          <Button variant="orange">Upgrade to Premium</Button>
        </div>
      </Card>
    )
  }

  if (isLoading || !reviewData) {
    return (
      <Card className="bg-och-midnight/60 border border-och-steel/20 rounded-2xl p-8">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Clock className="w-8 h-8 text-och-defender mx-auto" />
          </motion.div>
          <p className="text-och-steel font-black uppercase tracking-widest text-xs">
            Awaiting Mentor Review
          </p>
          <p className="text-och-steel text-sm">
            Your submission is in the queue. Mentors typically review within 48 hours.
          </p>
        </div>
      </Card>
    )
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { icon: CheckCircle2, color: 'text-och-mint', bgColor: 'bg-och-mint/10', label: 'Approved' }
      case 'changes_requested':
        return { icon: AlertCircle, color: 'text-och-orange', bgColor: 'bg-och-orange/10', label: 'Changes Requested' }
      case 'rejected':
        return { icon: AlertCircle, color: 'text-och-defender', bgColor: 'bg-och-defender/10', label: 'Resubmit Required' }
      case 'pending':
      default:
        return { icon: Clock, color: 'text-och-gold', bgColor: 'bg-och-gold/10', label: 'Under Review' }
    }
  }

  const statusConfig = getStatusConfig(reviewData.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className={`${statusConfig.bgColor} border-2 rounded-2xl p-6`} style={{ borderColor: statusConfig.color }}>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-och-midnight/60 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-och-steel" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-white uppercase tracking-tight">
                {reviewData.mentorName}
                {reviewData.mentorTitle && <span className="text-och-steel font-bold"> — {reviewData.mentorTitle}</span>}
              </h3>
              {reviewData.reviewDate && (
                <p className="text-sm text-och-steel">Reviewed on {new Date(reviewData.reviewDate).toLocaleDateString()}</p>
              )}
            </div>
            <div className={`flex items-center gap-2 ${statusConfig.color}`}>
              <StatusIcon className="w-5 h-5" />
              <span className="font-black text-sm uppercase tracking-widest">{statusConfig.label}</span>
            </div>
          </div>

          {/* Overall Score */}
          <div className="flex items-center gap-4 pt-4 border-t border-och-steel/20">
            <div>
              <p className="text-och-steel text-xs font-black uppercase tracking-widest mb-1">Overall Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-och-gold">{reviewData.overallScore}</span>
                <span className="text-och-steel">/ {reviewData.maxScore}</span>
              </div>
            </div>
            <div className="flex-1 h-2 bg-och-midnight rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(reviewData.overallScore / reviewData.maxScore) * 100}%` }}
                transition={{ delay: 0.3, duration: 1 }}
                className="h-full bg-gradient-to-r from-och-mint to-och-gold"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* General Feedback */}
      {reviewData.generalFeedback && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-och-midnight/80 border border-och-steel/20 rounded-2xl p-6">
            <h4 className="font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-och-orange" />
              Mentor Feedback
            </h4>
            <p className="text-och-steel leading-relaxed whitespace-pre-wrap">
              {reviewData.generalFeedback}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Rubric Scores */}
      {reviewData.rubricScores && reviewData.rubricScores.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-och-midnight/80 border border-och-defender/20 rounded-2xl p-6">
            <h4 className="font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-och-defender" />
              Competency Assessment
            </h4>

            <div className="space-y-4">
              {reviewData.rubricScores.map((rubric, idx) => (
                <motion.div
                  key={idx}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{rubric.category}</span>
                    <Badge variant="defender">
                      {rubric.score}/{rubric.maxScore}
                    </Badge>
                  </div>
                  <div className="h-2 bg-och-midnight rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(rubric.score / rubric.maxScore) * 100}%` }}
                      transition={{ delay: 0.2 + idx * 0.05, duration: 1 }}
                      className="h-full bg-och-defender"
                    />
                  </div>
                  {rubric.feedback && (
                    <p className="text-sm text-och-steel italic">{rubric.feedback}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Per-Subtask Comments */}
      {reviewData.comments && reviewData.comments.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-och-midnight/80 border border-och-orange/20 rounded-2xl p-6">
            <h4 className="font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-och-orange" />
              Detailed Comments
            </h4>

            <div className="space-y-4">
              {reviewData.comments.map((comment, idx) => (
                <motion.div
                  key={idx}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  className="bg-och-midnight/60 rounded-xl border border-och-orange/10 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      const newSet = new Set(expandedComments)
                      if (newSet.has(comment.subtaskId)) {
                        newSet.delete(comment.subtaskId)
                      } else {
                        newSet.add(comment.subtaskId)
                      }
                      setExpandedComments(newSet)
                    }}
                    className="w-full p-4 text-left hover:bg-och-midnight/80 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-white">{comment.subtaskTitle}</p>
                      {comment.score !== undefined && (
                        <Badge variant="orange" className="mt-2">
                          Score: {comment.score}/100
                        </Badge>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: expandedComments.has(comment.subtaskId) ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-5 h-5 text-och-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedComments.has(comment.subtaskId) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-och-orange/10 p-4 bg-och-midnight/40"
                      >
                        <p className="text-och-steel whitespace-pre-wrap mb-4">{comment.comment}</p>

                        {comment.recommendedRecipes && comment.recommendedRecipes.length > 0 && (
                          <div>
                            <p className="text-och-orange font-bold text-sm mb-2 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              Recommended Micro-Skills
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {comment.recommendedRecipes.map((recipe, ridx) => (
                                <Badge key={ridx} variant="orange" className="rounded-full">
                                  {recipe}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recommended Next Steps */}
      {reviewData.recommendedRecipes && reviewData.recommendedRecipes.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-gradient-to-br from-och-mint/10 to-och-defender/10 border border-och-mint/30 rounded-2xl p-6">
            <h4 className="font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-och-mint" />
              Next Learning Boosters
            </h4>
            <p className="text-och-steel text-sm mb-4">
              Your mentor recommends focusing on these micro-skills to improve your competency:
            </p>
            <div className="flex flex-wrap gap-2">
              {reviewData.recommendedRecipes.map((recipe, idx) => (
                <Badge key={idx} variant="mint" className="rounded-full">
                  {recipe}
                </Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Resubmission Option */}
      {reviewData.resubmissionAllowed && reviewData.status !== 'approved' && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-och-orange/10 border border-och-orange/30 rounded-2xl p-6">
            <p className="text-och-steel mb-4">
              You can resubmit your mission evidence after addressing the mentor's feedback.
            </p>
            <Button variant="orange" className="font-black uppercase tracking-widest">
              Resubmit Mission
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
