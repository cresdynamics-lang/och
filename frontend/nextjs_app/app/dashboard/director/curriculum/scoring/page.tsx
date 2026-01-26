'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { usePrograms, useTracks, useProgram } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'
import Link from 'next/link'

const ChartBarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

interface ScoringBreakdown {
  missions: number
  capstone: number
  portfolio: number
  attendance: number
  mentor_feedback: number
  peer_review: number
  total: number
}

interface RubricCriteria {
  name: string
  weight: number
  levels: Array<{
    level: string
    description: string
    score_range: { min: number; max: number }
  }>
}

interface TrackScoringConfig {
  track_id: string
  track_name: string
  program_name: string
  breakdown: ScoringBreakdown
  rubrics: Record<string, RubricCriteria>
  domain_complexity: 'low' | 'medium' | 'high'
  auto_grade: boolean
}

export default function ScoringRulesPage() {
  const { programs, isLoading: programsLoading } = usePrograms()
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const { program: selectedProgramDetail } = useProgram(
    selectedProgramId && selectedProgramId !== '' ? selectedProgramId : ''
  )
  const { tracks, isLoading: tracksLoading } = useTracks(
    selectedProgramId && selectedProgramId !== '' ? selectedProgramId : undefined
  )

  const [scoringConfigs, setScoringConfigs] = useState<Record<string, TrackScoringConfig>>({})
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const availableTracks = selectedProgramDetail?.tracks || tracks

  const getDefaultConfig = (trackId: string, trackName: string, programName: string): TrackScoringConfig => ({
    track_id: trackId,
    track_name: trackName,
    program_name: programName,
    breakdown: {
      missions: 40,
      capstone: 25,
      portfolio: 15,
      attendance: 10,
      mentor_feedback: 5,
      peer_review: 5,
      total: 100,
    },
    rubrics: {
      mission_submission: {
        name: 'Mission Submission',
        weight: 1.0,
        levels: [
          { level: 'Exceeds', description: 'Exceeds all requirements', score_range: { min: 90, max: 100 } },
          { level: 'Meets', description: 'Meets all requirements', score_range: { min: 75, max: 89 } },
          { level: 'Approaching', description: 'Approaches requirements', score_range: { min: 60, max: 74 } },
          { level: 'Below', description: 'Below requirements', score_range: { min: 0, max: 59 } },
        ],
      },
      capstone_project: {
        name: 'Capstone Project',
        weight: 1.0,
        levels: [
          { level: 'Excellent', description: 'Outstanding work', score_range: { min: 90, max: 100 } },
          { level: 'Good', description: 'Good quality work', score_range: { min: 75, max: 89 } },
          { level: 'Satisfactory', description: 'Meets basic requirements', score_range: { min: 60, max: 74 } },
          { level: 'Needs Improvement', description: 'Does not meet requirements', score_range: { min: 0, max: 59 } },
        ],
      },
    },
    domain_complexity: 'medium',
    auto_grade: false,
  })

  useEffect(() => {
    loadScoringConfigs()
  }, [availableTracks])

  const loadScoringConfigs = async () => {
    if (availableTracks.length === 0) return

    const configs: Record<string, TrackScoringConfig> = {}
    for (const track of availableTracks) {
      try {
        // Load track details to check for existing scoring config in competencies
        const trackDetail = await programsClient.getTrack(String(track.id))
        const competencies = trackDetail.competencies || {}
        
        if (competencies.scoring_config) {
          configs[String(track.id)] = competencies.scoring_config as TrackScoringConfig
        } else {
          configs[String(track.id)] = getDefaultConfig(
            String(track.id),
            track.name,
            selectedProgramDetail?.name || ''
          )
        }
      } catch (err) {
        console.error(`Failed to load config for track ${track.id}:`, err)
        configs[String(track.id)] = getDefaultConfig(
          String(track.id),
          track.name,
          selectedProgramDetail?.name || ''
        )
      }
    }
    setScoringConfigs(configs)
  }

  const handleSaveConfig = async (trackId: string) => {
    setIsSaving(true)
    try {
      const config = scoringConfigs[trackId]
      if (!config) return

      // Validate breakdown totals to 100
      const total = Object.values(config.breakdown)
        .filter((v, i, arr) => i !== arr.length - 1) // Exclude 'total'
        .reduce((sum, v) => sum + v, 0)

      if (Math.abs(total - 100) > 0.01) {
        alert(`Scoring breakdown must total 100%. Current total: ${total}%`)
        setIsSaving(false)
        return
      }

      // Update track competencies with scoring config
      const trackDetail = await programsClient.getTrack(trackId)
      const updatedCompetencies = {
        ...trackDetail.competencies,
        scoring_config: config,
      }

      await programsClient.updateTrack(trackId, {
        competencies: updatedCompetencies,
      })

      setEditingTrackId(null)
      alert('Scoring configuration saved successfully!')
    } catch (err: any) {
      console.error('Failed to save scoring config:', err)
      alert(err?.response?.data?.detail || err?.message || 'Failed to save scoring configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const updateBreakdown = (trackId: string, key: keyof ScoringBreakdown, value: number) => {
    if (key === 'total') return // Don't allow editing total directly

    setScoringConfigs(prev => {
      const config = { ...prev[trackId] }
      config.breakdown = { ...config.breakdown, [key]: value }
      
      // Recalculate total
      const newTotal = Object.entries(config.breakdown)
        .filter(([k]) => k !== 'total')
        .reduce((sum, [, v]) => sum + (typeof v === 'number' ? v : 0), 0)
      
      config.breakdown.total = newTotal
      return { ...prev, [trackId]: config }
    })
  }

  const getTotalColor = (total: number) => {
    if (Math.abs(total - 100) < 0.01) return 'mint'
    if (total > 100) return 'orange'
    return 'gold'
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <ChartBarIcon />
              <h1 className="text-4xl font-bold text-och-gold">Scoring Rules</h1>
            </div>
            <p className="text-och-steel">
              Modify scoring breakdown per track and define success metrics
            </p>
          </div>

          {/* Program Selection */}
          <Card className="mb-6">
            <div className="p-6">
              <label className="block text-sm font-medium text-white mb-2">Select Program</label>
              <select
                value={selectedProgramId}
                onChange={(e) => {
                  setSelectedProgramId(e.target.value)
                  setScoringConfigs({})
                  setEditingTrackId(null)
                }}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                disabled={programsLoading}
              >
                <option value="">Select a program</option>
                {programs.map((program) => (
                  <option key={program.id} value={String(program.id)}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Tracks and Scoring Configurations */}
          {selectedProgramId && (
            <div className="space-y-6">
              {tracksLoading ? (
                <Card>
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading tracks...</p>
                  </div>
                </Card>
              ) : availableTracks.length === 0 ? (
                <Card>
                  <div className="p-6 text-center">
                    <p className="text-och-steel">No tracks available for the selected program</p>
                  </div>
                </Card>
              ) : (
                availableTracks.map((track) => {
                  const config = scoringConfigs[String(track.id)]
                  const isEditing = editingTrackId === String(track.id)

                  if (!config) {
                    return (
                      <Card key={track.id}>
                        <div className="p-6 text-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-och-mint mx-auto"></div>
                        </div>
                      </Card>
                    )
                  }

                  return (
                    <Card key={track.id}>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-bold text-white">{track.name}</h3>
                            <p className="text-sm text-och-steel">{config.program_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={track.track_type === 'primary' ? 'defender' : 'gold'}>
                              {track.track_type === 'primary' ? 'Primary Track' : 'Cross-Track'}
                            </Badge>
                            {!isEditing && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingTrackId(String(track.id))}
                              >
                                <EditIcon />
                                <span className="ml-1">Edit</span>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Scoring Breakdown */}
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Scoring Breakdown (%)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {Object.entries(config.breakdown)
                              .filter(([key]) => key !== 'total')
                              .map(([key, value]) => (
                                <div key={key}>
                                  <label className="block text-xs text-och-steel mb-1 capitalize">
                                    {key.replace(/_/g, ' ')}
                                  </label>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                      value={value}
                                      onChange={(e) => updateBreakdown(String(track.id), key as keyof ScoringBreakdown, parseFloat(e.target.value) || 0)}
                                      className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                                    />
                                  ) : (
                                    <div className="px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white">
                                      {value}%
                                    </div>
                                  )}
                                </div>
                              ))}
                            <div>
                              <label className="block text-xs text-och-steel mb-1">Total</label>
                              <div className={`px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white font-bold`}>
                                <Badge variant={getTotalColor(config.breakdown.total)}>
                                  {config.breakdown.total.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {Math.abs(config.breakdown.total - 100) > 0.01 && (
                            <p className="text-sm text-orange-400 mt-2">
                              ⚠️ Breakdown must total exactly 100%
                            </p>
                          )}
                        </div>

                        {/* Domain Complexity */}
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Domain Complexity</h4>
                          {isEditing ? (
                            <select
                              value={config.domain_complexity}
                              onChange={(e) =>
                                setScoringConfigs(prev => ({
                                  ...prev,
                                  [String(track.id)]: {
                                    ...prev[String(track.id)],
                                    domain_complexity: e.target.value as 'low' | 'medium' | 'high',
                                  },
                                }))
                              }
                              className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                            >
                              <option value="low">Low (Simpler domains like GRC)</option>
                              <option value="medium">Medium (Balanced complexity)</option>
                              <option value="high">High (Complex domains like Offensive Security)</option>
                            </select>
                          ) : (
                            <Badge
                              variant={
                                config.domain_complexity === 'high' ? 'orange' :
                                config.domain_complexity === 'medium' ? 'gold' : 'mint'
                              }
                            >
                              {config.domain_complexity.charAt(0).toUpperCase() + config.domain_complexity.slice(1)}
                            </Badge>
                          )}
                        </div>

                        {/* Rubrics Preview */}
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-4">Rubrics</h4>
                          <div className="space-y-4">
                            {Object.values(config.rubrics).map((rubric) => (
                              <div
                                key={rubric.name}
                                className="p-4 bg-och-midnight/30 rounded-lg border border-och-steel/20"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-white font-medium">{rubric.name}</h5>
                                  <span className="text-sm text-och-steel">Weight: {rubric.weight}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                  {rubric.levels.map((level, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 bg-och-midnight/50 rounded text-sm"
                                    >
                                      <div className="font-medium text-white mb-1">{level.level}</div>
                                      <div className="text-xs text-och-steel mb-1">{level.description}</div>
                                      <div className="text-xs text-och-mint">
                                        {level.score_range.min}-{level.score_range.max}%
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Save/Cancel Buttons */}
                        {isEditing && (
                          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-och-steel/20">
                            <Button
                              variant="defender"
                              onClick={() => handleSaveConfig(String(track.id))}
                              disabled={isSaving || Math.abs(config.breakdown.total - 100) > 0.01}
                            >
                              {isSaving ? 'Saving...' : 'Save Configuration'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingTrackId(null)
                                loadScoringConfigs() // Reload to reset changes
                              }}
                              disabled={isSaving}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          )}

          {!selectedProgramId && (
            <Card>
              <div className="p-6 text-center">
                <p className="text-och-steel">Please select a program to configure scoring rules</p>
              </div>
            </Card>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
