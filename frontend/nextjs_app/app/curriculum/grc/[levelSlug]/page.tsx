'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, Play, CheckCircle, Clock, BookOpen, Target, ChevronDown, ChevronRight, FileText, Award, Users, Hash, MessageSquare, ExternalLink, Star, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Mock GRC level data - replace with API calls
const mockGrcLevels = {
  'beginner': {
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
        content_items: [
          {
            id: 'grc-foundations-what-is-grc',
            slug: 'what-is-grc',
            title: 'What is GRC in Cybersecurity?',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/what-is-grc.mp4',
            duration_seconds: 360,
            order_number: 1,
            completed: false
          },
          {
            id: 'grc-foundations-governance-risk-compliance-differences',
            slug: 'governance-risk-compliance-differences',
            title: 'Governance vs Risk vs Compliance',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/governance-risk-compliance-differences.mp4',
            duration_seconds: 420,
            order_number: 2,
            completed: false
          },
          {
            id: 'grc-foundations-grc-roles-in-organizations',
            slug: 'grc-roles-in-organizations',
            title: 'Who Does What in GRC?',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/grc-roles-in-organizations.mp4',
            duration_seconds: 300,
            order_number: 3,
            completed: false
          },
          {
            id: 'grc-foundations-quiz',
            slug: 'grc-foundations-quiz',
            title: 'GRC Foundations Quiz',
            content_type: 'quiz',
            quiz_data: {
              questions: [
                {
                  id: 'q1',
                  type: 'mcq',
                  prompt: 'What does GRC stand for?',
                  choices: [
                    'Governance, Risk, and Compliance',
                    'Governance, Reporting, and Controls',
                    'General Risk and Compliance',
                    'Global Regulatory Compliance'
                  ],
                  correctIndex: 0
                },
                {
                  id: 'q2',
                  type: 'mcq',
                  prompt: 'Which of the following is primarily concerned with setting policies and ensuring organizational objectives are met?',
                  choices: [
                    'Risk Management',
                    'Compliance',
                    'Governance',
                    'Auditing'
                  ],
                  correctIndex: 2
                }
              ]
            },
            order_number: 4,
            completed: false,
            score: null
          }
        ]
      },
      {
        slug: 'policies-and-standards-intro',
        title: 'Policies, Standards & Frameworks',
        description: 'Introduction to policies, standards, procedures and common frameworks',
        order_number: 2,
        estimated_duration_minutes: 50,
        content_items: [
          {
            id: 'policies-standards-policies-vs-standards-vs-procedures',
            slug: 'policies-vs-standards-vs-procedures',
            title: 'Policies vs Standards vs Procedures',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/policies-vs-standards-vs-procedures.mp4',
            duration_seconds: 480,
            order_number: 1,
            completed: false
          },
          {
            id: 'policies-standards-common-frameworks-overview',
            slug: 'common-frameworks-overview',
            title: 'Common Frameworks: ISO 27001, NIST CSF',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/common-frameworks-overview.mp4',
            duration_seconds: 540,
            order_number: 2,
            completed: false
          },
          {
            id: 'policies-standards-african-context-frameworks',
            slug: 'african-context-frameworks',
            title: 'Frameworks in African Context (AFRINIC, etc.)',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/african-context-frameworks.mp4',
            duration_seconds: 360,
            order_number: 3,
            completed: false
          },
          {
            id: 'policies-standards-quiz',
            slug: 'policies-standards-quiz',
            title: 'Policies & Standards Quiz',
            content_type: 'quiz',
            quiz_data: { questions: [] },
            order_number: 4,
            completed: false,
            score: null
          }
        ]
      },
      {
        slug: 'risk-assessment-basics',
        title: 'Risk Assessment Fundamentals',
        description: 'Basic concepts of risk identification, assessment, and management',
        order_number: 3,
        estimated_duration_minutes: 40,
        content_items: [
          {
            id: 'risk-assessment-risk-register-basics',
            slug: 'risk-register-basics',
            title: 'What is a Risk Register?',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/risk-register-basics.mp4',
            duration_seconds: 300,
            order_number: 1,
            completed: false
          },
          {
            id: 'risk-assessment-impact-vs-likelihood',
            slug: 'impact-vs-likelihood',
            title: 'Impact vs Likelihood Assessment',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/impact-vs-likelihood.mp4',
            duration_seconds: 420,
            order_number: 2,
            completed: false
          },
          {
            id: 'risk-assessment-basic-controls-examples',
            slug: 'basic-controls-examples',
            title: 'Basic Control Examples & Categories',
            content_type: 'video',
            video_url: 'https://videos.och.local/grc/beginner/basic-controls-examples.mp4',
            duration_seconds: 360,
            order_number: 3,
            completed: false
          },
          {
            id: 'risk-assessment-quiz',
            slug: 'risk-assessment-quiz',
            title: 'Risk Assessment Quiz',
            content_type: 'quiz',
            quiz_data: { questions: [] },
            order_number: 4,
            completed: false,
            score: null
          }
        ]
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
  }
};

function ModuleAccordion({ module, levelSlug }: { module: any, levelSlug: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const videosCompleted = module.content_items.filter((item: any) => item.content_type === 'video' && item.completed).length;
  const quizzesCompleted = module.content_items.filter((item: any) => item.content_type === 'quiz' && item.completed).length;
  const totalVideos = module.content_items.filter((item: any) => item.content_type === 'video').length;
  const totalQuizzes = module.content_items.filter((item: any) => item.content_type === 'quiz').length;

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
            <p className="text-slate-300 mb-4">{module.description}</p>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">
                  Videos: {videosCompleted}/{totalVideos}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">
                  Quiz: {quizzesCompleted}/{totalQuizzes}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">{module.estimated_duration_minutes}min</span>
              </div>
            </div>
          </div>

          <div className="ml-4">
            <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-slate-700">
          <div className="space-y-3">
            {module.content_items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-3 flex-1">
                  {item.content_type === 'video' ? (
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Play className="w-4 h-4 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <FileText className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h4 className="text-white font-medium">{item.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      {item.content_type === 'video' && (
                        <span>{Math.floor(item.duration_seconds / 60)}min</span>
                      )}
                      {item.content_type === 'quiz' && item.completed && item.score !== null && (
                        <span className="text-emerald-400">Score: {item.score}%</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.completed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-500" />
                  )}

                  <Button
                    size="sm"
                    variant={item.completed ? "outline" : "default"}
                    className={item.completed ? "border-emerald-500 text-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"}
                  >
                    {item.completed ? 'Review' : 'Start'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

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

export default function GrcLevelPage() {
  const params = useParams();
  const levelSlug = params.levelSlug as string;
  const { user } = useAuth();
  const [level, setLevel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        // Try to fetch from API first
        const response = await fetch(`/api/curriculum/grc/${levelSlug}`);
        if (response.ok) {
          const data = await response.json();
          setLevel(data.level);
        } else {
          // Fallback to mock data
          const mockLevel = mockGrcLevels[levelSlug as keyof typeof mockGrcLevels];
          if (mockLevel) {
            setLevel(mockLevel);
          }
        }
      } catch (error) {
        console.error('Failed to fetch GRC level:', error);
        // Fallback to mock data
        const mockLevel = mockGrcLevels[levelSlug as keyof typeof mockGrcLevels];
        if (mockLevel) {
          setLevel(mockLevel);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLevel();
  }, [levelSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading GRC {levelSlug} level...</p>
        </div>
      </div>
    );
  }

  if (!level) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">GRC level not found</div>
          <Link href="/curriculum/grc">
            <Button>Back to GRC Track</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/curriculum/grc">
              <Button variant="outline" size="sm" className="text-slate-400 border-slate-600 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to GRC Track
              </Button>
            </Link>
            <Link href="/curriculum">
              <Button variant="outline" size="sm" className="text-slate-400 border-slate-600 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Curriculum Hub
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <div className="p-4 bg-emerald-500/20 rounded-xl">
              <FileText className="w-12 h-12 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{level.title}</h1>
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  GRC Track
                </Badge>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed">
                {level.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Community Section */}
        <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-slate-900/30 border border-emerald-500/20 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Community Resources</h3>
          </div>

          <p className="text-slate-300 text-sm mb-4">
            Get help with {level.title.toLowerCase()} GRC concepts from mentors and peers.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Link href={`/community/spaces/grc-${levelSlug}?channel=help`}>
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-emerald-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <Hash className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-white font-medium">#grc-{levelSlug}-help</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Get help with {level.title.toLowerCase()} level GRC concepts and challenges.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>GRC Community</span>
                  <span>Active discussions</span>
                </div>
              </Card>
            </Link>

            <Link href={`/community/spaces/grc-${levelSlug}?channel=missions`}>
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-emerald-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-white font-medium">#grc-{levelSlug}-missions</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Discuss assessment missions and share approaches to {level.title.toLowerCase()} challenges.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Mission Discussions</span>
                  <span>Peer support</span>
                </div>
              </Card>
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Need help with this level?</span>
              <Link href="/community">
                <Button variant="outline" size="sm" className="text-emerald-400 border-emerald-400 hover:bg-emerald-400 hover:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Explore Communities
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Modules */}
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-white">Modules</h2>
          {level.modules.map((module: any) => (
            <ModuleAccordion key={module.slug} module={module} levelSlug={levelSlug} />
          ))}
        </div>

        {/* Assessment Block */}
        {level.assessment_block && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Level Assessment</h2>
            <AssessmentBlock assessment={level.assessment_block} />
          </div>
        )}
      </div>
    </div>
  );
}
