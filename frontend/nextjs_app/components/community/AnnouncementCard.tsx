/**
 * Announcement Card Component
 * Special styling for announcements
 */

'use client';

import { PostCard } from './PostCard';
import { Megaphone } from 'lucide-react';
import type { CommunityPermissions } from './CommunityDashboard';

interface AnnouncementCardProps {
  post: any;
  userId?: string;
  permissions: CommunityPermissions;
}

export function AnnouncementCard({ post, userId, permissions }: AnnouncementCardProps) {
  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-och-orange/20 border border-och-orange/50 rounded-lg px-2 py-1 flex items-center gap-1">
          <Megaphone className="w-3 h-3 text-och-orange" />
          <span className="text-xs font-medium text-och-orange">Announcement</span>
        </div>
      </div>
      <PostCard post={post} userId={userId} permissions={permissions} />
    </div>
  );
}




