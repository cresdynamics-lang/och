'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, Play, CheckCircle, Clock, BookOpen, Target, ChevronDown, ChevronRight, Rocket, Award, Users, Hash, MessageSquare, ExternalLink, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Mock Innovation level data - replace with database queries
const mockInnovationLevels = {
  'beginner': {
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
        content_items: [
          {
            id: 'innovation-mindset-what-is-cyber-innovation',
            slug: 'what-is-cyber-innovation',
            title: 'What is Cyber Innovation?',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/what-is-cyber-innovation.mp4',
            duration_seconds: 360,
            order_number: 1,
            completed: false
          },
          {
            id: 'innovation-mindset-problem-first-thinking',
            slug: 'problem-first-thinking',
            title: 'Problem-First Thinking',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/problem-first-thinking.mp4',
            duration_seconds: 420,
            order_number: 2,
            completed: false
          },
          {
            id: 'innovation-mindset-observation-vs-assumption',
            slug: 'observation-vs-assumption',
            title: 'Observation vs Assumption',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/observation-vs-assumption.mp4',
            duration_seconds: 300,
            order_number: 3,
            completed: false
          },
          {
            id: 'innovation-mindset-quiz',
            slug: 'innovation-foundations-quiz',
            title: 'Innovation Foundations Quiz',
            content_type: 'quiz',
            quiz_data: {
              questions: [
                {
                  id: 'q1',
                  type: 'mcq',
                  prompt: 'What is the first step in cyber innovation?',
                  choices: [
                    'Build a tool immediately',
                    'Spot a real problem that others miss',
                    'Read all research papers',
                    'Copy existing solutions'
                  ],
                  correctIndex: 1
                },
                {
                  id: 'q2',
                  type: 'mcq',
                  prompt: 'What does OSINT stand for?',
                  choices: [
                    'Online Security Intelligence Tools',
                    'Open Source Intelligence',
                    'Operational Security Integration Network',
                    'Open Systems Internet Technology'
                  ],
                  correctIndex: 1
                },
                {
                  id: 'q3',
                  type: 'mcq',
                  prompt: 'Why is problem-first thinking important in cybersecurity?',
                  choices: [
                    'It helps you build tools faster',
                    'It ensures you solve real problems instead of imagined ones',
                    'It makes you look more professional',
                    'It reduces the need for testing'
                  ],
                  correctIndex: 1
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
        slug: 'threat-research-basics',
        title: 'Threat Research Basics',
        description: 'Using OSINT and research to understand cyber threats',
        order_number: 2,
        estimated_duration_minutes: 50,
        content_items: [
          {
            id: 'threat-research-open-source-intelligence-osint',
            slug: 'open-source-intelligence-osint',
            title: 'Open Source Intelligence (OSINT)',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/open-source-intelligence-osint.mp4',
            duration_seconds: 480,
            order_number: 1,
            completed: false
          },
          {
            id: 'threat-research-reading-cves-advisories',
            slug: 'reading-cves-advisories',
            title: 'Reading CVEs & Security Advisories',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/reading-cves-advisories.mp4',
            duration_seconds: 420,
            order_number: 2,
            completed: false
          },
          {
            id: 'threat-research-trend-spotting-patterns',
            slug: 'trend-spotting-patterns',
            title: 'Trend Spotting Patterns',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/trend-spotting-patterns.mp4',
            duration_seconds: 360,
            order_number: 3,
            completed: false
          },
          {
            id: 'threat-research-quiz',
            slug: 'threat-research-basics-quiz',
            title: 'Threat Research Basics Quiz',
            content_type: 'quiz',
            quiz_data: { questions: [] },
            order_number: 4,
            completed: false,
            score: null
          }
        ]
      },
      {
        slug: 'tool-prototyping-intro',
        title: 'Tool Prototyping Introduction',
        description: 'Building and validating security tool ideas quickly',
        order_number: 3,
        estimated_duration_minutes: 45,
        content_items: [
          {
            id: 'tool-prototyping-no-code-security-tools',
            slug: 'no-code-security-tools',
            title: 'No-Code Security Tools',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/no-code-security-tools.mp4',
            duration_seconds: 360,
            order_number: 1,
            completed: false
          },
          {
            id: 'tool-prototyping-scripting-with-chatgpt',
            slug: 'scripting-with-chatgpt',
            title: 'Scripting with ChatGPT',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/scripting-with-chatgpt.mp4',
            duration_seconds: 480,
            order_number: 2,
            completed: false
          },
          {
            id: 'tool-prototyping-idea-validation-checklist',
            slug: 'idea-validation-checklist',
            title: 'Idea Validation Checklist',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/idea-validation-checklist.mp4',
            duration_seconds: 300,
            order_number: 3,
            completed: false
          },
          {
            id: 'tool-prototyping-quiz',
            slug: 'prototyping-basics-quiz',
            title: 'Prototyping Basics Quiz',
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
      slug: 'innovation-beginner-assessment',
      title: 'Spot the Next Threat Trend',
      description: 'Use OSINT skills to identify an emerging threat that others might be missing.',
      missions: [
        { mission_slug: 'emerging-threats-osint' }
      ],
      recipes: ['innovation-osint-basics', 'innovation-idea-validation', 'innovation-threat-trend-spotting'],
      reflection_prompt: 'In 5–7 sentences, describe the emerging threat you discovered through OSINT research and why African organizations should care about it specifically.'
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
                <Play className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">
                  Videos: {videosCompleted}/{totalVideos}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-amber-400" />
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
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Play className="w-4 h-4 text-amber-400" />
                    </div>
                  ) : (
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Rocket className="w-4 h-4 text-amber-400" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h4 className="text-white font-medium">{item.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      {item.content_type === 'video' && (
                        <span>{Math.floor(item.duration_seconds / 60)}min</span>
                      )}
                      {item.content_type === 'quiz' && item.completed && item.score !== null && (
                        <span className="text-amber-400">Score: {item.score}%</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.completed ? (
                    <CheckCircle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-500" />
                  )}

                  <Button
                    size="sm"
                    variant={item.completed ? "outline" : "default"}
                    className={item.completed ? "border-amber-500 text-amber-400" : "bg-amber-600 hover:bg-amber-700"}
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

export default function InnovationLevelPage() {
  const params = useParams();
  const levelSlug = params.levelSlug as string;
  const { user } = useAuth();
  const [level, setLevel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        // Try to fetch from API first
        const response = await fetch(`/api/curriculum/innovation/${levelSlug}`);
        if (response.ok) {
          const data = await response.json();
          setLevel(data.level);
        } else {
          // Fallback to mock data
          const mockLevel = mockInnovationLevels[levelSlug as keyof typeof mockInnovationLevels];
          if (mockLevel) {
            setLevel(mockLevel);
          }
        }
      } catch (error) {
        console.error('Failed to fetch Innovation level:', error);
        // Fallback to mock data
        const mockLevel = mockInnovationLevels[levelSlug as keyof typeof mockInnovationLevels];
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
          <Rocket className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading Innovation {levelSlug} level...</p>
        </div>
      </div>
    );
  }

  if (!level) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Innovation level not found</div>
          <Link href="/curriculum/innovation">
            <Button>Back to Innovation Track</Button>
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
            <Link href="/curriculum/innovation">
              <Button variant="outline" size="sm" className="text-slate-400 border-slate-600 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Innovation Track
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
            <div className="p-4 bg-amber-500/20 rounded-xl">
              <Rocket className="w-12 h-12 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{level.title}</h1>
                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Innovation Track
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
        <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-slate-900/30 border border-amber-500/20 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Community Resources</h3>
          </div>

          <p className="text-slate-300 text-sm mb-4">
            Get help with {level.title.toLowerCase()} innovation concepts from mentors and peers.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Link href={`/community/spaces/innovation-${levelSlug}?channel=help`}>
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-amber-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <Hash className="w-5 h-5 text-amber-400" />
                  <h4 className="text-white font-medium">#innovation-{levelSlug}-help</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Get help with {level.title.toLowerCase()} level innovation concepts and challenges.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Innovation Community</span>
                  <span>Active discussions</span>
                </div>
              </Card>
            </Link>

            <Link href={`/community/spaces/innovation-${levelSlug}?channel=prototyping`}>
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-amber-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <h4 className="text-white font-medium">#innovation-{levelSlug}-prototyping</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Discuss prototyping approaches and share your tool development experiences.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Prototyping Discussions</span>
                  <span>Peer support</span>
                </div>
              </Card>
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Need help with this level?</span>
              <Link href="/community">
                <Button variant="outline" size="sm" className="text-amber-400 border-amber-400 hover:bg-amber-400 hover:text-white">
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
