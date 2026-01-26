/**
 * useCurriculumProgress Hook
 * 
 * Master hook for curriculum progress management with realtime updates.
 * Handles track enrollment, progress tracking, and next action calculation.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiGateway } from '@/services/apiGateway';
import type {
  CurriculumTrackDetail,
  UserTrackProgress,
  CurriculumActivity,
  NextAction,
  SubscriptionTier,
  MyProgressResponse,
  TrackEnrollResponse,
  CurriculumModuleList,
} from '@/services/types/curriculum';

interface UseCurriculumProgressOptions {
  trackCode?: string;
  autoEnroll?: boolean;
}

interface UseCurriculumProgressResult {
  // Track data
  track: CurriculumTrackDetail | null;
  
  // Progress data
  progress: UserTrackProgress | null;
  subscriptionTier: SubscriptionTier;
  
  // Next action
  nextAction: NextAction | null;
  
  // Recent activities
  recentActivities: CurriculumActivity[];
  
  // Modules with progress
  modules: (CurriculumModuleList & { 
    isLocked: boolean; 
    isCurrent: boolean;
  })[];
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  enrollInTrack: () => Promise<TrackEnrollResponse | null>;
  startModule: (moduleId: string) => Promise<void>;
  completeModule: (moduleId: string) => Promise<void>;
  updateLessonProgress: (lessonId: string, status: string, progressPct?: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useCurriculumProgress(
  userId: string,
  options: UseCurriculumProgressOptions = {}
): UseCurriculumProgressResult {
  const { trackCode, autoEnroll = false } = options;
  
  const [track, setTrack] = useState<CurriculumTrackDetail | null>(null);
  const [progress, setProgress] = useState<UserTrackProgress | null>(null);
  const [recentActivities, setRecentActivities] = useState<CurriculumActivity[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch track data and progress
  const fetchData = useCallback(async () => {
    if (!trackCode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch track details
      const trackResponse = await apiGateway.get<CurriculumTrackDetail>(
        `/curriculum/tracks/${trackCode}/`
      );
      setTrack(trackResponse);
      
      // Extract progress from track response
      if (trackResponse.user_progress) {
        // This is the summary, we need full progress
        const progressResponse = await apiGateway.get<{ enrolled: boolean; progress?: UserTrackProgress }>(
          `/curriculum/tracks/${trackCode}/progress/`
        );
        if (progressResponse.enrolled && progressResponse.progress) {
          setProgress(progressResponse.progress);
        }
      }
      
      // Set activities
      if (trackResponse.recent_activities) {
        setRecentActivities(trackResponse.recent_activities);
      }
      
      // Fetch subscription tier
      try {
        const myProgress = await apiGateway.get<MyProgressResponse>('/curriculum/my-progress/');
        setSubscriptionTier(myProgress.subscription_tier as SubscriptionTier);
      } catch (e) {
        // Default to free if can't fetch
        setSubscriptionTier('free');
      }
      
    } catch (err: any) {
      console.error('Error fetching curriculum data:', err);
      setError(err.message || 'Failed to fetch curriculum data');
    } finally {
      setLoading(false);
    }
  }, [trackCode]);

  useEffect(() => {
    if (userId && trackCode) {
      fetchData();
    }
  }, [userId, trackCode, fetchData]);

  // Auto-enroll if specified
  useEffect(() => {
    if (autoEnroll && track && !progress && !loading) {
      enrollInTrack();
    }
  }, [autoEnroll, track, progress, loading]);

  // Enroll in track
  const enrollInTrack = useCallback(async (): Promise<TrackEnrollResponse | null> => {
    if (!trackCode) return null;
    
    try {
      const response = await apiGateway.post<TrackEnrollResponse>(
        `/curriculum/tracks/${trackCode}/enroll/`
      );
      setProgress(response.progress);
      return response;
    } catch (err: any) {
      console.error('Error enrolling in track:', err);
      setError(err.message || 'Failed to enroll in track');
      return null;
    }
  }, [trackCode]);

  // Start a module
  const startModule = useCallback(async (moduleId: string): Promise<void> => {
    try {
      await apiGateway.post(`/curriculum/modules/${moduleId}/start/`);
      await fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Error starting module:', err);
      throw err;
    }
  }, [fetchData]);

  // Complete a module
  const completeModule = useCallback(async (moduleId: string): Promise<void> => {
    try {
      await apiGateway.post(`/curriculum/modules/${moduleId}/complete/`);
      await fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Error completing module:', err);
      throw err;
    }
  }, [fetchData]);

  // Update lesson progress
  const updateLessonProgress = useCallback(async (
    lessonId: string,
    status: string,
    progressPct?: number
  ): Promise<void> => {
    try {
      await apiGateway.post(`/curriculum/lessons/${lessonId}/progress/`, {
        lesson_id: lessonId,
        status,
        progress_percentage: progressPct,
      });
      // Don't refetch entire track, just update local state
    } catch (err: any) {
      console.error('Error updating lesson progress:', err);
      throw err;
    }
  }, []);

  // Calculate next action
  const nextAction = useMemo((): NextAction | null => {
    if (!track) return null;
    
    // Use track's next_action if available
    if (track.next_action) {
      return track.next_action;
    }
    
    // Otherwise calculate based on progress
    if (!progress) {
      return {
        type: 'start_module',
        icon: '🚀',
        label: 'Enroll to Start',
        url: `/curriculum/${trackCode}`,
      };
    }
    
    // Find first incomplete module
    const modules = track.modules || [];
    for (const module of modules) {
      if (module.completion_percentage < 100 && !module.is_locked) {
        return {
          type: module.completion_percentage > 0 ? 'continue_lesson' : 'start_module',
          icon: module.completion_percentage > 0 ? '📚' : '🚀',
          label: module.completion_percentage > 0 
            ? `Continue: ${module.title}` 
            : `Start: ${module.title}`,
          module_id: module.id,
          url: `/curriculum/${trackCode}/module/${module.id}`,
        };
      }
    }
    
    return {
      type: 'track_complete',
      icon: '🎉',
      label: 'Track Completed!',
      url: `/curriculum/${trackCode}/complete`,
    };
  }, [track, progress, trackCode]);

  // Process modules with lock status and current status
  const modules = useMemo(() => {
    if (!track?.modules) return [];
    
    const currentModuleId = progress?.current_module;
    
    return track.modules.map(module => {
      // Check if locked based on entitlement
      let isLocked = false;
      if (module.entitlement_tier === 'professional' && subscriptionTier !== 'professional') {
        isLocked = true;
      } else if (module.entitlement_tier === 'starter_enhanced' && 
                 !['starter_enhanced', 'professional'].includes(subscriptionTier)) {
        isLocked = true;
      }
      
      return {
        ...module,
        isLocked,
        isCurrent: module.id === currentModuleId,
      };
    });
  }, [track?.modules, progress?.current_module, subscriptionTier]);

  return {
    track,
    progress,
    subscriptionTier,
    nextAction,
    recentActivities,
    modules,
    loading,
    error,
    enrollInTrack,
    startModule,
    completeModule,
    updateLessonProgress,
    refetch: fetchData,
  };
}

/**
 * Hook for fetching user's overall curriculum progress (all tracks)
 */
export function useMyProgress(userId: string) {
  const [data, setData] = useState<MyProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiGateway.get<MyProgressResponse>('/curriculum/my-progress/');
      setData(response);
    } catch (err: any) {
      console.error('Error fetching my progress:', err);
      setError(err.message || 'Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Ensure tracks is always an array
  const tracks = Array.isArray(data?.tracks) ? data.tracks : [];
  const recentActivities = Array.isArray(data?.recent_activities) ? data.recent_activities : [];
  
  return {
    tracks,
    recentActivities,
    stats: data?.stats,
    subscriptionTier: (data?.subscription_tier as SubscriptionTier) || 'free',
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for fetching available curriculum tracks
 */
export function useCurriculumTracks() {
  const [tracks, setTracks] = useState<CurriculumTrackDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await apiGateway.get<CurriculumTrackDetail[] | { results?: CurriculumTrackDetail[]; count?: number }>('/curriculum/tracks/');
        
        // Handle both array and paginated response formats
        let tracksData: CurriculumTrackDetail[] = [];
        if (Array.isArray(response)) {
          tracksData = response;
        } else if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
          tracksData = response.results;
        }
        
        setTracks(tracksData);
      } catch (err: any) {
        console.error('Error fetching tracks:', err);
        setError(err.message || 'Failed to fetch tracks');
        // Ensure tracks is always an array even on error
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTracks();
  }, []);

  return { tracks, loading, error };
}

