'use client'

import { useState, useEffect, useCallback } from 'react'
import { communityClient } from '@/services/communityClient'
import type { CommunityPost, PostComment, CommunityGroup } from '@/services/types/community'

export function useCommunity() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [groups, setGroups] = useState<CommunityGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFeed = useCallback(async (params?: { group_id?: string; page?: number }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await communityClient.getFeed(params)
      setPosts(response.results)
    } catch (err: any) {
      setError(err.message || 'Failed to load community feed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadGroups = useCallback(async (menteeId: string) => {
    try {
      const data = await communityClient.getGroups(menteeId)
      setGroups(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load groups')
    }
  }, [])

  const createPost = useCallback(async (data: {
    title: string
    content: string
    group_id?: string
    tags?: string[]
  }) => {
    try {
      const post = await communityClient.createPost(data)
      setPosts(prev => [post, ...prev])
      return post
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create post')
    }
  }, [])

  const addComment = useCallback(async (postId: string, data: {
    content: string
    reply_to_id?: string
  }) => {
    try {
      const comment = await communityClient.addComment(postId, data)
      // Refresh post to get updated comment count
      await loadFeed()
      return comment
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add comment')
    }
  }, [loadFeed])

  const reactToPost = useCallback(async (postId: string, emoji: string) => {
    try {
      await communityClient.reactToPost(postId, emoji)
      // Refresh posts to get updated reactions
      await loadFeed()
    } catch (err: any) {
      throw new Error(err.message || 'Failed to react to post')
    }
  }, [loadFeed])

  return {
    posts,
    groups,
    isLoading,
    error,
    loadFeed,
    loadGroups,
    createPost,
    addComment,
    reactToPost,
  }
}

