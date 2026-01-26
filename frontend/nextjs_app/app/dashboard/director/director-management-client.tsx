'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { directorClient } from '@/services/directorClient'
import { programsClient } from '@/services/programsClient'

interface Program {
  id: string
  name: string
  status: string
  duration_months?: number
}

interface Track {
  id: string
  name: string
  program: string
  program_name?: string
}

interface Cohort {
  id: string
  name: string
  track: string
  track_name?: string
  status: string
  seat_cap: number
  enrolled_count?: number
}

export default function DirectorManagementClient() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'programs' | 'tracks' | 'cohorts' | 'enrollments'>('overview')
  const [programs, setPrograms] = useState<Program[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check URL params on mount
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab && ['overview', 'programs', 'tracks', 'cohorts', 'enrollments'].includes(tab)) {
      setActiveTab(tab as any)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'programs' || activeTab === 'overview') {
        const progs = await directorClient.getPrograms()
        setPrograms(Array.isArray(progs) ? progs : [])
      }
      if (activeTab === 'tracks' || activeTab === 'overview') {
        const trks = await directorClient.getTracks()
        setTracks(Array.isArray(trks) ? trks : [])
      }
      if (activeTab === 'cohorts' || activeTab === 'overview') {
        const chts = await directorClient.getCohorts()
        setCohorts(Array.isArray(chts) ? chts : [])
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'programs', label: 'Programs', icon: '🎯' },
    { id: 'tracks', label: 'Tracks', icon: '🛤️' },
    { id: 'cohorts', label: 'Cohorts', icon: '👥' },
    { id: 'enrollments', label: 'Enrollments', icon: '📝' },
  ]

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-orange">Program Director</h1>
          <p className="text-och-steel">Manage programs, tracks, cohorts, and enrollments</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-och-slate-700">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any)
                  window.history.pushState({}, '', `/dashboard/director?tab=${tab.id}`)
                }}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-och-mint text-och-mint'
                    : 'border-transparent text-och-steel hover:text-och-mint'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
                <div className="text-och-steel text-sm mb-1">Total Programs</div>
                <div className="text-3xl font-bold text-och-mint">{programs.length}</div>
              </div>
              <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
                <div className="text-och-steel text-sm mb-1">Total Tracks</div>
                <div className="text-3xl font-bold text-och-mint">{tracks.length}</div>
              </div>
              <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
                <div className="text-och-steel text-sm mb-1">Active Cohorts</div>
                <div className="text-3xl font-bold text-och-mint">
                  {cohorts.filter(c => c.status === 'active' || c.status === 'running').length}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
              <h2 className="text-xl font-bold text-och-mint mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/dashboard/director/programs/new"
                  className="p-4 bg-och-slate-900 rounded-lg border border-och-slate-700 hover:border-och-mint transition-colors"
                >
                  <div className="text-2xl mb-2">➕</div>
                  <div className="font-semibold text-och-mint">Create Program</div>
                  <div className="text-sm text-och-steel mt-1">Define new program</div>
                </Link>
                <Link
                  href="/dashboard/director/cohorts/new"
                  className="p-4 bg-och-slate-900 rounded-lg border border-och-slate-700 hover:border-och-mint transition-colors"
                >
                  <div className="text-2xl mb-2">📅</div>
                  <div className="font-semibold text-och-mint">Create Cohort</div>
                  <div className="text-sm text-och-steel mt-1">Start new cohort</div>
                </Link>
                <Link
                  href="/dashboard/director/rules"
                  className="p-4 bg-och-slate-900 rounded-lg border border-och-slate-700 hover:border-och-mint transition-colors"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-semibold text-och-mint">Define Rules</div>
                  <div className="text-sm text-och-steel mt-1">Completion criteria</div>
                </Link>
                <Link
                  href="/dashboard/director/mentors"
                  className="p-4 bg-och-slate-900 rounded-lg border border-och-slate-700 hover:border-och-mint transition-colors"
                >
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-semibold text-och-mint">Assign Mentors</div>
                  <div className="text-sm text-och-steel mt-1">Manage mentors</div>
                </Link>
              </div>
            </div>

            {/* Recent Programs */}
            <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-och-mint">Programs</h2>
                <Link
                  href="/dashboard/director/programs/new"
                  className="px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors text-sm"
                >
                  + New Program
                </Link>
              </div>
              {loading ? (
                <div className="text-och-steel">Loading...</div>
              ) : programs.length === 0 ? (
                <div className="text-och-steel py-8 text-center">
                  No programs yet. <Link href="/dashboard/director/programs/new" className="text-och-mint hover:underline">Create one</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {programs.slice(0, 5).map((program) => (
                    <Link
                      key={program.id}
                      href={`/dashboard/director/programs/${program.id}`}
                      className="block p-4 bg-och-slate-900 rounded-lg border border-och-slate-700 hover:border-och-mint transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-och-mint">{program.name}</div>
                          <div className="text-sm text-och-steel">{program.duration_months || 'N/A'} months</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          program.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-och-steel/20 text-och-steel'
                        }`}>
                          {program.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Cohorts */}
            <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-och-mint">Cohorts</h2>
                <Link
                  href="/dashboard/director/cohorts/new"
                  className="px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors text-sm"
                >
                  + New Cohort
                </Link>
              </div>
              {loading ? (
                <div className="text-och-steel">Loading...</div>
              ) : cohorts.length === 0 ? (
                <div className="text-och-steel py-8 text-center">
                  No cohorts yet. <Link href="/dashboard/director/cohorts/new" className="text-och-mint hover:underline">Create one</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {cohorts.slice(0, 5).map((cohort) => (
                    <Link
                      key={cohort.id}
                      href={`/dashboard/director/cohorts/${cohort.id}`}
                      className="block p-4 bg-och-slate-900 rounded-lg border border-och-slate-700 hover:border-och-mint transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-och-mint">{cohort.name}</div>
                          <div className="text-sm text-och-steel">
                            {cohort.enrolled_count || 0} / {cohort.seat_cap} seats
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          cohort.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' :
                          cohort.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-och-steel/20 text-och-steel'
                        }`}>
                          {cohort.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-och-mint">Programs</h2>
              <Link
                href="/dashboard/director/programs/new"
                className="px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors"
              >
                + Create Program
              </Link>
            </div>
            {loading ? (
              <div className="text-och-steel">Loading programs...</div>
            ) : programs.length === 0 ? (
              <div className="text-och-steel py-8 text-center">
                No programs found. <Link href="/dashboard/director/programs/new" className="text-och-mint hover:underline">Create your first program</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {programs.map((program) => (
                  <Link
                    key={program.id}
                    href={`/dashboard/director/programs/${program.id}`}
                    className="block p-4 bg-och-slate-900 rounded-lg border border-och-slate-700 hover:border-och-mint transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-och-mint mb-1">{program.name}</div>
                        <div className="text-sm text-och-steel">
                          Duration: {program.duration_months || 'N/A'} months
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        program.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-och-steel/20 text-och-steel'
                      }`}>
                        {program.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tracks' && (
          <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-och-mint">Tracks</h2>
              <button
                onClick={() => alert('Create track - select a program first')}
                className="px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors"
              >
                + Create Track
              </button>
            </div>
            {loading ? (
              <div className="text-och-steel">Loading tracks...</div>
            ) : tracks.length === 0 ? (
              <div className="text-och-steel py-8 text-center">
                No tracks found. Create a program first, then add tracks to it.
              </div>
            ) : (
              <div className="space-y-3">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="p-4 bg-och-slate-900 rounded-lg border border-och-slate-700"
                  >
                    <div className="font-semibold text-lg text-och-mint mb-1">{track.name}</div>
                    <div className="text-sm text-och-steel">Program: {track.program_name || track.program}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'cohorts' && (
          <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-och-mint">Cohorts</h2>
              <Link
                href="/dashboard/director/cohorts/new"
                className="px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors"
              >
                + Create Cohort
              </Link>
            </div>
            {loading ? (
              <div className="text-och-steel">Loading cohorts...</div>
            ) : cohorts.length === 0 ? (
              <div className="text-och-steel py-8 text-center">
                No cohorts found. <Link href="/dashboard/director/cohorts/new" className="text-och-mint hover:underline">Create your first cohort</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {cohorts.map((cohort) => (
                  <Link
                    key={cohort.id}
                    href={`/dashboard/director/cohorts/${cohort.id}`}
                    className="block p-4 bg-och-slate-900 rounded-lg border border-och-slate-700 hover:border-och-mint transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-och-mint mb-1">{cohort.name}</div>
                        <div className="text-sm text-och-steel">
                          {cohort.track_name || cohort.track} • {cohort.enrolled_count || 0} / {cohort.seat_cap} seats
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        cohort.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' :
                        cohort.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-och-steel/20 text-och-steel'
                      }`}>
                        {cohort.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'enrollments' && (
          <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
            <h2 className="text-2xl font-bold text-och-mint mb-6">Enrollments</h2>
            <div className="text-och-steel">
              Enrollment management coming soon. Use the cohort detail pages to manage enrollments.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

