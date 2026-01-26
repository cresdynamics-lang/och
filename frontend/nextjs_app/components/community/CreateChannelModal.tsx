"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { 
  X, Hash, Target, Users, Star, Briefcase, 
  Loader2, Lock, Globe
} from "lucide-react"
import type { CreateChannelData, ChannelType } from "@/services/types/community"
import { cn } from "@/lib/utils"

interface CreateChannelModalProps {
  onClose: () => void
  onCreate: (data: CreateChannelData) => Promise<void>
}

const channelTypes: { type: ChannelType; label: string; icon: React.ElementType; description: string }[] = [
  { type: 'interest', label: 'Interest Group', icon: Star, description: 'General topic discussions' },
  { type: 'track', label: 'Track Channel', icon: Target, description: 'Learning track specific' },
  { type: 'study_group', label: 'Study Group', icon: Users, description: 'Collaborative learning' },
  { type: 'project', label: 'Project', icon: Briefcase, description: 'Project collaboration' },
]

const colorOptions = [
  '#4F46E5', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
]

const iconOptions = ['#', '🎯', '💻', '🔥', '🚀', '💡', '🎓', '📚', '🛡️', '⚡']

export function CreateChannelModal({ onClose, onCreate }: CreateChannelModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateChannelData>({
    name: '',
    description: '',
    channel_type: 'interest',
    icon: '#',
    color: '#4F46E5',
    member_limit: 50,
    is_private: false,
    requires_approval: false,
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
        className="w-full max-w-lg mx-auto"
      >
        <Card className="bg-gradient-to-br from-slate-900 via-indigo-900/30 to-purple-900/30 border-slate-800/50 shadow-2xl">
          <div className="p-0">
            {/* Header */}
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <Hash className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Create Channel</h2>
                  <p className="text-sm text-slate-400">Start a new topic channel</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="p-2" onClick={onClose}>
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Channel Type */}
              <div className="space-y-2">
                <label className="text-slate-300">Channel Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {channelTypes.map(({ type, label, icon: Icon, description }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, channel_type: type }))}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        formData.channel_type === type
                          ? "border-indigo-500/50 bg-indigo-500/10"
                          : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5 mb-1",
                        formData.channel_type === type ? "text-indigo-400" : "text-slate-400"
                      )} />
                      <div className="font-medium text-sm text-slate-200">{label}</div>
                      <div className="text-xs text-slate-500">{description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-slate-300">Channel Name</label>
                <Input
                  id="name"
                  placeholder="e.g., DFIR Squad, Cloud Security"
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
                  placeholder="What's this channel about?"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-md text-slate-100 placeholder-slate-400 min-h-[80px] p-2"
                />
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
                            ? "bg-indigo-500/20 ring-2 ring-indigo-500/50"
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

              {/* Member Limit */}
              <div className="space-y-2">
                <label htmlFor="member_limit" className="text-slate-300">Member Limit</label>
                <Input
                  id="member_limit"
                  type="number"
                  min={5}
                  max={500}
                  value={formData.member_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, member_limit: parseInt(e.target.value) || 50 }))}
                  className="bg-slate-800/50 border-slate-700/50 w-32"
                />
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4 p-4 bg-slate-800/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="font-medium text-sm text-slate-200">Private Channel</div>
                      <div className="text-xs text-slate-500">Only visible to members</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    aria-label="Private Channel"
                    checked={formData.is_private}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                    className="w-5 h-5 accent-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="font-medium text-sm text-slate-200">Require Approval</div>
                      <div className="text-xs text-slate-500">Review join requests</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    aria-label="Require Approval"
                    checked={formData.requires_approval}
                    onChange={(e) => setFormData(prev => ({ ...prev, requires_approval: e.target.checked }))}
                    className="w-5 h-5 accent-indigo-500"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-slate-800/30 rounded-xl">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Preview</div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl border"
                    style={{ 
                      backgroundColor: `${formData.color}20`,
                      borderColor: `${formData.color}40`
                    }}
                  >
                    {formData.icon}
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">
                      {formData.name || 'Channel Name'}
                    </div>
                    <div className="text-sm text-slate-400">
                      {channelTypes.find(t => t.type === formData.channel_type)?.label} • 0/{formData.member_limit}
                    </div>
                  </div>
                </div>
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
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Channel'
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

