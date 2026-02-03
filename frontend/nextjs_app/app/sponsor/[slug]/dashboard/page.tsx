'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Shield,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Award,
  ChevronRight,
  Download,
  AlertTriangle,
  Sparkles,
  Clock,
  Briefcase,
  BarChart3,
  Zap,
  Eye,
  Calendar,
  Mail
} from 'lucide-react';

// Components for different sections
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { TrackPerformanceGrid } from './components/TrackPerformanceGrid';
import { TopTalentGrid } from './components/TopTalentGrid';
import { HiringPipeline } from './components/HiringPipeline';
import { AIAlertsPanel } from './components/AIAlertsPanel';
import { ErrorBoundary } from './components/ErrorBoundary';

// Types
interface SponsorDashboardData {
  sponsor: {
    id: string;
    name: string;
    slug: string;
    type: string;
    logo_url: string;
    contact_email: string;
  };
  cohort: {
    id: string;
    name: string;
    track_slug: string;
    students_enrolled: number;
    start_date: string;
    completion_rate: number;
  };
  executive_summary: {
    active_students: number;
    completion_rate: number;
    placement_rate: number;
    roi: number;
    hires_last_30d: number;
    ai_readiness_avg: number;
  };
  track_performance: Array<{
    track_slug: string;
    students_enrolled: number;
    completion_rate: number;
    avg_time_to_complete_days: number;
    top_performer: {
      student_name: string;
      completion_percentage: number;
      completion_time_days: number;
    };
    hiring_outcomes: {
      total_hires: number;
      avg_salary_kes: number;
      top_employer: string;
    };
  }>;
  top_talent: Array<{
    id: string;
    name: string;
    email: string;
    readiness_score: number;
    track_completion_pct: number;
    top_skills: string[];
    cohort_rank: number;
    last_activity_days: number;
    mentor_sessions_completed: number;
    missions_completed: number;
  }>;
  hiring_pipeline: {
    total_candidates: number;
    hired_count: number;
    overall_conversion_rate: number;
    avg_time_to_hire_days: number;
    stages: Array<{
      stage: string;
      count: number;
      conversion_rate: number;
    }>;
  };
  ai_alerts: Array<{
    id: string;
    type: string;
    priority: number;
    title: string;
    description: string;
    cohort_name: string;
    risk_score?: number;
    recommended_action: string;
    roi_estimate: string;
    action_url: string;
    expires_at?: string;
  }>;
}

export default function SponsorDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [dashboardData, setDashboardData] = useState<SponsorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchDashboardData();
    }
  }, [slug]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Add authentication token when auth is implemented
      const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/v1/sponsors/${slug}/dashboard/`, {
        headers: {
          // Add auth header when authentication is implemented
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const data: SponsorDashboardData = await response.json();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error fetching sponsor dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');

      // For development, provide mock data as fallback
      setDashboardData(getMockDashboardData(slug));
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'csv' | 'ppt') => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/v1/sponsors/${slug}/export/?format=${format}`;

      const response = await fetch(apiUrl, {
        headers: {
          // Add auth header when authentication is implemented
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${slug}_dashboard_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Sponsor Dashboard</h2>
          <p className="text-slate-400">Fetching latest cohort analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Dashboard Error</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { sponsor, cohort, executive_summary, track_performance, top_talent, hiring_pipeline, ai_alerts } = dashboardData;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-slate-600/10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-blue-500/20 rounded-xl">
                  <Shield className="w-12 h-12 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-white">{sponsor.name}</h1>
                    <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {sponsor.type}
                    </Badge>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    {cohort.name} • {cohort.track_slug} Track • {cohort.students_enrolled} Students
                  </p>
                </div>
              </div>

              {/* Export Actions */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('pdf')}
                  className="text-slate-400 border-slate-600 hover:text-white"
                  disabled={loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF Report
                </Button>
              <Button
                variant="outline"
                onClick={() => handleExportReport('csv')}
                className="text-slate-400 border-slate-600 hover:text-white"
                disabled={loading}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV Export
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/sponsor/${slug}/finance`)}
                className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Finance
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/sponsor/${slug}/cohorts`)}
                className="text-slate-400 border-slate-600 hover:text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Cohorts
              </Button>
              </div>
            </div>

            {/* Executive Summary */}
            <ExecutiveSummary summary={executive_summary} />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Track Performance & Top Talent */}
            <div className="xl:col-span-2 space-y-8">
              {/* Track Performance */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">🎯 Track Performance</h2>
                    <p className="text-slate-400">Completion rates and outcomes across all 5 tracks</p>
                  </div>
                </div>
                <TrackPerformanceGrid tracks={track_performance} />
              </section>

              {/* Top Talent */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">👥 Top Talent</h2>
                    <p className="text-slate-400">Highest-potential students by AI readiness score</p>
                  </div>
                  <Button variant="outline" className="text-slate-400 border-slate-600">
                    <Eye className="w-4 h-4 mr-2" />
                    View All 187 Students
                  </Button>
                </div>
                <TopTalentGrid talent={top_talent.slice(0, 9)} />
              </section>
            </div>

            {/* Right Column - Pipeline & AI Alerts */}
            <div className="space-y-8">
              {/* Hiring Pipeline */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">📈 Hiring Pipeline</h3>
                    <p className="text-slate-400 text-sm">Conversion rates and time-to-hire</p>
                  </div>
                </div>
                <HiringPipeline pipeline={hiring_pipeline} />
              </section>

              {/* AI Alerts */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">🚨 AI Alerts</h3>
                    <p className="text-slate-400 text-sm">Proactive insights and recommendations</p>
                  </div>
                  <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                    {ai_alerts.length} active
                  </Badge>
                </div>
                <AIAlertsPanel alerts={ai_alerts} />
              </section>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Mock data for development
function getMockDashboardData(slug: string): SponsorDashboardData {
  return {
    sponsor: {
      id: '1',
      name: 'Nairobi Polytechnic',
      slug: slug,
      type: 'university',
      logo_url: 'https://example.com/logo.png',
      contact_email: 'cyber@nairobipoly.ac.ke'
    },
    cohort: {
      id: '1',
      name: 'Jan 2026 Cohort',
      track_slug: 'defender',
      students_enrolled: 187,
      start_date: '2026-01-15',
      completion_rate: 68.2
    },
    executive_summary: {
      active_students: 127,
      completion_rate: 68.2,
      placement_rate: 23.4,
      roi: 4.2,
      hires_last_30d: 8,
      ai_readiness_avg: 82.7
    },
    track_performance: [
      {
        track_slug: 'defender',
        students_enrolled: 45,
        completion_rate: 72.1,
        avg_time_to_complete_days: 38,
        top_performer: {
          student_name: 'Sarah K.',
          completion_percentage: 95.0,
          completion_time_days: 32
        },
        hiring_outcomes: {
          total_hires: 12,
          avg_salary_kes: 3200000,
          top_employer: 'MTN'
        }
      },
      {
        track_slug: 'grc',
        students_enrolled: 38,
        completion_rate: 65.8,
        avg_time_to_complete_days: 42,
        top_performer: {
          student_name: 'James M.',
          completion_percentage: 91.0,
          completion_time_days: 35
        },
        hiring_outcomes: {
          total_hires: 8,
          avg_salary_kes: 2800000,
          top_employer: 'KCB Group'
        }
      },
      {
        track_slug: 'innovation',
        students_enrolled: 32,
        completion_rate: 58.9,
        avg_time_to_complete_days: 48,
        top_performer: {
          student_name: 'Grace L.',
          completion_percentage: 87.0,
          completion_time_days: 40
        },
        hiring_outcomes: {
          total_hires: 6,
          avg_salary_kes: 3500000,
          top_employer: 'Safaricom'
        }
      },
      {
        track_slug: 'leadership',
        students_enrolled: 28,
        completion_rate: 61.2,
        avg_time_to_complete_days: 45,
        top_performer: {
          student_name: 'David N.',
          completion_percentage: 89.0,
          completion_time_days: 38
        },
        hiring_outcomes: {
          total_hires: 4,
          avg_salary_kes: 4000000,
          top_employer: 'Microsoft'
        }
      },
      {
        track_slug: 'offensive',
        students_enrolled: 44,
        completion_rate: 55.3,
        avg_time_to_complete_days: 52,
        top_performer: {
          student_name: 'Alice W.',
          completion_percentage: 83.0,
          completion_time_days: 45
        },
        hiring_outcomes: {
          total_hires: 7,
          avg_salary_kes: 3800000,
          top_employer: 'Government CERT'
        }
      }
    ],
    top_talent: Array.from({ length: 25 }, (_, i) => ({
      id: `talent-${i + 1}`,
      name: `Student ${i + 1}`,
      email: `student${i + 1}@example.com`,
      readiness_score: 95 - i,
      track_completion_pct: 85 - i * 0.5,
      top_skills: ['Network Security', 'Incident Response', 'Python'],
      cohort_rank: i + 1,
      last_activity_days: i % 7,
      mentor_sessions_completed: 5 + i % 3,
      missions_completed: 12 + i % 5
    })),
    hiring_pipeline: {
      total_candidates: 45,
      hired_count: 6,
      overall_conversion_rate: 13.3,
      avg_time_to_hire_days: 21,
      stages: [
        { stage: 'Applied', count: 45, conversion_rate: 100.0 },
        { stage: 'Screened', count: 32, conversion_rate: 71.1 },
        { stage: 'Interviewed', count: 18, conversion_rate: 56.3 },
        { stage: 'Offer Extended', count: 8, conversion_rate: 44.4 },
        { stage: 'Hired', count: 6, conversion_rate: 75.0 }
      ]
    },
    ai_alerts: [
      {
        id: 'alert-1',
        type: 'dropout_risk',
        priority: 1,
        title: '12 Students At Risk (Week 3 Prediction)',
        description: '12 students showing early warning signs of disengagement based on activity patterns and quiz performance.',
        cohort_name: 'Jan 2026 Cohort',
        risk_score: 12,
        recommended_action: 'Deploy mentor 1:1s + recipe nudges',
        roi_estimate: '3.2x',
        action_url: `/sponsor/${slug}/interventions`
      },
      {
        id: 'alert-2',
        type: 'placement_bottleneck',
        priority: 2,
        title: 'Interview Conversion Bottleneck',
        description: '18 interviews → 2 hires (11% conversion rate) indicates potential skills gap or interview process issues.',
        cohort_name: 'Jan 2026 Cohort',
        recommended_action: 'Skills gap analysis + employer relationship sync',
        roi_estimate: '2.1x',
        action_url: `/sponsor/${slug}/placement`
      }
    ]
  };
}

