/**
 * Coaching Control Panel Component
 * AI Coach and habit preferences
 * Enhanced with advanced customization, coaching intensity, and reflection preferences
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, BookOpen, Zap, Clock, MessageSquare, TrendingUp, ChevronDown, ChevronUp, Sliders, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// Local types to replace missing @/lib/settings imports
export interface UserSettings {
  aiCoachStyle?: 'motivational' | 'direct' | 'analytical';
  habitFrequency?: 'daily' | 'weekly';
  reflectionPromptStyle?: 'guided' | 'freeform' | 'structured';
  [key: string]: any;
}

export interface SettingsUpdate {
  [key: string]: any;
}

interface CoachingControlPanelProps {
  settings: UserSettings | null;
  onUpdate: (updates: SettingsUpdate) => void;
}

export function CoachingControlPanel({ settings, onUpdate }: CoachingControlPanelProps) {
  // All hooks must be called before any conditional returns
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [coachingIntensity, setCoachingIntensity] = useState<'gentle' | 'moderate' | 'intensive'>('moderate');
  const [coachingFrequency, setCoachingFrequency] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Handle missing settings gracefully
  if (!settings) {
    return (
      <Card className="glass-card glass-card-hover">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-indigo-400" />
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Coaching Preferences</h2>
              <p className="text-xs text-slate-500 mt-1">
                Coaching settings are loading...
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const coachStyles = [
    {
      value: 'motivational' as const,
      label: 'Motivational',
      description: 'Encouraging and supportive',
    },
    {
      value: 'direct' as const,
      label: 'Direct',
      description: 'Straightforward and actionable',
    },
    {
      value: 'analytical' as const,
      label: 'Analytical',
      description: 'Data-driven and detailed',
    },
  ];

  return (
    <Card className="glass-card glass-card-hover">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8 text-indigo-400" />
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Coaching Preferences</h2>
            <p className="text-xs text-slate-500 mt-1">
              Customize your AI Coach style and reflection preferences
            </p>
          </div>
        </div>

        {/* AI Coach Style */}
        <div className="mb-6">
          <label className="font-bold text-slate-100 mb-3 block">AI Coach Style</label>
          <div className="space-y-2">
            {coachStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => onUpdate({ aiCoachStyle: style.value })}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  settings.aiCoachStyle === style.value
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-slate-200">{style.label}</div>
                <div className="text-xs text-slate-500">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Habit Frequency */}
        <div className="mb-6">
          <label className="font-bold text-slate-100 mb-3 block flex items-center gap-2">
            <Target className="w-5 h-5" />
            Habit Frequency
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdate({ habitFrequency: 'daily' })}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                settings.habitFrequency === 'daily'
                  ? 'border-indigo-500 bg-indigo-500/10 text-slate-100'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold">Daily</div>
            </button>
            <button
              onClick={() => onUpdate({ habitFrequency: 'weekly' })}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                settings.habitFrequency === 'weekly'
                  ? 'border-indigo-500 bg-indigo-500/10 text-slate-100'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold">Weekly</div>
            </button>
          </div>
        </div>

        {/* Reflection Prompt Style */}
        <div>
          <label className="font-bold text-slate-100 mb-3 block flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Reflection Style
          </label>
          <div className="space-y-2">
            <button
              onClick={() => onUpdate({ reflectionPromptStyle: 'guided' })}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                settings.reflectionPromptStyle === 'guided'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold text-slate-200">Guided</div>
              <div className="text-xs text-slate-500">Structured prompts and questions</div>
            </button>
            <button
              onClick={() => onUpdate({ reflectionPromptStyle: 'freeform' })}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                settings.reflectionPromptStyle === 'freeform'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold text-slate-200">Freeform</div>
              <div className="text-xs text-slate-500">Open-ended journaling</div>
            </button>
            <button
              onClick={() => onUpdate({ reflectionPromptStyle: 'structured' })}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                settings.reflectionPromptStyle === 'structured'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold text-slate-200">Structured</div>
              <div className="text-xs text-slate-500">Template-based reflections</div>
            </button>
          </div>
        </div>

        {/* Coaching Intensity */}
        <div className="mb-6">
          <label className="font-bold text-slate-100 mb-3 block flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Coaching Intensity
          </label>
          <div className="space-y-2">
            {[
              { value: 'gentle', label: 'Gentle', description: 'Supportive and encouraging, minimal pressure' },
              { value: 'moderate', label: 'Moderate', description: 'Balanced approach with clear guidance' },
              { value: 'intensive', label: 'Intensive', description: 'Challenging and goal-focused' },
            ].map((intensity) => (
              <button
                key={intensity.value}
                onClick={() => {
                  setCoachingIntensity(intensity.value as any);
                  // Update settings
                }}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  coachingIntensity === intensity.value
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-slate-200">{intensity.label}</div>
                <div className="text-xs text-slate-500">{intensity.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Coaching Frequency */}
        <div className="mb-6">
          <label className="font-bold text-slate-100 mb-3 block flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Coaching Frequency
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'low', label: 'Low', description: '1-2x/week' },
              { value: 'medium', label: 'Medium', description: '3-4x/week' },
              { value: 'high', label: 'High', description: 'Daily' },
            ].map((freq) => (
              <button
                key={freq.value}
                onClick={() => {
                  setCoachingFrequency(freq.value as any);
                }}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  coachingFrequency === freq.value
                    ? 'border-indigo-500 bg-indigo-500/10 text-slate-100'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold">{freq.label}</div>
                <div className="text-xs mt-1">{freq.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="font-bold text-slate-100">Advanced Coaching Settings</h4>
                <p className="text-xs text-slate-500">Fine-tune your coaching experience</p>
              </div>
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 mt-4"
              >
                {/* Coaching Topics */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Preferred Coaching Topics</label>
                  <div className="flex flex-wrap gap-2">
                    {['Career Growth', 'Skill Development', 'Habit Building', 'Goal Setting', 'Time Management', 'Stress Management'].map((topic) => (
                      <Badge
                        key={topic}
                        variant="outline"
                        className="cursor-pointer hover:bg-indigo-500/20 hover:border-indigo-500/50"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Notification Preferences */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Coaching Notification Timing</label>
                  <select
                    className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-2 text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
                    defaultValue="morning"
                  >
                    <option value="morning">Morning (8:00 AM)</option>
                    <option value="afternoon">Afternoon (2:00 PM)</option>
                    <option value="evening">Evening (6:00 PM)</option>
                    <option value="custom">Custom Time</option>
                  </select>
                </div>

                {/* Goal Reminders */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-slate-200">Goal Reminders</div>
                    <div className="text-xs text-slate-500">Receive reminders about your goals</div>
                  </div>
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      true ? 'bg-indigo-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        true ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Progress Tracking */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-slate-200">Progress Tracking</div>
                    <div className="text-xs text-slate-500">Track and visualize your progress</div>
                  </div>
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      true ? 'bg-indigo-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        true ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* AI Insights */}
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <div className="text-sm font-medium text-slate-200">AI Insights</div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Your AI Coach analyzes your progress and provides personalized insights based on your activity patterns and goals.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Impact Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/30 rounded-lg">
          <h4 className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Coaching Impact
          </h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Your coaching style: <strong className="text-slate-300">{settings.aiCoachStyle}</strong></li>
            <li>• Habit frequency: <strong className="text-slate-300">{settings.habitFrequency}</strong></li>
            <li>• Reflection style: <strong className="text-slate-300">{settings.reflectionPromptStyle}</strong></li>
            <li>• Coaching intensity: <strong className="text-slate-300">{coachingIntensity}</strong></li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

