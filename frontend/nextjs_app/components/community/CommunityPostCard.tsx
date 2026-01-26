"use client"

import { CardEnhanced } from "@/components/ui/card-enhanced"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { ReactionBar } from "./ReactionBar"
import { MessageCircle, Share2, Award, Calendar, BarChart3 } from "lucide-react"
import type { CommunityPost } from "@/types/community"
// Simple date formatter (date-fns alternative)
function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m${options?.addSuffix ? " ago" : ""}`
  if (diffHours < 24) return `${diffHours}h${options?.addSuffix ? " ago" : ""}`
  if (diffDays < 7) return `${diffDays}d${options?.addSuffix ? " ago" : ""}`
  
  return date.toLocaleDateString()
}

interface CommunityPostCardProps {
  post: CommunityPost
  userId?: string
}

export function CommunityPostCard({ post, userId }: CommunityPostCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "recently"
    }
  }

  return (
    <CardEnhanced className="group bg-slate-900/70 hover:bg-slate-900/90 border-slate-800/60 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden">
      <CardEnhanced.Header className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarImage src={post.user_avatar} />
              <AvatarFallback>{post.user_name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <div className="font-semibold text-slate-100 truncate text-sm">
                  {post.user_name || "Anonymous"}
                </div>
                {post.user_circle && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 h-auto">
                    Circle {post.user_circle}
                  </Badge>
                )}
                {post.university_name && (
                  <>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full flex-shrink-0" />
                    <div className="text-xs text-slate-400 font-medium truncate">
                      {post.university_name}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {formatDate(post.created_at)}
                {post.tags?.[0] && (
                  <>
                    <div className="w-1 h-1 bg-slate-500 rounded-full" />
                    <span className="font-mono text-slate-400">#{post.tags[0]}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* POST TYPE BADGE */}
          <Badge
            variant="outline"
            className={`uppercase text-xs px-2 py-1 flex-shrink-0 ${
              post.post_type === 'achievement' ? 'border-yellow-400 text-yellow-400' :
              post.post_type === 'event' ? 'border-emerald-400 text-emerald-400' :
              'border-slate-600 text-slate-400'
            }`}
          >
            {post.post_type === 'achievement' ? '🏆' :
             post.post_type === 'event' ? '📅' :
             post.post_type}
          </Badge>
        </div>
      </CardEnhanced.Header>

      <CardEnhanced.Content className="space-y-4 pb-6">
        {post.title && (
          <h3 className="text-xl font-bold text-slate-50 leading-tight">{post.title}</h3>
        )}

        {/* CONTENT */}
        <div className="prose prose-sm prose-invert max-w-none text-slate-200 leading-relaxed">
          <p className="whitespace-pre-wrap break-words">{post.content}</p>
        </div>

        {/* MEDIA GALLERY */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {post.media_urls.slice(0, 6).map((url, i) => (
              <div key={i} className="relative group aspect-video overflow-hidden rounded-lg bg-slate-800/50">
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {post.media_urls!.length > 3 && i === 2 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-sm">
                    +{post.media_urls!.length - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* EVENT DETAILS */}
        {post.post_type === 'event' && post.event_details && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              {new Date(post.event_details.start_time).toLocaleDateString()}
            </div>
            {post.event_details.title && (
              <div className="text-sm font-medium text-slate-200">{post.event_details.title}</div>
            )}
            {post.event_details.rsvp_count !== undefined && (
              <div className="text-xs text-slate-400">{post.event_details.rsvp_count} going</div>
            )}
          </div>
        )}

        {/* ACHIEVEMENT DETAILS */}
        {post.post_type === 'achievement' && post.achievement_data && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Award className="w-5 h-5" />
              <span className="font-bold text-sm">Achievement Unlocked</span>
            </div>
            <div className="text-lg font-bold text-slate-100">{post.achievement_data.badge}</div>
            <div className="text-sm text-yellow-400 font-mono">
              Circle {post.achievement_data.circle} • {post.achievement_data.score}/10
            </div>
          </div>
        )}

        {/* POLL OPTIONS */}
        {post.post_type === 'poll' && post.poll_options && Array.isArray(post.poll_options) && (
          <div className="space-y-2 p-4 bg-slate-800/50 rounded-lg">
            {post.poll_options.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700/50 rounded px-3 py-2 text-sm text-slate-200">
                  {option.option}
                </div>
                <div className="text-xs text-slate-400 w-12 text-right">
                  {option.votes || 0} votes
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAGS */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, i) => (
              <Badge key={i} variant="steel" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardEnhanced.Content>

      <CardEnhanced.Footer className="pt-4 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="w-full flex items-center justify-between gap-4 flex-wrap">
          <ReactionBar reactions={post.reactions || {}} postId={post.id} userId={userId} />

          <div className="flex items-center gap-2 ml-auto">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {post.view_count?.toLocaleString() || 0}
            </div>
            <Button variant="outline" size="sm" className="h-9 px-3 text-slate-400 hover:text-slate-200">
              <MessageCircle className="w-4 h-4 mr-1" />
              {post.comment_count || 0}
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-3 text-slate-400 hover:text-slate-200">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </CardEnhanced.Footer>
    </CardEnhanced>
  )
}

