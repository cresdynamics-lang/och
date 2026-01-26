/**
 * Post Card Component
 * Displays a community post with reactions, comments, and moderation controls
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Heart, MessageCircle, Share2, MoreVertical, Pin, Trash2, Shield } from 'lucide-react';
import type { CommunityPermissions } from './CommunityDashboard';

interface PostCardProps {
  post: {
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
    tags?: string[];
    reactions?: Record<string, number>;
    comment_count?: number;
    is_pinned?: boolean;
    university_name?: string;
  };
  userId?: string;
  permissions: CommunityPermissions;
  showUniversity?: boolean;
  onModerate?: () => void;
  onPin?: () => void;
}

const EMOJI_REACTIONS = ['👍', '❤️', '🎉', '💡', '🔥', '👏'];

export function PostCard({
  post,
  userId,
  permissions,
  showUniversity = false,
  onModerate,
  onPin,
}: PostCardProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [showModMenu, setShowModMenu] = useState(false);

  const handleReact = async (emoji: string) => {
    if (!permissions.canReact) return;
    // TODO: Call API to add reaction
    console.log('React with:', emoji);
    setShowReactions(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isAuthor = post.author.id === userId;
  const canModerate = permissions.canModerate && (isAuthor || permissions.canModerateAll);

  return (
    <Card className="hover:border-och-defender/50 transition-colors">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-och-defender/20 flex items-center justify-center text-och-defender font-semibold">
              {post.author.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{post.author.name}</span>
                {post.author.phase && (
                  <Badge variant="mint" className="text-xs">
                    {post.author.phase}
                  </Badge>
                )}
                {post.author.circle && (
                  <Badge variant="gold" className="text-xs">
                    Circle {post.author.circle}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-och-steel">
                <span>{formatDate(post.created_at)}</span>
                {showUniversity && post.university_name && (
                  <>
                    <span>•</span>
                    <span>{post.university_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.is_pinned && (
              <Badge variant="gold" className="flex items-center gap-1">
                <Pin className="w-3 h-3" />
                Pinned
              </Badge>
            )}
            {canModerate && (
              <div className="relative">
                <button
                  onClick={() => setShowModMenu(!showModMenu)}
                  className="p-1 hover:bg-och-midnight/50 rounded"
                >
                  <MoreVertical className="w-4 h-4 text-och-steel" />
                </button>
                {showModMenu && (
                  <div className="absolute right-0 top-8 bg-och-midnight border border-och-steel/20 rounded-lg shadow-lg z-10 min-w-[150px]">
                    {onPin && (
                      <button
                        onClick={() => {
                          onPin();
                          setShowModMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-och-midnight/50 flex items-center gap-2"
                      >
                        <Pin className="w-3 h-3" />
                        {post.is_pinned ? 'Unpin' : 'Pin'}
                      </button>
                    )}
                    {onModerate && (
                      <button
                        onClick={() => {
                          onModerate();
                          setShowModMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-och-midnight/50 flex items-center gap-2"
                      >
                        <Shield className="w-3 h-3" />
                        Moderate
                      </button>
                    )}
                    {isAuthor && (
                      <button
                        onClick={() => {
                          // TODO: Delete post
                          setShowModMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-och-orange hover:bg-och-midnight/50 flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
          <p className="text-och-steel whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="steel" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-och-steel/20">
          <div className="flex items-center gap-4">
            {/* Reactions */}
            <div className="relative">
              <button
                onClick={() => permissions.canReact && setShowReactions(!showReactions)}
                disabled={!permissions.canReact}
                className="flex items-center gap-2 text-och-steel hover:text-och-defender transition-colors disabled:opacity-50"
              >
                <Heart className="w-4 h-4" />
                <span className="text-sm">
                  {Object.values(post.reactions || {}).reduce((a, b) => a + b, 0) || 0}
                </span>
              </button>
              {showReactions && permissions.canReact && (
                <div className="absolute bottom-full left-0 mb-2 bg-och-midnight border border-och-steel/20 rounded-lg p-2 flex gap-1 shadow-lg z-10">
                  {EMOJI_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(emoji)}
                      className="text-xl hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <button
              disabled={!permissions.canComment}
              className="flex items-center gap-2 text-och-steel hover:text-och-defender transition-colors disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{post.comment_count || 0}</span>
            </button>

            {/* Share */}
            <button className="flex items-center gap-2 text-och-steel hover:text-och-defender transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}




