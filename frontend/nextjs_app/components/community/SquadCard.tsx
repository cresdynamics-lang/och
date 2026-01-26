"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { 
  Users, Target, Trophy, Flame, 
  CheckCircle2, Loader2, Crown, Zap, Lock
} from "lucide-react"
import type { StudySquad } from "@/services/types/community"
import { cn } from "@/lib/utils"

interface SquadCardProps {
  squad: StudySquad
  onJoin: (squadId: string) => Promise<void>
  onLeave?: (squadId: string) => Promise<void>
  highlighted?: boolean
}

const circleColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
  2: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  3: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  4: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  5: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
}

export function SquadCard({ squad, onJoin, onLeave, highlighted = false }: SquadCardProps) {
  const [loading, setLoading] = useState(false)
  const isFull = squad.member_count >= squad.max_members
  const memberProgress = (squad.member_count / squad.max_members) * 100
  const circleStyle = squad.circle_level ? circleColors[squad.circle_level] || circleColors[1] : null

  const handleAction = async () => {
    setLoading(true)
    try {
      if (squad.is_member && onLeave) {
        await onLeave(squad.id)
      } else {
        await onJoin(squad.id)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-500",
      "bg-gradient-to-br from-slate-900/70 via-purple-900/20 to-pink-900/20",
      "border border-slate-800/50",
      "hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/25",
      highlighted && "ring-2 ring-purple-500/30 ring-offset-2 ring-offset-slate-900"
    )}>
      {/* Status Badges */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {!squad.is_open && (
          <div className="w-8 h-8 bg-slate-800/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
        )}
        {isFull && squad.is_open && (
          <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs">
            FULL
          </Badge>
        )}
      </div>

      <div className="pb-4 pt-6">
        <div className="flex items-start gap-3">
          {/* Squad Icon */}
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border"
            style={{ 
              backgroundColor: `${squad.color}20`,
              borderColor: `${squad.color}40`
            }}
          >
            {squad.icon || '👥'}
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-bold text-lg text-slate-100 truncate group-hover:text-white transition-colors">
              {squad.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {circleStyle && (
                <Badge 
                  variant="outline" 
                  className={cn("text-xs font-semibold", circleStyle.bg, circleStyle.text, circleStyle.border)}
                >
                  Circle {squad.circle_level}
                </Badge>
              )}
              {squad.track_key && (
                <Badge variant="outline" className="text-xs border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                  {squad.track_key}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Goal */}
        {squad.goal && (
          <div className="mt-3 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold mb-1">
              <Target className="w-3 h-3" />
              CURRENT GOAL
            </div>
            <p className="text-sm text-slate-300 line-clamp-2">
              {squad.goal}
            </p>
          </div>
        )}
      </div>

      <div className="pb-4 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-slate-800/30 rounded-xl">
            <div className="text-lg font-bold text-purple-400">{squad.total_points}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Points</div>
          </div>
          <div className="text-center p-2 bg-slate-800/30 rounded-xl">
            <div className="text-lg font-bold text-emerald-400">{squad.missions_completed}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Missions</div>
          </div>
          <div className="text-center p-2 bg-slate-800/30 rounded-xl">
            <div className="text-lg font-bold text-orange-400 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-current" />
              {squad.weekly_streak}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Streak</div>
          </div>
        </div>

        {/* Member Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-1">
              <Users className="w-4 h-4" />
              Members
            </span>
            <span className={cn(
              "font-semibold",
              isFull ? "text-orange-400" : "text-slate-300"
            )}>
              {squad.member_count}/{squad.max_members}
            </span>
          </div>
          <ProgressBar 
            value={memberProgress} 
            variant={isFull ? 'orange' : 'mint'}
            showLabel={false}
            className="h-2"
          />
        </div>

        {/* Members Preview */}
        {squad.members_preview && squad.members_preview.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {squad.members_preview.slice(0, 4).map((member, i) => (
                <Avatar 
                  key={member.id} 
                  className={cn(
                    "w-8 h-8 border-2 border-slate-900",
                    member.role === 'leader' && "ring-2 ring-amber-500/50"
                  )}
                >
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-xs">
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {squad.member_count > 4 && (
                <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs text-slate-400">
                  +{squad.member_count - 4}
                </div>
              )}
            </div>
            
            {/* Leader indicator */}
            {squad.members_preview.find(m => m.role === 'leader') && (
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Crown className="w-3 h-3" />
                <span className="truncate max-w-[80px]">
                  {squad.members_preview.find(m => m.role === 'leader')?.name}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-0 pb-6">
        <Button
          className={cn(
            "w-full h-12 font-semibold text-sm shadow-lg transition-all duration-300",
            squad.is_member
              ? "bg-emerald-500/90 hover:bg-emerald-500 shadow-emerald-500/25"
              : !squad.is_open || isFull
              ? "bg-slate-600 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/25"
          )}
          onClick={handleAction}
          disabled={loading || (!squad.is_open && !squad.is_member) || (isFull && !squad.is_member)}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {squad.is_member ? 'Leaving...' : 'Joining...'}
            </>
          ) : squad.is_member ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {squad.user_role === 'leader' ? (
                <>
                  <Crown className="w-4 h-4 mr-1" />
                  Squad Leader
                </>
              ) : (
                'Member'
              )}
            </>
          ) : !squad.is_open ? (
            'Closed'
          ) : isFull ? (
            'Squad Full'
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Join Squad
            </>
          )}
        </Button>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div 
          className="absolute inset-0 blur-3xl"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${squad.color}15, transparent 70%)`
          }}
        />
      </div>
    </Card>
  )
}

