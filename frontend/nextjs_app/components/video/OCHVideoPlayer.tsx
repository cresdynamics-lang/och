'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';

interface VideoData {
  id: string;
  title: string;
  video_url: string;
  duration_seconds: number;
  last_progress?: number;
  completed?: boolean;
}

interface OCHVideoPlayerProps {
  video: VideoData;
  userId: string;
  trackSlug: string;
  levelSlug: string;
  moduleSlug: string;
  contentSlug: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  className?: string;
}

export function OCHVideoPlayer({
  video,
  userId,
  trackSlug,
  levelSlug,
  moduleSlug,
  contentSlug,
  onProgress,
  onComplete,
  className = ''
}: OCHVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration_seconds || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [savedProgress, setSavedProgress] = useState(video.last_progress || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isSeekingForward, setIsSeekingForward] = useState(false);

  // Progress persistence state
  const [lastSavedTime, setLastSavedTime] = useState(0);

  // Hide controls after 3 seconds of inactivity
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const hideControls = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    hideControls();
  }, [hideControls]);

  // Resume from saved position on mount
  useEffect(() => {
    if (video.last_progress && video.last_progress > 30 && videoRef.current) {
      videoRef.current.currentTime = video.last_progress;
      setCurrentTime(video.last_progress);
      toast.success(`Resumed from ${Math.floor(video.last_progress / 60)}:${String(Math.floor(video.last_progress % 60)).padStart(2, '0')}`);
    }
  }, [video.last_progress]);

  // Save progress to backend (debounced)
  const saveProgress = useCallback(async (progressSeconds: number) => {
    try {
      const response = await fetch(`/api/users/${userId}/curriculum-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_id: video.id,
          status: 'in_progress',
          video_progress_seconds: progressSeconds,
          video_duration_seconds: duration,
          last_position_resume: true
        })
      });

      if (!response.ok) {
        console.error('Failed to save video progress');
      } else {
        setSavedProgress(progressSeconds);
        setLastSavedTime(progressSeconds);
      }
    } catch (error) {
      console.error('Error saving video progress:', error);
    }
  }, [userId, video.id, duration]);

  // Handle video time updates
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;

    const current = videoRef.current.currentTime;
    setCurrentTime(current);

    // Save progress every 10 seconds
    if (current - lastSavedTime >= 10) {
      saveProgress(current);
    }

    // Auto-complete at 95%+
    if (current >= duration * 0.95 && !video.completed) {
      onComplete?.();
    }

    onProgress?.(current);
  }, [lastSavedTime, saveProgress, duration, video.completed, onComplete, onProgress]);

  // Handle seeking (anti-skip logic)
  const handleSeeking = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const targetTime = (e.target as HTMLVideoElement).currentTime || currentTime;

    // Allow seeking backward freely
    if (targetTime < currentTime) {
      setIsSeekingForward(false);
      return;
    }

    // Block seeking forward beyond saved progress + 30s buffer
    const maxAllowedTime = savedProgress + 30;
    if (targetTime > maxAllowedTime) {
      e.preventDefault();
      (e.target as HTMLVideoElement).currentTime = savedProgress;
      setIsSeekingForward(true);

      toast.error('Watch sequentially to build foundational understanding', {
        duration: 3000,
        icon: '⏯️'
      });

      return;
    }

    setIsSeekingForward(false);
  }, [currentTime, savedProgress]);

  // Handle playback rate changes (anti-speed logic)
  const handleRateChange = useCallback(() => {
    if (!videoRef.current) return;

    const rate = videoRef.current.playbackRate;

    // Reset to normal speed if user tries to speed up too much
    if (rate > 1.25) {
      videoRef.current.playbackRate = 1;
      setPlaybackRate(1);
      toast.error('Please watch at normal speed for better understanding', {
        duration: 2000,
        icon: '🐌'
      });
    } else {
      setPlaybackRate(rate);
    }
  }, []);

  // Handle video loaded
  const handleLoadedData = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  // Play/pause handlers
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
    showControlsTemporarily();
  }, [isPlaying, showControlsTemporarily]);

  // Volume handlers
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;

    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    showControlsTemporarily();
  }, [isMuted, showControlsTemporarily]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Seek handler
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      const targetTime = Math.min(newTime, savedProgress + 30); // Enforce anti-skip
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
    showControlsTemporarily();
  }, [savedProgress, showControlsTemporarily]);

  // Format time for display
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const savedProgressPercent = duration > 0 ? (savedProgress / duration) * 100 : 0;

  return (
    <Card className={`relative bg-slate-900/95 border-slate-700 overflow-hidden ${className}`}>
      {/* Video Element */}
      <div
        className="relative group"
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={video.video_url}
          className="w-full aspect-video bg-slate-950"
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onRateChange={handleRateChange}
          onLoadedData={handleLoadedData}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            onComplete?.();
          }}
          playsInline
          controlsList="nodownload"
          preload="metadata"
        />

        {/* Big Play Button (when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={togglePlay}
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 rounded-full w-16 h-16 p-0"
            >
              <Play className="w-8 h-8 ml-1" />
            </Button>
          </div>
        )}

        {/* Controls Overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="relative">
              {/* Saved Progress Background */}
              <div className="absolute inset-0 h-1 bg-slate-600 rounded-full">
                <div
                  className="h-full bg-amber-500/50 rounded-full"
                  style={{ width: `${savedProgressPercent}%` }}
                />
              </div>
              {/* Current Progress */}
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-1 bg-transparent appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${progressPercent}%, #374151 ${progressPercent}%, #374151 100%)`
                }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <Button
                onClick={togglePlay}
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              {/* Time Display */}
              <span className="text-white text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-slate-600 rounded-full appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback Rate */}
              <select
                value={playbackRate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value);
                  if (videoRef.current) {
                    videoRef.current.playbackRate = rate;
                  }
                  setPlaybackRate(rate);
                  showControlsTemporarily();
                }}
                className="bg-slate-700 text-white text-sm px-2 py-1 rounded border-none"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
              </select>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={() => {
                  if (videoRef.current?.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                  }
                  showControlsTemporarily();
                }}
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Anti-skip warning overlay */}
        {isSeekingForward && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <Card className="p-4 bg-red-900/90 border-red-500 text-white">
              <h4 className="font-bold mb-2">Sequential Learning Required</h4>
              <p className="text-sm">Please watch the video in order to build strong foundations.</p>
            </Card>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-700">
        <h3 className="text-white font-semibold text-lg mb-2">{video.title}</h3>

        {/* Progress Indicators */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Progress: {Math.round(progressPercent)}%
            </span>
            <span className="text-amber-400">
              Saved: {Math.round(savedProgressPercent)}%
            </span>
          </div>
          {video.completed && (
            <span className="text-emerald-400 flex items-center gap-1">
              ✓ Completed
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
