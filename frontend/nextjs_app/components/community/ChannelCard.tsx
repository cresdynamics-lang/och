"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { 
  Users, Flame, Crown, Hash, Lock, 
  MessageSquare, CheckCircle2, Loader2 
} from "lucide-react"
import type { Channel, ChannelListItem } from "@/services/types/community"
import { cn } from "@/lib/utils"

interface ChannelCardProps {
  channel: Channel | ChannelListItem
  onJoin: (channelId: string) => Promise<void>
  onLeave?: (channelId: string) => Promise<void>
  highlighted?: boolean
}

const channelTypeConfig: Record<string, { label: string; color: string }> = {
  track: { label: 'Track', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  project: { label: 'Project', color: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
  interest: { label: 'Interest', color: 'border-purple-500/30 bg-purple-500/10 text-purple-400' },
  study_group: { label: 'Study', color: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
  official: { label: 'Official', color: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' },
}

export function ChannelCard({ channel, onJoin, onLeave, highlighted = false }: ChannelCardProps) {
  const [loading, setLoading] = useState(false)
  const isFull = channel.member_count >= channel.member_limit
  const isFullChannel = 'reputation_leader' in channel
  const reputationLeader = isFullChannel ? (channel as Channel).reputation_leader : null
  const description = isFullChannel ? (channel as Channel).description : null
  const isMember = 'is_member' in channel ? channel.is_member : false

  const handleAction = async () => {
    setLoading(true)
    try {
      if (isMember && onLeave) {
        await onLeave(channel.id)
      } else {
        await onJoin(channel.id)
      }
    } finally {
      setLoading(false)
    }
  }

  const typeConfig = channelTypeConfig[channel.channel_type] || channelTypeConfig.interest

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-500",
      "bg-gradient-to-br from-slate-900/70 via-indigo-900/20 to-purple-900/20",
      "border border-slate-800/50",
      "hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/25",
      highlighted && "ring-2 ring-amber-500/30 ring-offset-2 ring-offset-slate-900"
    )}>
      {/* Private Badge */}
      {channel.is_private && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-8 h-8 bg-slate-800/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      )}

      <div className="pb-4 pt-6">
        <div className="flex items-start gap-3">
          {/* Channel Icon */}
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ 
              backgroundColor: `${channel.color}20`,
              borderColor: `${channel.color}40`,
              borderWidth: '1px'
            }}
          >
            {channel.icon || <Hash className="w-6 h-6" style={{ color: channel.color }} />}
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-bold text-lg text-slate-100 truncate group-hover:text-white transition-colors">
              {channel.name}
            </h3>
            <Badge 
              variant="outline" 
              className={cn("text-xs uppercase font-semibold", typeConfig.color)}
            >
              {typeConfig.label}
            </Badge>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-slate-400 line-clamp-2 mt-3">
            {description}
          </p>
        )}
      </div>

      <div className="pb-4 space-y-4">
        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-slate-400">
            <Users className="w-4 h-4" />
            <span className={cn(isFull && "text-orange-400 font-medium")}>
              {channel.member_count}/{channel.member_limit || '∞'}
            </span>
          </div>
          
          {isFullChannel && (channel as Channel).post_count > 0 && (
            <div className="flex items-center gap-1 text-slate-400">
              <MessageSquare className="w-4 h-4" />
              <span>{(channel as Channel).post_count}</span>
            </div>
          )}
        </div>

        {/* Reputation Leader */}
        {reputationLeader && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50"
          >
            <Avatar className="w-8 h-8 ring-2 ring-amber-500/30">
              <AvatarImage src={reputationLeader.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-amber-500/30 to-orange-500/30 text-amber-300">
                {reputationLeader.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-slate-200 truncate flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                {reputationLeader.name}
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Flame className="w-3 h-3 fill-current" />
                Lvl {reputationLeader.level} • {reputationLeader.points.toLocaleString()} pts
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="pt-0 pb-6">
        <Button
          className={cn(
            "w-full h-12 font-semibold text-sm shadow-lg transition-all duration-300",
            isMember
              ? "bg-emerald-500/90 hover:bg-emerald-500 shadow-emerald-500/25"
              : isFull
              ? "bg-slate-600 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/25"
          )}
          onClick={handleAction}
          disabled={loading || (isFull && !isMember)}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isMember ? 'Leaving...' : 'Joining...'}
            </>
          ) : isMember ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Member
            </>
          ) : isFull ? (
            'Channel Full'
          ) : (
            <>
              🚀 Join Channel
            </>
          )}
        </Button>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div 
          className="absolute inset-0 blur-3xl"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${channel.color}15, transparent 70%)`
          }}
        />
      </div>
    </Card>
  )
}

