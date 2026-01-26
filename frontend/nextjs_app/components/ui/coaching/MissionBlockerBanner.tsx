'use client'

import { AlertCircle, Flame, Target, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

interface MissionBlockerBannerProps {
  eligibility: {
    eligible: boolean
    gates: Array<{
      type: string
      message: string
      action: string
      priority: string
    }>
    warnings: Array<{
      type: string
      message: string
      action: string
      priority: string
      score_penalty?: number
    }>
    coachingScore: number
    scoreMultiplier: number
  }
}

export function MissionBlockerBanner({ eligibility }: MissionBlockerBannerProps) {
  const router = useRouter()
  
  if (eligibility.eligible && eligibility.warnings.length === 0) {
    return null
  }
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'habit_streak': return <Flame className="w-5 h-5" />
      case 'reflection': return <BookOpen className="w-5 h-5" />
      case 'goals': return <Target className="w-5 h-5" />
      default: return <AlertCircle className="w-5 h-5" />
    }
  }
  
  return (
    <Card className="border-l-4 border-amber-500 bg-gradient-to-r from-amber-500/10 mb-6 glass-card">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-8 h-8 text-amber-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-100 mb-2">
              {eligibility.eligible ? 'Missions Available (with warnings)' : 'Missions Locked'}
            </h3>
            
            {eligibility.gates.length > 0 && (
              <div className="space-y-2 mb-4">
                {eligibility.gates.map((gate, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                    {getIcon(gate.type)}
                    <div>
                      <p className="font-medium">{gate.message}</p>
                      <p className="text-sm text-slate-400">{gate.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {eligibility.warnings.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-amber-300 mb-2">Warnings (score impact):</p>
                {eligibility.warnings.map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                    {getIcon(warning.type)}
                    <div>
                      <p className="font-medium">{warning.message}</p>
                      <p className="text-sm text-slate-400">{warning.action}</p>
                      {warning.score_penalty && (
                        <p className="text-xs text-amber-400 mt-1">
                          Score multiplier: {((1 - warning.score_penalty) * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-3 mt-4">
              <Button
                variant="defender"
                size="sm"
                onClick={() => router.push('/dashboard/student/coaching')}
              >
                Go to Coaching OS
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/student/coaching')}
              >
                Fix Issues
              </Button>
            </div>
            
            {eligibility.coachingScore > 0 && (
              <p className="text-xs text-slate-500 mt-3">
                Current alignment score: {eligibility.coachingScore}% | 
                Score multiplier: {(eligibility.scoreMultiplier * 100).toFixed(0)}%
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}


