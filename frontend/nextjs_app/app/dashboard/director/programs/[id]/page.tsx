'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useProgram } from '@/hooks/usePrograms'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ProgramDetailPage() {
  const params = useParams()
  const programId = params?.id as string | undefined
  
  // Call hook before any conditional returns
  const { program, isLoading, error, reload } = useProgram(programId || '')
  
  // Safety check
  if (!programId) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="border-och-orange/50">
            <div className="p-6 text-center">
              <p className="text-och-orange mb-4">Invalid program ID</p>
              <Link href="/dashboard/director/programs">
                <Button variant="outline">Back to Programs</Button>
              </Link>
            </div>
          </Card>
        </DirectorLayout>
      </RouteGuard>
    )
  }
  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('ProgramDetailPage:', { programId, isLoading, error, hasProgram: !!program, program })
  }

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading program...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (error) {
    console.error('ProgramDetailPage error:', error)
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="border-och-orange/50">
            <div className="p-6 text-center">
              <p className="text-och-orange mb-2">Error loading program</p>
              <p className="text-sm text-och-steel mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard/director/programs">
                  <Button variant="outline">Back to Programs</Button>
                </Link>
              </div>
            </div>
          </Card>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (!program) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="border-och-orange/50">
            <div className="p-6 text-center">
              <p className="text-och-orange mb-4">Program not found</p>
              <p className="text-sm text-och-steel mb-4">Program ID: {programId}</p>
              <Link href="/dashboard/director/programs">
                <Button variant="outline">Back to Programs</Button>
              </Link>
            </div>
          </Card>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">{program.name}</h1>
                <p className="text-och-steel">{program.description || 'No description'}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={reload} disabled={isLoading}>
                  🔄 Refresh
                </Button>
                <Link href={`/dashboard/director/programs/${program.id}/edit`}>
                  <Button variant="defender" size="sm">
                    Edit Program
                  </Button>
                </Link>
                <Link href="/dashboard/director/programs">
                  <Button variant="outline" size="sm">
                    ← Back
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Category</p>
                <Badge variant="defender">{program.category}</Badge>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Duration</p>
                <p className="text-xl font-bold text-white">{program.duration_months} months</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Price</p>
                <p className="text-xl font-bold text-white">{program.currency} {program.default_price}</p>
              </div>
            </Card>
          </div>

          {program.outcomes && program.outcomes.length > 0 && (
            <Card className="mb-6">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Learning Outcomes</h2>
                <ul className="space-y-2">
                  {program.outcomes.map((outcome: string, idx: number) => (
                    <li key={idx} className="text-och-steel flex items-start gap-2">
                      <span className="text-och-defender mt-1">•</span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {program.tracks && program.tracks.length > 0 ? (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Tracks ({program.tracks.length})</h2>
                <div className="space-y-4">
                  {program.tracks.map((track: any) => (
                    <Card key={track.id} className="border-och-defender/30">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge variant={track.track_type === 'primary' ? 'defender' : 'gold'}>
                              {track.track_type === 'primary' ? 'Primary' : 'Cross-Track'}
                            </Badge>
                            <h3 className="text-lg font-semibold text-white">{track.name}</h3>
                          </div>
                          <Link href={`/dashboard/director/tracks/${track.id}`}>
                            <Button variant="outline" size="sm">
                              View Track
                            </Button>
                          </Link>
                        </div>
                        <p className="text-sm text-och-steel mb-3">{track.description}</p>
                        {track.milestones && track.milestones.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-och-steel/20">
                            <p className="text-xs text-och-steel mb-2">
                              {track.milestones.length} milestones,{' '}
                              {track.milestones.reduce((sum: number, m: any) => sum + (m.modules?.length || 0), 0)} modules
                            </p>
                            <div className="space-y-2">
                              {track.milestones.map((milestone: any) => (
                                <div key={milestone.id} className="p-2 bg-och-midnight/50 rounded text-sm">
                                  <p className="text-white font-medium">{milestone.name}</p>
                                  <p className="text-xs text-och-steel">
                                    {milestone.modules?.length || 0} modules
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="p-6 text-center">
                <p className="text-och-steel mb-4">No tracks defined yet</p>
                <Link href={`/dashboard/director/programs/${program.id}/edit`}>
                  <Button variant="defender">Add Tracks</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

