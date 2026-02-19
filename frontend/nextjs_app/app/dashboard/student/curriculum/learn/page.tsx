'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { curriculumClient } from '@/services/curriculumClient';

interface Lesson {
  id: string;
  title: string;
  content_url: string;
  lesson_type: string;
  duration_minutes?: number;
  order_index: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  trackName?: string;
  trackSlug?: string;
  moduleName?: string;
  /** True if this lesson is from a track other than the student's; view-only, no progress saved */
  isLocked?: boolean;
}

const DJANGO_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';

/**
 * Resolve a potentially-relative media URL to an absolute URL.
 * e.g. /media/lesson_videos/abc.mp4 → http://localhost:8000/media/lesson_videos/abc.mp4
 */
function resolveVideoUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative path — prepend Django server
  return `${DJANGO_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Return embed URL for YouTube / Vimeo, or null if it's a direct video file.
 * Handles: watch?v=, youtu.be/, /shorts/, /embed/
 * Adds enablejsapi=1 so YouTube fires postMessage "ended" events.
 */
function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube — all common patterns
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1&origin=${encodeURIComponent(origin)}`;
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

// Maps track_key (e.g. "DEFENDER_2", "offensive") → display info
function trackInfoFromKey(trackKey: string): { slug: string; name: string } {
  const k = (trackKey || '').toLowerCase();
  if (k.includes('defender') || k.includes('cyberdef') || k.includes('socdef')) {
    return { slug: 'defender', name: 'Defender' };
  }
  if (k.includes('offensive')) return { slug: 'offensive', name: 'Offensive' };
  if (k.includes('grc')) return { slug: 'grc', name: 'GRC' };
  if (k.includes('innovation')) return { slug: 'innovation', name: 'Innovation' };
  if (k.includes('leadership')) return { slug: 'leadership', name: 'Leadership' };
  return { slug: k, name: trackKey };
}

const TRACK_ORDER = ['defender', 'offensive', 'grc', 'innovation', 'leadership'];

/** Derive curriculum track slug from user.track_key (e.g. defender, offensive). */
function myTrackSlugFromUser(trackKey: string | null | undefined): string | null {
  if (!trackKey || !trackKey.trim()) return null;
  const info = trackInfoFromKey(trackKey);
  return info.slug || null;
}

export default function CurriculumLearnPage() {
  const { user } = useAuth();
  const myTrackSlug = myTrackSlugFromUser(user?.track_key ?? undefined);

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Tracks whether the current iframe video has been marked watched
  const [iframeWatched, setIframeWatched] = useState(false);

  const levelNames: Record<string, string> = {
    beginner: 'Beginner Level',
    intermediate: 'Intermediate Level',
    advanced: 'Advanced Level',
  };

  // Restore saved level on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('all_tracks_current_level') as 'beginner' | 'intermediate' | 'advanced';
      if (saved && ['beginner', 'intermediate', 'advanced'].includes(saved)) {
        setCurrentLevel(saved);
      }
    }
  }, []);

  useEffect(() => {
    loadLessons();
  }, [currentLevel, myTrackSlug]);

  // Reset iframe-watched flag whenever the current video changes
  useEffect(() => {
    setIframeWatched(false);
  }, [currentVideoIndex]);

  // Listen for YouTube postMessage "video ended" (state = 0)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = JSON.parse(event.data);
        // YouTube sends { event: 'onStateChange', info: 0 } when video ends
        if (data.event === 'onStateChange' && data.info === 0) {
          handleVideoComplete();
        }
      } catch {
        // Non-JSON messages can be ignored
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoIndex, lessons]);

  const loadLessons = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all modules at the current level (no per-track API calls needed)
      const modules = await curriculumClient.getModules({ level: currentLevel });

      if (!modules || modules.length === 0) {
        setLessons([]);
        setLoading(false);
        return;
      }

      // Only fetch detail for modules that have lessons
      const modulesWithContent = modules.filter((m: any) => m.lesson_count > 0);

      const allLessonsPromises = modulesWithContent.map((module: any) =>
        curriculumClient.getModule(module.id)
          .then(moduleDetail => {
            const trackInfo = trackInfoFromKey(module.track_key || '');
            return (moduleDetail.lessons || []).map((l: any) => ({
              ...l,
              status: l.user_progress?.status ?? l.status ?? 'not_started',
              trackSlug: trackInfo.slug,
              trackName: trackInfo.name,
              moduleName: module.title,
            }));
          })
          .catch(err => {
            console.warn(`Failed to load lessons for module ${module.id}:`, err);
            return [];
          })
      );

      const allLessonsArrays = await Promise.all(allLessonsPromises);
      const allLessons = allLessonsArrays.flat();

      // Video lessons only (with a non-empty URL)
      let videoLessons = allLessons
        .filter((l: any) => l.lesson_type === 'video' && l.content_url)
        .map((l: any) => ({
          ...l,
          isLocked: myTrackSlug != null && l.trackSlug !== myTrackSlug,
        }));

      // Sort: student's track first, then by TRACK_ORDER, then order_index
      videoLessons = videoLessons.sort((a: any, b: any) => {
        const aMy = myTrackSlug != null && a.trackSlug === myTrackSlug ? 0 : 1;
        const bMy = myTrackSlug != null && b.trackSlug === myTrackSlug ? 0 : 1;
        if (aMy !== bMy) return aMy - bMy;
        const ia = TRACK_ORDER.indexOf(a.trackSlug);
        const ib = TRACK_ORDER.indexOf(b.trackSlug);
        const rankA = ia === -1 ? 99 : ia;
        const rankB = ib === -1 ? 99 : ib;
        if (rankA !== rankB) return rankA - rankB;
        return (a.order_index || 0) - (b.order_index || 0);
      });

      setLessons(videoLessons);

      const savedIndex = parseInt(localStorage.getItem(`all_tracks_${currentLevel}_index`) || '0');
      setCurrentVideoIndex(Math.min(savedIndex, Math.max(0, videoLessons.length - 1)));
    } catch (err: any) {
      console.error('Error loading lessons:', err);
      setError(err.message || 'Failed to load lessons');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  const currentVideo = lessons[currentVideoIndex];

  const handleVideoComplete = async () => {
    const lesson = lessons[currentVideoIndex];
    if (!lesson) return;
    // Do not save progress for other tracks (view-only)
    if (lesson.isLocked) {
      setIframeWatched(true);
      return;
    }

    setLessons(prev =>
      prev.map((l, i) => i === currentVideoIndex ? { ...l, status: 'completed' as const } : l)
    );
    setIframeWatched(true);

    try {
      await curriculumClient.updateLessonProgress(lesson.id, {
        status: 'completed',
        progress_percentage: 100,
        time_spent_minutes: lesson.duration_minutes || 5,
      });
    } catch (err) {
      console.error('Failed to save progress:', err);
    }

    localStorage.setItem(`all_tracks_${currentLevel}_index`, currentVideoIndex.toString());
  };

  /** Allow selecting a lesson: my track by progression, or any locked lesson for view-only */
  const goToVideo = (index: number) => {
    const lesson = lessons[index];
    const canSelectMyTrack = index === 0 || lessons[index - 1]?.status === 'completed';
    const canSelectLocked = lesson?.isLocked === true;
    if (canSelectLocked || canSelectMyTrack) {
      setCurrentVideoIndex(index);
      localStorage.setItem(`all_tracks_${currentLevel}_index`, index.toString());
    }
  };

  const goToNextVideo = async () => {
    const next = currentVideoIndex + 1;
    if (next >= lessons.length) return;
    const nextLesson = lessons[next];
    const canGoToNext = nextLesson?.isLocked || next === 0 || lessons[next - 1]?.status === 'completed';
    if (!canGoToNext) return;

    const currentLesson = lessons[currentVideoIndex];
    if (currentLesson && !currentLesson.isLocked && currentLesson.status !== 'completed') {
      setLessons(prev =>
        prev.map((l, i) => i === currentVideoIndex ? { ...l, status: 'completed' as const } : l)
      );
      try {
        await curriculumClient.updateLessonProgress(currentLesson.id, {
          status: 'completed',
          progress_percentage: 100,
          time_spent_minutes: currentLesson.duration_minutes || 5,
        });
      } catch (err) {
        console.error('Failed to save progress on Next:', err);
      }
    }

    setCurrentVideoIndex(next);
    localStorage.setItem(`all_tracks_${currentLevel}_index`, next.toString());
  };

  const isNextUnlocked = () => {
    const next = currentVideoIndex + 1;
    if (next >= lessons.length) return false;
    const nextLesson = lessons[next];
    return nextLesson?.isLocked || next === 0 || lessons[next - 1]?.status === 'completed';
  };

  const myTrackLessons = () => lessons.filter(l => !l.isLocked);
  const allCompleted = () => {
    const my = myTrackLessons();
    return my.length > 0 && my.every(l => l.status === 'completed');
  };

  // Check if a specific track's videos are all completed
  const isTrackCompleted = (trackSlug: string) => {
    const trackLessons = lessons.filter(l => l.trackSlug === trackSlug);
    return trackLessons.length > 0 && trackLessons.every(l => l.status === 'completed');
  };

  // Get completion percentage for a specific track
  const getTrackCompletionPercentage = (trackSlug: string) => {
    const trackLessons = lessons.filter(l => l.trackSlug === trackSlug);
    if (trackLessons.length === 0) return 0;
    const completed = trackLessons.filter(l => l.status === 'completed').length;
    return Math.round((completed / trackLessons.length) * 100);
  };

  const setLevel = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setCurrentLevel(level);
    setCurrentVideoIndex(0);
    localStorage.setItem('all_tracks_current_level', level);
  };

  // Unique track slugs present in current lesson list
  const activeTrackSlugs = [...new Set(lessons.map(l => l.trackSlug).filter(Boolean))];
  const hasMyTrackContent = myTrackSlug != null && lessons.some(l => l.trackSlug === myTrackSlug);
  const myTrackDisplayName = myTrackSlug ? (trackInfoFromKey(myTrackSlug).name || myTrackSlug) : null;

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/student/curriculum"
            className="text-slate-400 hover:text-white mb-4 inline-flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Curriculum
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {myTrackSlug ? 'Curriculum' : 'All Tracks'}
              </h1>
              <p className="text-slate-400">
                {levelNames[currentLevel]}
                {myTrackDisplayName && (
                  <span className="ml-2 text-slate-500">· Your track: <span className="text-indigo-400 font-medium">{myTrackDisplayName}</span></span>
                )}
              </p>
            </div>
            {!loading && (
              <Badge variant="outline" className="text-slate-300 border-slate-600">
                Video {lessons.length > 0 ? currentVideoIndex + 1 : 0} of {lessons.length}
              </Badge>
            )}
          </div>

          {/* Level selector */}
          <div className="flex items-center gap-2 mt-4">
            {(['beginner', 'intermediate', 'advanced'] as const).map((level, i, arr) => (
              <div key={level} className="flex items-center gap-2">
                <button
                  onClick={() => setLevel(level)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    currentLevel === level
                      ? level === 'beginner'
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : level === 'intermediate'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {currentLevel === level ? `• ${level.charAt(0).toUpperCase() + level.slice(1)}` : level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
                {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-slate-600" />}
              </div>
            ))}
          </div>

          {!loading && myTrackSlug && !hasMyTrackContent && lessons.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-amber-200 text-sm font-medium">No content for your track yet</p>
              <p className="text-amber-200/80 text-xs mt-1">Your track ({myTrackDisplayName}) has no video lessons at this level. Below you can view other tracks as locked (view only).</p>
            </div>
          )}

          {/* Track pills — show which tracks have content at this level */}
          <div className="mt-4">
            <p className="text-slate-400 text-sm mb-2">Tracks with content</p>
            <div className="flex flex-wrap gap-2">
              {TRACK_ORDER.map(slug => {
                const displayNames: Record<string, string> = {
                  defender: 'Defender', offensive: 'Offensive', grc: 'GRC',
                  innovation: 'Innovation', leadership: 'Leadership',
                };
                const hasContent = activeTrackSlugs.includes(slug);
                const isCurrent = currentVideo?.trackSlug === slug;
                const isMyTrack = slug === myTrackSlug;
                const completionPct = hasContent ? getTrackCompletionPercentage(slug) : 0;
                return (
                  <div
                    key={slug}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                      isCurrent
                        ? 'bg-och-orange border-och-orange text-white'
                        : hasContent
                        ? isMyTrack
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                          : 'bg-slate-700 border-slate-500 text-slate-300'
                        : 'bg-slate-900 border-slate-700 text-slate-600'
                    }`}
                  >
                    {displayNames[slug] || slug}
                    {isMyTrack && <span className="ml-1.5 text-xs opacity-90">(your track)</span>}
                    {!hasContent && !loading && (
                      <span className="ml-1 text-xs opacity-60">— no content</span>
                    )}
                    {hasContent && isMyTrack && completionPct > 0 && (
                      <span className="ml-2 text-xs opacity-75">({completionPct}%)</span>
                    )}
                    {hasContent && !isMyTrack && (
                      <Lock className="w-3.5 h-3.5 ml-1.5 inline-block text-slate-400" aria-hidden />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track-specific mission unlocks */}
          {!loading && activeTrackSlugs.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {activeTrackSlugs.map(slug => {
                  if (!isTrackCompleted(slug)) return null;
                  const displayNames: Record<string, string> = {
                    defender: 'Defender', offensive: 'Offensive', grc: 'GRC',
                    innovation: 'Innovation', leadership: 'Leadership',
                  };
                  return (
                    <Link
                      key={slug}
                      href={`/dashboard/student/missions?track=${slug}&tier=${currentLevel}`}
                    >
                      <Button
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {displayNames[slug]} Missions
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar: Learning Path */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="p-4 bg-slate-900/50 border-slate-700 sticky top-4">
              <h3 className="text-lg font-semibold text-white mb-4">Learning Path</h3>
              {/* Level completion summary */}
              {!loading && lessons.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-slate-800/60 border border-slate-600/40">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Level Status</p>
                  {currentLevel === 'beginner' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">Level 1 (Beginner)</span>
                        {allCompleted() ? (
                          <span className="text-xs font-bold text-green-400">100% Done</span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {Math.round((lessons.filter(l => l.status === 'completed').length / lessons.length) * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${allCompleted() ? 100 : (lessons.filter(l => l.status === 'completed').length / lessons.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {currentLevel === 'intermediate' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-400">Level 1: Done</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-white font-medium">Level 2 (Intermediate)</span>
                        <span className="text-xs text-blue-400">Now in Level 2</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(lessons.filter(l => l.status === 'completed').length / lessons.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {currentLevel === 'advanced' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-400">Level 1: Done</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-400">Level 2: Done</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-white font-medium">Level 3 (Advanced)</span>
                        <span className="text-xs text-purple-400">Now in Level 3</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${(lessons.filter(l => l.status === 'completed').length / lessons.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              {loading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : lessons.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No video lessons for this level
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                  {lessons.map((lesson, index) => {
                    const isCompleted = lesson.status === 'completed';
                    const isCurrent = index === currentVideoIndex;
                    const isUnlockedMyTrack = index === 0 || lessons[index - 1]?.status === 'completed';
                    const canSelect = lesson.isLocked || isUnlockedMyTrack;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => goToVideo(index)}
                        disabled={!canSelect}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          lesson.isLocked
                            ? isCurrent
                              ? 'bg-slate-700 border border-slate-600'
                              : 'bg-slate-900 border border-slate-700 hover:bg-slate-800'
                            : isCurrent
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : isCompleted
                            ? 'bg-green-500/10 border border-green-500/20 hover:bg-green-500/20'
                            : isUnlockedMyTrack
                            ? 'bg-slate-800 border border-slate-600 hover:bg-slate-700'
                            : 'bg-slate-900 border border-slate-700 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                            lesson.isLocked
                              ? 'bg-slate-600 text-slate-400'
                              : isCompleted
                              ? 'bg-green-500 text-white'
                              : isCurrent
                              ? 'bg-blue-500 text-white'
                              : isUnlockedMyTrack
                              ? 'bg-slate-600 text-slate-300'
                              : 'bg-slate-700 text-slate-500'
                          }`}>
                            {lesson.isLocked ? (
                              <Lock className="w-3 h-3" />
                            ) : isCompleted ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : isUnlockedMyTrack ? (
                              index + 1
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              lesson.isLocked
                                ? 'text-slate-400'
                                : isCurrent
                                ? 'text-blue-400'
                                : isCompleted
                                ? 'text-green-400'
                                : isUnlockedMyTrack
                                ? 'text-white'
                                : 'text-slate-500'
                            }`}>
                              {lesson.title}
                            </p>
                            {lesson.trackName && (
                              <p className="text-xs text-slate-500 truncate">
                                {lesson.trackName}
                                {lesson.isLocked && ' · View only'}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Video Player */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {loading ? (
              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              </Card>
            ) : error ? (
              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <Button onClick={loadLessons}>Retry</Button>
                </div>
              </Card>
            ) : !currentVideo ? (
              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <div className="flex flex-col items-center justify-center h-96 text-center gap-3">
                  <p className="text-slate-400 text-lg font-medium">No lessons yet</p>
                  <p className="text-slate-500 text-sm max-w-sm">
                    No video lessons have been added for the <span className="text-white">{levelNames[currentLevel]}</span> yet.
                    A director needs to create modules and add video lessons.
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="p-6 bg-slate-900/50 border-slate-700">
                {currentVideo.isLocked && (
                  <div className="mb-4 p-3 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
                    <p className="text-slate-300 text-sm">
                      View only — this content is from another track. Your progress is not saved. Your track: <span className="font-medium text-indigo-300">{myTrackDisplayName ?? '—'}</span>
                    </p>
                  </div>
                )}
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-white mb-1">{currentVideo.title}</h2>
                  {currentVideo.trackName && (
                    <p className="text-sm text-slate-400 mb-3">
                      {currentVideo.trackName} Track
                      {currentVideo.moduleName ? ` • ${currentVideo.moduleName}` : ''}
                      {currentVideo.isLocked && ' (view only)'}
                    </p>
                  )}
                  <div className="bg-slate-800 rounded-lg overflow-hidden relative">
                    {(() => {
                      const embedUrl = getEmbedUrl(currentVideo.content_url);
                      const resolvedUrl = resolveVideoUrl(currentVideo.content_url);
                      if (embedUrl) {
                        // YouTube / Vimeo → iframe + "Mark as Watched" (only for my track)
                        const isWatched = iframeWatched || lessons[currentVideoIndex]?.status === 'completed';
                        return (
                          <>
                            <div className="aspect-video w-full relative">
                              <iframe
                                key={currentVideo.id}
                                src={embedUrl}
                                className={`w-full h-full ${currentVideo.isLocked ? 'blur-md' : ''}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={currentVideo.title}
                              />
                              {currentVideo.isLocked && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                                  <div className="text-center p-6">
                                    <Lock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                    <p className="text-white font-semibold text-lg mb-1">Content Locked</p>
                                    <p className="text-slate-400 text-sm">This content is from the {currentVideo.trackName} track</p>
                                    <p className="text-slate-500 text-xs mt-2">View only - progress not saved</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* Manual completion bar — only for student's track */}
                            <div className="flex justify-end items-center px-4 py-2 bg-slate-900/80 border-t border-slate-700">
                              {currentVideo.isLocked ? (
                                <span className="flex items-center gap-1.5 text-slate-500 text-sm">
                                  <Lock className="w-4 h-4" />
                                  View only — progress not saved
                                </span>
                              ) : isWatched ? (
                                <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                                  <CheckCircle className="w-4 h-4" />
                                  Marked as Watched
                                </span>
                              ) : (
                                <Button
                                  variant="outline"
                                  onClick={handleVideoComplete}
                                  className="text-sm border-green-500/40 text-green-400 hover:bg-green-500/10"
                                >
                                  Mark as Watched
                                </Button>
                              )}
                            </div>
                          </>
                        );
                      }
                      if (!resolvedUrl) {
                        return (
                          <div className="aspect-video flex items-center justify-center text-slate-500 text-sm">
                            No video URL configured for this lesson
                          </div>
                        );
                      }
                      // Direct video file (mp4, webm, etc.)
                      return (
                        <div className="aspect-video relative">
                          <video
                            key={currentVideo.id}
                            src={resolvedUrl}
                            controls={!currentVideo.isLocked}
                            className={`w-full h-full ${currentVideo.isLocked ? 'blur-md' : ''}`}
                            onEnded={handleVideoComplete}
                          />
                          {currentVideo.isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                              <div className="text-center p-6">
                                <Lock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                <p className="text-white font-semibold text-lg mb-1">Content Locked</p>
                                <p className="text-slate-400 text-sm">This content is from the {currentVideo.trackName} track</p>
                                <p className="text-slate-500 text-xs mt-2">View only - progress not saved</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    disabled={currentVideoIndex === 0}
                    onClick={() => goToVideo(currentVideoIndex - 1)}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  {allCompleted() ? (
                    currentLevel !== 'advanced' ? (
                      <Button
                        onClick={() => setLevel(currentLevel === 'beginner' ? 'intermediate' : 'advanced')}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        Next Level: {currentLevel === 'beginner' ? 'Intermediate' : 'Advanced'}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Link href="/dashboard/student/missions">
                        <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                          Start Missions
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    )
                  ) : (
                    <Button
                      variant="outline"
                      disabled={!isNextUnlocked()}
                      onClick={goToNextVideo}
                      className="flex items-center gap-2"
                    >
                      Next Video
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
