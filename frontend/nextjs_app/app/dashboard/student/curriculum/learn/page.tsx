'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

interface Video {
  id: string;
  title: string;
  video_url: string;
  completed: boolean;
}

export default function CurriculumLearnPage() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
  // Get track slug from localStorage
  const trackSlug = typeof window !== 'undefined' ? localStorage.getItem('current_learning_track') || 'defender' : 'defender';

  // Properly manage videos state
  const [videos, setVideos] = useState<Video[]>([
    {
      id: '1',
      title: 'Welcome to the Course',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      completed: true
    },
    {
      id: '2',
      title: 'Understanding the Basics',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      completed: false
    },
    {
      id: '3',
      title: 'First Practical Steps',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      completed: false
    }
  ]);

  const currentVideo = videos[currentVideoIndex];

  const handleVideoComplete = () => {
    // Properly update state with immutable update
    setVideos(prevVideos => 
      prevVideos.map((video, index) => 
        index === currentVideoIndex 
          ? { ...video, completed: true }
          : video
      )
    );

    // Check if this was the last video
    if (currentVideoIndex === videos.length - 1) {
      // All videos completed - show completion state
      setTimeout(() => {
        alert('🎉 Congratulations! You\'ve completed all videos in this module.\n\nNext steps:\n• Take the module quiz\n• Complete hands-on missions\n• Move to the next module');
      }, 1000);
    }
  };

  const goToVideo = (index: number) => {
    // Only allow going to videos that are unlocked (previous video completed or first video)
    if (index === 0 || videos[index - 1]?.completed) {
      setCurrentVideoIndex(index);
    }
  };

  const goToNextVideo = () => {
    const nextIndex = currentVideoIndex + 1;
    if (nextIndex < videos.length) {
      // Check if next video is unlocked
      if (nextIndex === 0 || videos[nextIndex - 1]?.completed) {
        setCurrentVideoIndex(nextIndex);
      }
    }
  };

  const isNextVideoUnlocked = () => {
    const nextIndex = currentVideoIndex + 1;
    if (nextIndex >= videos.length) return false;
    return nextIndex === 0 || videos[nextIndex - 1]?.completed;
  };

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
              <p className="text-slate-400">Beginner Level</p>
            </div>
            <Badge variant="outline" className="text-slate-300 border-slate-600">
              Video {currentVideoIndex + 1} of {videos.length}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-slate-900/50 border-slate-700">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white mb-2">{currentVideo.title}</h2>
                <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
                  <video
                    key={currentVideo.id} // Force re-render when video changes
                    src={currentVideo.video_url}
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
                {currentVideoIndex === videos.length - 1 && videos[currentVideoIndex]?.completed ? (
                  <Link href="/dashboard/student/missions">
                    <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                      Start Missions
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    disabled={!isNextVideoUnlocked()}
                    onClick={goToNextVideo}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Video List Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Learning Path</h3>
              <div className="space-y-2">
                {videos.map((video, index) => {
                  const isCompleted = video.completed;
                  const isCurrent = index === currentVideoIndex;
                  const isUnlocked = index === 0 || videos[index - 1]?.completed;

                  return (
                    <button
                      key={video.id}
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
                            {video.title}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
