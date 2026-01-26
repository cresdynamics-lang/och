"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { 
  Flame, Crown, Users, MessageCircle, Award, 
  X, TrendingUp, Target, Zap, Trophy, Star,
  Heart, Share2, Copy, Check
} from "lucide-react"
import type { ReputationPublic, CommunityReputation } from "@/services/types/community"
import { LEVEL_THRESHOLDS, getLevelProgress } from "@/services/types/community"
import { cn } from "@/lib/utils"

interface ReputationProfileProps {
  userId: string
  onClose: () => void
  onFollow?: (userId: string) => void
  onMessage?: (userId: string) => void
}

// Badge display configuration
const badgeConfig: Record<string, { icon: string; label: string; color: string }> = {
  community_mentor: { icon: '👑', label: 'Community Mentor', color: 'from-amber-500 to-orange-500' },
  top_contributor: { icon: '🔥', label: 'Top Contributor', color: 'from-red-500 to-orange-500' },
  ama_host: { icon: '💬', label: 'AMA Host', color: 'from-blue-500 to-cyan-500' },
  squad_leader: { icon: '⭐', label: 'Squad Leader', color: 'from-purple-500 to-pink-500' },
  challenge_winner: { icon: '🏆', label: 'Challenge Winner', color: 'from-yellow-500 to-amber-500' },
  helpful_peer: { icon: '🤝', label: 'Helpful Peer', color: 'from-emerald-500 to-teal-500' },
  mission_master: { icon: '🎯', label: 'Mission Master', color: 'from-indigo-500 to-purple-500' },
  circle_climber: { icon: '📈', label: 'Circle Climber', color: 'from-green-500 to-emerald-500' },
}

// Level colors
const levelColors: Record<number, string> = {
  1: 'from-slate-400 to-slate-500',
  2: 'from-slate-400 to-slate-500',
  3: 'from-emerald-400 to-emerald-500',
  4: 'from-emerald-400 to-emerald-500',
  5: 'from-blue-400 to-blue-500',
  6: 'from-blue-400 to-blue-500',
  7: 'from-purple-400 to-purple-500',
  8: 'from-purple-400 to-purple-500',
  9: 'from-amber-400 to-orange-500',
  10: 'from-amber-400 via-orange-500 to-red-500',
}

export function ReputationProfile({ userId, onClose, onFollow, onMessage }: ReputationProfileProps) {
  const [profile, setProfile] = useState<ReputationPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/community/reputation/profile?user_id=${userId}`)
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${userId}`
    await navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    onFollow?.(userId)
  }

  if (loading || !profile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="w-full max-w-md mx-auto bg-slate-900 rounded-3xl p-8 animate-pulse">
          <div className="h-24 w-24 mx-auto bg-slate-800 rounded-3xl mb-4" />
          <div className="h-8 bg-slate-800 rounded-lg mb-2" />
          <div className="h-4 bg-slate-800 rounded-lg w-2/3 mx-auto" />
        </div>
      </motion.div>
    )
  }

  const levelProgress = getLevelProgress(profile.total_points, profile.level)
  const nextLevelPoints = LEVEL_THRESHOLDS[profile.level + 1] || profile.total_points
  const levelGradient = levelColors[profile.level] || levelColors[1]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md mx-auto"
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900/30 to-purple-900/30 border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/25">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-slate-800/80 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl" />
          </div>

          <div className="relative p-8 space-y-6">
            {/* Avatar & Level */}
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-24 h-24">
                <div className={cn(
                  "w-full h-full bg-gradient-to-r rounded-3xl p-1",
                  levelGradient
                )}>
                  <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profile.user_avatar} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-500">
                        {profile.user_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                
                {/* Level Badge */}
                <div className={cn(
                  "absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                  "bg-gradient-to-r",
                  levelGradient
                )}>
                  <span className="text-white font-black text-lg">
                    {profile.level}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-100 via-indigo-100 to-purple-100 bg-clip-text text-transparent">
                  {profile.user_name}
                </h2>
                {profile.university_name && (
                  <p className="text-sm text-slate-400 mt-1">
                    {profile.university_name}
                  </p>
                )}
              </div>

              {/* Points & Level Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Flame className={cn(
                    "w-5 h-5 fill-current",
                    profile.level >= 7 ? "text-amber-400" : "text-orange-400"
                  )} />
                  <span className="text-3xl font-black bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                    {profile.total_points.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-400">pts</span>
                </div>
                
                <div className="w-full max-w-xs mx-auto space-y-1">
                  <ProgressBar 
                    value={levelProgress} 
                    variant="defender"
                    showLabel={false}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Level {profile.level}</span>
                    {profile.level < 10 && (
                      <span>{nextLevelPoints - profile.total_points} to Level {profile.level + 1}</span>
                    )}
                  </div>
                </div>

                {profile.weekly_points > 0 && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-sm rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    +{profile.weekly_points} this week
                  </div>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="text-2xl font-bold text-indigo-400">{profile.posts_count}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Posts</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="text-2xl font-bold text-emerald-400">{profile.reactions_received}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Reactions</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="text-2xl font-bold text-purple-400">{profile.squads_led}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Squads Led</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="text-2xl font-bold text-amber-400">{profile.helpful_answers}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Helpful Answers</div>
              </div>
            </div>

            {/* Badges */}
            {profile.badges.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Achievements
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((badge, i) => {
                    const config = badgeConfig[badge] || { 
                      icon: '🏅', 
                      label: badge.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                      color: 'from-slate-500 to-slate-600'
                    }
                    return (
                      <motion.div
                        key={badge}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium",
                            "bg-gradient-to-r border-0 text-white shadow-lg",
                            config.color
                          )}
                        >
                          <span className="mr-1.5">{config.icon}</span>
                          {config.label}
                        </Badge>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Titles */}
            {profile.titles.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {profile.titles.map((title) => (
                  <span 
                    key={title}
                    className="px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-xs rounded-full"
                  >
                    <Crown className="w-3 h-3 inline mr-1" />
                    {title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleFollow}
                className={cn(
                  "flex-1 shadow-lg transition-all duration-300",
                  isFollowing
                    ? "bg-emerald-500/90 hover:bg-emerald-500 shadow-emerald-500/25"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/25"
                )}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onMessage?.(userId)}
                className="flex-1 border-slate-700/50 hover:bg-slate-800/50"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 w-12 h-12 hover:bg-slate-800/50"
                onClick={handleShare}
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Share2 className="w-5 h-5 text-slate-400" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}

