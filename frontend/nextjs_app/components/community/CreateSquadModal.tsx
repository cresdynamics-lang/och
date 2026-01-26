"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { 
  X, Users, Target, Loader2, Lock
} from "lucide-react"
import type { CreateSquadData } from "@/services/types/community"
import { cn } from "@/lib/utils"

interface CreateSquadModalProps {
  onClose: () => void
  onCreate: (data: CreateSquadData) => Promise<void>
}

const colorOptions = [
  '#8B5CF6', // Purple (default)
  '#EC4899', // Pink
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#4F46E5', // Indigo
  '#EF4444', // Red
]

const iconOptions = ['👥', '🚀', '⚡', '🔥', '💪', '🎯', '🏆', '💡', '🛡️', '⭐']

const circleOptions = [
  { value: 1, label: 'Circle 1', color: 'bg-slate-500/20 text-slate-400' },
  { value: 2, label: 'Circle 2', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 3, label: 'Circle 3', color: 'bg-blue-500/20 text-blue-400' },
  { value: 4, label: 'Circle 4', color: 'bg-purple-500/20 text-purple-400' },
  { value: 5, label: 'Circle 5', color: 'bg-amber-500/20 text-amber-400' },
]

export function CreateSquadModal({ onClose, onCreate }: CreateSquadModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateSquadData>({
    name: '',
    description: '',
    goal: '',
    icon: '👥',
    color: '#8B5CF6',
    circle_level: undefined,
    track_key: '',
    min_members: 4,
    max_members: 8,
    is_open: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    try {
      await onCreate(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
      >
        <Card className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-pink-900/30 border-slate-800/50 shadow-2xl">
          <div className="p-0">
            {/* Header */}
            <div className="sticky top-0 z-10 p-6 border-b border-slate-800/50 bg-slate-900/90 backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Create Study Squad</h2>
                  <p className="text-sm text-slate-400">Build your micro-cohort</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="p-2" onClick={onClose}>
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-slate-300">Squad Name *</label>
                <Input
                  id="name"
                  placeholder="e.g., Circle 3 DFIR Warriors"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700/50"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-slate-300">Description</label>
                <textarea
                  id="description"
                  placeholder="What brings your squad together?"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-md text-slate-100 placeholder-slate-400 min-h-[60px] p-2"
                />
              </div>

              {/* Goal */}
              <div className="space-y-2">
                <label htmlFor="goal" className="text-slate-300">
                  <Target className="w-4 h-4 inline mr-1" />
                  Current Goal
                </label>
                <textarea
                  id="goal"
                  placeholder="e.g., Complete 5 missions this week"
                  value={formData.goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-md text-slate-100 placeholder-slate-400 min-h-[60px] p-2"
                />
              </div>

              {/* Circle Level */}
              <div className="space-y-2">
                <label className="text-slate-300">Circle Focus (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, circle_level: undefined }))}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-all",
                      !formData.circle_level
                        ? "bg-slate-600/50 text-slate-200 ring-2 ring-slate-500/50"
                        : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                    )}
                  >
                    Any Circle
                  </button>
                  {circleOptions.map(({ value, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, circle_level: value }))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm transition-all",
                        formData.circle_level === value
                          ? `${color} ring-2 ring-current`
                          : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-slate-300">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all",
                          formData.icon === icon
                            ? "bg-purple-500/20 ring-2 ring-purple-500/50"
                            : "bg-slate-800/50 hover:bg-slate-700/50"
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={cn(
                          "w-8 h-8 rounded-lg transition-all",
                          formData.color === color && "ring-2 ring-white/50 scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Member Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="min_members" className="text-slate-300">Min Members</label>
                  <Input
                    id="min_members"
                    type="number"
                    min={2}
                    max={formData.max_members}
                    value={formData.min_members}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_members: parseInt(e.target.value) || 4 }))}
                    className="bg-slate-800/50 border-slate-700/50"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="max_members" className="text-slate-300">Max Members</label>
                  <Input
                    id="max_members"
                    type="number"
                    min={formData.min_members}
                    max={20}
                    value={formData.max_members}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_members: parseInt(e.target.value) || 8 }))}
                    className="bg-slate-800/50 border-slate-700/50"
                  />
                </div>
              </div>

              {/* Open for Joining */}
              <div className="p-4 bg-slate-800/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="font-medium text-sm text-slate-200">Open for Joining</div>
                      <div className="text-xs text-slate-500">Allow anyone to join your squad</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    aria-label="Open for Joining"
                    checked={formData.is_open}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_open: e.target.checked }))}
                    className="w-5 h-5 accent-indigo-500"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-slate-800/30 rounded-xl space-y-3">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Preview</div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border"
                    style={{ 
                      backgroundColor: `${formData.color}20`,
                      borderColor: `${formData.color}40`
                    }}
                  >
                    {formData.icon}
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">
                      {formData.name || 'Squad Name'}
                    </div>
                    <div className="text-sm text-slate-400 flex items-center gap-2">
                      <span>1/{formData.max_members} members</span>
                      {formData.circle_level && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className={circleOptions.find(c => c.value === formData.circle_level)?.color}>
                            Circle {formData.circle_level}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {formData.goal && (
                  <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="text-xs text-purple-400 font-semibold flex items-center gap-1 mb-1">
                      <Target className="w-3 h-3" />
                      GOAL
                    </div>
                    <div className="text-sm text-slate-300">{formData.goal}</div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <p className="text-sm text-indigo-300">
                  <strong>Tip:</strong> As the creator, you'll automatically become the squad leader and earn +100 reputation points! 🏆
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-700/50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Squad'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}

