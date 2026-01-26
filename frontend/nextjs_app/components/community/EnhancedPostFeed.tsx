'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCommunity } from '@/hooks/useCommunity'
import { useAuth } from '@/hooks/useAuth'
import type { CommunityPost } from '@/services/types/community'

const EMOJI_REACTIONS = ['👍', '❤️', '🎉', '💡', '🔥', '👏']

export function EnhancedPostFeed() {
  const { user } = useAuth()
  const { posts, isLoading, error, loadFeed, addComment, reactToPost } = useCommunity()
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const handleReact = async (postId: string, emoji: string) => {
    await reactToPost(postId, emoji)
  }

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId]
    if (!content?.trim()) return

    try {
      await addComment(postId, { content })
      setCommentInputs(prev => ({ ...prev, [postId]: '' }))
      setExpandedPosts(prev => new Set([...Array.from(prev), postId]))
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  const toggleExpanded = (postId: string) => {
    setExpandedPosts(prev => {
      const next = new Set(Array.from(prev))
      if (next.has(postId)) {
        next.delete(postId)
      } else {
        next.add(postId)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-och-steel">Loading posts...</div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 border-och-orange">
        <div className="text-och-orange text-sm">{error}</div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post: CommunityPost) => (
        <Card key={post.id}>
          <div className="p-4">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-och-defender flex items-center justify-center text-white font-semibold">
                  {`${post.author.first_name?.[0] || ''}${post.author.last_name?.[0] || ''}`}
                </div>
                <div>
                  <div className="font-semibold text-white">{`${post.author.first_name} ${post.author.last_name}`}</div>
                  <div className="text-xs text-och-steel">
                    {new Date(post.created_at).toLocaleDateString()}
                    {post.university?.name ? ` • ${post.university.name}` : ''}
                  </div>
                </div>
              </div>
              {post.is_pinned && <Badge variant="gold">📌 Pinned</Badge>}
              {post.is_featured && <Badge variant="mint">⭐ Featured</Badge>}
            </div>

            {/* Post Content */}
            <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
            <p className="text-och-steel mb-3">{post.content}</p>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="steel" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Reactions */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                {EMOJI_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(post.id, emoji)}
                    className="text-xl hover:scale-125 transition-transform"
                    aria-label={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <span className="text-sm text-och-steel">
                {post.reaction_count} reactions
              </span>
            </div>

            {/* Engagement Stats */}
            <div className="flex items-center gap-4 text-sm text-och-steel mb-3 pb-3 border-b border-och-steel/20">
              <span>{post.comment_count} comments</span>
              <span>{post.view_count ?? 0} views</span>
            </div>

            {/* Quick Reply */}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentInputs[post.id] || ''}
                onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                placeholder="Add a quick reply..."
                className="flex-1 px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddComment(post.id)
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleExpanded(post.id)}
              >
                {expandedPosts.has(post.id) ? 'Hide' : 'View'} Comments
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

