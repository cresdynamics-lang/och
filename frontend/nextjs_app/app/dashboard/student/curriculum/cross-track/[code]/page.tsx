/**
 * Cross-Track Program Detail Page
 * Tier 6 - Professional skills across all cyber roles
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, PlayCircle, FileText, CheckCircle2, 
  Clock, Loader2, Upload, Send, Lock, Unlock, Award, 
  Target, Brain, Briefcase, Rocket, Zap, Shield, Star,
  ChevronRight, ChevronDown, Video, FileCheck, MessageSquare,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { curriculumClient } from '@/services/curriculumClient';
import { fastapiClient } from '@/services/fastapiClient';
import { useAuth } from '@/hooks/useAuth';

// Program icons and colors
const programIcons: Record<string, { icon: JSX.Element; color: string; gradient: string; border: string }> = {
  CROSS_ENTREPRENEURSHIP: {
    icon: <Rocket className="w-6 h-6" />,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 via-sky-500/10 to-cyan-500/20',
    border: 'border-cyan-500/30',
  },
  CROSS_SOFT_SKILLS: {
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-emerald-500/20',
    border: 'border-emerald-500/30',
  },
  CROSS_CAREER: {
    icon: <Briefcase className="w-6 h-6" />,
    color: 'text-amber-400',
    gradient: 'from-amber-500/20 via-yellow-500/10 to-amber-500/20',
    border: 'border-amber-500/30',
  },
  CROSS_ETHICS: {
    icon: <Shield className="w-6 h-6" />,
    color: 'text-indigo-400',
    gradient: 'from-indigo-500/20 via-blue-500/10 to-indigo-500/20',
    border: 'border-indigo-500/30',
  },
  CROSS_LEADERSHIP: {
    icon: <Award className="w-6 h-6" />,
    color: 'text-och-gold',
    gradient: 'from-och-gold/20 via-amber-500/10 to-och-gold/20',
    border: 'border-och-gold/30',
  },
};

export default function CrossTrackProgramPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const code = params?.code as string;

  const [program, setProgram] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendedTrackKey, setRecommendedTrackKey] = useState<string | null>(null);
  const [loadingRecommendedTrack, setLoadingRecommendedTrack] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [submissionType, setSubmissionType] = useState<'reflection' | 'scenario' | 'document' | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Track mappings - which cross-track programs are prioritized for which profiled tracks
  // All cross-track programs are available to all students, but some are highlighted based on profiled track
  const trackPriorityMap: Record<string, string[]> = {
    'defender': ['CROSS_ENTREPRENEURSHIP', 'CROSS_SOFT_SKILLS', 'CROSS_CAREER', 'CROSS_ETHICS', 'CROSS_LEADERSHIP'],
    'offensive': ['CROSS_ENTREPRENEURSHIP', 'CROSS_SOFT_SKILLS', 'CROSS_CAREER', 'CROSS_ETHICS', 'CROSS_LEADERSHIP'],
    'grc': ['CROSS_ENTREPRENEURSHIP', 'CROSS_SOFT_SKILLS', 'CROSS_CAREER', 'CROSS_ETHICS', 'CROSS_LEADERSHIP'],
    'innovation': ['CROSS_ENTREPRENEURSHIP', 'CROSS_SOFT_SKILLS', 'CROSS_CAREER', 'CROSS_ETHICS', 'CROSS_LEADERSHIP'],
    'leadership': ['CROSS_LEADERSHIP', 'CROSS_ENTREPRENEURSHIP', 'CROSS_SOFT_SKILLS', 'CROSS_CAREER', 'CROSS_ETHICS'], // Leadership prioritized
  };
  
  // All cross-track programs are available to all students (per Tier 6 guidelines)
  // But we highlight the recommended one based on profiled track
  const allCrossTrackPrograms = [
    'CROSS_ENTREPRENEURSHIP',
    'CROSS_SOFT_SKILLS',
    'CROSS_CAREER',
    'CROSS_ETHICS',
    'CROSS_LEADERSHIP',
  ];

  // Fetch recommended track from profiler
  useEffect(() => {
    const fetchRecommendedTrack = async () => {
      if (!user?.id) {
        setLoadingRecommendedTrack(false);
        return;
      }

      setLoadingRecommendedTrack(true);
      try {
        const profilingStatus = await fastapiClient.profiling.checkStatus();
        if (profilingStatus.completed && profilingStatus.session_id) {
          const results = await fastapiClient.profiling.getResults(profilingStatus.session_id);
          
          if (results.primary_track?.key) {
            setRecommendedTrackKey(results.primary_track.key.toLowerCase());
            setLoadingRecommendedTrack(false);
            return;
          }
          
          if (results.recommendations && results.recommendations.length > 0) {
            const primaryRec = results.recommendations[0];
            if (primaryRec.track_key) {
              setRecommendedTrackKey(primaryRec.track_key.toLowerCase());
              setLoadingRecommendedTrack(false);
              return;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch recommended track:', error);
      } finally {
        setLoadingRecommendedTrack(false);
      }
    };

    fetchRecommendedTrack();
  }, [user?.id]);

  // Check if program is unlocked based on profiler recommendation
  // All cross-track programs are unlocked by default (per Tier 6 guidelines)
  // But we ensure the profiled track's corresponding program is definitely unlocked
  useEffect(() => {
    if (!code) {
      setIsUnlocked(false);
      return;
    }

    const programCode = code.toUpperCase();
    
    // All cross-track programs are available to all students
    // But if profiled for leadership, ensure CROSS_LEADERSHIP is unlocked
    // If profiled for other tracks, all programs are still available
    if (recommendedTrackKey) {
      // Special case: if profiled for leadership, CROSS_LEADERSHIP should definitely be unlocked
      if (recommendedTrackKey.toLowerCase() === 'leadership' && programCode === 'CROSS_LEADERSHIP') {
        setIsUnlocked(true);
        return;
      }
      
      // For all other cases, all cross-track programs are unlocked
      // (per Tier 6 guidelines - cross-track programs are universal professional skills)
      setIsUnlocked(allCrossTrackPrograms.includes(programCode));
    } else {
      // If no profiler recommendation, all programs are still unlocked
      setIsUnlocked(allCrossTrackPrograms.includes(programCode));
    }
  }, [code, recommendedTrackKey]);

  // Fetch program data
  useEffect(() => {
    const fetchProgram = async () => {
      if (!code) return;

      setLoading(true);
      setError(null);

      try {
        const data = await curriculumClient.getCrossTrackProgram(code);
        setProgram(data.program);
        setModules(data.modules);
        setProgress(data.progress);
      } catch (err: any) {
        console.error('Failed to fetch cross-track program:', err);
        setError(err.message || 'Failed to load program');
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, [code]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!program || !submissionType || !submissionContent.trim()) return;

    setSubmitting(true);
    try {
      await curriculumClient.submitCrossTrack({
        track_id: program.id,
        submission_type: submissionType,
        content: submissionContent,
      });

      // Refresh progress
      const data = await curriculumClient.getCrossTrackProgram(code);
      setProgress(data.progress);

      // Reset form
      setSubmissionType(null);
      setSubmissionContent('');
      setSelectedLesson(null);
    } catch (err: any) {
      console.error('Failed to submit:', err);
      alert(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <RouteGuard>
        <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-midnight/95 to-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </RouteGuard>
    );
  }

  if (error) {
    return (
      <RouteGuard>
        <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-midnight/95 to-slate-950 flex items-center justify-center p-4">
          <Card className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl max-w-md">
            <p className="text-red-400 text-center">{error}</p>
            <Button onClick={() => router.push('/dashboard/student/curriculum')} className="mt-4 w-full">
              Back to Curriculum
            </Button>
          </Card>
        </div>
      </RouteGuard>
    );
  }

  if (!program) {
    return null;
  }

  const programTheme = programIcons[code.toUpperCase()] || programIcons.CROSS_ENTREPRENEURSHIP;
  const completionPct = progress?.completion_percentage || 0;

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-midnight/95 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/student/curriculum')}
              className="border-och-steel/30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isUnlocked ? (
                  <Unlock className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 text-och-steel" />
                )}
                <Badge className={`${programTheme.border} ${programTheme.color} border text-xs`}>
                  Tier 6 - Cross-Track
                </Badge>
              </div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <span className={programTheme.color}>{programTheme.icon}</span>
                {program.name}
              </h1>
              <p className="text-sm text-och-steel mt-2">{program.description}</p>
            </div>
          </div>

          {/* Recommended Track Info - Always visible when available */}
          {loadingRecommendedTrack ? (
            <Card className="p-4 bg-och-midnight/60 border border-och-steel/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-och-steel animate-spin" />
                <p className="text-xs text-och-steel">Loading your recommended track...</p>
              </div>
            </Card>
          ) : recommendedTrackKey ? (
            <Card className={`p-4 bg-gradient-to-br ${programTheme.gradient} border ${programTheme.border} rounded-xl`}>
              <div className="flex items-center gap-3">
                <Star className={`w-5 h-5 ${programTheme.color}`} />
                <div className="flex-1">
                  <h3 className="text-sm font-black text-white mb-1">Your Recommended Track</h3>
                  <p className="text-xs text-och-steel">
                    Based on your AI Profiler assessment, you've been matched with the{' '}
                    <span className={`font-bold ${programTheme.color} capitalize`}>{recommendedTrackKey}</span> track.
                    {recommendedTrackKey.toLowerCase() === 'leadership' && code.toUpperCase() === 'CROSS_LEADERSHIP' && (
                      <span className="block mt-1 text-emerald-400 font-semibold">
                        ✓ This cross-track program is highly recommended for your leadership path!
                      </span>
                    )}
                    {recommendedTrackKey.toLowerCase() !== 'leadership' && (
                      <span className="block mt-1 text-och-steel">
                        All cross-track programs are available to help you develop professional skills across all cyber roles.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4 bg-och-midnight/60 border border-och-steel/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-och-steel" />
                <p className="text-xs text-och-steel">
                  Complete your AI Profiler assessment to see your recommended track and personalized learning path.
                </p>
              </div>
            </Card>
          )}

          {/* Lock Message */}
          {!isUnlocked && (
            <Card className={`p-4 bg-gradient-to-br ${programTheme.gradient} border ${programTheme.border} rounded-xl`}>
              <div className="flex items-center gap-3">
                <Lock className={`w-5 h-5 ${programTheme.color}`} />
                <div>
                  <h3 className="text-sm font-black text-white mb-1">Program Locked</h3>
                  <p className="text-xs text-och-steel">
                    This cross-track program is currently locked. Complete your recommended track to unlock all cross-track programs.
                    {recommendedTrackKey && (
                      <span className="block mt-1">
                        Your recommended track: <span className="font-bold capitalize">{recommendedTrackKey}</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Progress Overview */}
          {isUnlocked && progress && (
            <Card className={`p-6 bg-gradient-to-br ${programTheme.gradient} border ${programTheme.border} rounded-xl`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-white mb-1">Your Progress</h3>
                  <p className="text-sm text-och-steel">
                    {progress.modules_completed} of {modules.length} modules • {progress.lessons_completed} lessons • {progress.submissions_completed} submissions
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-black ${programTheme.color}`}>
                    {Math.round(completionPct)}%
                  </div>
                  <div className="text-xs text-och-steel uppercase tracking-wide">Complete</div>
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${programTheme.color.replace('text-', 'from-')} to-${programTheme.color.replace('text-', '')}/50`}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              {progress.is_complete && (
                <div className="mt-4 flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold">Program Completed!</span>
                </div>
              )}
            </Card>
          )}

          {/* Modules List */}
          {isUnlocked && (
            <div className="space-y-3">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Modules
              </h2>
              {modules.map((module, idx) => {
                const isExpanded = expandedModules.has(module.id);
                const moduleProgress = 0; // TODO: Calculate from lesson progress
                
                return (
                  <Card
                    key={module.id}
                    className={`p-4 bg-och-midnight/60 border border-och-steel/20 rounded-xl hover:border-och-steel/40 transition-all`}
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg ${programTheme.gradient} ${programTheme.border} border flex items-center justify-center ${programTheme.color}`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-black text-white mb-1">{module.title}</h3>
                          <p className="text-xs text-och-steel line-clamp-1">{module.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-[10px] border-och-steel/30 text-och-steel">
                              {module.lesson_count} lessons
                            </Badge>
                            {module.estimated_time_minutes && (
                              <div className="flex items-center gap-1 text-[10px] text-och-steel">
                                <Clock className="w-3 h-3" />
                                {module.estimated_time_minutes} min
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {moduleProgress > 0 && (
                          <div className="text-xs text-och-steel">
                            {Math.round(moduleProgress)}%
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-och-steel" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-och-steel" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-och-steel/20 space-y-2">
                            {module.lessons.map((lesson: any) => {
                              const lessonIcon = lesson.lesson_type === 'video' ? Video :
                                lesson.lesson_type === 'guide' ? FileText :
                                lesson.lesson_type === 'assessment' ? FileCheck :
                                lesson.lesson_type === 'quiz' ? Brain : BookOpen;

                              const LessonIcon = lessonIcon;

                              return (
                                <div
                                  key={lesson.id}
                                  className="flex items-center gap-3 p-3 rounded-lg bg-och-midnight/40 hover:bg-och-midnight/60 transition-colors cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLesson(lesson.id);
                                    if (lesson.lesson_type === 'assessment') {
                                      setSubmissionType('reflection');
                                    }
                                  }}
                                >
                                  <div className={`w-8 h-8 rounded-lg ${programTheme.gradient} ${programTheme.border} border flex items-center justify-center ${programTheme.color}`}>
                                    <LessonIcon className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-bold text-white">{lesson.title}</div>
                                    {lesson.description && (
                                      <div className="text-xs text-och-steel line-clamp-1">{lesson.description}</div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {lesson.duration_minutes && (
                                      <div className="text-xs text-och-steel flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {lesson.duration_minutes}m
                                      </div>
                                    )}
                                    <ChevronRight className="w-4 h-4 text-och-steel" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Lesson Viewer / Submission Form */}
          {selectedLesson && submissionType && (
            <Card className={`p-6 bg-gradient-to-br ${programTheme.gradient} border ${programTheme.border} rounded-xl`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white">
                  {submissionType === 'reflection' ? 'Reflection' :
                   submissionType === 'scenario' ? 'Scenario Response' :
                   submissionType === 'document' ? 'Document Upload' : 'Submission'}
                </h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedLesson(null);
                    setSubmissionType(null);
                    setSubmissionContent('');
                  }}
                  className="border-och-steel/30"
                >
                  Close
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    {submissionType === 'reflection' ? 'Your Reflection' :
                     submissionType === 'scenario' ? 'Your Response' :
                     'Your Content'}
                  </label>
                  <textarea
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder={submissionType === 'reflection' 
                      ? 'Share your thoughts, insights, and learnings...'
                      : 'Enter your response...'}
                    className="w-full h-32 p-3 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {submissionType === 'document' && (
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Upload Document</label>
                    <div className="border-2 border-dashed border-och-steel/30 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-och-steel mx-auto mb-2" />
                      <p className="text-sm text-och-steel mb-2">Drag and drop or click to upload</p>
                      <Button variant="outline" className="text-xs">
                        Choose File
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={!submissionContent.trim() || submitting}
                  className={`w-full ${programTheme.color} hover:opacity-90 bg-gradient-to-r ${programTheme.gradient.replace('from-', 'from-').replace('to-', 'to-')}`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
