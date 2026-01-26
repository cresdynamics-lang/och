'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Mission {
  id: string
  code: string
  title: string
  description: string
  track: string
  tier: string
  difficulty: string
  type: string
  track_key?: string
  competencies?: string[]
  requires_mentor_review: boolean
  is_active: boolean
}

interface AllMissionsViewProps {
  missions: Mission[]
  loading: boolean
  filters: {
    track: string
    tier: string
    difficulty: string
    type: string
    search: string
  }
  onFiltersChange: (filters: any) => void
  onMissionClick: (mission: Mission) => void
  onRefresh: () => void
}

export function AllMissionsView({
  missions,
  loading,
  filters,
  onFiltersChange,
  onMissionClick,
  onRefresh,
}: AllMissionsViewProps) {
  const router = useRouter()
  const [localSearch, setLocalSearch] = useState(filters.search)

  const handleMissionClick = (mission: Mission) => {
    // Navigate to dedicated mission detail page
    router.push(`/dashboard/mentor/missions/${mission.id}`)
    // Also call the callback if provided (for backward compatibility)
    if (onMissionClick) {
      onMissionClick(mission)
    }
  }

  const handleSearch = () => {
    onFiltersChange({ ...filters, search: localSearch })
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'beginner': return 'mint'
      case 'intermediate': return 'defender'
      case 'advanced': return 'gold'
      case 'mastery': return 'orange'
      case 'capstone': return 'orange'
      default: return 'steel'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'novice': return 'mint'
      case 'beginner': return 'mint'
      case 'intermediate': return 'defender'
      case 'advanced': return 'gold'
      case 'elite': return 'orange'
      default: return 'steel'
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs text-och-steel mb-1 block">Search</label>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Code, title, description..."
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm focus:border-och-mint focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-och-steel mb-1 block">Track</label>
            <select
              value={filters.track}
              onChange={(e) => onFiltersChange({ ...filters, track: e.target.value })}
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm focus:border-och-mint focus:outline-none"
            >
              <option value="">All Tracks</option>
              <option value="defender">Defender</option>
              <option value="offensive">Offensive</option>
              <option value="grc">GRC</option>
              <option value="innovation">Innovation</option>
              <option value="leadership">Leadership</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-och-steel mb-1 block">Tier</label>
            <select
              value={filters.tier}
              onChange={(e) => onFiltersChange({ ...filters, tier: e.target.value })}
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm focus:border-och-mint focus:outline-none"
            >
              <option value="">All Tiers</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="mastery">Mastery</option>
              <option value="capstone">Capstone</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-och-steel mb-1 block">Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={(e) => onFiltersChange({ ...filters, difficulty: e.target.value })}
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm focus:border-och-mint focus:outline-none"
            >
              <option value="">All Difficulties</option>
              <option value="novice">Novice</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="elite">Elite</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={handleSearch}
              variant="defender"
              size="sm"
              className="flex-1"
            >
              Search
            </Button>
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Missions Grid */}
      {loading ? (
        <div className="text-center py-12 text-och-steel">Loading missions...</div>
      ) : missions.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <p className="text-och-steel">No missions found. Try adjusting your filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((mission) => (
            <Card
              key={mission.id}
              className="glass-card p-5 hover:border-och-mint/50 hover:shadow-lg hover:shadow-och-mint/10 transition-all cursor-pointer group relative overflow-hidden"
              onClick={() => handleMissionClick(mission)}
            >
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-och-mint/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-och-mint">{mission.code}</h3>
                      {mission.requires_mentor_review && (
                        <Badge variant="orange" className="text-xs animate-pulse">Mentor Review</Badge>
                      )}
                    </div>
                    <h4 className="text-white font-semibold text-lg mb-3 leading-tight">{mission.title}</h4>
                  </div>
                </div>

                <p className="text-sm text-och-steel mb-4 line-clamp-3 leading-relaxed">
                  {mission.description || 'No description available'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant={getTierColor(mission.tier)} className="text-xs capitalize font-medium">
                    {mission.tier}
                  </Badge>
                  <Badge variant={getDifficultyColor(mission.difficulty)} className="text-xs capitalize font-medium">
                    {mission.difficulty}
                  </Badge>
                  <Badge variant="steel" className="text-xs capitalize">
                    {mission.track}
                  </Badge>
                  <Badge variant="steel" className="text-xs capitalize">
                    {mission.type}
                  </Badge>
                </div>

                {mission.competencies && mission.competencies.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-och-steel/20">
                    <p className="text-xs text-och-steel mb-2 font-medium">Key Competencies:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {mission.competencies.slice(0, 3).map((comp, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-och-midnight/70 rounded-md text-och-steel border border-och-steel/20">
                          {comp}
                        </span>
                      ))}
                      {mission.competencies.length > 3 && (
                        <span className="text-xs text-och-steel px-2 py-1 bg-och-midnight/50 rounded-md">
                          +{mission.competencies.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 group-hover:bg-och-mint/10 group-hover:border-och-mint/50 group-hover:text-och-mint transition-all"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMissionClick(mission)
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    View Full Details
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

