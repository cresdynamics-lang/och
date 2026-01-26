'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Shield,
  Zap,
  Award,
  Search,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useState } from 'react'

interface Filters {
  status: string
  difficulty: string
  track: string
  search: string
}

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  onReset: () => void
}

const DIFFICULTIES = [
  { value: 'beginner', label: 'START', icon: Shield, color: 'from-emerald-500 to-teal-500' },
  { value: 'intermediate', label: 'BUILD', icon: Zap, color: 'from-blue-500 to-cyan-500' },
  { value: 'advanced', label: 'MASTER', icon: Award, color: 'from-orange-500 to-red-500' },
  { value: 'capstone', label: 'ELITE', icon: Award, color: 'from-purple-500 to-pink-500' },
]

const TRACKS = [
  { value: 'defender', label: '🛡️ Defender', color: 'bg-red-100 text-red-700' },
  { value: 'offensive', label: '⚔️ Offensive', color: 'bg-orange-100 text-orange-700' },
  { value: 'grc', label: '📋 GRC', color: 'bg-blue-100 text-blue-700' },
  { value: 'innovation', label: '💡 Innovation', color: 'bg-purple-100 text-purple-700' },
  { value: 'leadership', label: '👥 Leadership', color: 'bg-pink-100 text-pink-700' },
]

const STATUSES = [
  { value: 'not_started', label: '📝 Not Started' },
  { value: 'in_progress', label: '⏳ In Progress' },
  { value: 'completed', label: '✅ Completed' },
  { value: 'submitted', label: '📤 Submitted' },
]

export function MissionsFilterSidebar({ filters, onChange, onReset }: Props) {
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    status: true,
    difficulty: true,
    track: true,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleSearchChange = (value: string) => {
    onChange({ ...filters, search: value })
  }

  const handleStatusChange = (status: string) => {
    onChange({ ...filters, status: filters.status === status ? 'all' : status })
  }

  const handleDifficultyChange = (difficulty: string) => {
    onChange({ ...filters, difficulty: filters.difficulty === difficulty ? 'all' : difficulty })
  }

  const handleTrackChange = (track: string) => {
    onChange({ ...filters, track: filters.track === track ? 'all' : track })
  }

  const hasActiveFilters = filters.status !== 'all' || filters.difficulty !== 'all' || filters.track !== 'all' || filters.search !== ''

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="bg-white rounded-lg shadow-sm p-6 h-fit sticky top-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Reset
          </button>
        )}
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('search')}
          className="flex items-center justify-between w-full mb-3 font-semibold text-gray-900 hover:text-gray-700"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </span>
          {expandedSections.search ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.search && (
          <input
            type="text"
            placeholder="Search missions..."
            value={filters.search}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Status Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('status')}
          className="flex items-center justify-between w-full mb-3 font-semibold text-gray-900 hover:text-gray-700"
        >
          <span>Status</span>
          {expandedSections.status ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.status && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="radio"
                name="status"
                checked={filters.status === 'all'}
                onChange={() => handleStatusChange('all')}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">All</span>
            </label>
            {STATUSES.map(status => (
              <label key={status.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="radio"
                  name="status"
                  checked={filters.status === status.value}
                  onChange={() => handleStatusChange(status.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">{status.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Difficulty Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('difficulty')}
          className="flex items-center justify-between w-full mb-3 font-semibold text-gray-900 hover:text-gray-700"
        >
          <span>Difficulty</span>
          {expandedSections.difficulty ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.difficulty && (
          <div className="space-y-2">
            <button
              onClick={() => onChange({ ...filters, difficulty: 'all' })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.difficulty === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {DIFFICULTIES.map(diff => {
              const Icon = diff.icon
              return (
                <button
                  key={diff.value}
                  onClick={() => onChange({ ...filters, difficulty: diff.value })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    filters.difficulty === diff.value
                      ? `bg-gradient-to-r ${diff.color} text-white shadow-lg`
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {diff.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Track Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('track')}
          className="flex items-center justify-between w-full mb-3 font-semibold text-gray-900 hover:text-gray-700"
        >
          <span>Track</span>
          {expandedSections.track ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.track && (
          <div className="space-y-2">
            <button
              onClick={() => onChange({ ...filters, track: 'all' })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.track === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Tracks
            </button>
            {TRACKS.map(track => (
              <button
                key={track.value}
                onClick={() => onChange({ ...filters, track: track.value })}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.track === track.value
                    ? `${track.color} shadow-lg`
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {track.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
