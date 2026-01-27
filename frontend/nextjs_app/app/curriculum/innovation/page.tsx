'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Play, CheckCircle, Clock, BookOpen, Target, ChevronDown, ChevronRight, Rocket, Award, Users, Hash, MessageSquare, ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Mock Innovation curriculum data - replace with actual API calls
const mockInnovationCurriculum = {
  track: {
    slug: 'innovation',
    title: 'Innovation Track',
    description: 'Build tomorrow\'s cyber tools. Spot emerging threats. Launch secure products for African markets.',
    icon_key: 'innovation'
  },
  levels: [
    {
      slug: 'beginner',
      title: 'Beginner',
      description: 'Innovation foundations and basic cyber creativity',
      order_number: 1,
      estimated_duration_hours: 9,
      modules: [
        {
          slug: 'innovation-mindset-basics',
          title: 'Innovation Mindset Basics',
          description: 'Developing the creative thinking patterns for cyber innovation',
          order_number: 1,
          estimated_duration_minutes: 40,
          content_count: 4 // 3 videos + 1 quiz
        },
        {
          slug: 'threat-research-basics',
          title: 'Threat Research Basics',
          description: 'Using OSINT and research to understand cyber threats',
          order_number: 2,
          estimated_duration_minutes: 50,
          content_count: 4
        },
        {
          slug: 'tool-prototyping-intro',
          title: 'Tool Prototyping Introduction',
          description: 'Building and validating security tool ideas quickly',
          order_number: 3,
          estimated_duration_minutes: 45,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'innovation-beginner-assessment',
        title: 'Spot the Next Threat Trend',
        description: 'Use OSINT skills to identify an emerging threat that others might be missing.',
        missions: [
          { mission_slug: 'emerging-threats-osint' }
        ],
        recipes: ['innovation-osint-basics', 'innovation-idea-validation', 'innovation-threat-trend-spotting'],
        reflection_prompt: 'In 5–7 sentences, describe the emerging threat you discovered through OSINT research and why African organizations should care about it specifically.'
      }
    },
    {
      slug: 'intermediate',
      title: 'Intermediate',
      description: 'Building and testing security innovations',
      order_number: 2,
      estimated_duration_hours: 11,
      modules: [
        {
          slug: 'security-automation-basics',
          title: 'Security Automation Basics',
          description: 'Automating security tasks with scripts and basic tools',
          order_number: 1,
          estimated_duration_minutes: 60,
          content_count: 4
        },
        {
          slug: 'threat-modeling-innovation',
          title: 'Threat Modeling for Innovation',
          description: 'Using threat modeling frameworks to guide security innovation',
          order_number: 2,
          estimated_duration_minutes: 65,
          content_count: 4
        },
        {
          slug: 'mvp-development-security',
          title: 'Secure MVP Development',
          description: 'Building secure minimum viable products for security tools',
          order_number: 3,
          estimated_duration_minutes: 55,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'innovation-intermediate-assessment',
        title: 'Build Your First Security Tool MVP',
        description: 'Create a working prototype of a security tool using automation and threat modeling.',
        missions: [
          { mission_slug: 'security-tool-mvp-development' }
        ],
        recipes: ['innovation-mvp-security-checklist', 'innovation-threat-model-template', 'innovation-automation-basics'],
        reflection_prompt: 'In 6–8 sentences, describe the security tool MVP you built, the problem it solves, and what you learned about balancing security with innovation speed.'
      }
    },
    {
      slug: 'advanced',
      title: 'Advanced',
      description: 'Scaling security innovations and advanced technologies',
      order_number: 3,
      estimated_duration_hours: 12,
      modules: [
        {
          slug: 'ai-security-innovation',
          title: 'AI for Security Innovation',
          description: 'Using AI to enhance security tools and threat detection',
          order_number: 1,
          estimated_duration_minutes: 70,
          content_count: 4
        },
        {
          slug: 'zero-trust-innovation',
          title: 'Zero Trust Architecture Innovation',
          description: 'Innovative approaches to zero trust implementation',
          order_number: 2,
          estimated_duration_minutes: 75,
          content_count: 4
        },
        {
          slug: 'blockchain-security-innovation',
          title: 'Blockchain Security Innovation',
          description: 'Securing blockchain applications and smart contracts',
          order_number: 3,
          estimated_duration_minutes: 65,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'innovation-advanced-assessment',
        title: 'Design Zero Trust for African Telco',
        description: 'Design and prototype a zero trust architecture for a major African telecommunications provider.',
        missions: [
          { mission_slug: 'zero-trust-architecture-design' }
        ],
        recipes: ['innovation-ztna-blueprint', 'innovation-blockchain-security-basics', 'innovation-ai-security-tools'],
        reflection_prompt: 'In 7–9 sentences, explain your zero trust design for the African telco, including how you addressed local challenges like intermittent connectivity and resource constraints.'
      }
    },
    {
      slug: 'mastery',
      title: 'Mastery',
      description: 'Strategic innovation leadership and cyber entrepreneurship',
      order_number: 4,
      estimated_duration_hours: 14,
      modules: [
        {
          slug: 'cyber-product-strategy',
          title: 'Cyber Product Strategy',
          description: 'Strategic thinking for cyber product development',
          order_number: 1,
          estimated_duration_minutes: 80,
          content_count: 4
        },
        {
          slug: 'venture-building-cyber',
          title: 'Building Cyber Ventures',
          description: 'Entrepreneurship and venture building in cybersecurity',
          order_number: 2,
          estimated_duration_minutes: 85,
          content_count: 4
        },
        {
          slug: 'national-cyber-innovation',
          title: 'National Cyber Innovation Programs',
          description: 'Building national-level cyber innovation initiatives',
          order_number: 3,
          estimated_duration_minutes: 75,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'innovation-mastery-assessment',
        title: 'Pitch Your Cyber Startup to VCs',
        description: 'Develop and present a complete cyber startup pitch for African market opportunities.',
        missions: [
          { mission_slug: 'cyber-startup-pitch-development' }
        ],
        recipes: ['innovation-pitch-deck-template', 'innovation-market-analysis-africa', 'innovation-funding-strategy-guide'],
        reflection_prompt: 'In 8–10 sentences, describe your cyber startup idea, the African market opportunity you identified, and how you would address the unique challenges of building cyber ventures in African markets.'
      }
    }
  ]
};

// Mock progress data
const mockProgress = {
  track_slug: 'innovation',
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

export default function InnovationTrackPage() {
  const { user } = useAuth();
  const [curriculum, setCurriculum] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Innovation curriculum
        const curriculumResponse = await fetch('/api/curriculum/innovation');
        if (curriculumResponse.ok) {
          const curriculumData = await curriculumResponse.json();
          setCurriculum(curriculumData);
        } else {
          setCurriculum(mockInnovationCurriculum);
        }

        // Fetch user progress
        if (user?.id) {
          const progressResponse = await fetch(`/api/users/${user.id}/curriculum/innovation/progress`);
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
        console.error('Failed to fetch Innovation data:', error);
        setCurriculum(mockInnovationCurriculum);
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
          <Rocket className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading Innovation Track...</p>
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Failed to load Innovation curriculum</div>
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
              <Rocket className="w-12 h-12 text-amber-400" />
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
            Connect with fellow innovators, get help with prototypes, and share your cyber startup journey.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/community/spaces/innovation-beginner">
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-amber-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <Hash className="w-5 h-5 text-amber-400" />
                  <h4 className="text-white font-medium">#innovation-beginner-help</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Get help with innovation concepts, prototyping, and threat research.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Innovation Community</span>
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
                  Stay updated with innovation news, startup opportunities, and OCH updates.
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
              <span className="text-slate-400 text-sm">Need help with innovation concepts?</span>
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

                  <Link href={`/curriculum/innovation/${level.slug}`}>
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
