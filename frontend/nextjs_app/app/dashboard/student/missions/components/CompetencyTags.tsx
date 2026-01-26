'use client'

import { Badge } from '@/components/ui/Badge'

interface CompetencyTagsProps {
  tags: string[]
  maxVisible?: number
}

export function CompetencyTags({ tags, maxVisible = 5 }: CompetencyTagsProps) {
  if (!tags || tags.length === 0) return null
  
  const visibleTags = tags.slice(0, maxVisible)
  const remaining = tags.length - maxVisible
  
  return (
    <div className="flex flex-wrap gap-2">
      {visibleTags.map((tag, idx) => (
        <Badge key={idx} variant="steel" className="text-xs">
          {tag}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="steel" className="text-xs opacity-60">
          +{remaining} more
        </Badge>
      )}
    </div>
  )
}

