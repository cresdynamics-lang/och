'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { mentorClient } from '@/services/mentorClient'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import type { TalentScopeMentorView, MenteePerformance } from '@/services/types/mentor'

interface MenteeAnalyticsProps {
  mentorId: string
  menteeId: string
  performanceData: MenteePerformance | null
  talentscopeData: TalentScopeMentorView | null
}

export function MenteeAnalytics({ mentorId, menteeId, performanceData, talentscopeData }: MenteeAnalyticsProps) {
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  // Prepare readiness trend data (mock for now, would come from API)
  const readinessTrendData = [
    { date: 'Week 1', readiness: 45, engagement: 60 },
    { date: 'Week 2', readiness: 52, engagement: 65 },
    { date: 'Week 3', readiness: 58, engagement: 70 },
    { date: 'Week 4', readiness: 65, engagement: 75 },
    { date: 'Week 5', readiness: 68, engagement: 78 },
    { date: 'Week 6', readiness: 72, engagement: 80 },
    { date: 'Week 7', readiness: 75, engagement: 82 },
    { date: 'Week 8', readiness: 78, engagement: 85 },
  ]

  // Mission completion data
  const missionData = [
    { name: 'Completed', value: performanceData?.mission_completion_rate || 0, color: '#33FFC1' },
    { name: 'In Progress', value: 15, color: '#0648A8' },
    { name: 'Pending', value: 10, color: '#C89C15' },
    { name: 'Needs Review', value: 5, color: '#FF6B6B' },
  ]

  // Skill heatmap data from TalentScope
  const skillHeatmapData = talentscopeData?.skills_heatmap 
    ? Object.entries(talentscopeData.skills_heatmap)
        .map(([skill, score]) => ({
          skill: skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          score: typeof score === 'number' ? score : 0,
          category: getSkillCategory(skill),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
    : []

  // Performance breakdown
  const performanceBreakdown = [
    { name: 'Readiness', value: performanceData?.readiness_score || 0, color: '#33FFC1' },
    { name: 'Missions', value: performanceData?.mission_completion_rate || 0, color: '#0648A8' },
    { name: 'Engagement', value: performanceData?.engagement_score || 0, color: '#C89C15' },
    { name: 'Overall', value: performanceData?.overall_score || 0, color: '#8B5CF6' },
  ]

  // Radar chart data for skill assessment
  const radarData = skillHeatmapData.length > 0
    ? [
        {
          category: 'Technical',
          score: calculateCategoryScore(skillHeatmapData, 'technical'),
          fullMark: 100,
        },
        {
          category: 'Soft Skills',
          score: calculateCategoryScore(skillHeatmapData, 'soft'),
          fullMark: 100,
        },
        {
          category: 'Security',
          score: calculateCategoryScore(skillHeatmapData, 'security'),
          fullMark: 100,
        },
        {
          category: 'Tools',
          score: calculateCategoryScore(skillHeatmapData, 'tools'),
          fullMark: 100,
        },
        {
          category: 'Communication',
          score: calculateCategoryScore(skillHeatmapData, 'communication'),
          fullMark: 100,
        },
      ]
    : []

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-och-midnight border border-och-steel/50 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <div className="p-4">
            <div className="text-sm text-och-steel mb-1">Readiness Score</div>
            <div className="text-3xl font-bold text-och-mint mb-2">
              {performanceData?.readiness_score || 0}%
            </div>
            <ProgressBar 
              value={performanceData?.readiness_score || 0} 
              max={100} 
              variant="mint"
              className="h-2"
            />
          </div>
        </Card>

        <Card className="glass-card">
          <div className="p-4">
            <div className="text-sm text-och-steel mb-1">Mission Completion</div>
            <div className="text-3xl font-bold text-och-defender mb-2">
              {performanceData?.mission_completion_rate || 0}%
            </div>
            <ProgressBar 
              value={performanceData?.mission_completion_rate || 0} 
              max={100} 
              variant="defender"
              className="h-2"
            />
          </div>
        </Card>

        <Card className="glass-card">
          <div className="p-4">
            <div className="text-sm text-och-steel mb-1">Engagement Score</div>
            <div className="text-3xl font-bold text-och-gold mb-2">
              {performanceData?.engagement_score || 0}%
            </div>
            <ProgressBar 
              value={performanceData?.engagement_score || 0} 
              max={100} 
              variant="gold"
              className="h-2"
            />
          </div>
        </Card>

        <Card className="glass-card">
          <div className="p-4">
            <div className="text-sm text-och-steel mb-1">Overall Performance</div>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {performanceData?.overall_score || 0}%
            </div>
            <ProgressBar 
              value={performanceData?.overall_score || 0} 
              max={100} 
              variant="mint"
              className="h-2"
            />
          </div>
        </Card>
      </div>

      {/* Readiness Trend Chart */}
      <Card className="glass-card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Readiness & Engagement Trend</h3>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    timeRange === range
                      ? 'bg-och-defender text-white'
                      : 'bg-och-midnight/50 text-och-steel hover:text-white'
                  }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={readinessTrendData}>
              <defs>
                <linearGradient id="colorReadiness" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#33FFC1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#33FFC1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0648A8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0648A8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#A8B0B8" opacity={0.2} />
              <XAxis dataKey="date" stroke="#A8B0B8" />
              <YAxis stroke="#A8B0B8" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="readiness"
                stroke="#33FFC1"
                fillOpacity={1}
                fill="url(#colorReadiness)"
                name="Readiness Score"
              />
              <Area
                type="monotone"
                dataKey="engagement"
                stroke="#0648A8"
                fillOpacity={1}
                fill="url(#colorEngagement)"
                name="Engagement Score"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Performance Breakdown & Mission Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Breakdown */}
        <Card className="glass-card">
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Performance Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#A8B0B8" opacity={0.2} />
                <XAxis dataKey="name" stroke="#A8B0B8" />
                <YAxis stroke="#A8B0B8" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {performanceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Mission Status */}
        <Card className="glass-card">
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Mission Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={missionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#A8B0B8" opacity={0.2} />
                <XAxis type="number" stroke="#A8B0B8" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="#A8B0B8" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {missionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Skill Heatmap */}
      {skillHeatmapData.length > 0 && (
        <Card className="glass-card">
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Top Skills Assessment</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={skillHeatmapData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#A8B0B8" opacity={0.2} />
                <XAxis type="number" stroke="#A8B0B8" domain={[0, 100]} />
                <YAxis dataKey="skill" type="category" stroke="#A8B0B8" width={150} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                  {skillHeatmapData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getScoreColor(entry.score)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Radar Chart for Skill Categories */}
      {radarData.length > 0 && (
        <Card className="glass-card">
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Skill Category Assessment</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#A8B0B8" opacity={0.3} />
                <PolarAngleAxis dataKey="category" stroke="#A8B0B8" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#A8B0B8" />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#33FFC1"
                  fill="#33FFC1"
                  fillOpacity={0.6}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* TalentScope Ingested Signals */}
      {talentscopeData?.ingested_signals && (
        <Card className="glass-card">
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Data Signals</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
                <div className="text-2xl font-bold text-och-mint mb-1">
                  {talentscopeData.ingested_signals.mission_scores || 0}
                </div>
                <div className="text-sm text-och-steel">Mission Scores</div>
              </div>
              <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
                <div className="text-2xl font-bold text-och-defender mb-1">
                  {talentscopeData.ingested_signals.habit_logs || 0}
                </div>
                <div className="text-sm text-och-steel">Habit Logs</div>
              </div>
              <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
                <div className="text-2xl font-bold text-och-gold mb-1">
                  {talentscopeData.ingested_signals.mentor_evaluations || 0}
                </div>
                <div className="text-sm text-och-steel">Mentor Evaluations</div>
              </div>
              <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  {talentscopeData.ingested_signals.community_engagement || 0}
                </div>
                <div className="text-sm text-och-steel">Community Activity</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// Helper functions
function getSkillCategory(skill: string): string {
  const skillLower = skill.toLowerCase()
  if (skillLower.includes('python') || skillLower.includes('javascript') || skillLower.includes('programming')) {
    return 'technical'
  }
  if (skillLower.includes('communication') || skillLower.includes('teamwork') || skillLower.includes('leadership')) {
    return 'soft'
  }
  if (skillLower.includes('security') || skillLower.includes('cyber') || skillLower.includes('threat')) {
    return 'security'
  }
  if (skillLower.includes('tool') || skillLower.includes('platform') || skillLower.includes('system')) {
    return 'tools'
  }
  return 'communication'
}

function calculateCategoryScore(skills: Array<{ category: string; score: number }>, category: string): number {
  const categorySkills = skills.filter(s => s.category === category)
  if (categorySkills.length === 0) return 0
  const total = categorySkills.reduce((sum, s) => sum + s.score, 0)
  return Math.round(total / categorySkills.length)
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#33FFC1' // mint
  if (score >= 60) return '#0648A8' // defender
  if (score >= 40) return '#C89C15' // gold
  return '#FF6B6B' // red
}

