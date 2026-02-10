'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Zap, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'

interface RecipeDemoProps {
  onComplete: () => void
  onBack: () => void
  onInteractionTrack?: (interaction: { type: string; timeSpent: number }) => void
}

interface SampleRecipe {
  id: string
  title: string
  description: string
  difficulty: string
  estimated_minutes: number
  track_codes: string[]
  skill_codes: string[]
  tools_and_environment: string[]
  steps: Array<{
    step_number: number
    instruction: string
    expected_outcome?: string
    evidence_hint?: string
  }>
  preview_only: boolean
  message?: string
}

export function RecipeDemo({ onComplete, onBack, onInteractionTrack }: RecipeDemoProps) {
  const [recipe, setRecipe] = useState<SampleRecipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    loadSampleRecipe()
  }, [])

  useEffect(() => {
    // Track interaction time when component unmounts
    return () => {
      if (onInteractionTrack && startTime) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000)
        onInteractionTrack({ type: 'recipe_demo', timeSpent })
      }
    }
  }, [onInteractionTrack, startTime])

  const loadSampleRecipe = async () => {
    try {
      setLoading(true)
      const response = await apiGateway.get('/api/v1/recipes/sample')
      setRecipe(response.data)
      setError(null)
    } catch (err: any) {
      console.error('Failed to load sample recipe:', err)
      setError(err.message || 'Failed to load recipe demo')
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
            <div className="text-white text-lg">Loading recipe demo...</div>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center px-4 py-8">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="text-red-400 text-lg">Failed to load recipe demo</div>
            <p className="text-gray-300">{error || 'No recipe available'}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={onBack} variant="outline">Back</Button>
              <Button onClick={loadSampleRecipe} variant="mint">Retry</Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const difficultyColors: Record<string, string> = {
    'beginner': 'och-mint',
    'intermediate': 'och-gold',
    'advanced': 'och-orange'
  }

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
          <Card className="p-8 bg-och-midnight/90 border-2 border-och-mint/30">
            {/* Preview Badge */}
            <div className="mb-6 text-center">
              <Badge variant="mint" className="text-sm px-4 py-2">
                Demo - This is what recipes look like
              </Badge>
            </div>

            {/* Recipe Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-black text-white mb-2">{recipe.title}</h1>
                  <Badge 
                    variant={difficultyColors[recipe.difficulty] as any || 'steel'}
                    className="text-sm"
                  >
                    {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                  </Badge>
                </div>
                <BookOpen className="w-12 h-12 text-och-mint" />
              </div>
              <p className="text-gray-300 text-lg">{recipe.description}</p>
            </div>

            {/* Recipe Details */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 text-gray-300">
                <Clock className="w-5 h-5 text-och-mint" />
                <span>Time: {recipe.estimated_minutes} minutes</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Zap className="w-5 h-5 text-och-gold" />
                <span>Micro-skill learning unit</span>
              </div>
            </div>

            {/* Track & Skills */}
            {recipe.track_codes && recipe.track_codes.length > 0 && (
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-2">Tracks</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.track_codes.map((track, index) => (
                    <Badge key={index} variant="gold" className="text-xs">
                      {track}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {recipe.skill_codes && recipe.skill_codes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.skill_codes.map((skill, index) => (
                    <Badge key={index} variant="steel" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tools */}
            {recipe.tools_and_environment && recipe.tools_and_environment.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-2">Tools & Environment</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tools_and_environment.map((tool, index) => (
                    <Badge key={index} variant="steel" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Steps Preview */}
            {recipe.steps && recipe.steps.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-4">Recipe Steps</h3>
                <div className="space-y-3">
                  {recipe.steps.slice(0, 3).map((step, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-lg p-4 border border-och-steel/20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-och-mint/20 flex items-center justify-center text-och-mint font-bold text-sm shrink-0">
                          {step.step_number || index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-white mb-1">{step.instruction}</p>
                          {step.expected_outcome && (
                            <p className="text-gray-400 text-sm">
                              <strong>Expected:</strong> {step.expected_outcome}
                            </p>
                          )}
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-och-mint shrink-0" />
                      </div>
                    </div>
                  ))}
                  {recipe.steps.length > 3 && (
                    <div className="text-center text-gray-400 text-sm">
                      + {recipe.steps.length - 3} more steps
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Message */}
            <div className="bg-och-mint/10 border border-och-mint/30 rounded-lg p-4 mb-6">
              <p className="text-gray-300 text-sm">
                <strong className="text-white">This is a demo.</strong> Recipes are micro-skills 
                (15-30 minutes) that teach specific tools and techniques. They support mission 
                completion and build your practical skills portfolio.
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
