'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SentimentBadge } from './SentimentBadge'
import { useAICoaching } from '@/hooks/useAICoaching'
import type { SentimentAnalysis } from '@/services/types/coaching'

interface ReflectionWithSentimentProps {
  reflectionId: string
  content: string
  timestamp: string
  initialSentiment?: SentimentAnalysis
}

export function ReflectionWithSentiment({
  reflectionId,
  content,
  timestamp,
  initialSentiment,
}: ReflectionWithSentimentProps) {
  const { analyzeSentiment } = useAICoaching(undefined)
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(initialSentiment || null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const analysis = await analyzeSentiment(reflectionId, content)
      setSentiment(analysis)
      setShowDetails(true)
    } catch (error) {
      console.error('Failed to analyze sentiment:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="text-xs text-och-steel mb-2">{new Date(timestamp).toLocaleDateString()}</div>
            <p className="text-white">{content}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          {sentiment ? (
            <SentimentBadge sentiment={sentiment} showDetails={showDetails} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Sentiment'}
            </Button>
          )}
          
          {sentiment && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

