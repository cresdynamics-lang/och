'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, Play, CheckCircle, Clock, BookOpen, Target, ChevronDown, ChevronRight, Award, Users, Hash, MessageSquare, ExternalLink, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Mock Offensive level data - replace with database queries
const mockOffensiveLevels = {
  'beginner': {
    slug: 'beginner',
    title: 'Beginner',
    description: 'Reconnaissance and enumeration fundamentals',
    order_number: 1,
    estimated_duration_hours: 10,
    modules: [
      {
        slug: 'recon-fundamentals',
        title: 'Reconnaissance Fundamentals',
        description: 'Active and passive reconnaissance techniques',
        order_number: 1,
        estimated_duration_minutes: 50,
        content_items: [
          {
            id: 'recon-fundamentals-active-vs-passive-recon',
            slug: 'active-vs-passive-recon',
            title: 'Active vs Passive Reconnaissance',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/active-vs-passive-recon.mp4',
            duration_seconds: 360,
            order_number: 1,
            completed: false
          },
          {
            id: 'recon-fundamentals-dns-enumeration-techniques',
            slug: 'dns-enumeration-techniques',
            title: 'DNS Enumeration Techniques',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/dns-enumeration-techniques.mp4',
            duration_seconds: 420,
            order_number: 2,
            completed: false
          },
          {
            id: 'recon-fundamentals-whois-and-asn-lookup',
            slug: 'whois-and-asn-lookup',
            title: 'WHOIS and ASN Lookup',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/whois-and-asn-lookup.mp4',
            duration_seconds: 300,
            order_number: 3,
            completed: false
          },
          {
            id: 'recon-fundamentals-quiz',
            slug: 'reconnaissance-basics-quiz',
            title: 'Reconnaissance Basics Quiz',
            content_type: 'quiz',
            quiz_data: {
              questions: [
                {
                  id: 'q1',
                  type: 'mcq',
                  prompt: 'Which type of reconnaissance involves directly interacting with the target?',
                  choices: [
                    'Passive reconnaissance',
                    'Active reconnaissance',
                    'Internal reconnaissance',
                    'External reconnaissance'
                  ],
                  correctIndex: 1
                },
                {
                  id: 'q2',
                  type: 'mcq',
                  prompt: 'What information can be gathered from a WHOIS lookup?',
                  choices: [
                    'Domain registration details and contact information',
                    'Internal network topology',
                    'User passwords',
                    'Database contents'
                  ],
                  correctIndex: 0
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
        slug: 'port-scanning-nmap',
        title: 'Port Scanning with Nmap',
        description: 'Mastering Nmap for network reconnaissance',
        order_number: 2,
        estimated_duration_minutes: 55,
        content_items: [
          {
            id: 'port-scanning-nmap-scan-types-explained',
            slug: 'nmap-scan-types-explained',
            title: 'Nmap Scan Types Explained',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/nmap-scan-types-explained.mp4',
            duration_seconds: 480,
            order_number: 1,
            completed: false
          },
          {
            id: 'port-scanning-nmap-scripting-engine-nse',
            slug: 'nmap-scripting-engine-nse',
            title: 'Nmap Scripting Engine (NSE)',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/nmap-scripting-engine-nse.mp4',
            duration_seconds: 420,
            order_number: 2,
            completed: false
          },
          {
            id: 'port-scanning-scan-evasion-techniques',
            slug: 'scan-evasion-techniques',
            title: 'Scan Evasion Techniques',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/scan-evasion-techniques.mp4',
            duration_seconds: 360,
            order_number: 3,
            completed: false
          },
          {
            id: 'port-scanning-quiz',
            slug: 'nmap-fundamentals-quiz',
            title: 'Nmap Fundamentals Quiz',
            content_type: 'quiz',
            quiz_data: { questions: [] },
            order_number: 4,
            completed: false,
            score: null
          }
        ]
      },
      {
        slug: 'web-recon-basics',
        title: 'Web Reconnaissance Basics',
        description: 'Web application reconnaissance techniques',
        order_number: 3,
        estimated_duration_minutes: 45,
        content_items: [
          {
            id: 'web-recon-basics-directory-busting-gobuster',
            slug: 'directory-busting-gobuster',
            title: 'Directory Busting with Gobuster',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/directory-busting-gobuster.mp4',
            duration_seconds: 360,
            order_number: 1,
            completed: false
          },
          {
            id: 'web-recon-basics-subdomain-enumeration',
            slug: 'subdomain-enumeration',
            title: 'Subdomain Enumeration',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/subdomain-enumeration.mp4',
            duration_seconds: 480,
            order_number: 2,
            completed: false
          },
          {
            id: 'web-recon-basics-technology-fingerprinting',
            slug: 'technology-fingerprinting',
            title: 'Technology Fingerprinting',
            content_type: 'video',
            video_url: 'https://videos.och.local/offensive/beginner/technology-fingerprinting.mp4',
            duration_seconds: 300,
            order_number: 3,
            completed: false
          },
          {
            id: 'web-recon-basics-quiz',
            slug: 'web-reconnaissance-quiz',
            title: 'Web Reconnaissance Quiz',
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
      slug: 'offensive-beginner-assessment',
      title: 'Complete Reconnaissance Assessment',
      description: 'Conduct full reconnaissance on a target following proper methodology.',
      missions: [
        { mission_slug: 'full-recon-exercise' }
      ],
      recipes: ['offensive-nmap-basics', 'offensive-osint-recon', 'offensive-web-recon-checklist'],
      reflection_prompt: 'Document your reconnaissance methodology and explain what information you were able to gather about the target.'
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
                <Play className="w-4 h-4 text-orange-400" />
                <span className="text-slate-400">
                  Videos: {videosCompleted}/{totalVideos}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-orange-400" />
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
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Play className="w-4 h-4 text-orange-400" />
                    </div>
                  ) : (
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Award className="w-4 h-4 text-orange-400" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h4 className="text-white font-medium">{item.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      {item.content_type === 'video' && (
                        <span>{Math.floor(item.duration_seconds / 60)}min</span>
                      )}
                      {item.content_type === 'quiz' && item.completed && item.score !== null && (
                        <span className="text-orange-400">Score: {item.score}%</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.completed ? (
                    <CheckCircle className="w-5 h-5 text-orange-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-500" />
                  )}

                  <Button
                    size="sm"
                    variant={item.completed ? "outline" : "default"}
                    className={item.completed ? "border-orange-500 text-orange-400" : "bg-orange-600 hover:bg-orange-700"}
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
        <Target className="w-6 h-6 text-orange-400" />
        <h3 className="text-xl font-bold text-white">{assessment.title}</h3>
      </div>

      <p className="text-slate-300 mb-6">{assessment.description}</p>

      <div className="space-y-4">
        {assessment.missions && assessment.missions.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-400" />
              Missions
            </h4>
            <div className="flex flex-wrap gap-2">
              {assessment.missions.map((mission: any, idx: number) => (
                <Badge key={idx} variant="outline" className="text-orange-400 border-orange-400">
                  {mission.mission_slug.replace(/-/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {assessment.recipes && assessment.recipes.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-orange-400" />
              Recipes
            </h4>
            <div className="flex flex-wrap gap-2">
              {assessment.recipes.map((recipe: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-orange-400 border-orange-400">
                  {recipe.replace(/-/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {assessment.reflection_prompt && (
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange-400" />
              Reflection
            </h4>
            <p className="text-slate-300 text-sm italic">{assessment.reflection_prompt}</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700">
        <Button className="w-full bg-orange-600 hover:bg-orange-700">
          Start Assessment
        </Button>
      </div>
    </Card>
  );
}

export default function OffensiveLevelPage() {
  const params = useParams();
  const levelSlug = params.levelSlug as string;
  const { user } = useAuth();
  const [level, setLevel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        // Try to fetch from API first
        const response = await fetch(`/api/curriculum/offensive/${levelSlug}`);
        if (response.ok) {
          const data = await response.json();
          setLevel(data.level);
        } else {
          // Fallback to mock data
          const mockLevel = mockOffensiveLevels[levelSlug as keyof typeof mockOffensiveLevels];
          if (mockLevel) {
            setLevel(mockLevel);
          }
        }
      } catch (error) {
        console.error('Failed to fetch Offensive level:', error);
        // Fallback to mock data
        const mockLevel = mockOffensiveLevels[levelSlug as keyof typeof mockOffensiveLevels];
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
          <Target className="w-12 h-12 text-orange-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading Offensive {levelSlug} level...</p>
        </div>
      </div>
    );
  }

  if (!level) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Offensive level not found</div>
          <Link href="/curriculum/offensive">
            <Button>Back to Offensive Track</Button>
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
            <Link href="/curriculum/offensive">
              <Button variant="outline" size="sm" className="text-slate-400 border-slate-600 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Offensive Track
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
            <div className="p-4 bg-orange-500/20 rounded-xl">
              <Target className="w-12 h-12 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{level.title}</h1>
                <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Offensive Track
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
        <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-slate-900/30 border border-orange-500/20 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Community Resources</h3>
          </div>

          <p className="text-slate-300 text-sm mb-4">
            Get help with {level.title.toLowerCase()} offensive concepts from fellow pentesters and red teamers.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Link href={`/community/spaces/offensive-${levelSlug}?channel=help`}>
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-orange-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <Hash className="w-5 h-5 text-orange-400" />
                  <h4 className="text-white font-medium">#offensive-{levelSlug}-help</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Get help with {level.title.toLowerCase()} level offensive concepts and challenges.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Offensive Community</span>
                  <span>Active discussions</span>
                </div>
              </Card>
            </Link>

            <Link href={`/community/spaces/offensive-${levelSlug}?channel=techniques`}>
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-orange-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-orange-400" />
                  <h4 className="text-white font-medium">#offensive-{levelSlug}-techniques</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Share and discuss offensive techniques, tools, and methodologies.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Technique Discussions</span>
                  <span>Peer support</span>
                </div>
              </Card>
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Need help with offensive techniques?</span>
              <Link href="/community">
                <Button variant="outline" size="sm" className="text-orange-400 border-orange-400 hover:bg-orange-400 hover:text-white">
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
