'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Shield, Target, AlertCircle, GraduationCap, TrendingUp, RefreshCw, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { apiGateway } from '@/services/apiGateway';
import { subscriptionClient } from '@/services/subscriptionClient';
import { profilerClient } from '@/services/profilerClient';
import { fastapiClient } from '@/services/fastapiClient';
import { programsClient, type Track } from '@/services/programsClient';

interface ProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  country?: string;
  timezone?: string;
  mfa_enabled?: boolean;
  email_verified?: boolean;
}

interface SubscriptionData {
  tier: 'free' | 'starter' | 'professional';
  status: 'active' | 'inactive' | 'past_due' | 'cancelled';
  enhanced_access_until?: string;
  days_enhanced_left?: number;
  next_payment?: string;
  grace_period_until?: string;
  can_upgrade: boolean;
  features: string[];
}

interface ProfilerStatus {
  completed: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
  session_id?: string | null;
  has_active_session?: boolean;
  completed_at?: string;
  progress?: any;
}

interface ProfilerResults {
  completed: boolean;
  result?: {
    recommended_tracks?: Array<{
      track_id?: string;
      confidence?: number;
      reason?: string;
      track_name?: string;
    }>;
    overall_score?: number;
    aptitude_score?: number;
    behavioral_score?: number;
  };
}

interface TrackRecommendation {
  track: Track | null;
  confidence?: number;
  reason?: string;
  isPrimary: boolean;
}

interface UniversityInfo {
  id: number;
  name: string;
  code: string;
  auto_mapped: boolean;
}

// Calculate profile completeness percentage
function calculateProfileCompleteness(
  profile: ProfileData | null,
  profilerStatus: ProfilerStatus | null,
  university: UniversityInfo | null
): number {
  let score = 0;
  const checks = [
    { condition: profile?.first_name && profile?.last_name, weight: 20 },
    { condition: profile?.email_verified, weight: 10 },
    { condition: profile?.country, weight: 10 },
    { condition: profile?.timezone, weight: 10 },
    { condition: profilerStatus?.completed, weight: 30 },
    { condition: university !== null, weight: 20 },
  ];

  checks.forEach(({ condition, weight }) => {
    if (condition) score += weight;
  });

  return score;
}

export function OCHSettingsOverview() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [profilerStatus, setProfilerStatus] = useState<ProfilerStatus | null>(null);
  const [profilerResults, setProfilerResults] = useState<ProfilerResults | null>(null);
  const [fastapiProfilingStatus, setFastapiProfilingStatus] = useState<any>(null);
  const [fastapiProfilingResults, setFastapiProfilingResults] = useState<any>(null);
  const [university, setUniversity] = useState<UniversityInfo | null>(null);
  const [primaryTrack, setPrimaryTrack] = useState<TrackRecommendation | null>(null);
  const [secondaryTrack, setSecondaryTrack] = useState<TrackRecommendation | null>(null);
  
  // Retake request state
  const [retakeRequestStatus, setRetakeRequestStatus] = useState<'idle' | 'pending' | 'approved' | 'rejected' | 'loading'>('idle');
  const [isRetakeDialogOpen, setIsRetakeDialogOpen] = useState(false);
  const [retakeRequestReason, setRetakeRequestReason] = useState('');
  const [retakeRequestError, setRetakeRequestError] = useState<string | null>(null);
  
  // Track selection state
  const [availableTracks, setAvailableTracks] = useState<any[]>([]);
  const [selectedTrackKey, setSelectedTrackKey] = useState<string | null>(null);
  const [isTrackSelectionDialogOpen, setIsTrackSelectionDialogOpen] = useState(false);
  const [trackSelectionError, setTrackSelectionError] = useState<string | null>(null);
  const [hasSelectedTrack, setHasSelectedTrack] = useState(false);
  const [trackSelectionLoading, setTrackSelectionLoading] = useState(false);

  // Load all data
  useEffect(() => {
    loadAllData();
  }, [user?.id]);

  const loadAllData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Load basic data first
      await Promise.all([
        loadProfile(),
        loadSubscription(),
        loadProfilerStatus(),
        loadFastapiProfilingStatus(),
        loadUniversity(),
      ]);
      
      // Load profiler results after status is loaded
      await loadProfilerResults();
      await loadFastapiProfilingResults();
      
      // Load additional data
      await loadRetakeRequestStatus();
      await loadAvailableTracks();
      await checkTrackSelectionStatus();
    } catch (err: any) {
      console.error('Failed to load overview data:', err);
      setError(err?.message || 'Failed to load overview. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await apiGateway.get('/auth/me');
      setProfile(data as any);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const loadSubscription = async () => {
    try {
      const data = await apiGateway.get<any>('/subscription/status');
      setSubscription({
        tier: (data as any).tier || 'free',
        status: (data as any).status || 'inactive',
        enhanced_access_until: (data as any).enhanced_access_until,
        days_enhanced_left: (data as any).days_enhanced_left,
        next_payment: (data as any).next_payment,
        grace_period_until: (data as any).grace_period_until,
        can_upgrade: (data as any).can_upgrade !== false,
        features: (data as any).features || [],
      });
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setSubscription({
        tier: 'free',
        status: 'inactive',
        can_upgrade: true,
        features: [],
      });
    }
  };

  const loadProfilerStatus = async () => {
    try {
      if (!user?.id) return;
      const data = await profilerClient.getStatus(user.id.toString());
      setProfilerStatus({
        completed: (data as any).completed || false,
        status: (data as any).status || 'not_started',
      });
    } catch (err) {
      console.error('Failed to load profiler status:', err);
    }
  };

  const loadFastapiProfilingStatus = async () => {
    try {
      const status = await fastapiClient.profiling.checkStatus();
      setFastapiProfilingStatus(status);
      
      // Update profilerStatus with FastAPI data if available
      if (status.completed) {
        setProfilerStatus({
          completed: true,
          status: 'completed',
          session_id: status.session_id,
          has_active_session: status.has_active_session,
          completed_at: status.completed_at,
          progress: status.progress,
        });
      } else if (status.has_active_session) {
        setProfilerStatus({
          completed: false,
          status: 'in_progress',
          session_id: status.session_id,
          has_active_session: true,
          progress: status.progress,
        });
      }
    } catch (err) {
      console.error('Failed to load FastAPI profiling status:', err);
      // Don't set error state, just log - Django fallback will handle it
    }
  };

  const loadFastapiProfilingResults = async () => {
    try {
      if (!fastapiProfilingStatus?.completed || !fastapiProfilingStatus?.session_id) {
        return;
      }

      const results = await fastapiClient.profiling.getResults(fastapiProfilingStatus.session_id);
      setFastapiProfilingResults(results);

      // Load primary track from FastAPI results
      if (results.primary_track) {
        const primaryTrackData = results.primary_track;
        const primaryRec = results.recommendations?.[0];
        
        // Try to get track details from tracks API
        try {
          const tracks = await fastapiClient.profiling.getTracks();
          const trackKey = primaryTrackData.key || primaryTrackData.track_key;
          const trackData = tracks.tracks?.[trackKey];
          
          if (trackData) {
            setPrimaryTrack({
              track: {
                name: trackData.name,
                key: trackData.key,
                track_type: 'primary',
                description: trackData.description,
                competencies: {},
                missions: [],
                director: null,
              } as Track,
              confidence: primaryRec?.score ? primaryRec.score / 100 : undefined,
              reason: primaryRec?.reasoning || primaryRec?.track_name,
              isPrimary: true,
            });
          } else {
            // Fallback to basic track info
            setPrimaryTrack({
              track: {
                name: primaryTrackData.name || primaryTrackData.track_name || primaryRec?.track_name || 'Unknown Track',
                key: trackKey || '',
                track_type: 'primary',
                description: primaryTrackData.description || '',
                competencies: {},
                missions: [],
                director: null,
              } as Track,
              confidence: primaryRec?.score ? primaryRec.score / 100 : undefined,
              reason: primaryRec?.reasoning,
              isPrimary: true,
            });
          }
        } catch (trackErr) {
          console.error('Failed to load track details:', trackErr);
          // Fallback to basic info
          setPrimaryTrack({
            track: {
              name: primaryTrackData.name || primaryTrackData.track_name || results.recommendations?.[0]?.track_name || 'Unknown Track',
              key: primaryTrackData.key || primaryTrackData.track_key || '',
              track_type: 'primary',
              description: primaryTrackData.description || '',
              competencies: {},
              missions: [],
              director: null,
            } as Track,
            confidence: results.recommendations?.[0]?.score ? results.recommendations[0].score / 100 : undefined,
            reason: results.recommendations?.[0]?.reasoning,
            isPrimary: true,
          });
        }
      }

      // Set profiler results for scores display
      if (results.recommendations?.[0]) {
        setProfilerResults({
          completed: true,
          result: {
            overall_score: results.recommendations[0].score,
            aptitude_score: results.recommendations[0].score,
            behavioral_score: results.recommendations[0].score,
            recommended_tracks: results.recommendations.map(r => ({
              track_id: r.track_key,
              track_name: r.track_name,
              confidence: r.score / 100,
              reason: r.reasoning,
            })),
          },
        });
      }
    } catch (err) {
      console.error('Failed to load FastAPI profiling results:', err);
      // Don't throw - fallback to Django if needed
    }
  };

  const loadProfilerResults = async () => {
    try {
      if (!user?.id) return;
      const data = await profilerClient.getResults(user.id.toString());
      setProfilerResults(data as any);
      
      // Load track recommendations
      if ((data as any).completed && (data as any).result?.recommended_tracks && (data as any).result.recommended_tracks.length > 0) {
        await loadTrackRecommendations((data as any).result.recommended_tracks);
      } else {
        // Fallback: check profilerStatus for track_recommendation
        // We need to reload status to get the latest data
        const statusData = await profilerClient.getStatus(user.id.toString());
        if ((statusData as any).track_recommendation?.track_id) {
          await loadTrackFromRecommendation((statusData as any).track_recommendation);
        }
      }
    } catch (err) {
      console.error('Failed to load profiler results:', err);
      // If results fail, try to get track from status
      try {
        const statusData = await profilerClient.getStatus(user.id.toString());
        if ((statusData as any).track_recommendation?.track_id) {
          await loadTrackFromRecommendation((statusData as any).track_recommendation);
        }
      } catch (statusErr) {
        console.error('Failed to load track from status:', statusErr);
      }
    }
  };

  const loadTrackRecommendations = async (recommendedTracks: Array<{
    track_id?: string;
    confidence?: number;
    reason?: string;
    track_name?: string;
  }>) => {
    try {
      // Get primary track (first in array)
      if (recommendedTracks.length > 0 && recommendedTracks[0].track_id) {
        const primaryTrackData = recommendedTracks[0];
        try {
          const track = await programsClient.getTrack(primaryTrackData.track_id);
          setPrimaryTrack({
            track,
            confidence: primaryTrackData.confidence,
            reason: primaryTrackData.reason,
            isPrimary: true,
          });
        } catch (err) {
          console.error('Failed to load primary track:', err);
          // Fallback to track_name if available
          if (primaryTrackData.track_name) {
            setPrimaryTrack({
              track: { name: primaryTrackData.track_name, key: '', track_type: 'primary', description: '', competencies: {}, missions: [], director: null } as Track,
              confidence: primaryTrackData.confidence,
              reason: primaryTrackData.reason,
              isPrimary: true,
            });
          }
        }
      }

      // Get secondary track (second in array)
      if (recommendedTracks.length > 1 && recommendedTracks[1].track_id) {
        const secondaryTrackData = recommendedTracks[1];
        try {
          const track = await programsClient.getTrack(secondaryTrackData.track_id);
          setSecondaryTrack({
            track,
            confidence: secondaryTrackData.confidence,
            reason: secondaryTrackData.reason,
            isPrimary: false,
          });
        } catch (err) {
          console.error('Failed to load secondary track:', err);
          // Fallback to track_name if available
          if (secondaryTrackData.track_name) {
            setSecondaryTrack({
              track: { name: secondaryTrackData.track_name, key: '', track_type: 'primary', description: '', competencies: {}, missions: [], director: null } as Track,
              confidence: secondaryTrackData.confidence,
              reason: secondaryTrackData.reason,
              isPrimary: false,
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to load track recommendations:', err);
    }
  };

  const loadTrackFromRecommendation = async (trackRecommendation: {
    track_id?: string;
    confidence?: number;
    persona?: any;
  }) => {
    if (!trackRecommendation.track_id) return;
    
    try {
      const track = await programsClient.getTrack(trackRecommendation.track_id);
      setPrimaryTrack({
        track,
        confidence: trackRecommendation.confidence,
        isPrimary: true,
      });
    } catch (err) {
      console.error('Failed to load track from recommendation:', err);
    }
  };

  const loadUniversity = async () => {
    try {
      // Try to get university membership
      const memberships = await apiGateway.get<any>('/community/university-memberships/');
      if (memberships && (memberships as any[]).length > 0) {
        const membership = (memberships as any[])[0];
        setUniversity({
          id: membership.university?.id,
          name: membership.university?.name,
          code: membership.university?.code,
          auto_mapped: membership.auto_mapped || false,
        });
      }
    } catch (err) {
      console.error('Failed to load university:', err);
    }
  };

  const loadRetakeRequestStatus = async () => {
    try {
      // Check if user has a pending retake request
      const response = await apiGateway.get<any>('/profiling/retake-request/status');
      setRetakeRequestStatus((response as any).status || 'idle');
    } catch (err: any) {
      // If endpoint doesn't exist, that's fine - user hasn't made a request yet
      if (err.status !== 404) {
        console.error('Failed to load retake request status:', err);
      }
      setRetakeRequestStatus('idle');
    }
  };

  const loadAvailableTracks = async () => {
    try {
      const tracksResponse = await fastapiClient.profiling.getTracks();
      const tracksArray = Object.values(tracksResponse.tracks || {}).map((track: any) => ({
        key: track.key,
        name: track.name,
        description: track.description,
        focus_areas: track.focus_areas || [],
        career_paths: track.career_paths || [],
      }));
      setAvailableTracks(tracksArray);
    } catch (err) {
      console.error('Failed to load available tracks:', err);
      setAvailableTracks([]);
    }
  };

  const checkTrackSelectionStatus = async () => {
    try {
      // Check if user has already selected a track (one-time only)
      const response = await apiGateway.get('/profiling/track-selection/status') as { has_selected?: boolean; selected_track_key?: string };
      setHasSelectedTrack(response.has_selected || false);
      if (response.selected_track_key) {
        setSelectedTrackKey(response.selected_track_key);
      }
    } catch (err: any) {
      // If endpoint doesn't exist or user hasn't selected, that's fine
      if (err.status !== 404) {
        console.error('Failed to check track selection status:', err);
      }
      setHasSelectedTrack(false);
    }
  };

  const handleRetakeRequest = async () => {
    if (!retakeRequestReason.trim()) {
      setRetakeRequestError('Please provide a reason for requesting a retake.');
      return;
    }

    setRetakeRequestError(null);
    try {
      await apiGateway.post('/profiling/retake-request', {
        reason: retakeRequestReason,
      });
      setRetakeRequestStatus('pending');
      setIsRetakeDialogOpen(false);
      setRetakeRequestReason('');
    } catch (err: any) {
      console.error('Failed to submit retake request:', err);
      setRetakeRequestError(err.message || 'Failed to submit retake request. Please try again.');
    }
  };

  const handleTrackSelection = async () => {
    if (!selectedTrackKey) {
      setTrackSelectionError('Please select a track.');
      return;
    }

    if (hasSelectedTrack) {
      setTrackSelectionError('You have already selected a track. This is a one-time only choice.');
      return;
    }

    setTrackSelectionError(null);
    setTrackSelectionLoading(true);
    try {
      await apiGateway.post('/profiling/track-selection', {
        track_key: selectedTrackKey,
      });
      setHasSelectedTrack(true);
      setIsTrackSelectionDialogOpen(false);
      // Reload data to reflect the change
      await loadAllData();
    } catch (err: any) {
      console.error('Failed to select track:', err);
      setTrackSelectionError(err.message || 'Failed to select track. Please try again.');
    } finally {
      setTrackSelectionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-och-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-och-steel font-black uppercase tracking-widest text-xs">Loading Overview...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-och-orange mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Overview</h2>
              <p className="text-och-steel mb-6">{error}</p>
              <button
                onClick={loadAllData}
                className="px-6 py-3 bg-och-defender text-white rounded-lg hover:bg-och-defender/80 transition-colors"
              >
                Retry
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const profileCompleteness = calculateProfileCompleteness(profile, profilerStatus, university);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Account Overview</h2>
          <p className="text-och-steel">Your digital pilot's logbook status and readiness metrics</p>
        </div>

        {/* Profile Completeness */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Profile Completeness</h3>
            <Badge variant={profileCompleteness >= 80 ? 'mint' : profileCompleteness >= 50 ? 'orange' : 'steel'}>
              {profileCompleteness}%
            </Badge>
          </div>
          <div className="w-full bg-och-midnight rounded-full h-3 mb-4">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-och-mint to-och-gold transition-all duration-500"
              style={{ width: `${profileCompleteness}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-och-steel mb-1">Profile</div>
              <div className="text-white font-medium">
                {profile?.first_name && profile?.last_name ? 'Complete' : 'Incomplete'}
              </div>
            </div>
            <div>
              <div className="text-och-steel mb-1">AI Profiling</div>
              <div className="text-white font-medium">
                {fastapiProfilingStatus?.completed 
                  ? `Complete${fastapiProfilingStatus.completed_at ? ' • ' + new Date(fastapiProfilingStatus.completed_at).toLocaleDateString() : ''}` 
                  : fastapiProfilingStatus?.has_active_session 
                    ? 'In Progress' 
                    : profilerStatus?.completed 
                      ? 'Complete (Legacy)' 
                      : 'Pending'}
              </div>
            </div>
            <div>
              <div className="text-och-steel mb-1">University</div>
              <div className="text-white font-medium">
                {university ? university.name : 'Not Set'}
              </div>
            </div>
            <div>
              <div className="text-och-steel mb-1">Timezone</div>
              <div className="text-white font-medium">
                {profile?.timezone || 'Not Set'}
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-och-gold" />
              <h3 className="font-semibold text-white">Subscription</h3>
            </div>
            <div className="text-2xl font-bold text-och-mint mb-1">
              {subscription?.tier ? subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1) : 'Free'}
            </div>
            <div className="text-sm text-och-steel">
              {subscription?.status === 'active' ? 'Active' : 'Inactive'}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-och-defender" />
              <h3 className="font-semibold text-white">AI Profiling</h3>
            </div>
            <div className="text-2xl font-bold text-och-mint mb-1">
              {fastapiProfilingStatus?.completed 
                ? 'Complete' 
                : fastapiProfilingStatus?.has_active_session 
                  ? 'In Progress' 
                  : profilerStatus?.completed 
                    ? 'Complete (Legacy)' 
                    : 'Not Started'}
            </div>
            <div className="text-sm text-och-steel mb-3">
              {fastapiProfilingStatus?.completed 
                ? `Completed${fastapiProfilingStatus.completed_at ? ' • ' + new Date(fastapiProfilingStatus.completed_at).toLocaleDateString() : ''}` 
                : fastapiProfilingStatus?.has_active_session 
                  ? 'Assessment in progress' 
                  : profilerStatus?.completed 
                    ? 'Legacy profiling complete' 
                    : 'Assessment pending'}
            </div>
            {primaryTrack?.track?.name && (
              <div className="mt-3 pt-3 border-t border-och-steel/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-och-steel uppercase tracking-widest font-bold">Mapped Track</div>
                  {primaryTrack.confidence && (
                    <Badge variant="gold" className="text-[9px] font-black uppercase px-1.5 py-0.5">
                      {Math.round(primaryTrack.confidence * 100)}% Match
                    </Badge>
                  )}
                </div>
                <div className="text-lg font-bold text-och-gold mb-1">
                  {primaryTrack.track.name}
                </div>
                {primaryTrack.track.description && (
                  <p className="text-xs text-och-steel line-clamp-2 leading-relaxed">
                    {primaryTrack.track.description}
                  </p>
                )}
              </div>
            )}
            
            {/* Retake Request Button */}
            {fastapiProfilingStatus?.completed && (
              <div className="mt-4 pt-4 border-t border-och-steel/20">
                {retakeRequestStatus === 'pending' && (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-och-orange/10 border border-och-orange/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-och-orange" />
                    <p className="text-xs text-och-steel">
                      Retake request pending approval from program director/admin
                    </p>
                  </div>
                )}
                {retakeRequestStatus === 'approved' && (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-och-steel">Retake request approved</p>
                  </div>
                )}
                {retakeRequestStatus === 'rejected' && (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <p className="text-xs text-och-steel">Retake request rejected</p>
                  </div>
                )}
                {retakeRequestStatus === 'idle' && (
                  <Dialog open={isRetakeDialogOpen} onOpenChange={setIsRetakeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-2" />
                        Request AI Profiling Retake
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-och-midnight border-och-steel/20">
                      <DialogHeader>
                        <DialogTitle className="text-white">Request AI Profiling Retake</DialogTitle>
                        <DialogDescription className="text-och-steel">
                          Your request will be reviewed by a program director or administrator. 
                          Please provide a reason for requesting a retake.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="text-sm text-white mb-2 block">Reason for Retake</label>
                          <textarea
                            value={retakeRequestReason}
                            onChange={(e) => setRetakeRequestReason(e.target.value)}
                            placeholder="Explain why you need to retake the AI profiling assessment..."
                            className="w-full p-3 bg-slate-950 border border-och-steel/30 rounded-lg text-white text-sm placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-gold/50"
                            rows={4}
                          />
                        </div>
                        {retakeRequestError && (
                          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-xs text-red-400">{retakeRequestError}</p>
                          </div>
                        )}
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsRetakeDialogOpen(false);
                              setRetakeRequestReason('');
                              setRetakeRequestError(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={handleRetakeRequest}
                            disabled={!retakeRequestReason.trim()}
                          >
                            Submit Request
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-och-orange" />
              <h3 className="font-semibold text-white">Security</h3>
            </div>
            <div className="text-2xl font-bold text-och-mint mb-1">
              {profile?.mfa_enabled ? 'MFA Enabled' : 'Basic'}
            </div>
            <div className="text-sm text-och-steel">
              {profile?.email_verified ? 'Email Verified' : 'Email Unverified'}
            </div>
          </Card>
        </div>

        {/* Track Recommendations */}
        {(primaryTrack || secondaryTrack) && profilerStatus?.completed && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap className="w-6 h-6 text-och-gold" />
              <div>
                <h3 className="text-lg font-semibold text-white">Track Recommendations</h3>
                <p className="text-sm text-och-steel">Based on your TalentScope assessment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Track */}
              {primaryTrack && (
                <div className="p-4 bg-och-gold/5 border border-och-gold/20 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-och-gold" />
                      <h4 className="font-bold text-white">Primary Match</h4>
                    </div>
                    {primaryTrack.confidence && (
                      <Badge variant="gold" className="text-xs font-black uppercase">
                        {Math.round(primaryTrack.confidence * 100)}% Match
                      </Badge>
                    )}
                  </div>
                  <h5 className="text-xl font-bold text-white mb-2">
                    {primaryTrack.track?.name || 'Track Name Unavailable'}
                  </h5>
                  {primaryTrack.track?.description && (
                    <p className="text-sm text-och-steel mb-3 line-clamp-2">
                      {primaryTrack.track.description}
                    </p>
                  )}
                  {primaryTrack.reason && (
                    <p className="text-xs text-och-steel italic">
                      {primaryTrack.reason}
                    </p>
                  )}
                </div>
              )}

              {/* Secondary Track */}
              {secondaryTrack && (
                <div className="p-4 bg-och-mint/5 border border-och-mint/20 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-och-mint" />
                      <h4 className="font-bold text-white">Secondary Option</h4>
                    </div>
                    {secondaryTrack.confidence && (
                      <Badge variant="mint" className="text-xs font-black uppercase">
                        {Math.round(secondaryTrack.confidence * 100)}% Match
                      </Badge>
                    )}
                  </div>
                  <h5 className="text-xl font-bold text-white mb-2">
                    {secondaryTrack.track?.name || 'Track Name Unavailable'}
                  </h5>
                  {secondaryTrack.track?.description && (
                    <p className="text-sm text-och-steel mb-3 line-clamp-2">
                      {secondaryTrack.track.description}
                    </p>
                  )}
                  {secondaryTrack.reason && (
                    <p className="text-xs text-och-steel italic">
                      {secondaryTrack.reason}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Profiling Scores */}
            {profilerResults?.result && (
              <div className="mt-6 pt-6 border-t border-och-steel/20">
                <h4 className="text-sm font-semibold text-white mb-4">Assessment Scores</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {profilerResults.result.overall_score !== undefined && (
                    <div>
                      <p className="text-xs text-och-steel mb-1">Overall Score</p>
                      <p className="text-2xl font-bold text-och-mint">
                        {Math.round(profilerResults.result.overall_score)}%
                      </p>
                    </div>
                  )}
                  {profilerResults.result.aptitude_score !== undefined && (
                    <div>
                      <p className="text-xs text-och-steel mb-1">Aptitude Score</p>
                      <p className="text-2xl font-bold text-och-mint">
                        {Math.round(profilerResults.result.aptitude_score)}%
                      </p>
                    </div>
                  )}
                  {profilerResults.result.behavioral_score !== undefined && (
                    <div>
                      <p className="text-xs text-och-steel mb-1">Behavioral Score</p>
                      <p className="text-2xl font-bold text-och-mint">
                        {Math.round(profilerResults.result.behavioral_score)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

