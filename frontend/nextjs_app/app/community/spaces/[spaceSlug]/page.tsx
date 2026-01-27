'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, Hash, Volume2, Users, Settings, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

import SpacesSidebar from '@/components/community/SpacesSidebar';
import MessagesTimeline from '@/components/community/MessagesTimeline';
import ContextPanel from '@/components/community/ContextPanel';

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
  description?: string;
  channel_type: 'text' | 'announcement';
  sort_order: number;
  is_hidden: boolean;
}

interface CommunityThread {
  id: string;
  title: string;
  created_by: {
    id: string;
    email: string;
    display_name: string;
  };
  thread_type: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

interface CommunityMessage {
  id: string;
  author: {
    id: string;
    email: string;
    display_name: string;
  };
  body: string;
  reply_to_message_id: string | null;
  has_ai_flag: boolean;
  ai_flag_reason?: string;
  created_at: string;
  reactions: MessageReaction[];
}

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

function ThreadsList({
  threads,
  onThreadSelect,
  selectedThreadId
}: {
  threads: CommunityThread[];
  onThreadSelect: (threadId: string) => void;
  selectedThreadId?: string;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Threads</h3>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Thread
          </Button>
        </div>

        <div className="space-y-2">
          {threads.map(thread => (
            <Card
              key={thread.id}
              className={`p-3 cursor-pointer transition-colors hover:bg-slate-800 ${
                selectedThreadId === thread.id ? 'bg-slate-700 border-blue-500' : 'bg-slate-800/50'
              }`}
              onClick={() => onThreadSelect(thread.id)}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-sm">
                    {thread.created_by.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm mb-1 truncate">
                    {thread.title}
                  </h4>
                  <p className="text-slate-400 text-xs mb-2">
                    {thread.created_by.display_name} • {thread.message_count} messages
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                      {thread.thread_type}
                    </Badge>
                    <span className="text-slate-500 text-xs">
                      {new Date(thread.last_message_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {threads.length === 0 && (
          <div className="text-center py-8">
            <Hash className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No threads yet</p>
            <p className="text-slate-500 text-sm">Start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChannelView({
  channel,
  threads,
  messages,
  onThreadSelect,
  onSendMessage,
  onAddReaction,
  onFlagMessage,
  selectedThreadId
}: {
  channel: CommunityChannel;
  threads: CommunityThread[];
  messages: CommunityMessage[];
  onThreadSelect: (threadId: string) => void;
  onSendMessage: (body: string, replyToId?: string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onFlagMessage: (messageId: string, reason: string) => void;
  selectedThreadId?: string;
}) {
  const selectedThread = threads.find(t => t.id === selectedThreadId);

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-900/50">
        <div className="flex items-center gap-3">
          {channel.channel_type === 'announcement' ? (
            <Volume2 className="w-5 h-5 text-orange-400" />
          ) : (
            <Hash className="w-5 h-5 text-slate-400" />
          )}
          <div>
            <h2 className="text-white font-semibold">{channel.title}</h2>
            {channel.description && (
              <p className="text-slate-400 text-sm">{channel.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Threads Sidebar */}
        <div className="w-80 border-r border-slate-700">
          <ThreadsList
            threads={threads}
            onThreadSelect={onThreadSelect}
            selectedThreadId={selectedThreadId}
          />
        </div>

        {/* Messages Area */}
        <div className="flex-1">
          {selectedThread ? (
            <MessagesTimeline
              messages={messages}
              currentUserId="mock-user-id" // In production: get from auth
              onSendMessage={onSendMessage}
              onAddReaction={onAddReaction}
              onFlagMessage={onFlagMessage}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Hash className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Welcome to {channel.title}</h3>
                <p className="text-slate-400 mb-4">Select a thread to start reading messages</p>
                <Button onClick={() => onThreadSelect(threads[0]?.id)}>
                  View First Thread
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Context Panel */}
        <ContextPanel
          contextType={selectedThread?.thread_type === 'mission' ? 'mission' :
                      selectedThread?.thread_type === 'recipe' ? 'recipe' :
                      selectedThread?.thread_type === 'module' ? 'module' : 'generic'}
          threadType={selectedThread?.thread_type}
          threadId={selectedThread?.id}
        />
      </div>
    </div>
  );
}

export default function CommunitySpacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const spaceSlug = params.spaceSlug as string;

  const [space, setSpace] = useState<CommunitySpace | null>(null);
  const [allSpaces, setAllSpaces] = useState<CommunitySpace[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState<string | undefined>();
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>();
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('student');

  // Initialize with URL params
  useEffect(() => {
    const channelSlug = searchParams.get('channel');
    const threadId = searchParams.get('thread');

    if (channelSlug) {
      // Find channel by slug and set currentChannelId
      // This would be done after fetching space data
    }
    if (threadId) {
      setSelectedThreadId(threadId);
    }
  }, [searchParams]);

  // Fetch space data
  useEffect(() => {
    const fetchSpaceData = async () => {
      try {
        // Fetch space details
        const spaceResponse = await fetch(`/api/community/spaces/${spaceSlug}`);
        if (!spaceResponse.ok) throw new Error('Failed to fetch space');

        const spaceData = await spaceResponse.json();
        setSpace(spaceData.space);

        // Set default channel if none selected
        if (!currentChannelId && spaceData.space.channels.length > 0) {
          setCurrentChannelId(spaceData.space.channels[0].id);
        }

        // Fetch all spaces for sidebar
        const spacesResponse = await fetch('/api/community/spaces');
        if (spacesResponse.ok) {
          const spacesData = await spacesResponse.json();
          setAllSpaces(spacesData.spaces || []);
        }
      } catch (error) {
        console.error('Failed to fetch space data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaceData();
  }, [spaceSlug, currentChannelId]);

  // Fetch threads when channel changes
  useEffect(() => {
    if (!currentChannelId) return;

    const fetchThreads = async () => {
      try {
        const response = await fetch(`/api/community/channels/${currentChannelId}/threads`);
        if (!response.ok) throw new Error('Failed to fetch threads');

        const data = await response.json();
        setThreads(data.threads || []);

        // Select first thread if none selected
        if (!selectedThreadId && data.threads.length > 0) {
          setSelectedThreadId(data.threads[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch threads:', error);
      }
    };

    fetchThreads();
  }, [currentChannelId, selectedThreadId]);

  // Fetch messages when thread changes
  useEffect(() => {
    if (!selectedThreadId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/community/threads/${selectedThreadId}/messages`);
        if (!response.ok) throw new Error('Failed to fetch messages');

        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, [selectedThreadId]);

  const handleSpaceSelect = (spaceId: string) => {
    const selectedSpace = allSpaces.find(s => s.id === spaceId);
    if (selectedSpace) {
      window.location.href = `/community/spaces/${selectedSpace.slug}`;
    }
  };

  const handleChannelSelect = (channelId: string) => {
    setCurrentChannelId(channelId);
    setSelectedThreadId(undefined); // Reset thread selection
  };

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  const handleSendMessage = async (body: string, replyToId?: string) => {
    if (!selectedThreadId) return;

    // Check if user can post messages (employer guests are read-only)
    if (userRole === 'employer_guest') {
      alert('Employer guests have read-only access. Contact OCH to become a full member.');
      return;
    }

    try {
      const response = await fetch(`/api/community/threads/${selectedThreadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, reply_to_message_id: replyToId })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();

      // Add message to local state
      setMessages(prev => [...prev, data.message]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/community/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleFlagMessage = async (messageId: string, reason: string) => {
    try {
      await fetch(`/api/community/messages/${messageId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
    } catch (error) {
      console.error('Failed to flag message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading community space...</p>
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Space not found</div>
          <Link href="/community">
            <Button>Back to Community Hub</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentChannel = space.channels.find(c => c.id === currentChannelId);

  return (
    <div className="h-screen bg-slate-950 flex">
      {/* Spaces Sidebar */}
      <SpacesSidebar
        spaces={allSpaces}
        currentSpaceId={space.id}
        currentChannelId={currentChannelId}
        onSpaceSelect={handleSpaceSelect}
        onChannelSelect={handleChannelSelect}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {currentChannel ? (
          <ChannelView
            channel={currentChannel}
            threads={threads}
            messages={messages}
            onThreadSelect={handleThreadSelect}
            onSendMessage={handleSendMessage}
            onAddReaction={handleAddReaction}
            onFlagMessage={handleFlagMessage}
            selectedThreadId={selectedThreadId}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Hash className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Welcome to {space.title}</h3>
              <p className="text-slate-400 mb-4">Select a channel to start exploring</p>
              {space.channels.length > 0 && (
                <Button onClick={() => handleChannelSelect(space.channels[0].id)}>
                  Enter {space.channels[0].title}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
