"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/Button"
import { createClient } from "@/lib/supabase/client"
import type { CommunityComment } from "@/types/community"
import { MessageCircle, Reply } from "lucide-react"

interface CommentThreadProps {
  postId: string
  comments: CommunityComment[]
  userId?: string
}

export function CommentThread({ postId, comments: initialComments, userId }: CommentThreadProps) {
  const supabase = createClient()
  const [comments, setComments] = useState<CommunityComment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [loading, setLoading] = useState(false)

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return "just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString()
    } catch {
      return "recently"
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !userId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("community_comments")
        .insert({
          post_id: postId,
          user_id: userId,
          content: newComment.trim(),
        })
        .select()
        .single()

      if (error) throw error

      setComments([...comments, data as CommunityComment])
      setNewComment("")
    } catch (error: any) {
      console.error("Error posting comment:", error)
      alert(error.message || "Failed to post comment")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !userId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("community_comments")
        .insert({
          post_id: postId,
          parent_id: parentId,
          user_id: userId,
          content: replyContent.trim(),
        })
        .select()
        .single()

      if (error) throw error

      // Add reply to the appropriate parent comment
      const updatedComments = comments.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), data as CommunityComment],
          }
        }
        return comment
      })

      setComments(updatedComments)
      setReplyContent("")
      setReplyingTo(null)
    } catch (error: any) {
      console.error("Error posting reply:", error)
      alert(error.message || "Failed to post reply")
    } finally {
      setLoading(false)
    }
  }

  const renderComment = (comment: CommunityComment, level = 0) => {
    const replies = comment.replies || []
    const isReplying = replyingTo === comment.id

    return (
      <div key={comment.id} className={`${level > 0 ? 'ml-8 mt-3' : 'mb-4'}`}>
        <div className="flex gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={comment.user_avatar} />
            <AvatarFallback>{comment.user_name?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-100 text-sm">
                {comment.user_name || "Anonymous"}
              </span>
              <span className="text-xs text-slate-500">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <p className="text-slate-200 text-sm mb-2 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
            {userId && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}

            {isReplying && (
              <div className="mt-3 ml-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-2"
                  placeholder="Write a reply..."
                />
                <div className="flex gap-2">
                  <Button
                    variant="defender"
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={loading || !replyContent.trim()}
                  >
                    Post Reply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Render nested replies */}
            {replies.length > 0 && (
              <div className="mt-3">
                {replies.map((reply) => renderComment(reply, level + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-slate-800/50 pt-4 mt-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments ({comments.length})
        </h3>

        {/* Comments List */}
        <div className="space-y-4 mb-4">
          {comments.map((comment) => renderComment(comment))}
          {comments.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>

        {/* New Comment Form */}
        {userId && (
          <form onSubmit={handleSubmitComment} className="space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Write a comment..."
              required
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="defender"
                size="sm"
                disabled={loading || !newComment.trim()}
              >
                {loading ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

