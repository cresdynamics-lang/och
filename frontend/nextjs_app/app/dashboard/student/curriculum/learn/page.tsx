'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { curriculumClient } from '@/services/curriculumClient';

interface Lesson {
  id: string;
  title: string;
  content_url: string;
  lesson_type: string;
  duration_minutes?: number;
  order_index: number;
  status?: 'not_started' | 'in_progress' | 'completed';
}

export default function CurriculumLearnPage() {
  const trackSlug = typeof window !== 'undefined' ? localStorage.getItem('current_learning_track') || 'defender' : 'defender';

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);

  const levelNames = {
    beginner: 'Beginner Level (Tier 2)',
    intermediate: 'Intermediate Level (Tier 3)',
    advanced: 'Advanced Level (Tier 4)'
  };

  const levelMap = {
    beginner: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced'
  };

  // Load lessons from backend
  useEffect(() => {
    loadLessons();
  }, [trackSlug, currentLevel]);

  const loadLessons = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch track data with modules
      const trackData = await curriculumClient.getTrack(trackSlug);

      // Filter modules for current level
      const levelModules = trackData.modules?.filter((m: any) => m.level === levelMap[currentLevel]) || [];
      setModules(levelModules);

      // Get lessons from first module of current level
      if (levelModules.length > 0) {
        const moduleLessons = await curriculumClient.getLessons(levelModules[0].id);
        // Filter for video lessons only
        const videoLessons = moduleLessons.filter(l => l.lesson_type === 'video');
        setLessons(videoLessons);

        // Load saved video index for this level
        const savedIndex = parseInt(localStorage.getItem(`${trackSlug}_${currentLevel}_index`) || '0');
        setCurrentVideoIndex(Math.min(savedIndex, videoLessons.length - 1));
      } else {
        // No modules for this level, use demo data
        setLessons([
          {
            id: `demo-${currentLevel}-1`,
            title: `${levelNames[currentLevel]} - Introduction`,
            content_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            lesson_type: 'video',
            order_index: 1,
            status: 'not_started'
          },
          {
            id: `demo-${currentLevel}-2`,
            title: `${levelNames[currentLevel]} - Core Concepts`,
            content_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            lesson_type: 'video',
            order_index: 2,
            status: 'not_started'
          },
          {
            id: `demo-${currentLevel}-3`,
            title: `${levelNames[currentLevel]} - Practical Application`,
            content_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            lesson_type: 'video',
            order_index: 3,
            status: 'not_started'
          }
        ]);
      }
    } catch (err: any) {
      console.error('Error loading lessons:', err);
      setError(err.message || 'Failed to load lessons');
      // Fallback to demo data
      setLessons([
        {
          id: `demo-${currentLevel}-1`,
          title: `${levelNames[currentLevel]} - Introduction`,
          content_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          lesson_type: 'video',
          order_index: 1,
          status: 'not_started'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentVideo = lessons[currentVideoIndex];

  const handleVideoComplete = async () => {
    const lesson = lessons[currentVideoIndex];
    if (!lesson) return;

    // Update local state
    setLessons(prevLessons =>
      prevLessons.map((l, index) =>
        index === currentVideoIndex
          ? { ...l, status: 'completed' as const }
          : l
      )
    );

    // Only save to backend if this is a real lesson (not a demo)
    if (!lesson.id.startsWith('demo-')) {
      try {
        await curriculumClient.updateLessonProgress(lesson.id, {
          status: 'completed',
          progress_percentage: 100,
          time_spent_minutes: lesson.duration_minutes || 5
        });
        console.log('✓ Progress saved to backend');
      } catch (err) {
        console.error('Failed to save progress:', err);
        // Local state already updated above
      }
    } else {
      console.log('✓ Demo lesson completed (not saved to backend)');
    }

    // Save current index
    localStorage.setItem(`${trackSlug}_${currentLevel}_index`, currentVideoIndex.toString());
  };

  const goToVideo = (index: number) => {
    // Only allow going to lessons that are unlocked
    if (index === 0 || lessons[index - 1]?.status === 'completed') {
      setCurrentVideoIndex(index);
      localStorage.setItem(`${trackSlug}_${currentLevel}_index`, index.toString());
    }
  };

  const goToNextVideo = () => {
    const nextIndex = currentVideoIndex + 1;
    if (nextIndex < lessons.length) {
      if (nextIndex === 0 || lessons[nextIndex - 1]?.status === 'completed') {
        setCurrentVideoIndex(nextIndex);
        localStorage.setItem(`${trackSlug}_${currentLevel}_index`, nextIndex.toString());
      }
    }
  };

  const isNextVideoUnlocked = () => {
    const nextIndex = currentVideoIndex + 1;
    if (nextIndex >= lessons.length) return false;
    return nextIndex === 0 || lessons[nextIndex - 1]?.status === 'completed';
  };

  const areAllVideosCompleted = () => {
    return lessons.every(lesson => lesson.status === 'completed');
  };

  const goToNextLevel = () => {
    if (currentLevel === 'beginner') {
      setCurrentLevel('intermediate');
      localStorage.setItem(`${trackSlug}_current_level`, 'intermediate');
    } else if (currentLevel === 'intermediate') {
      setCurrentLevel('advanced');
      localStorage.setItem(`${trackSlug}_current_level`, 'advanced');
    }
    setCurrentVideoIndex(0);
    // loadLessons() will be called automatically by useEffect
  };

  // Load saved level on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLevel = localStorage.getItem(`${trackSlug}_current_level`) as 'beginner' | 'intermediate' | 'advanced';
      if (savedLevel && ['beginner', 'intermediate', 'advanced'].includes(savedLevel)) {
        setCurrentLevel(savedLevel);
      }
    }
  }, [trackSlug]);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/student/curriculum" className="text-slate-400 hover:text-white mb-4 inline-flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back to Curriculum
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white capitalize">{trackSlug} Track</h1>
              <p className="text-slate-400">{levelNames[currentLevel]}</p>
            </div>
            <Badge variant="outline" className="text-slate-300 border-slate-600">
              Video {currentVideoIndex + 1} of {lessons.length}
            </Badge>
          </div>

          {/* Level Progress Indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              currentLevel === 'beginner' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-green-500 text-white'
            }`}>
              {currentLevel === 'beginner' ? '• Beginner' : '✓ Beginner'}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              currentLevel === 'intermediate' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
              currentLevel === 'advanced' ? 'bg-blue-500 text-white' :
              'bg-slate-800 text-slate-500'
            }`}>
              {currentLevel === 'intermediate' ? '• Intermediate' :
               currentLevel === 'advanced' ? '✓ Intermediate' :
               'Intermediate'}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              currentLevel === 'advanced' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
              'bg-slate-800 text-slate-500'
            }`}>
              {currentLevel === 'advanced' ? '• Advanced' : 'Advanced'}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
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
                <div className="flex items-center justify-center h-96 text-slate-400">
                  No lessons available for this level
                </div>
              </Card>
            ) : (
              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-white mb-2">{currentVideo.title}</h2>
                  <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
                    <video
                      key={currentVideo.id} // Force re-render when video changes
                      src={currentVideo.content_url}
                      controls
                      className="w-full h-full"
                      onEnded={handleVideoComplete}
                    />
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    disabled={currentVideoIndex === 0}
                    onClick={() => goToVideo(currentVideoIndex - 1)}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  {/* Show different button based on completion state */}
                  {areAllVideosCompleted() ? (
                    <div className="flex gap-2">
                      {currentLevel !== 'advanced' ? (
                        <Button
                          onClick={goToNextLevel}
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
                      )}
                    </div>
                  ) : currentVideoIndex === lessons.length - 1 && lessons[currentVideoIndex]?.status === 'completed' ? (
                    <Button
                      onClick={handleVideoComplete}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      Complete & Continue
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={!isNextVideoUnlocked()}
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

          {/* Video List Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Learning Path</h3>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : lessons.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No lessons available
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson, index) => {
                  const isCompleted = lesson.status === 'completed';
                  const isCurrent = index === currentVideoIndex;
                  const isUnlocked = index === 0 || lessons[index - 1]?.status === 'completed';

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => goToVideo(index)}
                      disabled={!isUnlocked}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isCurrent
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : isCompleted
                          ? 'bg-green-500/10 border border-green-500/20 hover:bg-green-500/20'
                          : isUnlocked
                          ? 'bg-slate-800 border border-slate-600 hover:bg-slate-700'
                          : 'bg-slate-900 border border-slate-700 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-blue-500 text-white'
                            : isUnlocked
                            ? 'bg-slate-600 text-slate-300'
                            : 'bg-slate-700 text-slate-500'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : isUnlocked ? (
                            index + 1
                          ) : (
                            <Lock className="w-3 h-3" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isCurrent ? 'text-blue-400' : isCompleted ? 'text-green-400' : isUnlocked ? 'text-white' : 'text-slate-500'
                          }`}>
                            {lesson.title}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
