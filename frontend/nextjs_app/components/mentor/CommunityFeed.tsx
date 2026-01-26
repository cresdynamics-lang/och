'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useCommunity } from '@/hooks/useCommunity'

export function CommunityFeed() {
  // Reuse generic community hook; in future can add mentor-specific filters
  const { posts, isLoading, error } = useCommunity()

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Community & Announcements</h2>
        <Button variant="outline" size="sm">
          New Post
        </Button>
      </div>

      {isLoading && (
        <div className="text-och-steel text-sm">Loading community posts...</div>
      )}

      {error && !isLoading && (
        <div className="text-och-orange text-sm">Error loading posts: {error}</div>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <div className="text-och-steel text-sm">No posts yet.</div>
      )}

      {!isLoading && !error && posts.length > 0 && (
        <div className="space-y-3">
          {posts.slice(0, 5).map((post) => (
            <div
              key={post.id}
              className="p-3 bg-och-midnight/50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-sm font-semibold line-clamp-1">
                  {post.title}
                </span>
                <span className="text-[11px] text-och-steel">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="text-xs text-och-steel line-clamp-2 mb-1">
                {post.content}
              </div>
              {post.university?.name && (
                <div className="text-[11px] text-och-steel">
                  University: {post.university.name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}


