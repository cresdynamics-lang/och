'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { programsClient, type Program, type Track, type Milestone, type Module } from '@/services/programsClient'
import { usePrograms, useTracks } from '@/hooks/usePrograms'
import Link from 'next/link'

interface CurriculumStats {
  activePrograms: number
  publishedMissions: number
  assessmentWindows: number
  tracksConfigured: number
  totalModules: number
  totalMilestones: number
}

const BookIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const RocketIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const ChartBarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

export default function CurriculumPage() {
  const { programs, isLoading: programsLoading } = usePrograms()
  const { tracks, isLoading: tracksLoading } = useTracks()
  
  const [stats, setStats] = useState<CurriculumStats>({
    activePrograms: 0,
    publishedMissions: 0,
    assessmentWindows: 0,
    tracksConfigured: 0,
    totalModules: 0,
    totalMilestones: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    loadStats()
  }, [programs, tracks])

  const loadStats = async () => {
    setIsLoadingStats(true)
    try {
      let totalModules = 0
      let totalMilestones = 0

      // Load modules and milestones for all tracks
      for (const track of tracks) {
        try {
          const milestones = await programsClient.getMilestones(String(track.id))
          totalMilestones += milestones.length
          
          for (const milestone of milestones) {
            if (milestone.id) {
              const modules = await programsClient.getModules(milestone.id)
              totalModules += modules.length
            }
          }
        } catch (err) {
          console.error(`Failed to load stats for track ${track.id}:`, err)
        }
      }

      setStats({
        activePrograms: programs.filter(p => p.status === 'active').length,
        publishedMissions: 0, // TODO: Fetch from missions API
        assessmentWindows: 0, // TODO: Fetch from assessments API
        tracksConfigured: tracks.length,
        totalModules,
        totalMilestones,
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-gold flex items-center gap-3">
              <BookIcon />
              Curriculum Engine
            </h1>
            <p className="text-och-steel">
              Define curriculum structure, manage missions, and configure assessments to guide learner transformation
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Link href="/dashboard/director/curriculum/structure">
              <Card className="hover:border-och-defender/50 transition-all hover:scale-[1.02] cursor-pointer h-full">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-och-defender/20 flex items-center justify-center">
                      <BookIcon />
                    </div>
                    <h3 className="text-lg font-bold text-white">Define Structure</h3>
                  </div>
                  <p className="text-och-steel text-sm mb-4">
                    Manage Track → Modules → Lessons → Missions hierarchy
                  </p>
                  <div className="flex items-center text-och-mint text-sm">
                    Manage <ChevronRightIcon />
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/director/curriculum/missions">
              <Card className="hover:border-och-defender/50 transition-all hover:scale-[1.02] cursor-pointer h-full">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-och-mint/20 flex items-center justify-center">
                      <RocketIcon />
                    </div>
                    <h3 className="text-lg font-bold text-white">Manage Missions</h3>
                  </div>
                  <p className="text-och-steel text-sm mb-4">
                    Publish missions, link to tracks, configure competencies
                  </p>
                  <div className="flex items-center text-och-mint text-sm">
                    Manage <ChevronRightIcon />
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/director/curriculum/scoring">
              <Card className="hover:border-och-defender/50 transition-all hover:scale-[1.02] cursor-pointer h-full">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-och-gold/20 flex items-center justify-center">
                      <ChartBarIcon />
                    </div>
                    <h3 className="text-lg font-bold text-white">Scoring Rules</h3>
                  </div>
                  <p className="text-och-steel text-sm mb-4">
                    Modify scoring breakdown and define success metrics
                  </p>
                  <div className="flex items-center text-och-mint text-sm">
                    Configure <ChevronRightIcon />
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/director/rules">
              <Card className="hover:border-och-defender/50 transition-all hover:scale-[1.02] cursor-pointer h-full">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-och-orange/20 flex items-center justify-center">
                      <DocumentIcon />
                    </div>
                    <h3 className="text-lg font-bold text-white">Program Rules</h3>
                  </div>
                  <p className="text-och-steel text-sm mb-4">
                    Define graduation logic and completion criteria
                  </p>
                  <div className="flex items-center text-och-mint text-sm">
                    Configure <ChevronRightIcon />
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Curriculum Overview Stats */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Curriculum Overview</h2>
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Active Programs</p>
                    <p className="text-2xl font-bold text-white">{stats.activePrograms}</p>
                  </div>
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Tracks Configured</p>
                    <p className="text-2xl font-bold text-white">{stats.tracksConfigured}</p>
                  </div>
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Total Milestones</p>
                    <p className="text-2xl font-bold text-white">{stats.totalMilestones}</p>
                  </div>
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Total Modules</p>
                    <p className="text-2xl font-bold text-white">{stats.totalModules}</p>
                  </div>
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Published Missions</p>
                    <p className="text-2xl font-bold text-white">{stats.publishedMissions}</p>
                  </div>
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Assessment Windows</p>
                    <p className="text-2xl font-bold text-white">{stats.assessmentWindows}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Program Structure Overview */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Program Structure</h2>
              {programsLoading || tracksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                </div>
              ) : programs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-och-steel">No programs configured yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {programs.map((program) => {
                    const programTracks = tracks.filter(t => String(t.program) === String(program.id))
                    return (
                      <div
                        key={program.id}
                        className="p-5 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">{program.name}</h3>
                            <p className="text-sm text-och-steel mb-2">{program.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant={program.status === 'active' ? 'mint' : 'steel'}>
                                {program.status}
                              </Badge>
                              <span className="text-och-steel text-sm">
                                {programTracks.length} track{programTracks.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          <Link href={`/dashboard/director/programs/${program.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>

                        {/* Tracks */}
                        {programTracks.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-och-steel/20">
                            <p className="text-sm font-medium text-och-steel mb-2">Tracks</p>
                            <div className="space-y-2">
                              {programTracks.map((track) => (
                                <Link
                                  key={track.id}
                                  href={`/dashboard/director/tracks/${track.id}`}
                                  className="flex items-center justify-between p-3 bg-och-midnight rounded-lg hover:bg-och-midnight/70 transition-colors"
                                >
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-white font-medium">{track.name}</span>
                                      <Badge variant={track.track_type === 'primary' ? 'defender' : 'gold'}>
                                        {track.track_type === 'primary' ? 'Primary' : 'Cross-Track'}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-och-steel">{track.description}</p>
                                  </div>
                                  <ChevronRightIcon />
                                </Link>
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

          {/* Curriculum Hierarchy Info */}
          <Card className="mt-6">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Curriculum Hierarchy</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-och-midnight/30 rounded-lg border border-och-defender/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-och-defender"></div>
                    <h4 className="font-semibold text-white">Track</h4>
                  </div>
                  <p className="text-sm text-och-steel">
                    Focused learning paths (Cyber Defense, Offensive Security, GRC)
                  </p>
                </div>
                <div className="p-4 bg-och-midnight/30 rounded-lg border border-och-mint/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-och-mint"></div>
                    <h4 className="font-semibold text-white">Milestone</h4>
                  </div>
                  <p className="text-sm text-och-steel">
                    Major checkpoints within a track containing multiple modules
                  </p>
                </div>
                <div className="p-4 bg-och-midnight/30 rounded-lg border border-och-gold/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-och-gold"></div>
                    <h4 className="font-semibold text-white">Module</h4>
                  </div>
                  <p className="text-sm text-och-steel">
                    Content units (videos, articles, quizzes, labs) within milestones
                  </p>
                </div>
                <div className="p-4 bg-och-midnight/30 rounded-lg border border-och-orange/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-och-orange"></div>
                    <h4 className="font-semibold text-white">Mission</h4>
                  </div>
                  <p className="text-sm text-och-steel">
                    Practical assessments linked to competencies and tracks
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}