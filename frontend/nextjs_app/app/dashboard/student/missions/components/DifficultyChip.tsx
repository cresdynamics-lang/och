'use client'

import { Badge } from '@/components/ui/Badge'
import type { MissionDifficulty } from '../types'

interface DifficultyChipProps {
  difficulty: MissionDifficulty
  showIcon?: boolean
}

const getDifficultyConfig = (difficulty: MissionDifficulty) => {
  switch (difficulty) {
    case 'beginner':
      return { color: 'mint' as const, icon: '🟢', label: 'Beginner' }
    case 'intermediate':
      return { color: 'defender' as const, icon: '🟡', label: 'Intermediate' }
    case 'advanced':
      return { color: 'orange' as const, icon: '🟠', label: 'Advanced' }
    case 'capstone':
      return { color: 'gold' as const, icon: '⭐', label: 'Capstone' }
    default:
      return { color: 'steel' as const, icon: '⚪', label: 'Unknown' }
  }
}

export function DifficultyChip({ difficulty, showIcon = true }: DifficultyChipProps) {
  const config = getDifficultyConfig(difficulty)
  
  return (
    <Badge variant={config.color} className="text-xs font-semibold">
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  )
}

