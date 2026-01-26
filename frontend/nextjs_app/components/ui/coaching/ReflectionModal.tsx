/**
 * Reflection Modal Component
 * Full-screen modal for daily reflections with AI insights
 */
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Save } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCoachingStore } from '@/lib/coaching/store'
import { getToday } from '@/lib/coaching/utils'
import type { Reflection, SentimentEmoji } from '@/lib/coaching/types'

interface ReflectionModalProps {
  isOpen: boolean
  onClose: () => void
}

const sentimentOptions: { emoji: SentimentEmoji; value: 'positive' | 'neutral' | 'negative'; label: string }[] = [
  { emoji: '😊', value: 'positive', label: 'Positive' },
  { emoji: '😐', value: 'neutral', label: 'Neutral' },
  { emoji: '😔', value: 'negative', label: 'Negative' },
]

export function ReflectionModal({ isOpen, onClose }: ReflectionModalProps) {
  const { addReflection, getTodayReflection } = useCoachingStore()
  const [content, setContent] = useState('')
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative'>('neutral')
  const [isSaving, setIsSaving] = useState(false)
  const [aiInsights, setAiInsights] = useState<string | null>(null)
  
  const todayReflection = getTodayReflection()
  
  // Load existing reflection if available
  useEffect(() => {
    if (isOpen && todayReflection && content === '') {
      setContent(todayReflection.content)
      setSentiment(todayReflection.sentiment)
      setAiInsights(todayReflection.aiInsights)
    } else if (!isOpen) {
      // Reset when modal closes
      setContent('')
      setSentiment('neutral')
      setAiInsights(null)
    }
  }, [isOpen, todayReflection])
  
  const handleSave = async () => {
    if (!content.trim()) return
    
    setIsSaving(true)
    
    try {
      const reflection: Omit<Reflection, 'id' | 'createdAt'> = {
        userId: 'current-user', // TODO: Get from auth
        date: getToday(),
        content: content.trim(),
        sentiment,
        aiInsights: aiInsights || 'Reflection saved. AI insights will be generated shortly.',
        emotionTags: [], // TODO: Extract from content
      }
      
      addReflection(reflection as Reflection)
      
      // TODO: Generate AI insights
      // const insights = await reflectionsAPI.getAIInsights(reflection.id)
      // setAiInsights(insights)
      
      onClose()
    } catch (error) {
      console.error('Failed to save reflection:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl h-[90vh] sm:h-[80vh] flex flex-col bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Daily Reflection</h2>
              <p className="text-slate-400 text-sm mt-1">What did you learn today?</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col space-y-4 p-6 overflow-hidden">
            {/* Text Editor */}
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-300 mb-2">
                Your Reflection
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Today I practiced... I struggled with... Tomorrow I'll..."
                className="flex-1 min-h-[300px] resize-none bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            {/* Sentiment Picker */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                How are you feeling?
              </label>
              <div className="flex gap-2">
                {sentimentOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={sentiment === option.value ? 'defender' : 'outline'}
                    size="sm"
                    className={`w-16 h-16 text-2xl ${
                      sentiment === option.value
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                    onClick={() => setSentiment(option.value)}
                  >
                    {option.emoji}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* AI Insights Preview */}
            {aiInsights && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/30"
              >
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-300 mb-1">AI Insights</p>
                    <p className="text-sm text-indigo-200/80">{aiInsights}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-slate-800">
            <Button
              variant="outline"
              className="flex-1 border-slate-700 text-slate-400 hover:bg-slate-800"
              onClick={onClose}
            >
              Skip Today
            </Button>
            <Button
              variant="defender"
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              onClick={handleSave}
              disabled={!content.trim() || isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Reflection'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}


