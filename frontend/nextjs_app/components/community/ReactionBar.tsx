"use client"

import { Button } from "@/components/ui/Button"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

const EMOJIS = ["🔥", "💯", "👏", "❤️", "😂"] as const

interface ReactionBarProps {
  reactions: Record<string, number>
  postId: string
  userId?: string
}

export function ReactionBar({ reactions, postId, userId }: ReactionBarProps) {
  const supabase = createClient()
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set())
  const [localReactions, setLocalReactions] = useState<Record<string, number>>(reactions)

  // Fetch user's reactions for this post
  useEffect(() => {
    if (!userId) return

    const fetchUserReactions = async () => {
      const { data } = await supabase
        .from("community_reactions")
        .select("reaction_type")
        .eq("post_id", postId)
        .eq("user_id", userId)

      if (data) {
        setUserReactions(new Set(data.map(r => r.reaction_type)))
      }
    }

    fetchUserReactions()
  }, [postId, userId, supabase])

  // Sync local reactions with props
  useEffect(() => {
    setLocalReactions(reactions)
  }, [reactions])

  const toggleReaction = async (emoji: string) => {
    if (!userId) {
      // Redirect to login or show error
      return
    }

    const isReacted = userReactions.has(emoji)

    // Optimistic update
    const newUserReactions = new Set(userReactions)
    const newLocalReactions = { ...localReactions }

    if (isReacted) {
      newUserReactions.delete(emoji)
      newLocalReactions[emoji] = Math.max(0, (newLocalReactions[emoji] || 0) - 1)
    } else {
      newUserReactions.add(emoji)
      newLocalReactions[emoji] = (newLocalReactions[emoji] || 0) + 1
    }

    setUserReactions(newUserReactions)
    setLocalReactions(newLocalReactions)

    // Server update
    if (isReacted) {
      const { error } = await supabase
        .from("community_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId)
        .eq("reaction_type", emoji)

      if (error) {
        // Rollback on error
        setUserReactions(prev => {
          const rolledBack = new Set(prev)
          rolledBack.add(emoji)
          return rolledBack
        })
        setLocalReactions(reactions)
      }
    } else {
      const { error } = await supabase
        .from("community_reactions")
        .insert({ post_id: postId, user_id: userId, reaction_type: emoji })

      if (error) {
        // Rollback on error
        setUserReactions(prev => {
          const rolledBack = new Set(prev)
          rolledBack.delete(emoji)
          return rolledBack
        })
        setLocalReactions(reactions)
      }
    }
  }

  return (
    <div className="flex items-center gap-1">
      {EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          variant="outline"
          size="sm"
          className={`h-9 px-2 text-slate-400 hover:text-slate-200 transition-all ${
            userReactions.has(emoji)
              ? "bg-indigo-500/20 text-indigo-400 scale-110 shadow-md shadow-indigo-500/25"
              : ""
          }`}
          onClick={() => toggleReaction(emoji)}
        >
          <span className="text-lg">{emoji}</span>
          {localReactions[emoji] > 0 && (
            <span className="ml-1 text-xs font-mono tabular-nums">
              {localReactions[emoji]}
            </span>
          )}
        </Button>
      ))}
    </div>
  )
}

