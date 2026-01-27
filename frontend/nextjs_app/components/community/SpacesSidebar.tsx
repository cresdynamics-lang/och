'use client';

import { useState } from 'react';
import { Shield, Zap, FileText, Rocket, Award, Hash, Volume2, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface CommunitySpace {
  id: string;
  slug: string;
  title: string;
  track_code?: string;
  level_slug?: string;
  is_global: boolean;
  user_role: string;
  channels: CommunityChannel[];
}

interface CommunityChannel {
  id: string;
  slug: string;
  title: string;
  channel_type: 'text' | 'announcement';
  sort_order: number;
  is_hidden: boolean;
}

interface SpacesSidebarProps {
  spaces: CommunitySpace[];
  currentSpaceId?: string;
  currentChannelId?: string;
  onSpaceSelect: (spaceId: string) => void;
  onChannelSelect: (channelId: string) => void;
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

function SpaceIcon({ space, isSelected }: { space: CommunitySpace; isSelected: boolean }) {
  if (space.is_global) {
    return (
      <div className={`w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center ${
        isSelected ? 'bg-slate-500' : 'hover:bg-slate-500'
      } transition-colors`}>
        <Volume2 className="w-4 h-4 text-white" />
      </div>
    );
  }

  const TrackIcon = TRACK_ICONS[space.track_code as keyof typeof TRACK_ICONS] || Shield;
  const levelColor = LEVEL_COLORS[space.level_slug as keyof typeof LEVEL_COLORS] || 'bg-slate-500';

  return (
    <div className="relative">
      <div className={`w-8 h-8 rounded-lg ${levelColor} flex items-center justify-center ${
        isSelected ? 'ring-2 ring-white ring-opacity-50' : ''
      } transition-all hover:scale-110`}>
        <TrackIcon className="w-4 h-4 text-white" />
      </div>
      {!space.is_global && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-slate-700 rounded-full border border-slate-800 flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full ${levelColor}`} />
        </div>
      )}
    </div>
  );
}

function ChannelList({
  channels,
  currentChannelId,
  onChannelSelect,
  isCollapsed
}: {
  channels: CommunityChannel[];
  currentChannelId?: string;
  onChannelSelect: (channelId: string) => void;
  isCollapsed: boolean;
}) {
  const groupedChannels = channels.reduce((acc, channel) => {
    const category = channel.channel_type === 'announcement' ? 'announcements' :
                    channel.slug.includes('help') ? 'help' :
                    channel.slug.includes('mission') ? 'missions' :
                    channel.slug.includes('recipe') ? 'recipes' :
                    'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(channel);
    return acc;
  }, {} as Record<string, CommunityChannel[]>);

  if (isCollapsed) {
    return (
      <div className="space-y-1 px-2">
        {channels.map(channel => (
          <button
            key={channel.id}
            onClick={() => onChannelSelect(channel.id)}
            className={`w-full text-left p-2 rounded hover:bg-slate-700 transition-colors ${
              currentChannelId === channel.id ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
            title={channel.title}
          >
            {channel.channel_type === 'announcement' ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <Hash className="w-4 h-4" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
        <div key={category}>
          <div className="flex items-center gap-2 px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <ChevronDown className="w-3 h-3" />
            {category}
          </div>
          <div className="space-y-1">
            {categoryChannels.map(channel => (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel.id)}
                className={`w-full text-left px-3 py-1 rounded hover:bg-slate-700 transition-colors flex items-center gap-2 ${
                  currentChannelId === channel.id
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {channel.channel_type === 'announcement' ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <Hash className="w-4 h-4" />
                )}
                <span className="truncate text-sm">{channel.title.replace('#', '')}</span>
                {channel.is_hidden && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    Hidden
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SpacesSidebar({
  spaces,
  currentSpaceId,
  currentChannelId,
  onSpaceSelect,
  onChannelSelect
}: SpacesSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentSpace = spaces.find(s => s.id === currentSpaceId);

  return (
    <div className={`bg-slate-900 border-r border-slate-700 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-white font-semibold text-sm">Community</h2>
            <p className="text-slate-400 text-xs">OCH Cyber Hub</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-90' : ''}`} />
        </Button>
      </div>

      {/* Spaces List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Spaces</span>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-1">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}

          <div className="space-y-1">
            {spaces.map(space => (
              <button
                key={space.id}
                onClick={() => onSpaceSelect(space.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors ${
                  currentSpaceId === space.id ? 'bg-slate-700' : ''
                }`}
                title={isCollapsed ? space.title : undefined}
              >
                <SpaceIcon space={space} isSelected={currentSpaceId === space.id} />
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <div className={`text-sm font-medium truncate ${
                      currentSpaceId === space.id ? 'text-white' : 'text-slate-300'
                    }`}>
                      {space.title}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {space.user_role}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Channels for Current Space */}
        {currentSpace && (
          <div className="border-t border-slate-700">
            {!isCollapsed && (
              <div className="p-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <SpaceIcon space={currentSpace} isSelected={false} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">
                      {currentSpace.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Badge variant="outline" className="text-xs">
                        {currentSpace.user_role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-2">
              <ChannelList
                channels={currentSpace.channels}
                currentChannelId={currentChannelId}
                onChannelSelect={onChannelSelect}
                isCollapsed={isCollapsed}
              />
            </div>
          </div>
        )}
      </div>

      {/* User Status */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-sm font-medium">U</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">Current User</div>
              <div className="text-slate-400 text-xs">Student</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
