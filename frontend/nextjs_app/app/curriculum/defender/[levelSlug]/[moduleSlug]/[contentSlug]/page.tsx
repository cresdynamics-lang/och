'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Play, CheckCircle, Clock, Volume2, Settings, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useContentProgress } from '@/hooks/useCurriculum';
import { emitCurriculumVideoCompleted } from '@/lib/coaching-events';

export default function VideoContentPage() {
  const params = useParams();
  const router = useRouter();
  const levelSlug = params.levelSlug as string;
  const moduleSlug = params.moduleSlug as string;
  const contentSlug = params.contentSlug as string;

  const { user } = useAuth();
  const { updateProgress, updating } = useContentProgress(user?.id);

  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Mock video data - in real implementation this would come from API
  const videoData = {
    id: 'mock-video-id',
    title: 'Understanding Log Files and Their Importance',
    description: 'Learn why log files are crucial for cybersecurity defense and how they help in incident response.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration_seconds: 300,
    module_title: 'Log Analysis Fundamentals',
    level_title: levelSlug.charAt(0).toUpperCase() + levelSlug.slice(1)
  };

  const handleVideoStart = () => {
    setHasStarted(true);
  };

  const handleVideoEnd = async () => {
    setIsCompleted(true);

    // Update progress
    try {
      await updateProgress(videoData.id, 'completed');

      // Emit coaching event
      if (user?.id) {
        await emitCurriculumVideoCompleted(
          user.id,
          'defender',
          levelSlug,
          moduleSlug,
          contentSlug
        );
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleMarkComplete = async () => {
    try {
      await updateProgress(videoData.id, 'completed');
      setIsCompleted(true);
      // Navigate back to level page after a short delay
      setTimeout(() => {
        router.push(`/curriculum/defender/${levelSlug}`);
      }, 1500);
    } catch (error) {
      console.error('Failed to mark as complete:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/curriculum/defender/${levelSlug}`}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                  <span>{videoData.level_title}</span>
                  <span>→</span>
                  <span>{videoData.module_title}</span>
                </div>
                <h1 className="text-white font-semibold">{videoData.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isCompleted ? (
                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              ) : hasStarted ? (
                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Play className="w-3 h-3 mr-1" />
                  In Progress
                </Badge>
              ) : (
                <Badge variant="outline" className="text-slate-400 border-slate-600">
                  Not Started
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-700 overflow-hidden">
              {/* Video Container */}
              <div className="relative aspect-video bg-slate-800">
                {!isCompleted ? (
                  <video
                    src={videoData.video_url}
                    controls
                    className="w-full h-full"
                    onPlay={handleVideoStart}
                    onEnded={handleVideoEnd}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <div className="text-center">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Video Completed!</h3>
                      <p className="text-slate-400 mb-6">Great job watching the video.</p>
                      <Button
                        onClick={() => router.push(`/curriculum/defender/${levelSlug}`)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Continue to Next Lesson
                      </Button>
                    </div>
                  </div>
                )}

                {/* Video Controls Overlay (when not completed) */}
                {!isCompleted && (
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" className="bg-slate-800/80 hover:bg-slate-700">
                        <Volume2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" className="bg-slate-800/80 hover:bg-slate-700">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" className="bg-slate-800/80 hover:bg-slate-700">
                        <Maximize className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">{videoData.title}</h2>
                    <p className="text-slate-300">{videoData.description}</p>
                  </div>
                  <Badge variant="outline" className="text-slate-400 border-slate-600">
                    {Math.round(videoData.duration_seconds / 60)}min
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {!isCompleted && (
                    <Button
                      onClick={handleMarkComplete}
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {updating ? 'Marking Complete...' : 'Mark as Complete'}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => router.push(`/curriculum/defender/${levelSlug}`)}
                  >
                    Back to Level
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/50 border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Learning Progress</h3>

              <div className="space-y-4">
                {/* Video Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-300">Video Progress</span>
                    <span className="text-slate-400">
                      {isCompleted ? '100%' : hasStarted ? `${Math.round((currentTime / duration) * 100)}%` : '0%'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : hasStarted ? 'bg-blue-500' : 'bg-slate-600'
                      }`}
                      style={{
                        width: isCompleted ? '100%' : hasStarted ? `${(currentTime / duration) * 100}%` : '0%'
                      }}
                    />
                  </div>
                </div>

                {/* Learning Tips */}
                <div className="border-t border-slate-700 pt-4">
                  <h4 className="text-white font-medium mb-3">Learning Tips</h4>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Take notes on key concepts and terminology</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Pause and replay sections you find challenging</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Think about how this applies to real-world scenarios</span>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="border-t border-slate-700 pt-4">
                  <h4 className="text-white font-medium mb-3">What's Next?</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => router.push(`/curriculum/defender/${levelSlug}/${moduleSlug}/quiz/log-basics-quiz`)}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Take Module Quiz
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => router.push(`/curriculum/defender/${levelSlug}`)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      View All Videos
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
