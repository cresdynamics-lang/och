'use client'

import { useParams, useRouter } from 'next/navigation'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useTalentScopeView } from '@/hooks/useTalentScopeView'
import { useAuth } from '@/hooks/useAuth'
import { useMentorMentees } from '@/hooks/useMentorMentees'
import { useMenteeFlags } from '@/hooks/useMenteeFlags'
import { mentorClient } from '@/services/mentorClient'
import { djangoClient } from '@/services/djangoClient'
import type { AssignedMentee } from '@/services/types/mentor'
import type { User } from '@/services/types'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from 'recharts'

export default function MenteeAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const menteeId = params.menteeId as string
  
  const { mentees } = useMentorMentees(mentorId)
  const { view, isLoading, error } = useTalentScopeView(mentorId, menteeId)

  const { flagMentee, reload: reloadFlags } = useMenteeFlags(mentorId)
  const [student, setStudent] = useState<AssignedMentee | null>(null)
  const [studentDetails, setStudentDetails] = useState<User | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagForm, setFlagForm] = useState({
    flag_type: 'struggling' as 'struggling' | 'at_risk' | 'needs_attention' | 'technical_issue',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    description: '',
  })
  const [isFlagging, setIsFlagging] = useState(false)
  const [flagError, setFlagError] = useState<string | null>(null)
  const [flagSuccess, setFlagSuccess] = useState(false)

  useEffect(() => {
    if (mentees.length > 0 && menteeId) {
      const found = mentees.find(m => m.id === menteeId || m.user_id === menteeId)
      if (found) {
        setStudent(found)
        
        // Fetch detailed student information
        if (found.user_id) {
          setLoadingDetails(true)
          djangoClient.users.getUser(Number(found.user_id))
            .then((user) => {
              setStudentDetails(user)
            })
            .catch((err) => {
              console.error('Failed to load student details:', err)
            })
            .finally(() => {
              setLoadingDetails(false)
            })
        }
      } else {
        setStudent(null)
        setStudentDetails(null)
      }
    } else if (mentees.length === 0 && menteeId) {
      // If no mentees loaded yet, wait for them
      setStudent(null)
    }
  }, [mentees, menteeId])

  if (!mentorId) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
        <div className="text-och-steel">Please log in to view analytics.</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-och-mint hover:text-och-defender mb-4 flex items-center gap-2 text-sm"
        >
          <span>←</span> Back to Analytics
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-mint">

              {student?.name || 'Student Analytics'}
            </h1>
            <p className="text-och-steel text-sm">
              {student?.cohort && <span>Cohort: {student.cohort} • </span>}
              {student?.track && <span>Track: {student.track} • </span>}
              Comprehensive TalentScope analytics and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="orange"
              size="sm"
              onClick={() => setShowFlagModal(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Flag Student
            </Button>
            {student?.avatar_url && (
              <img
                src={student.avatar_url}
                alt={student.name}
                className="w-16 h-16 rounded-full border-2 border-och-mint/20"
              />
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-och-steel text-sm py-8 text-center">Loading analytics...</div>
      )}

      {error && (
        <Card>
          <div className="p-6">
            <div className="text-och-orange text-sm">Error: {error}</div>
            <button
              onClick={() => router.push('/dashboard/mentor/analytics')}
              className="mt-4 text-och-mint hover:text-och-defender text-sm"
            >
              Return to Analytics Dashboard
            </button>
          </div>
        </Card>
      )}

      {!isLoading && !error && view && (
        <div className="space-y-6">

          {/* Student Personal Details */}
          {student && (
            <Card>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Student Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4">
                    {student.avatar_url && (
                      <img
                        src={student.avatar_url}
                        alt={student.name}
                        className="w-20 h-20 rounded-full border-2 border-och-mint/20"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-white">{student.name}</h3>
                      <p className="text-sm text-och-steel">{student.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {studentDetails && (
                      <>
                        {studentDetails.first_name && studentDetails.last_name && (
                          <div>
                            <span className="text-xs text-och-steel">Full Name:</span>
                            <p className="text-sm text-white">{studentDetails.first_name} {studentDetails.last_name}</p>
                          </div>
                        )}
                        {studentDetails.phone_number && (
                          <div>
                            <span className="text-xs text-och-steel">Phone:</span>
                            <p className="text-sm text-white">{studentDetails.phone_number}</p>
                          </div>
                        )}
                        {studentDetails.country && (
                          <div>
                            <span className="text-xs text-och-steel">Country:</span>
                            <p className="text-sm text-white">{studentDetails.country}</p>
                          </div>
                        )}
                        {studentDetails.timezone && (
                          <div>
                            <span className="text-xs text-och-steel">Timezone:</span>
                            <p className="text-sm text-white">{studentDetails.timezone}</p>
                          </div>
                        )}
                      </>
                    )}
                    {loadingDetails && (
                      <div className="text-xs text-och-steel">Loading details...</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {student.cohort && (
                      <div>
                        <span className="text-xs text-och-steel">Cohort:</span>
                        <p className="text-sm text-white">{student.cohort}</p>
                      </div>
                    )}
                    {student.track && (
                      <div>
                        <span className="text-xs text-och-steel">Track:</span>
                        <p className="text-sm text-white">{student.track}</p>
                      </div>
                    )}
                    {student.readiness_score !== undefined && (
                      <div>
                        <span className="text-xs text-och-steel">Readiness Score:</span>
                        <p className="text-sm font-semibold text-och-mint">{student.readiness_score.toFixed(1)}%</p>
                      </div>
                    )}
                    {student.risk_level && (
                      <div>
                        <span className="text-xs text-och-steel">Risk Level:</span>
                        <Badge variant={student.risk_level === 'high' ? 'orange' : student.risk_level === 'medium' ? 'gold' : 'mint'}>
                          {student.risk_level}
                        </Badge>
                      </div>
                    )}
                  </div>
                  {studentDetails?.bio && (
                    <div className="md:col-span-2">
                      <span className="text-xs text-och-steel">Bio:</span>
                      <p className="text-sm text-white mt-1">{studentDetails.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Core Readiness Score - Prominent Display */}
          {view.core_readiness_score !== undefined && view.core_readiness_score !== null && (
            <Card>
              <div className="p-6 bg-gradient-to-r from-och-midnight to-och-midnight/80 rounded-lg border border-och-mint/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-och-steel mb-1">Core Readiness Score</h3>
                    <div className="flex items-baseline gap-3">

                      <span className="text-4xl font-bold text-white">{Number(view.core_readiness_score).toFixed(1)}%</span>
                      {view.career_readiness_stage && (
                        <span className="text-sm text-och-mint capitalize px-2 py-1 bg-och-mint/10 rounded">
                          {view.career_readiness_stage}
                        </span>
                      )}
                    </div>
                  </div>

                  {view.learning_velocity !== undefined && view.learning_velocity !== null && (
                    <div className="text-right">
                      <div className="text-xs text-och-steel">Learning Velocity</div>
                      <div className="text-lg font-semibold text-white">{Number(view.learning_velocity).toFixed(1)} pts/mo</div>
                    </div>
                  )}
                </div>
                <ProgressBar

                  value={Number(view.core_readiness_score)}
                  variant={Number(view.core_readiness_score) >= 80 ? 'mint' : Number(view.core_readiness_score) >= 60 ? 'defender' : Number(view.core_readiness_score) >= 40 ? 'gold' : 'orange'}
                  className="mt-2"
                />
                {view.estimated_readiness_window && (
                  <div className="mt-3 text-xs text-och-steel">
                    Estimated Readiness Window: <span className="text-white">{view.estimated_readiness_window}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Readiness Breakdown */}
          {view.readiness_breakdown && Object.keys(view.readiness_breakdown).length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Readiness Breakdown</h3>

                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.entries(view.readiness_breakdown).map(([category, score]) => ({
                      category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                      score: Number(score) || 0,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="category" stroke="#64748B" style={{ fontSize: '12px' }} />
                      <YAxis domain={[0, 100]} stroke="#64748B" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#E2E8F0' }}
                      />
                      <Bar dataKey="score" fill="#33FFC1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(view.readiness_breakdown).map(([category, score]) => (
                    <div key={category} className="p-3 bg-och-midnight rounded border border-och-steel/20">
                      <div className="text-xs text-och-steel mb-1 capitalize">{category}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-och-midnight rounded-full overflow-hidden">
                          <div
                            className="h-full bg-och-mint"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white w-12 text-right">{score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Gap Analysis */}
          {view.gap_analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              {view.gap_analysis.strengths && view.gap_analysis.strengths.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-och-mint mb-2">Strengths</h3>
                    <ul className="space-y-1">
                      {view.gap_analysis.strengths.map((strength, idx) => (
                        <li key={idx} className="text-xs text-white flex items-start gap-2">
                          <span className="text-och-mint mt-0.5">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}

              {/* Weaknesses */}
              {view.gap_analysis.weaknesses && view.gap_analysis.weaknesses.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-och-orange mb-2">Areas for Improvement</h3>
                    <ul className="space-y-1">
                      {view.gap_analysis.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-xs text-white flex items-start gap-2">
                          <span className="text-och-orange mt-0.5">⚠</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}

              {/* Missing Skills */}
              {view.gap_analysis.missing_skills && view.gap_analysis.missing_skills.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-och-gold mb-2">Missing Skills</h3>
                    <ul className="space-y-1">
                      {view.gap_analysis.missing_skills.map((skill, idx) => (
                        <li key={idx} className="text-xs text-white flex items-start gap-2">
                          <span className="text-och-gold mt-0.5">○</span>
                          <span>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}

              {/* Improvement Plan */}
              {view.gap_analysis.improvement_plan && view.gap_analysis.improvement_plan.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-och-defender mb-2">Improvement Plan</h3>
                    <ul className="space-y-1">
                      {view.gap_analysis.improvement_plan.map((item, idx) => (
                        <li key={idx} className="text-xs text-white flex items-start gap-2">
                          <span className="text-och-defender mt-0.5">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Professional Tier Data */}
          {view.professional_tier_data && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-white">Professional Tier Analytics</h3>
                  <span className="text-xs px-2 py-0.5 bg-och-gold/20 text-och-gold rounded">Premium</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {view.professional_tier_data.job_fit_score !== undefined && view.professional_tier_data.job_fit_score !== null && (
                    <div>
                      <div className="text-xs text-och-steel mb-1">Job Fit Score</div>
                      <div className="text-2xl font-bold text-white">{Number(view.professional_tier_data.job_fit_score).toFixed(1)}%</div>
                      <div className="w-full h-2 bg-och-midnight rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-och-gold"
                          style={{ width: `${Number(view.professional_tier_data.job_fit_score)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {view.professional_tier_data.hiring_timeline_prediction && (
                    <div>
                      <div className="text-xs text-och-steel mb-1">Hiring Timeline Prediction</div>
                      <div className="text-lg font-semibold text-white">{view.professional_tier_data.hiring_timeline_prediction}</div>
                    </div>
                  )}
                </div>
                {view.professional_tier_data.track_benchmarks && Object.keys(view.professional_tier_data.track_benchmarks).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-och-steel/20">
                    <div className="text-xs text-och-steel mb-2">Track Benchmarks</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(view.professional_tier_data.track_benchmarks).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-och-steel capitalize">{key.replace('_', ' ')}:</span>
                          <span className="text-white">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Ingested Signals */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Ingested Signals</h3>

              <div className="mb-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { name: 'Mentor Evaluations', value: view.ingested_signals.mentor_evaluations },
                      { name: 'Habit Logs', value: view.ingested_signals.habit_logs },
                      { name: 'Mission Scores', value: view.ingested_signals.mission_scores },
                      { name: 'Community Engagement', value: view.ingested_signals.community_engagement },
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="name" stroke="#64748B" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#E2E8F0' }}
                    />
                    <Bar dataKey="value" fill="#33FFC1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-och-midnight rounded border border-och-steel/20">
                  <div className="text-xs text-och-steel mb-1">Mentor Evaluations</div>
                  <div className="text-xl font-bold text-white">{view.ingested_signals.mentor_evaluations}</div>
                </div>
                <div className="p-3 bg-och-midnight rounded border border-och-steel/20">
                  <div className="text-xs text-och-steel mb-1">Habit Logs</div>
                  <div className="text-xl font-bold text-white">{view.ingested_signals.habit_logs}</div>
                </div>
                <div className="p-3 bg-och-midnight rounded border border-och-steel/20">
                  <div className="text-xs text-och-steel mb-1">Mission Scores</div>
                  <div className="text-xl font-bold text-white">{view.ingested_signals.mission_scores}</div>
                </div>
                <div className="p-3 bg-och-midnight rounded border border-och-steel/20">
                  <div className="text-xs text-och-steel mb-1">Community Engagement</div>
                  <div className="text-xl font-bold text-white">{view.ingested_signals.community_engagement}</div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-white mb-3">Reflection Sentiment</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Positive', value: view.ingested_signals.reflection_sentiment.positive, color: '#33FFC1' },
                        { name: 'Neutral', value: view.ingested_signals.reflection_sentiment.neutral, color: '#64748B' },
                        { name: 'Negative', value: view.ingested_signals.reflection_sentiment.negative, color: '#EF4444' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Positive', value: view.ingested_signals.reflection_sentiment.positive, color: '#33FFC1' },
                        { name: 'Neutral', value: view.ingested_signals.reflection_sentiment.neutral, color: '#64748B' },
                        { name: 'Negative', value: view.ingested_signals.reflection_sentiment.negative, color: '#EF4444' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#E2E8F0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Skills Heatmap */}
          {Object.keys(view.skills_heatmap).length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Skills Heatmap</h3>

                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(view.skills_heatmap)
                        .sort(([, a], [, b]) => (Number(b) || 0) - (Number(a) || 0))
                        .slice(0, 10)
                        .map(([skill, score]) => ({
                          skill: skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                          score: Math.round(Number(score) || 0),
                        }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis type="number" domain={[0, 100]} stroke="#64748B" style={{ fontSize: '12px' }} />
                      <YAxis dataKey="skill" type="category" stroke="#64748B" style={{ fontSize: '12px' }} width={90} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#E2E8F0' }}
                      />
                      <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                        {Object.entries(view.skills_heatmap)
                          .sort(([, a], [, b]) => (Number(b) || 0) - (Number(a) || 0))
                          .slice(0, 10)
                          .map(([, score], index) => {
                            const numScore = Number(score) || 0
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  numScore >= 80 ? '#33FFC1' :
                                  numScore >= 60 ? '#0648A8' :
                                  numScore >= 40 ? '#F59E0B' : '#EF4444'
                                }
                              />
                            )
                          })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(view.skills_heatmap)
                    .sort(([, a], [, b]) => (b || 0) - (a || 0))
                    .map(([skill, score]) => {
                      const numScore = Number(score) || 0
                      return (
                        <div key={skill} className="flex items-center justify-between text-xs p-2 bg-och-midnight/50 rounded border border-och-steel/20">
                          <span className="text-och-steel">{skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          <span className="text-white font-medium">{numScore.toFixed(0)}%</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </Card>
          )}

          {/* Behavioral Trends */}
          {view.behavioral_trends && view.behavioral_trends.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Behavioral Trends (Last 30 Days)</h3>

                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={view.behavioral_trends.map(trend => ({
                        date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        engagement: Number(trend.engagement) || 0,
                        performance: Number(trend.performance) || 0,
                        sentiment: (Number(trend.sentiment) || 0) * 100,
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#33FFC1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#33FFC1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0648A8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0648A8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="date" stroke="#64748B" style={{ fontSize: '12px' }} />
                      <YAxis domain={[0, 100]} stroke="#64748B" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#E2E8F0' }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="engagement"
                        stroke="#33FFC1"
                        fillOpacity={1}
                        fill="url(#colorEngagement)"
                        name="Engagement %"
                      />
                      <Area
                        type="monotone"
                        dataKey="performance"
                        stroke="#F59E0B"
                        fillOpacity={1}
                        fill="url(#colorPerformance)"
                        name="Performance %"
                      />
                      <Area
                        type="monotone"
                        dataKey="sentiment"
                        stroke="#0648A8"
                        fillOpacity={1}
                        fill="url(#colorSentiment)"
                        name="Sentiment %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {view.behavioral_trends.slice(-7).map((trend, index) => {
                    const engagement = Number(trend.engagement) || 0
                    const performance = Number(trend.performance) || 0
                    const sentiment = Number(trend.sentiment) || 0
                    return (
                      <div key={index} className="p-2 bg-och-midnight rounded border border-och-steel/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-och-steel">{new Date(trend.date).toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-och-steel w-20">Engagement:</span>
                            <div className="flex-1 h-2 bg-och-midnight rounded-full overflow-hidden">
                              <div className="h-full bg-och-mint" style={{ width: `${engagement}%` }} />
                            </div>
                            <span className="text-white text-xs w-8 text-right">{engagement.toFixed(0)}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-och-steel w-20">Performance:</span>
                            <div className="flex-1 h-2 bg-och-midnight rounded-full overflow-hidden">
                              <div className="h-full bg-och-gold" style={{ width: `${performance}%` }} />
                            </div>
                            <span className="text-white text-xs w-8 text-right">{performance.toFixed(0)}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-och-steel w-20">Sentiment:</span>
                            <div className="flex-1 h-2 bg-och-midnight rounded-full overflow-hidden">
                              <div className="h-full bg-och-defender" style={{ width: `${sentiment * 100}%` }} />
                            </div>
                            <span className="text-white text-xs w-8 text-right">{(sentiment * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Readiness Over Time */}
          {view.readiness_over_time && view.readiness_over_time.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Readiness Over Time</h3>

                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={view.readiness_over_time.map(point => {
                        const score = typeof point.score === 'number' 
                          ? point.score 
                          : (point.score !== null && point.score !== undefined ? parseFloat(String(point.score)) : 0)
                        return {
                          date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                          score: Math.round(Number(score) || 0),
                        }
                      })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="date" stroke="#64748B" style={{ fontSize: '12px' }} />
                      <YAxis domain={[0, 100]} stroke="#64748B" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#E2E8F0' }}
                        formatter={(value: number) => [`${value}%`, 'Readiness Score']}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#33FFC1"
                        strokeWidth={3}
                        dot={{ fill: '#33FFC1', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Readiness Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {view.readiness_over_time.slice(-10).map((point, index) => {
                    const score = typeof point.score === 'number' 
                      ? point.score 
                      : (point.score !== null && point.score !== undefined ? parseFloat(String(point.score)) : 0)
                    const numScore = Number(score) || 0
                    return (
                      <div key={index} className="p-2 bg-och-midnight rounded border border-och-steel/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-och-steel">{new Date(point.date).toLocaleDateString()}</span>

                          <span className="text-sm font-semibold text-white">{numScore.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-och-midnight rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${

                              numScore >= 80 ? 'bg-och-mint' : 
                              numScore >= 60 ? 'bg-och-defender' : 
                              numScore >= 40 ? 'bg-och-gold' : 'bg-och-orange'
                            }`}
                            style={{ width: `${numScore}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {!isLoading && !error && !view && (
        <Card>
          <div className="p-6">

            <div className="text-och-steel text-sm">No analytics data available for this student.</div>
            <button
              onClick={() => router.push('/dashboard/mentor/analytics')}
              className="mt-4 text-och-mint hover:text-och-defender text-sm"
            >
              Return to Analytics Dashboard
            </button>
          </div>
        </Card>
      )}


      {/* Flag Mentee Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-och-midnight/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Flag Student</h2>
                <button
                  onClick={() => {
                    setShowFlagModal(false)
                    setFlagForm({
                      flag_type: 'struggling',
                      severity: 'medium',
                      description: '',
                    })
                    setFlagError(null)
                    setFlagSuccess(false)
                  }}
                  className="text-och-steel hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {student && (
                <div className="mb-4 p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                  <p className="text-sm text-och-steel mb-1">Flagging:</p>
                  <p className="text-white font-medium">{student.name}</p>
                  {student.email && (
                    <p className="text-xs text-och-steel">{student.email}</p>
                  )}
                </div>
              )}

              {flagSuccess && (
                <div className="mb-4 p-3 bg-och-mint/20 border border-och-mint rounded-lg">
                  <p className="text-sm text-och-mint">Flag created successfully!</p>
                </div>
              )}

              {flagError && (
                <div className="mb-4 p-3 bg-och-orange/20 border border-och-orange rounded-lg">
                  <p className="text-sm text-och-orange">{flagError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Flag Type
                  </label>
                  <select
                    value={flagForm.flag_type}
                    onChange={(e) => setFlagForm({ ...flagForm, flag_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
                  >
                    <option value="struggling">Struggling</option>
                    <option value="at_risk">At Risk</option>
                    <option value="needs_attention">Needs Attention</option>
                    <option value="technical_issue">Technical Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Severity
                  </label>
                  <select
                    value={flagForm.severity}
                    onChange={(e) => setFlagForm({ ...flagForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Description <span className="text-och-steel">(required)</span>
                  </label>
                  <textarea
                    value={flagForm.description}
                    onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })}
                    rows={4}
                    placeholder="Describe the issue or concern..."
                    className="w-full px-3 py-2 rounded-lg bg-och-midnight border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender placeholder-och-steel"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowFlagModal(false)
                      setFlagForm({
                        flag_type: 'struggling',
                        severity: 'medium',
                        description: '',
                      })
                      setFlagError(null)
                      setFlagSuccess(false)
                    }}
                    disabled={isFlagging}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="orange"
                    onClick={async () => {
                      if (!flagForm.description.trim()) {
                        setFlagError('Please provide a description')
                        return
                      }
                      if (!student) {
                        setFlagError('Student information is not loaded. Please wait and try again.')
                        return
                      }

                      // Use user_id if available, otherwise try id
                      const studentUserId = student.user_id || student.id
                      if (!studentUserId) {
                        setFlagError('Student ID is missing. Please refresh the page.')
                        return
                      }

                      setIsFlagging(true)
                      setFlagError(null)
                      setFlagSuccess(false)

                      try {
                        await flagMentee({
                          mentee_id: String(studentUserId), // Ensure it's a string (backend will convert to UUID)
                          flag_type: flagForm.flag_type,
                          severity: flagForm.severity,
                          description: flagForm.description,
                        })
                        setFlagSuccess(true)
                        await reloadFlags()
                        
                        // Close modal after 2 seconds
                        setTimeout(() => {
                          setShowFlagModal(false)
                          setFlagForm({
                            flag_type: 'struggling',
                            severity: 'medium',
                            description: '',
                          })
                          setFlagError(null)
                          setFlagSuccess(false)
                        }, 2000)
                      } catch (err: any) {
                        setFlagError(err?.message || 'Failed to create flag. Please try again.')
                      } finally {
                        setIsFlagging(false)
                      }
                    }}
                    disabled={isFlagging || !flagForm.description.trim()}
                    className="flex-1"
                  >
                    {isFlagging ? 'Creating Flag...' : 'Create Flag'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}


