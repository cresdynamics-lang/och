/**
 * Global Feed View
 * Shows trending posts, cross-university competitions, and major achievements
 * Students have read-only access to other universities
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PostCard } from './PostCard';
import { TrendingUp, Award, Users, Lock } from 'lucide-react';
import type { CommunityPermissions } from './CommunityDashboard';
import type { Role } from '@/utils/rbac';

interface GlobalFeedViewProps {
  userId?: string;
  permissions: CommunityPermissions;
  roles: Role[];
}

interface GlobalPost {
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
  post_type: 'discussion' | 'announcement' | 'event' | 'achievement' | 'competition';
  tags?: string[];
  reactions?: Record<string, number>;
  comment_count?: number;
  university_id?: string;
  university_name?: string;
  is_trending?: boolean;
  achievement_badge?: string;
  competition_name?: string;
}

export function GlobalFeedView({
  userId,
  permissions,
  roles,
}: GlobalFeedViewProps) {
  const [posts, setPosts] = useState<GlobalPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'trending' | 'achievements' | 'competitions' | 'all'>('trending');

  useEffect(() => {
    // TODO: Fetch from Django API
    // const fetchPosts = async () => {
    //   try {
    //     const response = await apiGateway.get(`/community/global/feed`, {
    //       params: { filter, read_only: permissions.readOnlyAccess }
    //     });
    //     setPosts(response.results || []);
    //   } catch (error) {
    //     console.error('Failed to fetch global feed:', error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchPosts();

    // Mock data
    setTimeout(() => {
      setPosts([
        {
          id: 'global-1',
          title: 'Cross-University Cybersecurity Challenge',
          content: 'Join the monthly challenge and compete with students from across Africa!',
          author: {
            id: 'admin-1',
            name: 'OCH Platform',
            email: 'platform@och.africa',
          },
          created_at: new Date().toISOString(),
          post_type: 'competition',
          is_trending: true,
          competition_name: 'Monthly Challenge',
          university_name: 'All Universities',
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, [filter, permissions.readOnlyAccess]);

  const filteredPosts = posts.filter((post) => {
    if (filter === 'all') return true;
    if (filter === 'trending') return post.is_trending;
    if (filter === 'achievements') return post.post_type === 'achievement';
    if (filter === 'competitions') return post.post_type === 'competition';
    return true;
  });

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
      {/* Read-only notice for students */}
      {permissions.readOnlyAccess && (
        <Card className="border-och-orange/50 bg-och-orange/5 p-4">
          <div className="flex items-center gap-2 text-och-orange">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Read-only access: You can view and react to posts from other universities, but cannot post or comment.
            </span>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter('trending')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
              filter === 'trending'
                ? 'bg-och-defender text-white'
                : 'bg-och-midnight/50 text-och-steel hover:text-white'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            Trending
          </button>
          <button
            onClick={() => setFilter('achievements')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
              filter === 'achievements'
                ? 'bg-och-defender text-white'
                : 'bg-och-midnight/50 text-och-steel hover:text-white'
            }`}
          >
            <Award className="w-3 h-3" />
            Achievements
          </button>
          <button
            onClick={() => setFilter('competitions')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
              filter === 'competitions'
                ? 'bg-och-defender text-white'
                : 'bg-och-midnight/50 text-och-steel hover:text-white'
            }`}
          >
            <Users className="w-3 h-3" />
            Competitions
          </button>
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
        </div>
      </Card>

      {/* Posts */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-och-steel mb-2">No posts in global feed</p>
            <p className="text-sm text-och-steel">
              Check back later for trending content and cross-university activities!
            </p>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="relative">
              <PostCard
                post={post}
                userId={userId}
                permissions={{
                  ...permissions,
                  canPost: false, // No posting in global feed for students
                  canComment: !permissions.readOnlyAccess, // Can comment if not read-only
                }}
                showUniversity={true}
              />
              {post.university_name && (
                <Badge variant="steel" className="absolute top-4 right-4">
                  {post.university_name}
                </Badge>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}




