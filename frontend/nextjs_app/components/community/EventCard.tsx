/**
 * Event Card Component
 * Special styling for events with date/time
 */

'use client';

import { PostCard } from './PostCard';
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { CommunityPermissions } from './CommunityDashboard';

interface EventCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    author: any;
    created_at: string;
    event_date?: string;
    event_time?: string;
    [key: string]: any;
  };
  userId?: string;
  permissions: CommunityPermissions;
}

export function EventCard({ post, userId, permissions }: EventCardProps) {
  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {post.event_date && (
          <Badge variant="mint" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(post.event_date).toLocaleDateString()}
          </Badge>
        )}
        {post.event_time && (
          <Badge variant="steel" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.event_time}
          </Badge>
        )}
      </div>
      <PostCard post={post} userId={userId} permissions={permissions} />
    </div>
  );
}




