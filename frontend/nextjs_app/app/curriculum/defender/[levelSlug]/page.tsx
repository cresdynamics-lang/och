'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, Play, CheckCircle, Clock, BookOpen, Target, ChevronDown, ChevronRight, FileText, Award, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useDefenderLevel, useAuth, useContentProgress } from '@/hooks/useCurriculum';
import AiCoachStrip from '@/components/curriculum/AiCoachStrip';
import Link from 'next/link';
import { Users, Hash, MessageSquare, ExternalLink } from 'lucide-react';

function ModuleAccordion({ module, levelSlug }: { module: any, levelSlug: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-4 bg-slate-900/50 border-slate-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h4 className="text-white font-medium">{module.title}</h4>
            <p className="text-slate-400 text-sm">{module.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{module.estimated_duration_minutes}min</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700 pt-4">
          {/* Videos */}
          <div className="mb-4">
            <h5 className="text-white font-medium mb-3 flex items-center gap-2">
              <Play className="w-4 h-4" />
              Videos ({module.videos?.length || 0})
            </h5>
            <div className="space-y-2">
              {module.videos?.map((video: any) => (
                <div key={video.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center">
                      <Play className="w-3 h-3 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{video.title}</p>
                      <p className="text-slate-400 text-xs">{Math.round(video.duration_seconds / 60)}min</p>
                    </div>
                  </div>
                  <Link href={`/curriculum/defender/${levelSlug}/${module.slug}/${video.slug}`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      Watch
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz */}
          {module.quiz && (
            <div>
              <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Quiz
              </h5>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{module.quiz.title}</p>
                    <p className="text-slate-400 text-xs">{module.quiz.questions?.length || 0} questions</p>
                  </div>
                </div>
                <Link href={`/curriculum/defender/${levelSlug}/${module.slug}/quiz/${module.quiz.slug}`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    Take Quiz
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Supporting Recipes */}
          {module.supporting_recipes && module.supporting_recipes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Supporting Recipes
              </h5>
              <div className="flex flex-wrap gap-2">
                {module.supporting_recipes.map((recipe: string) => (
                  <Badge key={recipe} variant="outline" className="text-xs text-slate-400 border-slate-600">
                    {recipe}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function AssessmentBlock({ assessment }: { assessment: any }) {
  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{assessment.title}</h3>
            <p className="text-slate-300 text-sm">{assessment.description}</p>
          </div>
        </div>

        {/* Missions */}
        {assessment.missions && assessment.missions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Missions ({assessment.missions.length})
            </h4>
            <div className="space-y-2">
              {assessment.missions.map((mission: any) => (
                <div key={mission.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-white text-sm font-medium">{mission.title}</p>
                    <p className="text-slate-400 text-xs">{mission.description}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs">
                    Start
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recipes */}
        {assessment.recipes && assessment.recipes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Recipes ({assessment.recipes.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {assessment.recipes.map((recipe: string) => (
                <Badge key={recipe} className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                  {recipe}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Reflection Prompt */}
        {assessment.reflection_prompt && (
          <div className="mb-4">
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Reflection
            </h4>
            <Card className="bg-slate-800/50 border-slate-600">
              <div className="p-4">
                <p className="text-slate-300 text-sm mb-3">{assessment.reflection_prompt}</p>
                <textarea
                  placeholder="Write your reflection here..."
                  className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm resize-none"
                  rows={4}
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    Submit Reflection
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Complete Assessment Button */}
        <div className="flex justify-center">
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6">
            Complete Assessment
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function DefenderLevelPage() {
  const params = useParams();
  const levelSlug = params.levelSlug as string;
  const { level, loading, error } = useDefenderLevel(levelSlug);
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400">Loading level...</div>
        </div>
      </div>
    );
  }

  if (error || !level) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Failed to load level</div>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-slate-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/curriculum/defender" className="text-slate-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <span className="text-2xl">🎓</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {level.title}
                </h1>
                <p className="text-slate-300 text-sm">{level.description}</p>
              </div>
            </div>
          </div>

          {/* Level Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-lg font-bold text-white">{level.modules?.length || 0}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Modules</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-lg font-bold text-white">{level.estimated_duration_hours}h</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Duration</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-lg font-bold text-white">0%</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Complete</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Coach Strip */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <AiCoachStrip trackSlug="defender" />
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modules */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Modules</h2>
          {level.modules?.map((module: any) => (
            <ModuleAccordion
              key={module.id}
              module={module}
              levelSlug={levelSlug}
            />
          ))}
        </div>

        {/* Community Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Community Resources
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Help Channel */}
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Hash className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-medium">#defender-{levelSlug}-help</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Get help with {levelSlug} level concepts, missions, and challenges from mentors and peers.
              </p>
              <Link href={`/community/spaces/defender-${levelSlug}?channel=help`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Ask for Help
                </Button>
              </Link>
            </Card>

            {/* Mission Discussions */}
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Hash className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-medium">#defender-{levelSlug}-missions</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Discuss missions, share solutions, and learn from others' approaches to {levelSlug} challenges.
              </p>
              <Link href={`/community/spaces/defender-${levelSlug}?channel=missions`}>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Mission Discussions
                </Button>
              </Link>
            </Card>

            {/* Recipe Sharing */}
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Hash className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-medium">#defender-{levelSlug}-recipes</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Share and discuss recipes, techniques, and best practices for {levelSlug} level work.
              </p>
              <Link href={`/community/spaces/defender-${levelSlug}?channel=recipes`}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Recipe Discussions
                </Button>
              </Link>
            </Card>

            {/* General Chat */}
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Hash className="w-5 h-5 text-slate-400" />
                <h3 className="text-white font-medium">#defender-{levelSlug}-general</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Casual discussions, introductions, and general {levelSlug} level conversation.
              </p>
              <Link href={`/community/spaces/defender-${levelSlug}?channel=general`}>
                <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:border-slate-500">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Join the Conversation
                </Button>
              </Link>
            </Card>
          </div>

          <div className="mt-6 text-center">
            <Link href="/community">
              <Button variant="outline" className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white">
                <Users className="w-4 h-4 mr-2" />
                Explore All Communities
              </Button>
            </Link>
          </div>
        </div>

        {/* Assessment Block */}
        {level.assessment_block && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Level Assessment</h2>
            <AssessmentBlock assessment={level.assessment_block} />
          </div>
        )}
      </div>
    </div>
  );
}
