'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Play, CheckCircle, Clock, BookOpen, Target, ChevronDown, ChevronRight, FileText, Award, Users, Hash, MessageSquare, ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Mock GRC curriculum data - replace with actual API calls
const mockGrcCurriculum = {
  track: {
    slug: 'grc',
    title: 'GRC Track',
    description: 'Governance, Risk, and Compliance for modern cyber programs.',
    icon_key: 'grc'
  },
  levels: [
    {
      slug: 'beginner',
      title: 'Beginner',
      description: 'GRC fundamentals and basic concepts',
      order_number: 1,
      estimated_duration_hours: 10,
      modules: [
        {
          slug: 'grc-foundations',
          title: 'GRC Foundations & Key Terms',
          description: 'Understanding the core concepts of Governance, Risk, and Compliance',
          order_number: 1,
          estimated_duration_minutes: 45,
          content_count: 4
        },
        {
          slug: 'policies-and-standards-intro',
          title: 'Policies, Standards & Frameworks',
          description: 'Introduction to policies, standards, procedures and common frameworks',
          order_number: 2,
          estimated_duration_minutes: 50,
          content_count: 4
        },
        {
          slug: 'risk-assessment-basics',
          title: 'Risk Assessment Fundamentals',
          description: 'Basic concepts of risk identification, assessment, and management',
          order_number: 3,
          estimated_duration_minutes: 40,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'grc-beginner-assessment',
        title: 'GRC Beginner Assessment',
        description: 'Mini case study to apply GRC basics to a small African fintech scenario.',
        missions: [
          { mission_slug: 'sample-risk-register-exercise' },
          { mission_slug: 'policy-review-mini-case' }
        ],
        recipes: ['grc-risk-register-basics', 'grc-policy-reading-checklist'],
        reflection_prompt: 'In 5–7 sentences, explain why a small African fintech must care about GRC.'
      }
    },
    {
      slug: 'intermediate',
      title: 'Intermediate',
      description: 'Operational GRC practices and implementation',
      order_number: 2,
      estimated_duration_hours: 12,
      modules: [
        {
          slug: 'risk-register-operations',
          title: 'Risk Register Operations',
          description: 'Managing and maintaining risk registers in operational environments',
          order_number: 1,
          estimated_duration_minutes: 55,
          content_count: 4
        },
        {
          slug: 'control-mapping-fundamentals',
          title: 'Control Mapping Fundamentals',
          description: 'Mapping controls to requirements and frameworks',
          order_number: 2,
          estimated_duration_minutes: 60,
          content_count: 4
        },
        {
          slug: 'policy-gap-analysis',
          title: 'Policy Gap Analysis',
          description: 'Identifying and addressing gaps in policy frameworks',
          order_number: 3,
          estimated_duration_minutes: 45,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'grc-intermediate-assessment',
        title: 'GRC Intermediate Assessment',
        description: 'Operational case study: As GRC analyst at a Telco, prioritize and treat 5 identified risks.',
        missions: [
          { mission_slug: 'telco-risk-prioritization-case' },
          { mission_slug: 'control-mapping-exercise' }
        ],
        recipes: ['grc-control-mapping-iso-nist', 'grc-vendor-risk-review-checklist'],
        reflection_prompt: 'In 6–8 sentences, describe how you would implement a risk management process for a growing African startup.'
      }
    },
    {
      slug: 'advanced',
      title: 'Advanced',
      description: 'Advanced GRC practices including audits and metrics',
      order_number: 3,
      estimated_duration_hours: 12,
      modules: [
        {
          slug: 'audit-preparation-and-evidence',
          title: 'Audit Preparation & Evidence Collection',
          description: 'Preparing for audits and managing evidence effectively',
          order_number: 1,
          estimated_duration_minutes: 65,
          content_count: 4
        },
        {
          slug: 'advanced-risk-treatment',
          title: 'Advanced Risk Treatment Strategies',
          description: 'Sophisticated approaches to risk mitigation and treatment',
          order_number: 2,
          estimated_duration_minutes: 70,
          content_count: 4
        },
        {
          slug: 'metrics-and-kpis-for-grc',
          title: 'GRC Metrics & KPIs',
          description: 'Measuring and reporting GRC program effectiveness',
          order_number: 3,
          estimated_duration_minutes: 55,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'grc-advanced-assessment',
        title: 'GRC Advanced Assessment',
        description: 'Mini internal audit simulation: Prepare evidence and respond to audit findings.',
        missions: [
          { mission_slug: 'internal-audit-simulation' },
          { mission_slug: 'evidence-collection-case' }
        ],
        recipes: ['grc-audit-evidence-management', 'grc-metrics-dashboard-basics'],
        reflection_prompt: 'In 7–9 sentences, explain how you would design and implement a metrics program to demonstrate GRC program value to executive leadership.'
      }
    },
    {
      slug: 'mastery',
      title: 'Mastery',
      description: 'Strategic GRC leadership and board-level practices',
      order_number: 4,
      estimated_duration_hours: 14,
      modules: [
        {
          slug: 'grc-program-design',
          title: 'GRC Program Design & Strategy',
          description: 'Designing comprehensive GRC programs from the ground up',
          order_number: 1,
          estimated_duration_minutes: 75,
          content_count: 4
        },
        {
          slug: 'regulatory-landscape-africa',
          title: 'Regulatory Landscape in Africa',
          description: 'Understanding African regulatory requirements and compliance frameworks',
          order_number: 2,
          estimated_duration_minutes: 80,
          content_count: 4
        },
        {
          slug: 'board-reporting-and-risk-appetite',
          title: 'Board Reporting & Risk Appetite',
          description: 'Communicating GRC matters to board level and defining risk appetite',
          order_number: 3,
          estimated_duration_minutes: 70,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'grc-mastery-assessment',
        title: 'GRC Mastery Assessment',
        description: 'Strategic case study: Build and present a high-level GRC program pitch for an African financial institution.',
        missions: [
          { mission_slug: 'grc-program-pitch-development' },
          { mission_slug: 'board-presentation-simulation' }
        ],
        recipes: ['grc-program-roadmap-template', 'grc-board-reporting-framework'],
        reflection_prompt: 'In 8–10 sentences, describe how you would establish and lead a world-class GRC program in an African context, considering cultural, regulatory, and resource challenges.'
      }
    }
  ]
};

// Mock progress data
const mockProgress = {
  track_slug: 'grc',
  level_progress: [
    { level_slug: 'beginner', videos_completed: 0, quizzes_completed: 0, assessment_completed: false, percent_complete: 0 },
    { level_slug: 'intermediate', videos_completed: 0, quizzes_completed: 0, assessment_completed: false, percent_complete: 0 },
    { level_slug: 'advanced', videos_completed: 0, quizzes_completed: 0, assessment_completed: false, percent_complete: 0 },
    { level_slug: 'mastery', videos_completed: 0, quizzes_completed: 0, assessment_completed: false, percent_complete: 0 }
  ],
  overall_progress: {
    videos_completed: 0,
    quizzes_completed: 0,
    assessments_completed: 0,
    total_videos: 36,
    total_quizzes: 12,
    total_assessments: 4,
    percent_complete: 0
  }
};

function AssessmentBlock({ assessment }: { assessment: any }) {
  return (
    <Card className="p-6 bg-slate-900/50 border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <Target className="w-6 h-6 text-emerald-400" />
        <h3 className="text-xl font-bold text-white">{assessment.title}</h3>
      </div>

      <p className="text-slate-300 mb-6">{assessment.description}</p>

      <div className="space-y-4">
        {assessment.missions && assessment.missions.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Missions
            </h4>
            <div className="flex flex-wrap gap-2">
              {assessment.missions.map((mission: any, idx: number) => (
                <Badge key={idx} variant="outline" className="text-emerald-400 border-emerald-400">
                  {mission.mission_slug.replace(/-/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {assessment.recipes && assessment.recipes.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Recipes
            </h4>
            <div className="flex flex-wrap gap-2">
              {assessment.recipes.map((recipe: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-emerald-400 border-emerald-400">
                  {recipe.replace(/-/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {assessment.reflection_prompt && (
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Reflection
            </h4>
            <p className="text-slate-300 text-sm italic">{assessment.reflection_prompt}</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700">
        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
          Start Assessment
        </Button>
      </div>
    </Card>
  );
}

export default function GrcTrackPage() {
  const { user } = useAuth();
  const [curriculum, setCurriculum] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch GRC curriculum
        const curriculumResponse = await fetch('/api/curriculum/grc');
        if (curriculumResponse.ok) {
          const curriculumData = await curriculumResponse.json();
          setCurriculum(curriculumData);
        } else {
          setCurriculum(mockGrcCurriculum);
        }

        // Fetch user progress
        if (user?.id) {
          const progressResponse = await fetch(`/api/users/${user.id}/curriculum/grc/progress`);
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            setProgress(progressData);
          } else {
            setProgress(mockProgress);
          }
        } else {
          setProgress(mockProgress);
        }
      } catch (error) {
        console.error('Failed to fetch GRC data:', error);
        setCurriculum(mockGrcCurriculum);
        setProgress(mockProgress);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading GRC Track...</p>
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Failed to load GRC curriculum</div>
          <Link href="/curriculum">
            <Button>Back to Curriculum</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalProgress = progress?.overall_progress?.percent_complete || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-transparent to-slate-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/curriculum">
              <Button variant="outline" size="sm" className="text-slate-400 border-slate-600 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Curriculum
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-6 mb-8">
            <div className="p-4 bg-emerald-500/20 rounded-xl">
              <FileText className="w-12 h-12 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{curriculum.track.title}</h1>
              <p className="text-slate-300 text-lg leading-relaxed max-w-2xl">
                {curriculum.track.description}
              </p>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <Card className="p-6 bg-slate-900/50 border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Track Progress</h3>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {totalProgress}% Complete
              </Badge>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Community Section */}
        <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-slate-900/30 border border-emerald-500/20 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Community Support</h3>
          </div>

          <p className="text-slate-300 text-sm mb-4">
            Connect with fellow GRC professionals, get help with frameworks, and share your compliance journey.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/community/spaces/grc-beginner">
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-emerald-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <Hash className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-white font-medium">#grc-beginner-help</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Get help with GRC concepts, frameworks, and assessments.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>GRC Community</span>
                  <span>Active discussions</span>
                </div>
              </Card>
            </Link>

            <Link href="/community/spaces/announcements">
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-emerald-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-5 h-5 text-orange-400" />
                  <h4 className="text-white font-medium">Official Announcements</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Stay updated with GRC news, regulatory changes, and OCH updates.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>All Communities</span>
                  <span>Official updates</span>
                </div>
              </Card>
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Need help with GRC concepts?</span>
              <Link href="/community">
                <Button variant="outline" size="sm" className="text-emerald-400 border-emerald-400 hover:bg-emerald-400 hover:text-white">
                  Explore Communities
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Levels */}
        <div className="space-y-8">
          {curriculum.levels.map((level: any) => {
            const levelProgress = progress?.level_progress?.find((lp: any) => lp.level_slug === level.slug);
            const levelPercent = levelProgress?.percent_complete || 0;

            return (
              <Card key={level.slug} className="p-6 bg-slate-900/50 border-slate-700">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-white">{level.title}</h2>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {level.estimated_duration_hours}h
                      </Badge>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{level.description}</p>
                  </div>

                  <Link href={`/curriculum/grc/${level.slug}`}>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      View Level
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                {/* Level Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Progress</span>
                    <span className="text-white text-sm">{levelPercent}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${levelPercent}%` }}
                    />
                  </div>
                </div>

                {/* Modules */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {level.modules.map((module: any) => (
                    <Card key={module.slug} className="p-4 bg-slate-800/50 border-slate-600">
                      <h4 className="text-white font-medium mb-2">{module.title}</h4>
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2">{module.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{module.content_count} items</span>
                        <span>{module.estimated_duration_minutes}min</span>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Assessment Block */}
                {level.assessment_block && (
                  <AssessmentBlock assessment={level.assessment_block} />
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
