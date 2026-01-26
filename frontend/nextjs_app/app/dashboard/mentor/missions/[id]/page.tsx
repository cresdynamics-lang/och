'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { missionsClient, type MissionTemplate } from '@/services/missionsClient'
import { programsClient } from '@/services/programsClient'

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

export default function MentorMissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const missionId = params.id as string

  const [mission, setMission] = useState<MissionTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trackInfo, setTrackInfo] = useState<{ name?: string; program_name?: string } | null>(null)

  useEffect(() => {
    loadMissionData()
  }, [missionId])

  const loadMissionData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const missionData = await missionsClient.getMission(missionId)
      setMission(missionData)

      // Load track info if available
      if (missionData.track_id) {
        try {
          const track = await programsClient.getTrack(missionData.track_id)
          setTrackInfo({
            name: track.name,
            program_name: track.program_name,
          })
        } catch (err) {
          console.warn('Could not load track info:', err)
        }
      }
    } catch (err: any) {
      console.error('Failed to load mission:', err)
      setError(err?.message || 'Failed to load mission details')
    } finally {
      setIsLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'mint'
      case 'intermediate':
        return 'defender'
      case 'advanced':
        return 'orange'
      case 'capstone':
        return 'gold'
      default:
        return 'steel'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lab':
        return '🔬'
      case 'scenario':
        return '🎯'
      case 'project':
        return '🚀'
      case 'capstone':
        return '🏆'
      default:
        return '📋'
    }
  }

  const formatTime = (minutes?: number, hours?: number) => {
    if (hours) return `${hours} hours`
    if (minutes) {
      if (minutes < 60) return `${minutes} minutes`
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return m > 0 ? `${h} hours ${m} minutes` : `${h} hours`
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-och-steel/20 rounded w-1/3"></div>
          <div className="h-6 bg-och-steel/20 rounded w-2/3"></div>
          <Card className="p-6">
            <div className="h-64 bg-och-steel/20 rounded"></div>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !mission) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="p-6 border-och-orange/50 bg-och-orange/10">
          <div className="text-center">
            <p className="text-och-orange mb-4">{error || 'Mission not found'}</p>
            <Button variant="outline" onClick={() => router.push('/dashboard/mentor/missions/hall')}>
              <ArrowLeftIcon />
              <span className="ml-2">Back to Mission Hall</span>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/mentor/missions/hall')}
          >
            <ArrowLeftIcon />
            <span className="ml-2">Back to Mission Hall</span>
          </Button>
          <Button
            variant="gold"
            onClick={() => router.push('/dashboard/mentor/missions/registry')}
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            MCRR
          </Button>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-4xl">{getTypeIcon(mission.type || 'lab')}</span>
              <h1 className="text-4xl font-bold text-och-mint">{mission.code}</h1>
              <Badge variant={getDifficultyColor(mission.difficulty) as any} className="text-sm capitalize">
                {mission.difficulty}
              </Badge>
              <Badge variant="steel" className="text-sm capitalize">
                {mission.type}
              </Badge>
            </div>
            <h2 className="text-3xl font-semibold text-white mb-3">{mission.title}</h2>
            {mission.description && (
              <p className="text-lg text-och-steel leading-relaxed">{mission.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card className="bg-och-midnight/50 border border-och-steel/20">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Overview
              </h3>
              <div className="space-y-4">
                {formatTime(mission.estimated_time_minutes, mission.est_hours) && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="text-sm text-och-steel">Estimated Time</div>
                      <div className="text-white font-medium">{formatTime(mission.estimated_time_minutes, mission.est_hours)}</div>
                    </div>
                  </div>
                )}

                {trackInfo && (
                  <>
                    {trackInfo.name && (
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <div>
                          <div className="text-sm text-och-steel">Track</div>
                          <div className="text-white font-medium">{trackInfo.name}</div>
                        </div>
                      </div>
                    )}
                    {trackInfo.program_name && (
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <div>
                          <div className="text-sm text-och-steel">Program</div>
                          <div className="text-white font-medium">{trackInfo.program_name}</div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {mission.track_key && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <div>
                      <div className="text-sm text-och-steel">Track Key</div>
                      <div className="text-white font-medium font-mono">{mission.track_key}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Competencies */}
          {mission.competencies && mission.competencies.length > 0 && (
            <Card className="bg-och-midnight/50 border border-och-steel/20">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Competencies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mission.competencies.map((comp, idx) => (
                    <Badge key={idx} variant="defender" className="text-sm">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Requirements */}
          {mission.requirements && Object.keys(mission.requirements).length > 0 && (
            <Card className="bg-och-midnight/50 border border-och-steel/20">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Requirements & Details
                </h3>
                <div className="space-y-4">
                  {mission.requirements.story_narrative && (
                    <div>
                      <div className="text-sm font-medium text-och-steel mb-2">Story Narrative</div>
                      <p className="text-white whitespace-pre-wrap">{mission.requirements.story_narrative}</p>
                    </div>
                  )}

                  {mission.requirements.subtasks && Array.isArray(mission.requirements.subtasks) && mission.requirements.subtasks.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-och-steel mb-2">Subtasks</div>
                      <ol className="list-decimal list-inside space-y-2">
                        {mission.requirements.subtasks.map((subtask: any, idx: number) => (
                          <li key={idx} className="text-white">
                            <span className="font-medium">{subtask.title}</span>
                            {subtask.description && (
                              <span className="text-och-steel"> - {subtask.description}</span>
                            )}
                            {subtask.required && (
                              <Badge variant="orange" className="ml-2 text-xs">Required</Badge>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {mission.requirements.evidence_upload_schema && (
                    <div>
                      <div className="text-sm font-medium text-och-steel mb-2">Evidence Requirements</div>
                      <div className="bg-och-midnight rounded-lg p-4 space-y-2">
                        {mission.requirements.evidence_upload_schema.required_artifacts && (
                          <div>
                            <div className="text-xs text-och-steel mb-1">Required Artifacts:</div>
                            <ul className="list-disc list-inside space-y-1">
                              {mission.requirements.evidence_upload_schema.required_artifacts.map((artifact: any, idx: number) => (
                                <li key={idx} className="text-sm text-white">
                                  <span className="capitalize">{artifact.type}</span>
                                  {artifact.description && <span className="text-och-steel"> - {artifact.description}</span>}
                                  {artifact.required && <Badge variant="orange" className="ml-2 text-xs">Required</Badge>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mission.requirements.evidence_upload_schema.file_types && (
                          <div className="text-xs text-och-steel">
                            Allowed file types: {mission.requirements.evidence_upload_schema.file_types.join(', ')}
                          </div>
                        )}
                        {mission.requirements.evidence_upload_schema.max_file_size_mb && (
                          <div className="text-xs text-och-steel">
                            Max file size: {mission.requirements.evidence_upload_schema.max_file_size_mb} MB
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {mission.requirements.framework_mappings && Object.keys(mission.requirements.framework_mappings).length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-och-steel mb-2">Framework Mappings</div>
                      <div className="space-y-3">
                        {Object.entries(mission.requirements.framework_mappings).map(([framework, mappings]: [string, any]) => {
                          if (!Array.isArray(mappings) || mappings.length === 0) return null
                          return (
                            <div key={framework} className="bg-och-midnight rounded-lg p-3">
                              <div className="text-xs font-medium text-white mb-2 capitalize">
                                {framework.replace(/_/g, ' ')}
                              </div>
                              <div className="space-y-1">
                                {mappings.slice(0, 3).map((mapping: any, idx: number) => (
                                  <div key={idx} className="text-xs text-och-steel">
                                    {mapping.code || mapping.control || mapping.function || mapping.requirement || mapping.category}: {mapping.name || mapping.description || ''}
                                  </div>
                                ))}
                                {mappings.length > 3 && (
                                  <div className="text-xs text-och-steel">+{mappings.length - 3} more</div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card className="bg-och-midnight/50 border border-och-steel/20">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-och-steel mb-1">Mission Code</div>
                  <div className="text-white font-mono font-medium">{mission.code}</div>
                </div>
                <div>
                  <div className="text-xs text-och-steel mb-1">Difficulty</div>
                  <Badge variant={getDifficultyColor(mission.difficulty) as any} className="capitalize">
                    {mission.difficulty}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-och-steel mb-1">Type</div>
                  <Badge variant="steel" className="capitalize">
                    {mission.type}
                  </Badge>
                </div>
                {mission.status && (
                  <div>
                    <div className="text-xs text-och-steel mb-1">Status</div>
                    <Badge variant={mission.status === 'published' ? 'mint' : 'steel'} className="capitalize">
                      {mission.status}
                    </Badge>
                  </div>
                )}
                {mission.requires_mentor_review !== undefined && (
                  <div>
                    <div className="text-xs text-och-steel mb-1">Mentor Review</div>
                    <Badge variant={mission.requires_mentor_review ? 'orange' : 'steel'}>
                      {mission.requires_mentor_review ? 'Required' : 'Not Required'}
                    </Badge>
                  </div>
                )}
                {mission.assessment_mode && (
                  <div>
                    <div className="text-xs text-och-steel mb-1">Assessment Mode</div>
                    <Badge variant="steel" className="capitalize">
                      {mission.assessment_mode}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Note */}
          <Card className="bg-och-defender/10 border border-och-defender/30">
            <div className="p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-och-defender shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-och-defender mb-1">Read-Only View</div>
                  <div className="text-xs text-och-steel">
                    This is a read-only view of the mission. Use this information to guide your mentees.
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

