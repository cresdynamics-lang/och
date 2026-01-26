'use client'

import { Badge } from '@/components/ui/Badge'
import type { SentimentAnalysis } from '@/services/types/coaching'

interface SentimentBadgeProps {
  sentiment: SentimentAnalysis
  showDetails?: boolean
}

export function SentimentBadge({ sentiment, showDetails = false }: SentimentBadgeProps) {
  const getSentimentColor = () => {
    switch (sentiment.sentiment) {
      case 'positive':
        return 'mint'
      case 'neutral':
        return 'steel'
      case 'negative':
        return 'orange'
      default:
        return 'steel'
    }
  }

  const getSentimentIcon = () => {
    switch (sentiment.sentiment) {
      case 'positive':
        return '😊'
      case 'neutral':
        return '😐'
      case 'negative':
        return '😔'
      default:
        return '❓'
    }
  }

  const getConfidenceLevel = () => {
    if (sentiment.confidence >= 0.8) return 'High'
    if (sentiment.confidence >= 0.5) return 'Medium'
    return 'Low'
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getSentimentColor() as any} className="flex items-center gap-1">
        <span>{getSentimentIcon()}</span>
        <span className="capitalize">{sentiment.sentiment}</span>
        <span className="text-xs opacity-75">({Math.round(sentiment.score * 100)}%)</span>
      </Badge>
      
      {showDetails && (
        <div className="ml-2 p-2 bg-och-midnight/50 rounded-lg text-sm">
          <div className="text-och-steel mb-1">
            <strong>Confidence:</strong> {getConfidenceLevel()} ({Math.round(sentiment.confidence * 100)}%)
          </div>
          <div className="text-white mb-2">{sentiment.summary}</div>
          {sentiment.tips && sentiment.tips.length > 0 && (
            <div>
              <div className="text-och-steel mb-1 font-semibold">Tips:</div>
              <ul className="list-disc list-inside text-och-steel space-y-1">
                {sentiment.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

