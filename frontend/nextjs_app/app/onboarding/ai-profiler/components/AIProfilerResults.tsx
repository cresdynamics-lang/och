'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface ProfilingResult {
  user_id: string
  session_id: string
  recommendations: Array<{
    track_key: string
    track_name: string
    score: number
    confidence_level: string
    reasoning: string[]
    career_suggestions: string[]
  }>
  primary_track: {
    key: string
    name: string
    description: string
    focus_areas: string[]
    career_paths: string[]
  }
  assessment_summary: string
  completed_at: string
  // AI-powered enhancements
  future_you_persona?: {
    name: string
    archetype: string
    projected_skills: string[]
    strengths: string[]
    career_vision: string
    confidence: number
    track: string
  }
  personalized_track_descriptions?: Record<string, string>
  ai_confidence?: number
  ai_reasoning?: string
}

interface OCHBlueprint {
  track_recommendation: {
    primary_track: {
      key: string
      name: string
      description: string
      score: number
    }
    secondary_track?: {
      key: string
      name: string
    } | null
  }
  difficulty_level: {
    selected: string
    verified: boolean
    confidence: string
    suggested: string
  }
  suggested_starting_point: string
  learning_strategy: {
    optimal_path: string
    foundations: string[]
    strengths_to_leverage: string[]
    growth_opportunities: string[]
  }
  value_statement: string
  personalized_insights: {
    learning_preferences: Record<string, any>
    personality_traits: Record<string, any>
    career_alignment: {
      primary_track?: string
      secondary_track?: string | null
      career_readiness_score?: number
      career_paths?: string[]
    }
  }
  next_steps: string[]
}

interface AIProfilerResultsProps {
  result: ProfilingResult
  blueprint?: OCHBlueprint | null
  onComplete: () => void
  onReject: () => void
  rejecting?: boolean
}

export default function AIProfilerResults({ result, blueprint, onComplete, onReject, rejecting }: AIProfilerResultsProps) {
  const [showDetails, setShowDetails] = useState(false)
  // Removed showRejectConfirm state - retake now happens immediately without confirmation
  const primaryRecommendation = result.recommendations[0]
  const otherRecommendations = result.recommendations.slice(1)

  const getTrackIcon = (trackKey: string) => {
    const icons = {
      builders: '⚡',
      leaders: '👑',
      entrepreneurs: '🚀',
      researchers: '🔬',
      educators: '📚'
    }
    return icons[trackKey as keyof typeof icons] || '🎯'
  }

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto w-full"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your OCH Track Match!
          </h1>
          <p className="text-xl text-gray-300">
            Based on your responses, here's your personalized recommendation
          </p>
        </motion.div>

        {/* Primary Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-r from-och-orange/20 to-och-crimson/20 border-2 border-och-orange rounded-xl p-8 mb-8"
        >
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{getTrackIcon(primaryRecommendation.track_key)}</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {result.primary_track.name}
            </h2>
            <div className="text-xl text-gray-300 mb-4">
              {primaryRecommendation.score}% Match
            </div>
            <div className={`text-lg font-semibold ${getConfidenceColor(primaryRecommendation.confidence_level)}`}>
              {primaryRecommendation.confidence_level.charAt(0).toUpperCase() + primaryRecommendation.confidence_level.slice(1)} Confidence
            </div>
          </div>

          <p className="text-gray-300 text-lg text-center mb-6">
            {result.personalized_track_descriptions?.[result.primary_track.key] || result.primary_track.description}
          </p>
          {result.personalized_track_descriptions?.[result.primary_track.key] && (
            <div className="text-center mb-6">
              <span className="inline-block bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full">
                ✨ AI-Personalized for You
              </span>
            </div>
          )}

          {/* Focus Areas */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3 text-center">Focus Areas</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {result.primary_track.focus_areas.map((area, index) => (
                <span
                  key={index}
                  className="bg-white/20 text-white px-3 py-1 rounded-full text-sm"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* Career Paths */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3 text-center">Potential Career Paths</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {result.primary_track.career_paths.slice(0, 4).map((career, index) => (
                <div key={index} className="text-gray-300 text-sm flex items-center">
                  <span className="text-och-orange mr-2">•</span>
                  {career}
                </div>
              ))}
            </div>
          </div>

          {/* Reasoning */}
          <div className="border-t border-white/20 pt-6">
            <h3 className="text-white font-semibold mb-3 text-center">Why This Track?</h3>
            <ul className="space-y-2">
              {primaryRecommendation.reasoning.map((reason, index) => (
                <li key={index} className="text-gray-300 flex items-start">
                  <span className="text-och-orange mr-2 mt-1">✓</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Future-You Persona (AI-Generated) */}
        {result.future_you_persona && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-6 mb-8"
          >
            <div className="text-center mb-4">
              <div className="inline-block bg-purple-500/20 rounded-full px-4 py-1 mb-3">
                <span className="text-purple-300 text-xs font-semibold uppercase tracking-wide">AI-Powered Insight</span>
              </div>
              <h3 className="text-white font-bold text-2xl mb-2">Meet Your Future-You</h3>
              <p className="text-purple-200 text-lg font-semibold">{result.future_you_persona.name}</p>
              <p className="text-gray-300 text-sm mt-1">{result.future_you_persona.archetype}</p>
            </div>

            <div className="bg-black/20 rounded-lg p-4 mb-4">
              <p className="text-gray-200 text-center italic leading-relaxed">
                "{result.future_you_persona.career_vision}"
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Projected Skills */}
              <div>
                <h4 className="text-white font-semibold mb-2 text-sm">Skills You'll Master</h4>
                <div className="flex flex-wrap gap-2">
                  {result.future_you_persona.projected_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-purple-500/30 text-purple-100 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Strengths */}
              <div>
                <h4 className="text-white font-semibold mb-2 text-sm">Your Key Strengths</h4>
                <ul className="space-y-1">
                  {result.future_you_persona.strengths.map((strength, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-start">
                      <span className="text-purple-400 mr-2">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center mt-4">
              <div className="inline-flex items-center bg-white/10 rounded-full px-4 py-2">
                <span className="text-gray-400 text-xs mr-2">AI Confidence:</span>
                <span className="text-white font-bold text-sm">
                  {Math.round((result.future_you_persona.confidence || 0) * 100)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Assessment Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8"
        >
          <h3 className="text-white font-semibold mb-3 text-center">Assessment Summary</h3>
          <p className="text-gray-300 text-center leading-relaxed">
            {result.assessment_summary}
          </p>
        </motion.div>

        {/* Blueprint / Deep Analysis */}
        {blueprint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-white/5 rounded-xl p-6 mb-8"
          >
            <h3 className="text-white font-semibold mb-4 text-center">Your Personalized OCH Blueprint</h3>

            {/* Level & Difficulty */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-gray-400 text-xs uppercase mb-1">Level</div>
                <div className="text-white font-bold text-lg">
                  {blueprint?.difficulty_level?.selected?.toUpperCase() || 'INTERMEDIATE'}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {blueprint?.difficulty_level?.verified
                    ? `Verified (${blueprint?.difficulty_level?.confidence || 'high'} confidence)`
                    : `Suggested level: ${blueprint?.difficulty_level?.suggested?.toUpperCase() || 'INTERMEDIATE'}`}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs uppercase mb-1">Readiness</div>
                <div className="text-white font-bold text-lg">
                  {blueprint?.personalized_insights?.career_alignment?.career_readiness_score ?? primaryRecommendation.score}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Career readiness score</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs uppercase mb-1">Starting Point</div>
                <div className="text-white font-bold text-sm">
                  {blueprint?.suggested_starting_point || 'Beginner'}
                </div>
              </div>
            </div>

            {/* Track Insights */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-white font-semibold mb-2">Track Insights</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>
                    <span className="text-och-orange mr-1">•</span>
                    Primary track: {blueprint?.track_recommendation?.primary_track?.name || result.primary_track.name} ({blueprint?.track_recommendation?.primary_track?.score || primaryRecommendation.score}%)
                  </li>
                  {blueprint?.track_recommendation?.secondary_track && (
                    <li>
                      <span className="text-och-orange mr-1">•</span>
                      Secondary track: {blueprint.track_recommendation.secondary_track.name}
                    </li>
                  )}
                  {blueprint?.learning_strategy?.strengths_to_leverage?.length > 0 && (
                    <li>
                      <span className="text-och-orange mr-1">•</span>
                      Strengths to leverage: {blueprint.learning_strategy.strengths_to_leverage.join(', ')}
                    </li>
                  )}
                  {blueprint?.learning_strategy?.growth_opportunities?.length > 0 && (
                    <li>
                      <span className="text-och-orange mr-1">•</span>
                      Growth opportunities: {blueprint.learning_strategy.growth_opportunities.join(', ')}
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Future Career Path Alignment</h4>
                <p className="text-gray-300 text-sm mb-2">
                  {blueprint?.learning_strategy?.optimal_path || 'Follow your track curriculum to build foundational skills'}
                </p>
                {blueprint?.personalized_insights?.career_alignment?.career_paths && (
                  <ul className="text-gray-300 text-sm space-y-1">
                    {blueprint.personalized_insights.career_alignment.career_paths.slice(0, 4).map((path, idx) => (
                      <li key={idx}>
                        <span className="text-och-orange mr-1">•</span>
                        {path}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Value Statement & Next Steps */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-2">Your Value Statement</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {blueprint?.value_statement || 'Your unique combination of skills and interests make you well-suited for your chosen cybersecurity track.'}
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Next Steps</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  {(blueprint?.next_steps || result.next_steps || []).map((step, idx) => (
                    <li key={idx}>
                      <span className="text-och-orange mr-1">•</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Other Recommendations */}
        {otherRecommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-8"
          >
            <h3 className="text-white font-semibold mb-4 text-center">Other Potential Tracks</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {otherRecommendations.slice(0, 4).map((rec, index) => (
                <div key={rec.track_key} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{getTrackIcon(rec.track_key)}</span>
                    <span className="text-white font-semibold">{rec.track_name}</span>
                  </div>
                  <div className="text-gray-300 text-sm mb-2">
                    {rec.score}% Match
                  </div>
                  <div className={`text-xs ${getConfidenceColor(rec.confidence_level)}`}>
                    {rec.confidence_level} confidence
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-center"
        >
          <button
            onClick={onComplete}
            className="bg-gradient-to-r from-och-orange to-och-crimson hover:from-och-orange/80 hover:to-och-crimson/80 text-white text-xl font-bold px-12 py-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mb-4"
          >
            Start My OCH Journey
          </button>

          <div className="space-y-3">
            <p className="text-gray-500 text-xs">
              Assessment completed on {new Date(result.completed_at).toLocaleDateString()}
            </p>

            {/* Reject / Redo Section */}
            <div className="pt-4 border-t border-white/10 mt-4">
              <button
                onClick={onReject}
                disabled={rejecting}
                className="w-full py-3 px-6 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 hover:text-red-200 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>🔄</span>
                <span>{rejecting ? 'Resetting...' : 'Not happy with the results? Retake Assessment'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Detailed Analysis */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8 bg-white/5 rounded-xl p-6"
          >
            <h3 className="text-white font-semibold mb-4">Detailed Track Analysis</h3>
            <div className="space-y-4">
              {result.recommendations.map((rec, index) => (
                <div key={rec.track_key} className="border-b border-white/10 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{getTrackIcon(rec.track_key)}</span>
                      <span className="text-white font-semibold">{rec.track_name}</span>
                      {index === 0 && <span className="ml-2 text-xs bg-och-orange text-black px-2 py-1 rounded">PRIMARY</span>}
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{rec.score}%</div>
                      <div className={`text-xs ${getConfidenceColor(rec.confidence_level)}`}>
                        {rec.confidence_level}
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-300 text-sm mb-2">
                    Suggested careers: {rec.career_suggestions.join(', ')}
                  </div>

                  <ul className="text-gray-400 text-sm space-y-1">
                    {rec.reasoning.map((reason, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-och-orange mr-2">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}





































