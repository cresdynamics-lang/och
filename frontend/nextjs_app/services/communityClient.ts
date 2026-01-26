/**
 * Community Service Client
 * Handles posts, comments, reactions, and groups
 */

import { apiGateway } from './apiGateway'
import type {
  CommunityPost,
  PostComment,
  CommunityGroup,
} from './types/community'

export const communityClient = {
  /**
   * Get community feed
   */
  async getFeed(params?: {
    group_id?: string
    page?: number
    page_size?: number
  }): Promise<{ results: CommunityPost[]; count: number }> {
    return apiGateway.get('/community/posts/feed', { params })
  },

  /**
   * Create post
   */
  async createPost(data: {
    title: string
    content: string
    group_id?: string
    tags?: string[]
  }): Promise<CommunityPost> {
    return apiGateway.post('/community/posts', data)
  },

  /**
   * Get post comments
   */
  async getComments(postId: string): Promise<PostComment[]> {
    return apiGateway.get(`/community/posts/${postId}/comments`)
  },

  /**
   * Add comment
   */
  async addComment(postId: string, data: {
    content: string
    reply_to_id?: string
  }): Promise<PostComment> {
    return apiGateway.post(`/community/posts/${postId}/comments`, data)
  },

  /**
   * React to post
   */
  async reactToPost(postId: string, emoji: string): Promise<{ detail: string }> {
    return apiGateway.post(`/community/posts/${postId}/reactions`, { emoji })
  },

  /**
   * Get user groups
   */
  async getGroups(menteeId: string): Promise<CommunityGroup[]> {
    return apiGateway.get(`/community/groups/memberships`, { params: { mentee_id: menteeId } })
  },

  /**
   * Follow user
   */
  async followUser(menteeId: string, targetUserId: string): Promise<{ detail: string }> {
    return apiGateway.post(`/community/follow`, { mentee_id: menteeId, target_user_id: targetUserId })
  },

  /**
   * Get recent posts filtered by track
   */
  async getRecentPosts(params?: {
    filter?: string
    track?: string
    page_size?: number
  }): Promise<{ results: CommunityPost[]; count: number }> {
    return apiGateway.get('/community/posts/recent', { params })
  },
}

