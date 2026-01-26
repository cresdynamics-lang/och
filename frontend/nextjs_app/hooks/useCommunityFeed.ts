"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type {
  CommunityPost,
  Community,
  University,
  StudentUniversityMapping,
  CreatePostData,
} from "@/types/community"

export function useCommunityFeed(userId: string) {
  const supabase = createClient()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [currentUniversity, setCurrentUniversity] = useState<University | null>(null)
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'my-university' | 'global' | 'competitions' | 'leaderboard'>('my-university')

  // Auto-join university community
  const joinUniversityCommunity = useCallback(async (userId: string) => {
    try {
      // Get user's email from auth.users
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) return

      // Extract domain from email (e.g., student@uon.ac.ke -> uon)
      const emailDomain = user.email.split('@')[1]
      const domainParts = emailDomain.split('.')
      const potentialCode = domainParts[0].toUpperCase()

      // Try to find university by code
      const { data: university } = await supabase
        .from("universities")
        .select("*")
        .ilike("code", `%${potentialCode}%`)
        .limit(1)
        .single()

      if (!university) {
        // Try to find by email domain
        const { data: universityByDomain } = await supabase
          .from("universities")
          .select("*")
          .ilike("code", `%${domainParts[0]}%`)
          .limit(1)
          .single()

        if (!universityByDomain) {
          console.log("No university found for domain:", emailDomain)
          return
        }

        // Map student to university
        await supabase
          .from("student_university_mapping")
          .upsert({
            user_id: userId,
            university_id: universityByDomain.id,
            mapped_method: 'email_domain',
            updated_at: new Date().toISOString(),
          })

        setCurrentUniversity(universityByDomain as University)

        // Find or create university community
        const { data: community } = await supabase
          .from("communities")
          .select("*")
          .eq("university_id", universityByDomain.id)
          .eq("type", "university")
          .limit(1)
          .single()

        if (community) {
          // Auto-join community
          await supabase
            .from("community_memberships")
            .upsert({
              community_id: community.id,
              user_id: userId,
              role: 'member',
            })
        }
        return
      }

      // Map student to university
      await supabase
        .from("student_university_mapping")
        .upsert({
          user_id: userId,
          university_id: university.id,
          mapped_method: 'email_domain',
          updated_at: new Date().toISOString(),
        })

      setCurrentUniversity(university as University)

      // Find or create university community
      const { data: community } = await supabase
        .from("communities")
        .select("*")
        .eq("university_id", university.id)
        .eq("type", "university")
        .limit(1)
        .single()

      if (community) {
        // Auto-join community
        await supabase
          .from("community_memberships")
          .upsert({
            community_id: community.id,
            user_id: userId,
            role: 'member',
          })
      }
    } catch (err) {
      console.error("Error joining university community:", err)
    }
  }, [supabase])

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      // Get user's university mapping
      const { data: mapping } = await supabase
        .from("student_university_mapping")
        .select("university_id")
        .eq("user_id", userId)
        .single()

      if (mapping?.university_id) {
        // Fetch university details
        const { data: university } = await supabase
          .from("universities")
          .select("*")
          .eq("id", mapping.university_id)
          .single()

        if (university) {
          setCurrentUniversity(university as University)
        }

        // Fetch university community
        const { data: uniCommunity } = await supabase
          .from("communities")
          .select("*")
          .eq("university_id", mapping.university_id)
          .eq("type", "university")
          .single()

        if (uniCommunity && activeTab === 'my-university') {
          await fetchPosts(uniCommunity.id)
        }
      }

      if (activeTab === 'global') {
        // Fetch global community posts
        const { data: globalCommunity } = await supabase
          .from("communities")
          .select("*")
          .eq("type", "global")
          .single()

        if (globalCommunity) {
          await fetchPosts(globalCommunity.id)
        }
      }

      // Fetch all universities
      const { data: allUniversities } = await supabase
        .from("universities")
        .select("*")
        .eq("is_active", true)
        .order("member_count", { ascending: false })

      if (allUniversities) {
        setUniversities(allUniversities as University[])
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }, [userId, activeTab, supabase])

  // Fetch posts for a community
  const fetchPosts = useCallback(async (communityId: string) => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("community_posts")
        .select("*")
        .eq("community_id", communityId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(20)

      if (postsError) throw postsError

      if (!postsData || postsData.length === 0) {
        setPosts([])
        return
      }

      // Get current user for comparison
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      // Create user lookup (in production, you'd fetch from a profiles table)
      const userLookup: Record<string, { name?: string; email?: string; avatar?: string }> = {}
      
      // For now, we'll use a simple approach - in production, join with profiles table
      postsData.forEach(post => {
        if (!userLookup[post.user_id]) {
          // If it's the current user, use their data
          if (post.user_id === currentUser?.id) {
            userLookup[post.user_id] = {
              email: currentUser.email,
              name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || "Anonymous",
              avatar: currentUser.user_metadata?.avatar_url,
            }
          } else {
            // For other users, use placeholder (in production, fetch from profiles)
            userLookup[post.user_id] = {
              name: "Anonymous",
              email: undefined,
            }
          }
        }
      })

      // Fetch reactions for all posts
      const postIds = postsData.map(p => p.id)
      const { data: reactionsData } = await supabase
        .from("community_reactions")
        .select("post_id, reaction_type")
        .in("post_id", postIds)

      // Aggregate reactions by post
      const reactionsByPost: Record<string, Record<string, number>> = {}
      reactionsData?.forEach(reaction => {
        if (!reactionsByPost[reaction.post_id]) {
          reactionsByPost[reaction.post_id] = {}
        }
        reactionsByPost[reaction.post_id][reaction.reaction_type] =
          (reactionsByPost[reaction.post_id][reaction.reaction_type] || 0) + 1
      })

      // Fetch university data for posts
      const { data: universitiesData } = await supabase
        .from("universities")
        .select("id, name, logo_url")

      const universityLookup: Record<string, { name: string; logo?: string }> = {}
      universitiesData?.forEach(uni => {
        universityLookup[uni.id] = { name: uni.name, logo: uni.logo_url || undefined }
      })

      // Merge all data into posts
      const postsWithData = postsData.map(post => {
        const user = userLookup[post.user_id] || { name: "Anonymous" }
        return {
          ...post,
          reactions: reactionsByPost[post.id] || {},
          user_name: user.name,
          user_avatar: user.avatar,
          user_circle: undefined, // This would come from portfolio/progress system
          university_name: currentUniversity?.name,
          university_logo: currentUniversity?.logo_url,
        } as CommunityPost
      })

      setPosts(postsWithData)
    } catch (err: any) {
      console.error("Error fetching posts:", err)
      setError(err.message)
    }
  }, [supabase, currentUniversity])

  // Set up realtime subscriptions
  useEffect(() => {
    if (!userId) return

    // Subscribe to new posts
    const postsChannel = supabase
      .channel("community_posts_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_posts",
        },
        (payload) => {
          setPosts((prev) => [payload.new as CommunityPost, ...prev])
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "community_posts",
        },
        (payload) => {
          setPosts((prev) =>
            prev.map((p) => (p.id === payload.new.id ? payload.new as CommunityPost : p))
          )
        }
      )
      .subscribe()

    // Subscribe to reactions
    const reactionsChannel = supabase
      .channel("community_reactions_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_reactions",
        },
        () => {
          // Refetch posts to get updated reaction counts
          fetchInitialData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(postsChannel)
      supabase.removeChannel(reactionsChannel)
    }
  }, [userId, supabase, fetchInitialData])

  // Auto-join on mount
  useEffect(() => {
    if (userId) {
      joinUniversityCommunity(userId)
    }
  }, [userId, joinUniversityCommunity])

  // Fetch data when tab changes
  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  // Create post
  const createPost = useCallback(async (postData: CreatePostData) => {
    try {
      const { data, error: createError } = await supabase
        .from("community_posts")
        .insert({
          ...postData,
          user_id: userId,
          status: 'published',
        })
        .select()
        .single()

      if (createError) throw createError

      // Refresh posts
      await fetchInitialData()

      return data
    } catch (err: any) {
      throw new Error(err.message || "Failed to create post")
    }
  }, [userId, supabase, fetchInitialData])

  return {
    posts,
    universities,
    currentUniversity,
    communities,
    loading,
    error,
    createPost,
    activeTab,
    setActiveTab,
    refetch: fetchInitialData,
  }
}

