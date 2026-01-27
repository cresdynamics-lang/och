'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CohortStatusBadge, getTrackColor } from '../../components/CohortStatusBadge';
import { StudentRoster } from '../components/StudentRoster';
import { CohortAIAlerts } from '../components/CohortAIAlerts';
import {
  ArrowLeft,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  UserPlus,
  Download,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface CohortDetail {
  cohort: {
    id: string;
    name: string;
    track_slug: string;
    status: string;
    target_size: number;
    students_enrolled: number;
    completion_rate: number;
    start_date: string | null;
    target_completion_date: string | null;
    budget_allocated: number;
    ai_interventions_count: number;
    placement_goal: number;
  };
  student_roster: Array<{
    id: string;
    name: string;
    email: string;
    readiness_score: number;
    completion_percentage: number;
    joined_at: string;
    last_activity_at: string | null;
    enrollment_status: string;
    cohort_rank: number;
    top_skills: string[];
    last_activity_days: number;
    mentor_sessions_completed: number;
    missions_completed: number;
  }>;
  ai_insights: {
    dropout_risk: {
      total_students: number;
      at_risk_students: number;
      risk_percentage: number;
      predicted_dropout_rate: number;
    };
    alerts: Array<{
      type: string;
      priority: number;
      title: string;
      description: string;
      recommended_action: string;
    }>;
    recommendations: Array<{
      type: string;
      priority: string;
      title: string;
      description: string;
      expected_impact: string;
    }>;
  };
  performance_metrics: {
    completion_trend: number[];
    readiness_distribution: Record<string, number>;
    engagement_metrics: Record<string, number>;
  };
}

export default function CohortDetailDashboard() {
  const params = useParams();
  const router = useRouter();
  const { slug, cohortId } = params as { slug: string; cohortId: string };

  const [cohortData, setCohortData] = useState<CohortDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'analytics'>('overview');

  useEffect(() => {
    if (cohortId) {
      fetchCohortData();
    }
  }, [cohortId, slug]);

  const fetchCohortData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sponsors/${slug}/cohorts/${cohortId}/`, {
        headers: {
          // Add auth header when authentication is implemented
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cohort data: ${response.status}`);
      }

      const data: CohortDetail = await response.json();
      setCohortData(data);
    } catch (err: any) {
      console.error('Error fetching cohort data:', err);
      setError(err.message || 'Failed to load cohort data');

      // Mock data for development
      setCohortData(getMockCohortData(cohortId));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Cohort Dashboard</h2>
          <p className="text-slate-400">Fetching cohort analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !cohortData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Dashboard Error</h2>
          <p className="text-slate-400 mb-4">{error || 'Failed to load cohort data'}</p>
          <Button onClick={fetchCohortData}>Retry</Button>
        </div>
      </div>
    );
  }

  const { cohort, student_roster, ai_insights, performance_metrics } = cohortData;
  const trackColors = getTrackColor(cohort.track_slug);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `KES ${(amount / 1000).toFixed(0)}K`;
    return `KES ${amount}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/sponsor/${slug}/cohorts`)}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Cohorts
            </Button>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">{cohort.name}</span>
          </div>

          {/* Title and Actions */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${trackColors.bg}`}>
                <BarChart3 className={`w-8 h-8 ${trackColors.text}`} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{cohort.name}</h1>
                  <CohortStatusBadge status={cohort.status as any} />
                </div>
                <p className="text-slate-400 text-lg">
                  {cohort.track_slug.toUpperCase()} Track • {cohort.students_enrolled}/{cohort.target_size} Students
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="text-slate-400 border-slate-600">
                <Settings className="w-4 h-4 mr-2" />
                Edit Cohort
              </Button>
              <Button variant="outline" className="text-slate-400 border-slate-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Students
              </Button>
              <Button variant="outline" className="text-slate-400 border-slate-600">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Zap className="w-4 h-4 mr-2" />
                AI Boost
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Completion Rate</p>
                    <p className={`text-2xl font-bold ${trackColors.text}`}>
                      {cohort.completion_rate.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className={`w-8 h-8 ${trackColors.text}`} />
                </div>
                <ProgressBar value={cohort.completion_rate} className="mt-3" />
              </Card>

              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Active Students</p>
                    <p className="text-2xl font-bold text-white">
                      {cohort.students_enrolled}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-slate-400 text-sm mt-2">
                  of {cohort.target_size} target
                </p>
              </Card>

              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Budget Allocated</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(cohort.budget_allocated)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </Card>

              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">AI Interventions</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {cohort.ai_interventions_count}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-400" />
                </div>
              </Card>
            </div>

            {/* Timeline and Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">Start Date</span>
                    </div>
                    <span className="text-white">
                      {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">Target Completion</span>
                    </div>
                    <span className="text-white">
                      {cohort.target_completion_date ? new Date(cohort.target_completion_date).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Goals & Targets</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Student Target</span>
                    <Badge className="bg-blue-500/20 text-blue-400">
                      {cohort.target_size} students
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Placement Goal</span>
                    <Badge className="bg-green-500/20 text-green-400">
                      {cohort.placement_goal} hires
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Budget</span>
                    <Badge className="bg-purple-500/20 text-purple-400">
                      {formatCurrency(cohort.budget_allocated)}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>

            {/* AI Insights */}
            <CohortAIAlerts alerts={ai_insights.alerts} recommendations={ai_insights.recommendations} />
          </div>
        )}

        {activeTab === 'students' && (
          <StudentRoster
            students={student_roster}
            cohortId={cohortId}
            sponsorSlug={slug}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Performance Trends */}
            <Card className="p-6 bg-slate-900/50 border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Completion Trend</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {performance_metrics.completion_trend.map((value, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-full ${trackColors.bg} rounded-t`}
                      style={{ height: `${(value / 100) * 200}px` }}
                    />
                    <span className="text-xs text-slate-400 mt-2">Week {index + 1}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Readiness Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Readiness Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(performance_metrics.readiness_distribution).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-slate-300 capitalize">{level}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(count / student_roster.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-white text-sm w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Engagement Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Active Last 7 Days</span>
                    <Badge className="bg-green-500/20 text-green-400">
                      {performance_metrics.engagement_metrics.active_last_7d}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Avg Missions Completed</span>
                    <Badge className="bg-blue-500/20 text-blue-400">
                      {performance_metrics.engagement_metrics.completed_missions_avg.toFixed(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Avg Mentor Sessions</span>
                    <Badge className="bg-purple-500/20 text-purple-400">
                      {performance_metrics.engagement_metrics.mentor_sessions_avg.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mock data for development
function getMockCohortData(cohortId: string): CohortDetail {
  return {
    cohort: {
      id: cohortId,
      name: 'Jan 2026 - Defender',
      track_slug: 'defender',
      status: 'active',
      target_size: 187,
      students_enrolled: 127,
      completion_rate: 68.2,
      start_date: '2026-01-15',
      target_completion_date: '2026-06-30',
      budget_allocated: 3200000,
      ai_interventions_count: 3,
      placement_goal: 25
    },
    student_roster: Array.from({ length: 25 }, (_, i) => ({
      id: `student-${i + 1}`,
      name: `Student ${i + 1}`,
      email: `student${i + 1}@example.com`,
      readiness_score: 95 - i,
      completion_percentage: 85 - i * 0.5,
      joined_at: '2026-01-15T00:00:00Z',
      last_activity_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      enrollment_status: 'enrolled',
      cohort_rank: i + 1,
      top_skills: ['Network Security', 'Incident Response', 'Python'],
      last_activity_days: Math.floor(Math.random() * 7),
      mentor_sessions_completed: 5 + Math.floor(Math.random() * 3),
      missions_completed: 12 + Math.floor(Math.random() * 5)
    })),
    ai_insights: {
      dropout_risk: {
        total_students: 127,
        at_risk_students: 8,
        risk_percentage: 6.3,
        predicted_dropout_rate: 12.5
      },
      alerts: [
        {
          type: 'dropout_risk',
          priority: 1,
          title: '8 Students At Risk (Week 3 Prediction)',
          description: '8 students showing early warning signs of disengagement based on activity patterns and quiz performance.',
          recommended_action: 'Deploy mentor 1:1s + recipe nudges'
        },
        {
          type: 'curriculum_block',
          priority: 2,
          title: '12 Students Blocked on Alert Triage Quiz',
          description: '12 students cannot progress due to failing Alert Triage assessment.',
          recommended_action: 'Provide additional quiz attempts or tutoring'
        }
      ],
      recommendations: [
        {
          type: 'intervention',
          priority: 'high',
          title: 'Deploy Dropout Prevention Interventions',
          description: '8 students at risk. Deploy nudges and mentor support.',
          expected_impact: '15% reduction in dropout rate'
        },
        {
          type: 'curriculum',
          priority: 'medium',
          title: 'Review Curriculum Pacing',
          description: 'Consider adjusting module difficulty or adding support resources.',
          expected_impact: '10-15% improvement in completion'
        }
      ]
    },
    performance_metrics: {
      completion_trend: [65, 67, 68, 69, 70, 72],
      readiness_distribution: {
        excellent: 5,
        strong: 8,
        good: 7,
        developing: 5
      },
      engagement_metrics: {
        active_last_7d: 89,
        completed_missions_avg: 14.2,
        mentor_sessions_avg: 6.8
      }
    }
  };
}
