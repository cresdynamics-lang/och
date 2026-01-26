"use client"

import { Card } from "@/components/ui/Card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/Badge"
import type { LeaderboardSnapshot } from "@/types/community"

interface LeaderboardWidgetProps {
  leaderboard?: LeaderboardSnapshot
  scope?: 'university' | 'global' | 'track'
  userId?: string
}

export function LeaderboardWidget({
  leaderboard,
  scope = 'global',
  userId,
}: LeaderboardWidgetProps) {
  const rankings = leaderboard?.rankings || []
  const topThree = rankings.slice(0, 3)
  const rest = rankings.slice(3, 10)

  const getRankEmoji = (index: number) => {
    if (index === 0) return "🥇"
    if (index === 1) return "🥈"
    if (index === 2) return "🥉"
    return `${index + 1}.`
  }

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-100 mb-1">
          {scope === 'university' ? '🏫' : scope === 'track' ? '🎯' : '🌍'} {scope.charAt(0).toUpperCase() + scope.slice(1)} Leaderboard
        </h3>
        <p className="text-xs text-slate-400">
          {leaderboard?.period || 'weekly'} rankings
        </p>
      </div>

      {/* Top 3 */}
      {topThree.length > 0 && (
        <div className="space-y-2 mb-4">
          {topThree.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                entry.user_id === userId
                  ? 'bg-indigo-500/20 border border-indigo-500/50'
                  : 'bg-slate-800/50'
              }`}
            >
              <div className="text-2xl w-8 text-center">{getRankEmoji(index)}</div>
              <Avatar className="w-8 h-8">
                <AvatarImage src={entry.user_avatar} />
                <AvatarFallback>{entry.user_name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-100 truncate">
                  {entry.user_name || "Anonymous"}
                </div>
                <div className="text-xs text-slate-400">
                  {entry.posts || 0} posts
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-indigo-400">
                  {entry.score}
                </div>
                <div className="text-xs text-slate-500">pts</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rest of top 10 */}
      {rest.length > 0 && (
        <div className="space-y-1">
          {rest.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-2 p-2 rounded text-sm ${
                entry.user_id === userId
                  ? 'bg-indigo-500/20 border border-indigo-500/50'
                  : 'hover:bg-slate-800/50'
              }`}
            >
              <div className="w-6 text-center text-slate-400 text-xs">
                {index + 4}.
              </div>
              <Avatar className="w-6 h-6">
                <AvatarImage src={entry.user_avatar} />
                <AvatarFallback className="text-xs">
                  {entry.user_name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 truncate text-slate-200">
                {entry.user_name || "Anonymous"}
              </div>
              <div className="text-indigo-400 font-semibold text-xs">
                {entry.score}
              </div>
            </div>
          ))}
        </div>
      )}

      {rankings.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          No rankings yet
        </div>
      )}
    </Card>
  )
}

