'use client';

import { useState, useEffect } from 'react';
import { Users, Hash, Volume2, ChevronRight, Shield, Zap, FileText, Rocket, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface CommunitySpace {
  id: string;
  slug: string;
  title: string;
  track_code?: string;
  level_slug?: string;
  description: string;
  is_global: boolean;
  user_role: string;
  channels: CommunityChannel[];
  member_count?: number;
  is_member?: boolean;
}

interface CommunityChannel {
  id: string;
  slug: string;
  title: string;
  channel_type: 'text' | 'announcement';
  sort_order: number;
  is_hidden: boolean;
}

const TRACK_ICONS = {
  defender: Shield,
  offensive: Zap,
  grc: FileText,
  innovation: Rocket,
  leadership: Award,
} as const;

const LEVEL_COLORS = {
  beginner: 'bg-blue-500',
  intermediate: 'bg-green-500',
  advanced: 'bg-orange-500',
  mastery: 'bg-purple-500',
} as const;

function SpaceCard({ space, isRecommended }: { space: CommunitySpace; isRecommended?: boolean }) {
  const TrackIcon = TRACK_ICONS[space.track_code as keyof typeof TRACK_ICONS] || Shield;
  const levelColor = LEVEL_COLORS[space.level_slug as keyof typeof LEVEL_COLORS] || 'bg-slate-500';

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all hover:scale-105">
      {/* Recommended Badge */}
      {isRecommended && (
        <div className="mb-4">
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
            ⭐ Recommended for You
          </Badge>
        </div>
      )}

      {/* Space Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
          space.is_global ? 'bg-slate-600' : levelColor
        }`}>
          {space.is_global ? (
            <Volume2 className="w-6 h-6 text-white" />
          ) : (
            <TrackIcon className="w-6 h-6 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white mb-1">{space.title}</h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-3">{space.description}</p>

          {/* Space Metadata */}
          <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
            {!space.is_global && space.track_code && (
              <div className="flex items-center gap-1">
                <TrackIcon className="w-4 h-4" />
                <span className="capitalize">{space.track_code}</span>
                {space.level_slug && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className={`text-xs ${levelColor} border-current`}>
                      {space.level_slug}
                    </Badge>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{space.member_count || 0} members</span>
            </div>
          </div>

          {/* Channels Preview */}
          <div className="mb-4">
            <p className="text-slate-400 text-sm mb-2">Channels:</p>
            <div className="flex flex-wrap gap-2">
              {space.channels.slice(0, 3).map(channel => (
                <div key={channel.id} className="flex items-center gap-1 text-xs text-slate-500">
                  {channel.channel_type === 'announcement' ? (
                    <Volume2 className="w-3 h-3" />
                  ) : (
                    <Hash className="w-3 h-3" />
                  )}
                  <span>{channel.title.replace('#', '')}</span>
                </div>
              ))}
              {space.channels.length > 3 && (
                <span className="text-xs text-slate-500">+{space.channels.length - 3} more</span>
              )}
            </div>
          </div>

          {/* User Role */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-slate-400 border-slate-600">
              {space.user_role}
            </Badge>
            {space.is_member && (
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                Member
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Link href={`/community/spaces/${space.slug}`}>
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          Enter Space
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </Card>
  );
}

export default function CommunityHubPage() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<CommunitySpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedSpace, setRecommendedSpace] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        // In production, fetch from API
        const response = await fetch('/api/community/spaces');
        if (!response.ok) throw new Error('Failed to fetch spaces');

        const data = await response.json();
        setSpaces(data.spaces || []);

        // Set recommended space (e.g., user's current track/level)
        const defenderSpace = data.spaces?.find((s: CommunitySpace) => s.track_code === 'defender');
        if (defenderSpace) {
          setRecommendedSpace(defenderSpace.slug);
        }
      } catch (error) {
        console.error('Failed to fetch community spaces:', error);
        // Fallback mock data
        const mockSpaces: CommunitySpace[] = [
          {
            id: 'defender-beginner-space',
            slug: 'defender-beginner',
            title: 'Defender Beginner',
            track_code: 'defender',
            level_slug: 'beginner',
            description: 'Community space for Defender track beginners. Get help, share solutions, and connect with fellow cybersecurity learners.',
            is_global: false,
            user_role: 'student',
            member_count: 1250,
            is_member: true,
            channels: [
              { id: '1', slug: 'help', title: '#defender-beginner-help', channel_type: 'text', sort_order: 1, is_hidden: false },
              { id: '2', slug: 'missions', title: '#defender-beginner-missions', channel_type: 'text', sort_order: 2, is_hidden: false },
              { id: '3', slug: 'recipes', title: '#defender-beginner-recipes', channel_type: 'text', sort_order: 3, is_hidden: false },
              { id: '4', slug: 'general', title: '#defender-beginner-general', channel_type: 'text', sort_order: 4, is_hidden: false }
            ]
          },
          {
            id: 'announcements-space',
            slug: 'announcements',
            title: 'OCH Announcements',
            description: 'Official announcements, updates, and important information from the OCH team.',
            is_global: true,
            user_role: 'student',
            member_count: 5000,
            is_member: true,
            channels: [
              { id: '5', slug: 'general', title: '#announcements', channel_type: 'announcement', sort_order: 1, is_hidden: false }
            ]
          }
        ];
        setSpaces(mockSpaces);
        setRecommendedSpace('defender-beginner');
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading Community...</p>
        </div>
      </div>
    );
  }

  const globalSpaces = spaces.filter(s => s.is_global);
  const trackSpaces = spaces.filter(s => !s.is_global);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Users className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Community <span className="text-blue-400">Hub</span>
              </h1>
            </div>

            <p className="text-base sm:text-lg text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed">
              Connect with fellow learners, get help with missions, and share your cybersecurity journey.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{spaces.reduce((acc, space) => acc + (space.member_count || 0), 0)} Active Members</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                <span>{spaces.reduce((acc, space) => acc + space.channels.length, 0)} Channels</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Global Spaces */}
        {globalSpaces.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <h2 className="text-xl font-bold text-white">Global Spaces</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {globalSpaces.map(space => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Space */}
        {recommendedSpace && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-400" />
              <h2 className="text-xl font-bold text-white">Recommended for You</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trackSpaces
                .filter(space => space.slug === recommendedSpace)
                .map(space => (
                  <SpaceCard key={space.id} space={space} isRecommended />
                ))}
            </div>
          </div>
        )}

        {/* All Track Spaces */}
        {trackSpaces.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Track Communities</h2>
              <Badge variant="outline" className="text-slate-400 border-slate-600">
                {trackSpaces.length} Spaces
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trackSpaces.map(space => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 max-w-2xl mx-auto">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Join the Conversation</h3>
            <p className="text-slate-300 text-sm mb-4">
              Connect with cybersecurity professionals, get real-time help with challenges, and build your network in the industry.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                💬 Real-time discussions
              </span>
              <span className="flex items-center gap-1">
                🤝 Peer support
              </span>
              <span className="flex items-center gap-1">
                🎯 Mission help
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}