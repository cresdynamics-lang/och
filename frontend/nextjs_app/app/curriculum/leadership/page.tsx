'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Play, CheckCircle, Clock, BookOpen, Target, ChevronDown, ChevronRight, Award, Users, Hash, MessageSquare, ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Mock Leadership curriculum data - replace with actual API calls
const mockLeadershipCurriculum = {
  track: {
    slug: 'leadership',
    title: 'Leadership Track',
    description: 'From SOC team lead to CISO: master technical leadership, executive communication, and strategic cyber governance.',
    icon_key: 'leadership'
  },
  levels: [
    {
      slug: 'beginner',
      title: 'Beginner',
      description: 'Leadership foundations and basic cyber management skills',
      order_number: 1,
      estimated_duration_hours: 10,
      modules: [
        {
          slug: 'leadership-mindset-cyber',
          title: 'Leadership Mindset in Cyber',
          description: 'Developing the leadership mindset for cybersecurity roles',
          order_number: 1,
          estimated_duration_minutes: 50,
          content_count: 4 // 3 videos + 1 quiz
        },
        {
          slug: 'communication-security',
          title: 'Communication in Cybersecurity',
          description: 'Mastering communication skills for security professionals',
          order_number: 2,
          estimated_duration_minutes: 55,
          content_count: 4
        },
        {
          slug: 'team-dynamics-cyber',
          title: 'Team Dynamics in Cyber',
          description: 'Leading and managing cybersecurity teams effectively',
          order_number: 3,
          estimated_duration_minutes: 45,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'leadership-beginner-assessment',
        title: 'First Leadership Challenge',
        description: 'Practice communicating a phishing incident to non-technical executives and handling team dynamics.',
        missions: [
          { mission_slug: 'phishing-incident-communication' }
        ],
        recipes: ['leadership-risk-communication', 'leadership-team-motivation'],
        reflection_prompt: 'In 5–7 sentences, describe what was hardest about explaining technical risk to business leaders and how you would approach it differently next time.'
      }
    },
    {
      slug: 'intermediate',
      title: 'Intermediate',
      description: 'Strategic leadership and operational management',
      order_number: 2,
      estimated_duration_hours: 12,
      modules: [
        {
          slug: 'cyber-security-strategy',
          title: 'Cyber Security Strategy',
          description: 'Developing and implementing cyber security strategy',
          order_number: 1,
          estimated_duration_minutes: 65,
          content_count: 4
        },
        {
          slug: 'hiring-security-talent',
          title: 'Hiring Security Talent',
          description: 'Recruiting, interviewing, and retaining cybersecurity professionals',
          order_number: 2,
          estimated_duration_minutes: 70,
          content_count: 4
        },
        {
          slug: 'security-governance-basics',
          title: 'Security Governance Basics',
          description: 'Establishing governance frameworks and board reporting',
          order_number: 3,
          estimated_duration_minutes: 55,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'leadership-intermediate-assessment',
        title: 'Build Your First Cyber Strategy',
        description: 'Develop a comprehensive cybersecurity strategy for a mid-sized African enterprise.',
        missions: [
          { mission_slug: 'cyber-strategy-development' }
        ],
        recipes: ['leadership-strategy-alignment', 'leadership-talent-acquisition', 'leadership-governance-framework'],
        reflection_prompt: 'In 6–8 sentences, describe how you would implement the cyber strategy you developed, including challenges you anticipate and how you would overcome them.'
      }
    },
    {
      slug: 'advanced',
      title: 'Advanced',
      description: 'Executive leadership and enterprise-level security management',
      order_number: 3,
      estimated_duration_hours: 13,
      modules: [
        {
          slug: 'ciso-strategic-leadership',
          title: 'CISO Strategic Leadership',
          description: 'Strategic leadership skills for Chief Information Security Officers',
          order_number: 1,
          estimated_duration_minutes: 75,
          content_count: 4
        },
        {
          slug: 'cyber-budget-finance',
          title: 'Cyber Budget and Finance',
          description: 'Financial management and ROI justification for security programs',
          order_number: 2,
          estimated_duration_minutes: 70,
          content_count: 4
        },
        {
          slug: 'cross-functional-leadership',
          title: 'Cross-Functional Leadership',
          description: 'Leading across organizational boundaries and functions',
          order_number: 3,
          estimated_duration_minutes: 65,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'leadership-advanced-assessment',
        title: 'CISO Board Presentation Simulation',
        description: 'Prepare and deliver a board presentation on cybersecurity strategy and budget for a major African corporation.',
        missions: [
          { mission_slug: 'ciso-board-presentation' }
        ],
        recipes: ['leadership-board-communication', 'leadership-budget-justification', 'leadership-crisis-management'],
        reflection_prompt: 'In 7–9 sentences, reflect on how your board presentation addressed the unique challenges of cybersecurity leadership in African enterprises.'
      }
    },
    {
      slug: 'mastery',
      title: 'Mastery',
      description: 'Transformational leadership and national-level cyber influence',
      order_number: 4,
      estimated_duration_hours: 15,
      modules: [
        {
          slug: 'cyber-culture-transformation',
          title: 'Cyber Culture Transformation',
          description: 'Building and transforming security culture in organizations',
          order_number: 1,
          estimated_duration_minutes: 80,
          content_count: 4
        },
        {
          slug: 'national-cyber-leadership',
          title: 'National Cyber Leadership',
          description: 'Leading cyber initiatives at national and regional levels',
          order_number: 2,
          estimated_duration_minutes: 85,
          content_count: 4
        },
        {
          slug: 'legacy-leadership-cyber',
          title: 'Legacy Leadership in Cyber',
          description: 'Building lasting impact and mentoring future leaders',
          order_number: 3,
          estimated_duration_minutes: 75,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'leadership-mastery-assessment',
        title: 'Launch Your Cyber Leadership Initiative',
        description: 'Design and launch a transformational cyber leadership program for an African institution or region.',
        missions: [
          { mission_slug: 'cyber-leadership-program-launch' }
        ],
        recipes: ['leadership-culture-transformation', 'leadership-national-policy-influence', 'leadership-succession-planning'],
        reflection_prompt: 'In 8–10 sentences, describe your 3-year vision for African cybersecurity leadership and the specific initiatives you would launch to achieve it.'
      }
    }
  ]
};

// Mock progress data
const mockProgress = {
  track_slug: 'leadership',
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
        <Target className="w-6 h-6 text-amber-400" />
        <h3 className="text-xl font-bold text-white">{assessment.title}</h3>
      </div>

      <p className="text-slate-300 mb-6">{assessment.description}</p>

      <div className="space-y-4">
        {assessment.missions && assessment.missions.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              Missions
            </h4>
            <div className="flex flex-wrap gap-2">
              {assessment.missions.map((mission: any, idx: number) => (
                <Badge key={idx} variant="outline" className="text-amber-400 border-amber-400">
                  {mission.mission_slug.replace(/-/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {assessment.recipes && assessment.recipes.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Recipes
            </h4>
            <div className="flex flex-wrap gap-2">
              {assessment.recipes.map((recipe: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-amber-400 border-amber-400">
                  {recipe.replace(/-/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {assessment.reflection_prompt && (
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              Reflection
            </h4>
            <p className="text-slate-300 text-sm italic">{assessment.reflection_prompt}</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700">
        <Button className="w-full bg-amber-600 hover:bg-amber-700">
          Start Assessment
        </Button>
      </div>
    </Card>
  );
}

export default function LeadershipTrackPage() {
  const { user } = useAuth();
  const [curriculum, setCurriculum] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Leadership curriculum
        const curriculumResponse = await fetch('/api/curriculum/leadership');
        if (curriculumResponse.ok) {
          const curriculumData = await curriculumResponse.json();
          setCurriculum(curriculumData);
        } else {
          setCurriculum(mockLeadershipCurriculum);
        }

        // Fetch user progress
        if (user?.id) {
          const progressResponse = await fetch(`/api/users/${user.id}/curriculum/leadership/progress`);
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
        console.error('Failed to fetch Leadership data:', error);
        setCurriculum(mockLeadershipCurriculum);
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
          <Award className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading Leadership Track...</p>
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Failed to load Leadership curriculum</div>
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
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-transparent to-slate-600/10" />
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
            <div className="p-4 bg-amber-500/20 rounded-xl">
              <Award className="w-12 h-12 text-amber-400" />
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
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {totalProgress}% Complete
              </Badge>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full transition-all duration-1000"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Community Section */}
        <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-slate-900/30 border border-amber-500/20 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Community Support</h3>
          </div>

          <p className="text-slate-300 text-sm mb-4">
            Connect with fellow cyber leaders, get advice from CISOs, and share your leadership journey.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/community/spaces/leadership-beginner">
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-amber-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <Hash className="w-5 h-5 text-amber-400" />
                  <h4 className="text-white font-medium">#leadership-beginner-help</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Get help with leadership concepts, communication skills, and team management.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Leadership Community</span>
                  <span>Active discussions</span>
                </div>
              </Card>
            </Link>

            <Link href="/community/spaces/announcements">
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-amber-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-5 h-5 text-orange-400" />
                  <h4 className="text-white font-medium">Official Announcements</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Stay updated with leadership news, executive opportunities, and OCH updates.
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
              <span className="text-slate-400 text-sm">Need help with leadership concepts?</span>
              <Link href="/community">
                <Button variant="outline" size="sm" className="text-amber-400 border-amber-400 hover:bg-amber-400 hover:text-white">
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
                      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {level.estimated_duration_hours}h
                      </Badge>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{level.description}</p>
                  </div>

                  <Link href={`/curriculum/leadership/${level.slug}`}>
                    <Button className="bg-amber-600 hover:bg-amber-700">
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
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
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
