'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Clock, Target, BookOpen, ArrowRight, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'

interface MissionPreviewProps {
  onComplete: () => void
  onBack: () => void
  onInteractionTrack?: (interaction: { type: string; timeSpent: number }) => void
}

interface SampleMission {
  id: string
  title: string
  description: string
  difficulty: number
  mission_type: string
  estimated_duration_min: number
  skills_tags: string[]
  subtasks: Array<{
    id: string
    title: string
    description: string
    order_index: number
  }>
  preview_only: boolean
  message?: string
}

export function MissionPreview({ onComplete, onBack, onInteractionTrack }: MissionPreviewProps) {
  const [mission, setMission] = useState<SampleMission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    loadSampleMission()
  }, [])

  useEffect(() => {
    // Track interaction time when component unmounts
    return () => {
      if (onInteractionTrack && startTime) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000)
        onInteractionTrack({ type: 'mission_preview', timeSpent })
      }
    }
  }, [onInteractionTrack, startTime])

  const loadSampleMission = async () => {
    try {
      setLoading(true)
      const response = await apiGateway.get('/api/v1/missions/sample')
      setMission(response.data)
      setError(null)
    } catch (err: any) {
      console.error('Failed to load sample mission:', err)
      setError(err.message || 'Failed to load mission preview')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center px-4 py-8">
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-och-orange animate-spin mx-auto" />
            <div className="text-white text-lg">Loading mission preview...</div>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !mission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center px-4 py-8">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="text-red-400 text-lg">Failed to load mission preview</div>
            <p className="text-gray-300">{error || 'No mission available'}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={onBack} variant="outline">Back</Button>
              <Button onClick={loadSampleMission} variant="mint">Retry</Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const difficultyLabels = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master']
  const difficultyColors = ['', 'och-mint', 'och-gold', 'och-orange', 'och-crimson', 'och-crimson']

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button onClick={onBack} variant="outline" className="mb-6">
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          Back to Modules
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="p-8 bg-och-midnight/90 border-2 border-och-gold/30">
            {/* Preview Badge */}
            <div className="mb-6 text-center">
              <Badge variant="gold" className="text-sm px-4 py-2">
                Preview Only - This is what missions look like
              </Badge>
            </div>

            {/* Mission Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-black text-white mb-2">{mission.title}</h1>
                  <Badge 
                    variant={difficultyColors[mission.difficulty] as any || 'steel'}
                    className="text-sm"
                  >
                    {difficultyLabels[mission.difficulty] || 'Unknown'}
                  </Badge>
                </div>
                <Shield className="w-12 h-12 text-och-gold" />
              </div>
              <p className="text-gray-300 text-lg">{mission.description}</p>
            </div>

            {/* Mission Details */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 text-gray-300">
                <Clock className="w-5 h-5 text-och-mint" />
                <span>Estimated: {mission.estimated_duration_min} minutes</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Target className="w-5 h-5 text-och-gold" />
                <span>Type: {mission.mission_type}</span>
              </div>
            </div>

            {/* Skills Tags */}
            {mission.skills_tags && mission.skills_tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-och-mint" />
                  Skills You'll Practice
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mission.skills_tags.map((skill, index) => (
                    <Badge key={index} variant="steel" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Subtasks Preview */}
            {mission.subtasks && mission.subtasks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-4">Mission Structure</h3>
                <div className="space-y-3">
                  {mission.subtasks.slice(0, 3).map((subtask, index) => (
                    <div
                      key={subtask.id || index}
                      className="bg-white/5 rounded-lg p-4 border border-och-steel/20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-och-gold/20 flex items-center justify-center text-och-gold font-bold text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1">{subtask.title}</h4>
                          <p className="text-gray-400 text-sm">{subtask.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {mission.subtasks.length > 3 && (
                    <div className="text-center text-gray-400 text-sm">
                      + {mission.subtasks.length - 3} more subtasks
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Message */}
            <div className="bg-och-mint/10 border border-och-mint/30 rounded-lg p-4 mb-6">
              <p className="text-gray-300 text-sm">
                <strong className="text-white">This is a preview.</strong> After completing Foundations, 
                you'll be able to start missions like this one. Missions are real-world cybersecurity 
                scenarios that build practical, job-ready skills.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button onClick={onBack} variant="outline" className="flex-1">
                Back to Modules
              </Button>
              <Button onClick={onComplete} variant="mint" className="flex-1">
                Continue Foundations
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
