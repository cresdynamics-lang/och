'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Play, CheckCircle, Clock, BookOpen, Target, ChevronDown, ChevronRight, Award, Users, Hash, MessageSquare, ExternalLink, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Mock Offensive curriculum data - replace with actual API calls
const mockOffensiveCurriculum = {
  track: {
    slug: 'offensive',
    title: 'Offensive Track',
    description: 'Penetration testing, red teaming, and adversary emulation for African enterprise targets.',
    icon_key: 'offensive'
  },
  levels: [
    {
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
          content_count: 4 // 3 videos + 1 quiz
        },
        {
          slug: 'port-scanning-nmap',
          title: 'Port Scanning with Nmap',
          description: 'Mastering Nmap for network reconnaissance',
          order_number: 2,
          estimated_duration_minutes: 55,
          content_count: 4
        },
        {
          slug: 'web-recon-basics',
          title: 'Web Reconnaissance Basics',
          description: 'Web application reconnaissance techniques',
          order_number: 3,
          estimated_duration_minutes: 45,
          content_count: 4
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
    },
    {
      slug: 'intermediate',
      title: 'Intermediate',
      description: 'Exploitation fundamentals and vulnerability assessment',
      order_number: 2,
      estimated_duration_hours: 12,
      modules: [
        {
          slug: 'vulnerability-scanning',
          title: 'Vulnerability Scanning',
          description: 'Using automated tools to identify vulnerabilities',
          order_number: 1,
          estimated_duration_minutes: 65,
          content_count: 4
        },
        {
          slug: 'web-app-exploitation',
          title: 'Web Application Exploitation',
          description: 'Common web application vulnerabilities and exploitation',
          order_number: 2,
          estimated_duration_minutes: 70,
          content_count: 4
        },
        {
          slug: 'password-attacks',
          title: 'Password Attacks',
          description: 'Cracking and attacking password security',
          order_number: 3,
          estimated_duration_minutes: 55,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'offensive-intermediate-assessment',
        title: 'Exploit a Vulnerable Web Application',
        description: 'Identify and exploit vulnerabilities in a deliberately vulnerable web application.',
        missions: [
          { mission_slug: 'web-app-exploitation-exercise' }
        ],
        recipes: ['offensive-sql-injection-guide', 'offensive-xss-exploitation', 'offensive-password-cracking-basics'],
        reflection_prompt: 'Describe the vulnerabilities you found and exploited. What was your methodology and what lessons did you learn?'
      }
    },
    {
      slug: 'advanced',
      title: 'Advanced',
      description: 'Post-exploitation and evasion techniques',
      order_number: 3,
      estimated_duration_hours: 13,
      modules: [
        {
          slug: 'post-exploitation',
          title: 'Post-Exploitation Techniques',
          description: 'Maintaining access and privilege escalation after initial compromise',
          order_number: 1,
          estimated_duration_minutes: 75,
          content_count: 4
        },
        {
          slug: 'evasion-detection',
          title: 'Evasion and Detection Avoidance',
          description: 'Bypassing security controls and avoiding detection',
          order_number: 2,
          estimated_duration_minutes: 70,
          content_count: 4
        },
        {
          slug: 'wireless-attacks',
          title: 'Wireless Network Attacks',
          description: 'Attacking WiFi networks and wireless protocols',
          order_number: 3,
          estimated_duration_minutes: 65,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'offensive-advanced-assessment',
        title: 'Red Team Engagement Simulation',
        description: 'Simulate a red team engagement including initial access, privilege escalation, and persistence.',
        missions: [
          { mission_slug: 'red-team-simulation' }
        ],
        recipes: ['offensive-post-exploitation-guide', 'offensive-evasion-techniques', 'offensive-wireless-pentesting'],
        reflection_prompt: 'Describe your red team simulation approach. What techniques worked well and what challenges did you encounter?'
      }
    },
    {
      slug: 'mastery',
      title: 'Mastery',
      description: 'Red team operations and advanced adversary emulation',
      order_number: 4,
      estimated_duration_hours: 15,
      modules: [
        {
          slug: 'red-team-methodology',
          title: 'Red Team Methodology',
          description: 'Structured approach to red team operations',
          order_number: 1,
          estimated_duration_minutes: 80,
          content_count: 4
        },
        {
          slug: 'advanced-exploitation',
          title: 'Advanced Exploitation Techniques',
          description: '0-day exploits, custom weaponization, and advanced techniques',
          order_number: 2,
          estimated_duration_minutes: 85,
          content_count: 4
        },
        {
          slug: 'adversary-emulation',
          title: 'Adversary Emulation',
          description: 'Emulating real-world threat actors and techniques',
          order_number: 3,
          estimated_duration_minutes: 75,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'offensive-mastery-assessment',
        title: 'Full Red Team Operation Report',
        description: 'Execute a complete red team engagement and deliver a professional report with findings and recommendations.',
        missions: [
          { mission_slug: 'complete-red-team-operation' }
        ],
        recipes: ['offensive-red-team-methodology', 'offensive-advanced-exploitation', 'offensive-adversary-emulation'],
        reflection_prompt: 'Describe your complete red team operation. What was your most sophisticated technique and how would you improve it for future engagements?'
      }
    }
  ]
};

// Mock progress data
const mockProgress = {
  track_slug: 'offensive',
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

export default function OffensiveTrackPage() {
  const { user } = useAuth();
  const [curriculum, setCurriculum] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Offensive curriculum
        const curriculumResponse = await fetch('/api/curriculum/offensive');
        if (curriculumResponse.ok) {
          const curriculumData = await curriculumResponse.json();
          setCurriculum(curriculumData);
        } else {
          setCurriculum(mockOffensiveCurriculum);
        }

        // Fetch user progress
        if (user?.id) {
          const progressResponse = await fetch(`/api/users/${user.id}/curriculum/offensive/progress`);
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
        console.error('Failed to fetch Offensive data:', error);
        setCurriculum(mockOffensiveCurriculum);
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
          <Target className="w-12 h-12 text-orange-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading Offensive Track...</p>
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Failed to load Offensive curriculum</div>
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
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-transparent to-red-600/10" />
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
            <div className="p-4 bg-orange-500/20 rounded-xl">
              <Target className="w-12 h-12 text-orange-400" />
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
              <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {totalProgress}% Complete
              </Badge>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 rounded-full transition-all duration-1000"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Community Section */}
        <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-slate-900/30 border border-orange-500/20 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Community Support</h3>
          </div>

          <p className="text-slate-300 text-sm mb-4">
            Connect with fellow pentesters, share exploitation techniques, and get help with red team operations.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/community/spaces/offensive-beginner">
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-orange-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <Hash className="w-5 h-5 text-orange-400" />
                  <h4 className="text-white font-medium">#offensive-beginner-help</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Get help with reconnaissance, Nmap, and basic penetration testing concepts.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Offensive Community</span>
                  <span>Active discussions</span>
                </div>
              </Card>
            </Link>

            <Link href="/community/spaces/announcements">
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-orange-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-5 h-5 text-orange-400" />
                  <h4 className="text-white font-medium">Official Announcements</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Stay updated with offensive security news, CTF challenges, and OCH updates.
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
              <span className="text-slate-400 text-sm">Need help with offensive techniques?</span>
              <Link href="/community">
                <Button variant="outline" size="sm" className="text-orange-400 border-orange-400 hover:bg-orange-400 hover:text-white">
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
                      <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        {level.estimated_duration_hours}h
                      </Badge>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{level.description}</p>
                  </div>

                  <Link href={`/curriculum/offensive/${level.slug}`}>
                    <Button className="bg-orange-600 hover:bg-orange-700">
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
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
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
