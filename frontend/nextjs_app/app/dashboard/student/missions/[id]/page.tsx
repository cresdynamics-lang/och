'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiGateway } from '@/services/apiGateway'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, Loader2, AlertTriangle, Clock, Zap, Award } from 'lucide-react'
import Link from 'next/link'

interface MissionDetail {
  id: string
  code: string
  title: string
  description: string
  difficulty: string
  track_key: string
  estimated_duration_minutes?: number
  competency_tags?: string[]
  status?: string
  objectives?: string[]
  subtasks?: any[]
}

export default function MissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const missionId = params.id as string
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [mission, setMission] = useState<MissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/student')
    }
  }, [isAuthenticated, authLoading, router])

  // Load mission details
  useEffect(() => {
    if (!isAuthenticated || authLoading || !missionId) return

    const loadMission = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiGateway.get<MissionDetail>(
          `/student/missions/${missionId}/`
        )
        setMission(response)
      } catch (err: any) {
        console.error('Failed to load mission:', err)
        if (err?.response?.status === 401) {
          router.push('/login/student')
        } else {
          setError(err?.message || 'Failed to load mission details')
        }
      } finally {
        setLoading(false)
      }
    }

    loadMission()
  }, [missionId, isAuthenticated, authLoading, router])

  const handleStartMission = async () => {
    setStarting(true)
    try {
      // Create or update submission to start the mission
      await apiGateway.post(`/student/missions/${missionId}/start`, {})
      
      // Navigate to mission execution page
      router.push(`/dashboard/student/missions/${missionId}/execute`)
    } catch (err: any) {
      console.error('Failed to start mission:', err)
      alert('Failed to start mission. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  if (!isAuthenticated || authLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-och-gold" />
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-och-gold" />
        </motion.div>
      </div>
    )
  }

  if (error || !mission) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/dashboard/student/missions">
            <motion.div
              whileHover={{ x: -4 }}
              className="inline-flex items-center gap-2 text-och-defender hover:text-och-gold transition-colors mb-6"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-widest">Back to Missions</span>
            </motion.div>
          </Link>
          <Card className="p-8 bg-och-midnight/90 border border-och-defender/40">
            <div className="flex items-center gap-4 mb-4">
              <AlertTriangle className="w-8 h-8 text-och-defender flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Failed to Load Mission</h2>
                <p className="text-och-steel mt-1">{error || 'Mission not found'}</p>
              </div>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="defender"
              className="mt-4"
            >
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Back Navigation */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
        <Link href="/dashboard/student/missions">
          <motion.div
            whileHover={{ x: -4 }}
            className="inline-flex items-center gap-2 text-och-defender hover:text-och-gold transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-bold text-sm uppercase tracking-widest">Back to Missions</span>
          </motion.div>
        </Link>
      </div>

      {/* Mission Header */}
      <section className="w-full border-b border-och-steel/10 bg-gradient-to-r from-och-gold/10 via-och-defender/10 to-och-mint/10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm font-bold text-och-gold">{mission.code}</span>
                  <span className="inline-block px-3 py-1 rounded-full bg-och-defender/20 border border-och-defender/40 text-och-defender text-xs font-semibold">
                    {mission.difficulty}
                  </span>
                  <span className="inline-block px-3 py-1 rounded-full bg-och-mint/20 border border-och-mint/40 text-och-mint text-xs font-semibold">
                    {mission.track_key}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{mission.title}</h1>
                <p className="text-och-steel text-lg max-w-2xl">{mission.description}</p>
              </div>
            </div>

            {/* Mission Metadata */}
            <div className="flex flex-wrap gap-4">
              {mission.estimated_duration_minutes && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-och-midnight/60 border border-och-steel/20">
                  <Clock className="w-5 h-5 text-och-gold" />
                  <span className="text-och-steel text-sm">
                    ~{Math.ceil(mission.estimated_duration_minutes / 60)} hours
                  </span>
                </div>
              )}
              {mission.competency_tags && mission.competency_tags.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-och-midnight/60 border border-och-steel/20">
                  <Zap className="w-5 h-5 text-och-orange" />
                  <span className="text-och-steel text-sm">
                    {mission.competency_tags.length} competencies
                  </span>
                </div>
              )}
              {mission.status && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-och-midnight/60 border border-och-steel/20">
                  <Award className="w-5 h-5 text-och-mint" />
                  <span className="text-och-steel text-sm capitalize">
                    {mission.status.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Content */}
      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Objectives */}
            {mission.objectives && mission.objectives.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                  <h2 className="text-xl font-bold text-white mb-4">Mission Objectives</h2>
                  <ul className="space-y-3">
                    {mission.objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-och-defender/20 border border-och-defender/40 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-och-defender">{idx + 1}</span>
                        </span>
                        <span className="text-och-steel pt-0.5">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            )}

            {/* Subtasks */}
            {mission.subtasks && mission.subtasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                  <h2 className="text-xl font-bold text-white mb-4">Subtasks</h2>
                  <div className="space-y-4">
                    {mission.subtasks.map((subtask, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-och-midnight/40 border border-och-steel/10 hover:border-och-steel/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white mb-1">
                              {subtask.title || subtask.name || `Subtask ${idx + 1}`}
                            </h3>
                            {subtask.description && (
                              <p className="text-och-steel text-sm">{subtask.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Start */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 bg-gradient-to-br from-och-defender/20 to-och-orange/20 border border-och-defender/40">
                <h3 className="text-lg font-bold text-white mb-4">Ready to Begin?</h3>
                <Button
                  variant="defender"
                  className="w-full text-lg py-3"
                  onClick={handleStartMission}
                  disabled={starting}
                >
                  {starting ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Starting...</>
                  ) : (
                    'Start Mission'
                  )}
                </Button>
                <p className="text-och-steel text-xs text-center mt-4">
                  You can pause and resume this mission anytime
                </p>
              </Card>
            </motion.div>

            {/* Competencies */}
            {mission.competency_tags && mission.competency_tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                  <h3 className="text-lg font-bold text-white mb-4">Skills You'll Develop</h3>
                  <div className="flex flex-wrap gap-2">
                    {mission.competency_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-3 py-1 rounded-full bg-och-mint/20 border border-och-mint/40 text-och-mint text-xs font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

