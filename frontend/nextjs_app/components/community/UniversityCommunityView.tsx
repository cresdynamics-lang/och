/**
 * University Community View
 * Shows posts, announcements, and events for the user's home university
 * Role-based permissions apply here
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PostCard } from './PostCard';
import { AnnouncementCard } from './AnnouncementCard';
import { EventCard } from './EventCard';
import { Pin, Megaphone, Calendar, Filter } from 'lucide-react';
import type { CommunityPermissions } from './CommunityDashboard';
import type { Role } from '@/utils/rbac';

interface UniversityCommunityViewProps {
  userId?: string;
  permissions: CommunityPermissions;
  roles: Role[];
}

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    phase?: string;
    circle?: string;
  };
  created_at: string;
  updated_at?: string;
  post_type: 'discussion' | 'announcement' | 'event' | 'achievement';
  tags?: string[];
  reactions?: Record<string, number>;
  comment_count?: number;
  is_pinned?: boolean;
  is_event?: boolean;
  event_date?: string;
  university_id?: string;
  university_name?: string;
}

export function UniversityCommunityView({
  userId,
  permissions,
  roles,
}: UniversityCommunityViewProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'discussions' | 'announcements' | 'events'>('all');

  useEffect(() => {
    // TODO: Fetch from Django API
    // const fetchPosts = async () => {
    //   try {
    //     const response = await apiGateway.get(`/community/university/posts`, {
    //       params: { filter }
    //     });
    //     setPosts(response.results || []);
    //   } catch (error) {
    //     console.error('Failed to fetch university posts:', error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchPosts();

    // Mock data for now
    setTimeout(() => {
      setPosts([
        {
          id: '1',
          title: 'Welcome to OCH Community!',
          content: 'This is your university community feed. Share achievements, ask questions, and connect with peers.',
          author: {
            id: 'admin-1',
            name: 'OCH Admin',
            email: 'admin@och.africa',
          },
          created_at: new Date().toISOString(),
          post_type: 'announcement',
          is_pinned: true,
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, [filter]);

  const filteredPosts = posts.filter((post) => {
    if (filter === 'all') return true;
    if (filter === 'discussions') return post.post_type === 'discussion';
    if (filter === 'announcements') return post.post_type === 'announcement';
    if (filter === 'events') return post.post_type === 'event' || post.is_event;
    return true;
  });

  const pinnedPosts = filteredPosts.filter((p) => p.is_pinned);
  const regularPosts = filteredPosts.filter((p) => !p.is_pinned);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-och-midnight/50 rounded w-3/4"></div>
              <div className="h-4 bg-och-midnight/50 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-och-steel" />
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'all'
                ? 'bg-och-defender text-white'
                : 'bg-och-midnight/50 text-och-steel hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('discussions')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'discussions'
                ? 'bg-och-defender text-white'
                : 'bg-och-midnight/50 text-och-steel hover:text-white'
            }`}
          >
            Discussions
          </button>
          <button
            onClick={() => setFilter('announcements')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'announcements'
                ? 'bg-och-defender text-white'
                : 'bg-och-midnight/50 text-och-steel hover:text-white'
            }`}
          >
            <Megaphone className="w-3 h-3 inline mr-1" />
            Announcements
          </button>
          <button
            onClick={() => setFilter('events')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'events'
                ? 'bg-och-defender text-white'
                : 'bg-och-midnight/50 text-och-steel hover:text-white'
            }`}
          >
            <Calendar className="w-3 h-3 inline mr-1" />
            Events
          </button>
        </div>
      </Card>

      {/* Pinned Posts */}
      {pinnedPosts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-och-steel">
            <Pin className="w-4 h-4" />
            <span className="text-sm font-medium">Pinned</span>
          </div>
          {pinnedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              userId={userId}
              permissions={permissions}
              onModerate={permissions.canModerate ? () => {} : undefined}
              onPin={permissions.canPinEvents ? () => {} : undefined}
            />
          ))}
        </div>
      )}

      {/* Regular Posts */}
      <div className="space-y-4">
        {regularPosts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-och-steel mb-2">No posts yet</p>
            {permissions.canPost && (
              <p className="text-sm text-och-steel">
                Be the first to share something with your university community!
              </p>
            )}
          </Card>
        ) : (
          regularPosts.map((post) => {
            if (post.post_type === 'announcement') {
              return (
                <AnnouncementCard
                  key={post.id}
                  post={post}
                  userId={userId}
                  permissions={permissions}
                />
              );
            }
            if (post.post_type === 'event' || post.is_event) {
              return (
                <EventCard
                  key={post.id}
                  post={post}
                  userId={userId}
                  permissions={permissions}
                />
              );
            }
            return (
              <PostCard
                key={post.id}
                post={post}
                userId={userId}
                permissions={permissions}
                onModerate={permissions.canModerate ? () => {} : undefined}
                onPin={permissions.canPinEvents ? () => {} : undefined}
              />
            );
          })
        )}
      </div>
    </div>
  );
}




