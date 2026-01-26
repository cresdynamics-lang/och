"use client"

import { Badge } from "@/components/ui/Badge"
import type { University } from "@/types/community"

interface UniversityStatsBarProps {
  universities?: University[]
  currentUniversity?: University
  userScore?: number
  rank?: number
}

export function UniversityStatsBar({
  universities = [],
  currentUniversity,
  userScore = 0,
  rank,
}: UniversityStatsBarProps) {
  return (
    <div className="border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-xl sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {currentUniversity && (
            <div className="flex items-center gap-3">
              {currentUniversity.logo_url && (
                <img
                  src={currentUniversity.logo_url}
                  alt={currentUniversity.name}
                  className="w-8 h-8 rounded"
                />
              )}
              <div>
                <div className="text-sm font-semibold text-slate-100">
                  {currentUniversity.name}
                </div>
                <div className="text-xs text-slate-400">
                  {currentUniversity.member_count || 0} members
                </div>
              </div>
              {rank && (
                <Badge variant="gold" className="ml-2">
                  #{rank}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400">Your Score</div>
              <div className="text-lg font-bold text-indigo-400">
                {userScore}
                {userScore > 0 && (
                  <span className="text-xs text-slate-500 ml-1">pts</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

