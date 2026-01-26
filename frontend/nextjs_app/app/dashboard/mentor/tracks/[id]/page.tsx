'use client'

import { useState, useEffect, type SVGProps } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useTrack } from '@/hooks/usePrograms'
import { programsClient, type Milestone, type Module } from '@/services/programsClient'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
// Layout is provided by app/dashboard/mentor/layout.tsx

const ChevronDownIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    className={['w-5 h-5', className].filter(Boolean).join(' ')}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const ChevronRightIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    className={['w-5 h-5', className].filter(Boolean).join(' ')}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

export default function MentorTrackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const trackId = params?.id as string | undefined
  
  // Log the track ID being used
  useEffect(() => {
    if (trackId) {
      console.log('🔍 Track detail page - Track ID:', trackId, typeof trackId)
    }
  }, [trackId])
  
  const { track, isLoading, error, reload } = useTrack(trackId || '')
  
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set())
  const [cohorts, setCohorts] = useState<any[]>([])
  const [loadingCohorts, setLoadingCohorts] = useState(false)

  // Load track details (milestones and modules)
  useEffect(() => {
    const loadTrackDetails = async () => {
      if (!trackId) return
      
      setLoadingDetails(true)
      try {
        const [milestonesData, modulesData] = await Promise.all([
          programsClient.getMilestones(trackId),
          programsClient.getModules(undefined, trackId),
        ])

        // Load modules for each milestone
        const modulesByMilestone: Record<string, Module[]> = {}
        for (const milestone of milestonesData) {
          if (milestone.id) {
            try {
              const milestoneModules = await programsClient.getModules(milestone.id)
              modulesByMilestone[milestone.id] = milestoneModules.sort((a, b) => (a.order || 0) - (b.order || 0))
            } catch (err) {
              console.error(`Failed to load modules for milestone ${milestone.id}:`, err)
              modulesByMilestone[milestone.id] = []
            }
          }
        }

        // Combine all modules
        const allModulesList = Object.values(modulesByMilestone).flat()
        const uniqueModules = Array.from(
          new Map(allModulesList.map(m => [m.id, m])).values()
        )

        setMilestones(milestonesData.sort((a, b) => (a.order || 0) - (b.order || 0)))
        setModules(uniqueModules.sort((a, b) => (a.order || 0) - (b.order || 0)))
      } catch (err) {
        console.error('Failed to load track details:', err)
      } finally {
        setLoadingDetails(false)
      }
    }

    if (trackId) {
      loadTrackDetails()
    }
  }, [trackId])

  // Load cohorts for this track
  useEffect(() => {
    const loadCohorts = async () => {
      if (!trackId) return
      
      setLoadingCohorts(true)
      try {
        const cohortsData = await programsClient.getCohorts({ page: 1, pageSize: 500 })
        const trackCohorts = cohortsData.results.filter((c: any) => String(c.track) === String(trackId))
        setCohorts(trackCohorts)
      } catch (err) {
        console.error('Failed to load cohorts:', err)
      } finally {
        setLoadingCohorts(false)
      }
    }

    if (trackId) {
      loadCohorts()
    }
  }, [trackId])

  const toggleMilestone = (milestoneId: string) => {
    const newExpanded = new Set(expandedMilestones)
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId)
    } else {
      newExpanded.add(milestoneId)
    }
    setExpandedMilestones(newExpanded)
  }

  const getMilestoneModules = (milestoneId: string) => {
    return modules.filter(m => m.milestone === milestoneId)
  }

  if (isLoading || loadingDetails) {
    return (
      <RouteGuard>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          <div className="text-center py-12">
            <div className="text-och-steel">Loading track details...</div>
          </div>
        </div>
      </RouteGuard>
    )
  }

  if (error || (!track && !isLoading)) {
    return (
      <RouteGuard>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          <Card className="p-6">
            <div className="text-och-orange mb-4">
              <div className="font-semibold mb-2">Error: {error || 'Track not found'}</div>
              {trackId && (
                <div className="text-sm text-och-steel">
                  Track ID: {trackId}
                </div>
              )}
              <div className="text-sm text-och-steel mt-2">
                The track may not exist or you may not have permission to view it.
              </div>
            </div>
            <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
              <Button variant="defender" onClick={() => reload()}>
                Retry
              </Button>
            </div>
          </Card>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-mint">{track!.name}</h1>
                <p className="text-och-steel text-lg">{track!.description}</p>
              </div>
              <Button variant="outline" onClick={() => router.back()}>
                ← Back to Cohorts & Tracks
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={track!.track_type === 'primary' ? 'defender' : 'gold'}>
                {track!.track_type === 'primary' ? 'Primary Track' : 'Cross-Track'}
              </Badge>
              {track!.key && (
                <Badge variant="outline">{track!.key}</Badge>
              )}
              {track!.program_name && (
                <span className="text-sm text-och-steel">Program: {track!.program_name}</span>
              )}
            </div>
          </div>

          {/* Track Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-6">
              <div className="text-sm text-och-steel mb-1">Milestones</div>
              <div className="text-3xl font-bold text-och-mint">{milestones.length}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-och-steel mb-1">Total Modules</div>
              <div className="text-3xl font-bold text-och-mint">{modules.length}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-och-steel mb-1">Cohorts</div>
              <div className="text-3xl font-bold text-och-mint">{cohorts.length}</div>
            </Card>
          </div>

          {/* Milestones and Modules */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Curriculum Structure</h2>
              
              {milestones.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-och-steel">No milestones defined for this track.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones.map((milestone) => {
                    const milestoneModules = getMilestoneModules(milestone.id || '')
                    const isExpanded = expandedMilestones.has(milestone.id || '')
                    
                    return (
                      <div
                        key={milestone.id}
                        className="border border-och-steel/20 rounded-lg overflow-hidden"
                      >
                        <div
                          className="p-4 bg-och-midnight/50 cursor-pointer hover:bg-och-midnight/70 transition-colors"
                          onClick={() => milestone.id && toggleMilestone(milestone.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDownIcon className="w-5 h-5 text-och-mint" />
                              ) : (
                                <ChevronRightIcon className="w-5 h-5 text-och-steel" />
                              )}
                              <div>
                                <h3 className="text-lg font-semibold text-white">
                                  {milestone.order}. {milestone.name}
                                </h3>
                                {milestone.description && (
                                  <p className="text-sm text-och-steel mt-1">{milestone.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {milestone.duration_weeks && (
                                <Badge variant="outline">
                                  {milestone.duration_weeks} week{milestone.duration_weeks !== 1 ? 's' : ''}
                                </Badge>
                              )}
                              <Badge variant="mint">
                                {milestoneModules.length} module{milestoneModules.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Modules */}
                        {isExpanded && milestoneModules.length > 0 && (
                          <div className="p-4 border-t border-och-steel/20 bg-och-midnight/30">
                            <div className="space-y-3">
                              {milestoneModules.map((module) => (
                                <div
                                  key={module.id}
                                  className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className="text-white font-medium">
                                        {module.order}. {module.name}
                                      </h4>
                                      {module.description && (
                                        <p className="text-sm text-och-steel mt-1">{module.description}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                      <Badge variant="outline" className="text-xs">
                                        {module.content_type}
                                      </Badge>
                                      {module.estimated_hours && (
                                        <Badge variant="outline" className="text-xs">
                                          {module.estimated_hours}h
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {module.skills && module.skills.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {module.skills.map((skill, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-2 py-1 bg-och-defender/20 text-och-mint rounded"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {module.content_url && (
                                    <div className="mt-3">
                                      <a
                                        href={module.content_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-och-mint hover:underline inline-flex items-center gap-1"
                                      >
                                        <span>🔗</span> View Content
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Cohorts */}
          {cohorts.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Associated Cohorts</h2>
                <div className="space-y-3">
                  {cohorts.map((cohort) => (
                    <div
                      key={cohort.id}
                      className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium">{cohort.name}</h3>
                          <div className="flex items-center gap-3 mt-2 text-sm text-och-steel">
                            <span>
                              {new Date(cohort.start_date).toLocaleDateString()} - {new Date(cohort.end_date).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>{cohort.mode}</span>
                            <span>•</span>
                            <span>{cohort.enrolled_count || 0} enrolled</span>
                          </div>
                        </div>
                        <Badge variant={
                          cohort.status === 'active' || cohort.status === 'running' ? 'mint' :
                          cohort.status === 'closing' ? 'orange' : 'steel'
                        }>
                          {cohort.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
    </RouteGuard>
  )
}

