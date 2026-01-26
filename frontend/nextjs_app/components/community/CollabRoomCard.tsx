"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { 
  Users, Trophy, Calendar, Clock, Swords, 
  CheckCircle2, Loader2, MapPin, Globe, Lock
} from "lucide-react"
import type { CollabRoom, CollabRoomListItem } from "@/services/types/community"
import { cn } from "@/lib/utils"

interface CollabRoomCardProps {
  room: CollabRoom | CollabRoomListItem
  onJoin?: (roomId: string) => Promise<void>
  onViewDetails?: (roomId: string) => void
  compact?: boolean
}

const roomTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  ctf: { label: 'CTF Challenge', icon: '🏴', color: 'from-red-500 to-orange-500' },
  hackathon: { label: 'Hackathon', icon: '💻', color: 'from-purple-500 to-pink-500' },
  project: { label: 'Project', icon: '🚀', color: 'from-blue-500 to-cyan-500' },
  debate: { label: 'Debate', icon: '🎤', color: 'from-amber-500 to-yellow-500' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-500/20 text-slate-400' },
  upcoming: { label: 'Upcoming', color: 'bg-blue-500/20 text-blue-400' },
  active: { label: 'Live Now', color: 'bg-emerald-500/20 text-emerald-400 animate-pulse' },
  completed: { label: 'Completed', color: 'bg-slate-500/20 text-slate-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400' },
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

function formatTimeUntil(dateString: string): string {
  const now = new Date()
  const target = new Date(dateString)
  const diffMs = target.getTime() - now.getTime()
  
  if (diffMs < 0) return 'Started'
  
  const diffDays = Math.floor(diffMs / 86400000)
  const diffHours = Math.floor((diffMs % 86400000) / 3600000)
  
  if (diffDays > 0) return `${diffDays}d ${diffHours}h`
  if (diffHours > 0) return `${diffHours}h`
  
  const diffMins = Math.floor((diffMs % 3600000) / 60000)
  return `${diffMins}m`
}

export function CollabRoomCard({ room, onJoin, onViewDetails, compact = false }: CollabRoomCardProps) {
  const [loading, setLoading] = useState(false)
  
  const isFullRoom = 'universities' in room
  const universities = isFullRoom ? (room as CollabRoom).universities : []
  const universityCount = 'university_count' in room ? room.university_count : universities.length
  const isParticipant = isFullRoom && (room as CollabRoom).is_participant
  
  const typeConfig = roomTypeConfig[room.room_type] || roomTypeConfig.project
  const status = statusConfig[room.status] || statusConfig.upcoming
  
  const isUpcoming = room.status === 'upcoming'
  const isActive = room.status === 'active'
  
  const handleJoin = async () => {
    if (!onJoin) return
    setLoading(true)
    try {
      await onJoin(room.id)
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <Card 
        className="group cursor-pointer bg-slate-900/70 border-slate-800/50 hover:border-indigo-500/50 transition-all"
        onClick={() => onViewDetails?.(room.id)}
      >
        <div className="p-4 flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-xl",
            `bg-gradient-to-br ${typeConfig.color} shadow-lg`
          )}>
            {typeConfig.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-100 truncate">{room.name}</h4>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>{universityCount} universities</span>
              <span>•</span>
              <span>{room.participant_count} participants</span>
            </div>
          </div>
          
          <Badge className={status.color}>
            {status.label}
          </Badge>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-500",
      "bg-gradient-to-br from-slate-900/70 via-indigo-900/20 to-purple-900/20",
      "border border-slate-800/50",
      "hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/25",
      isActive && "ring-2 ring-emerald-500/30"
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br",
          typeConfig.color
        )} />
      </div>

      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge className={cn("font-semibold", status.color)}>
          {isActive && <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1.5 animate-pulse" />}
          {status.label}
        </Badge>
      </div>

      <div className="pb-4 pt-6 relative">
        <div className="flex items-start gap-4">
          {/* Room Icon */}
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg",
            `bg-gradient-to-br ${typeConfig.color}`
          )}>
            {typeConfig.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl text-slate-100 mb-1">
              {room.name}
            </h3>
            <Badge variant="outline" className="text-xs">
              {typeConfig.label}
            </Badge>
          </div>
        </div>

        {isFullRoom && (room as CollabRoom).description && (
          <p className="text-sm text-slate-400 line-clamp-2 mt-3">
            {(room as CollabRoom).description}
          </p>
        )}
      </div>

      <div className="pb-4 space-y-4 relative">
        {/* Participating Universities */}
        {universities.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Swords className="w-3 h-3" />
              Competing Universities
            </div>
            <div className="flex flex-wrap gap-2">
              {universities.slice(0, 4).map((uni) => (
                <div 
                  key={uni.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50"
                >
                  {uni.logo_url && (
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={uni.logo_url} />
                      <AvatarFallback className="text-[8px]">{uni.code}</AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-sm text-slate-200 font-medium">{uni.short_name || uni.code}</span>
                </div>
              ))}
              {universities.length > 4 && (
                <div className="px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <span className="text-sm text-slate-400">+{universities.length - 4} more</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-slate-800/30 rounded-xl">
            <div className="text-xl font-bold text-indigo-400">{universityCount}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Universities</div>
          </div>
          <div className="text-center p-3 bg-slate-800/30 rounded-xl">
            <div className="text-xl font-bold text-purple-400">{room.participant_count}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Participants</div>
          </div>
          <div className="text-center p-3 bg-slate-800/30 rounded-xl">
            <div className="text-xl font-bold text-emerald-400">
              {isUpcoming || isActive ? formatTimeUntil(room.starts_at) : '-'}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
              {isActive ? 'Duration' : 'Starts In'}
            </div>
          </div>
        </div>

        {/* Time Info */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(room.starts_at)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{formatDate(room.ends_at)}</span>
          </div>
        </div>

        {/* Results (for completed rooms) */}
        {room.status === 'completed' && isFullRoom && (room as CollabRoom).results?.winner_university_id && (
          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Trophy className="w-5 h-5" />
              Winner: {universities.find(u => u.id === (room as CollabRoom).results?.winner_university_id)?.name || 'TBD'}
            </div>
          </div>
        )}
      </div>

      <div className="pt-0 pb-6 relative">
        <div className="flex gap-3 w-full">
          <Button
            onClick={handleJoin}
            disabled={loading || room.status !== 'upcoming' || isParticipant}
            className={cn(
              "flex-1 h-12 font-semibold shadow-lg transition-all duration-300",
              isParticipant
                ? "bg-emerald-500/90 hover:bg-emerald-500 shadow-emerald-500/25"
                : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/25"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : isParticipant ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Joined
              </>
            ) : room.status === 'completed' ? (
              'View Results'
            ) : room.status === 'active' ? (
              <>
                <Swords className="w-4 h-4 mr-2" />
                Join Battle
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Join Challenge
              </>
            )}
          </Button>
          
          {onViewDetails && (
            <Button
              variant="outline"
              onClick={() => onViewDetails(room.id)}
              className="h-12 border-slate-700/50"
            >
              Details
            </Button>
          )}
        </div>
      </div>

      {/* Hover Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className={cn(
          "absolute inset-0 blur-3xl bg-gradient-to-br opacity-10",
          typeConfig.color
        )} />
      </div>
    </Card>
  )
}

