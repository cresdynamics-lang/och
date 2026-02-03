'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoData: {
    id: string;
    title: string;
    duration: string;
    videoUrl?: string;
    thumbnailUrl?: string;
  } | null;
  onVideoComplete?: (videoId: string) => void;
  isSkippable?: boolean;
}

export const VideoPlayerModal = ({
  isOpen,
  onClose,
  videoData,
  onVideoComplete,
  isSkippable = true
}: VideoPlayerModalProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasWatchedMinimum, setHasWatchedMinimum] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Minimum watch time for non-skippable videos (80% of duration)
  const minimumWatchTime = duration * 0.8;

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.load();
    }
  }, [isOpen, videoData]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isSkippable || hasWatchedMinimum) {
          onClose();
        }
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isOpen, onClose, isSkippable, hasWatchedMinimum]);

  useEffect(() => {
    setHasWatchedMinimum(currentTime >= minimumWatchTime);
  }, [currentTime, minimumWatchTime]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setCurrentTime(duration);
    onVideoComplete?.(videoData?.id || '');
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !videoData) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
    >
      {/* Close Button */}
      {(isSkippable || hasWatchedMinimum) && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-och-cyber-mint transition-colors"
          aria-label="Close video player"
        >
          <X className="w-8 h-8" />
        </button>
      )}

      {/* Video Container */}
      <div className="relative w-full h-full max-w-6xl max-h-screen bg-black">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnd}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          poster={videoData.thumbnailUrl}
          controls={false} // We'll build custom controls
        >
          <source src={videoData.videoUrl || '/videos/placeholder.mp4'} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #33FFC1 0%, #33FFC1 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`
              }}
            />
            <div className="flex justify-between text-sm text-white/80 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
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
                className="text-white hover:text-och-cyber-mint hover:bg-white/10"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-och-cyber-mint hover:bg-white/10"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #33FFC1 0%, #33FFC1 ${((isMuted ? 0 : volume) / 1) * 100}%, rgba(255,255,255,0.3) ${((isMuted ? 0 : volume) / 1) * 100}%, rgba(255,255,255,0.3) 100%)`
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Video Info */}
              <div className="text-white">
                <h3 id="video-modal-title" className="font-medium">{videoData.title}</h3>
                <p className="text-sm text-white/70">{videoData.duration}</p>
              </div>

              {/* Fullscreen */}
              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="sm"
                className="text-white hover:text-och-cyber-mint hover:bg-white/10"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Non-skippable video warning */}
        {!isSkippable && !hasWatchedMinimum && (
          <div className="absolute top-4 left-4 bg-och-signal-orange/90 text-black px-4 py-2 rounded-lg">
            <p className="text-sm font-medium">
              Watch {Math.round(minimumWatchTime - currentTime)}s more to unlock quiz
            </p>
          </div>
        )}

        {/* Video completed indicator */}
        {hasWatchedMinimum && (
          <div className="absolute top-4 left-4 bg-och-cyber-mint/90 text-black px-4 py-2 rounded-lg">
            <p className="text-sm font-medium">✓ Video completed - Quiz unlocked!</p>
          </div>
        )}
      </div>
    </div>
  );
};
