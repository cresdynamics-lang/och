'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { mentorshipClient } from '@/services/mentorshipClient'
import { communityClient } from '@/services/communityClient'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { MentorshipSession } from '@/services/types/mentorship'
import type { CommunityPost } from '@/services/types/community'

export function MentorshipCommunityCard() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const [sessions, setSessions] = useState<MentorshipSession[]>([])
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!menteeId) return

    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [sessionsData, postsData] = await Promise.all([
          mentorshipClient.getUpcomingSessions(menteeId).catch(() => []),
          communityClient.getRecentPosts({ page_size: 3 }).then(res => res.results).catch(() => []),
        ])

        setSessions(sessionsData)
        setPosts(postsData)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [menteeId])

  const handleJoinSession = (session: MentorshipSession) => {
    if (session.meeting_url) {
      window.open(session.meeting_url, '_blank')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  if (isLoading) {
    return (
      <Card className="mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-och-steel/20 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-och-steel/20 rounded"></div>
            <div className="h-4 bg-och-steel/20 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mb-6">
        <div className="text-och-orange">Error loading data: {error}</div>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <h2 className="text-2xl font-bold text-white mb-4">Mentorship & Community</h2>

      {/* Upcoming Sessions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-och-steel mb-3">Upcoming Sessions</h3>
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.slice(0, 2).map((session) => (
              <div key={session.id} className="p-3 bg-och-midnight/50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-white">{session.topic}</div>
                    <div className="text-sm text-och-steel">with {session.mentor_name}</div>
                    <div className="text-xs text-och-steel mt-1">{formatDate(session.scheduled_at)}</div>
                  </div>
                  <Badge variant={session.status === 'scheduled' ? 'defender' : 'steel'}>
                    {session.status}
                  </Badge>
                </div>
                {session.meeting_url && session.status === 'scheduled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleJoinSession(session)}
                    className="w-full mt-2"
                  >
                    Join Session
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-och-steel text-sm">
            No upcoming sessions scheduled
          </div>
        )}
      </div>

      {/* Community Posts */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-och-steel">Recent Community Posts</h3>
          <Link href="/dashboard/student/community">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        {posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/dashboard/student/community/posts/${post.id}`}
                className="block p-3 bg-och-midnight/50 rounded-lg hover:bg-och-midnight/70 transition"
              >
                <div className="font-semibold text-white mb-1 line-clamp-1">{post.title}</div>
                <div className="text-sm text-och-steel line-clamp-2 mb-2">{post.content}</div>
                <div className="flex items-center gap-2 text-xs text-och-steel">
                  <span>{post.author?.first_name} {post.author?.last_name}</span>
                  <span>•</span>
                  <span>{post.comment_count} replies</span>
                  {post.university?.name && (
                    <>
                      <span>•</span>
                      <Badge variant="steel" className="text-xs">{post.university?.name}</Badge>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-och-steel text-sm">
            No recent posts
          </div>
        )}
      </div>
    </Card>
  )
}
