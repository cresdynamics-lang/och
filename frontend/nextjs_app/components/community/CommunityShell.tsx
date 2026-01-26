"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommunityPostCard } from "./CommunityPostCard"
import { UniversityStatsBar } from "./UniversityStatsBar"
import { LeaderboardWidget } from "./LeaderboardWidget"
import { useCommunityFeed } from "@/hooks/useCommunityFeed"
import { CreatePostModal } from "./CreatePostModal"
import { CommentThread } from "./CommentThread"
import { Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CommunityShellProps {
  userId: string
}

export function CommunityShell({ userId }: CommunityShellProps) {
  const supabase = createClient()
  const {
    posts,
    universities,
    currentUniversity,
    communities,
    createPost,
    loading,
    activeTab,
    setActiveTab,
  } = useCommunityFeed(userId)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [communityId, setCommunityId] = useState<string>("")

  // Get community ID based on active tab
  useEffect(() => {
    const fetchCommunityId = async () => {
      if (activeTab === 'my-university' && currentUniversity) {
        const { data } = await supabase
          .from("communities")
          .select("id")
          .eq("university_id", currentUniversity.id)
          .eq("type", "university")
          .single()
        setCommunityId(data?.id || currentUniversity.id)
      } else if (activeTab === 'global') {
        const { data } = await supabase
          .from("communities")
          .select("id")
          .eq("type", "global")
          .single()
        setCommunityId(data?.id || "global-community")
      } else if (activeTab === 'competitions') {
        const { data } = await supabase
          .from("communities")
          .select("id")
          .eq("type", "competition")
          .limit(1)
          .single()
        setCommunityId(data?.id || "competition-community")
      } else {
        setCommunityId(currentUniversity?.id || "default-community")
      }
    }

    fetchCommunityId()
  }, [activeTab, currentUniversity, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* TOP TABS */}
      <div className="border-b border-slate-800/50 sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <div className="container mx-auto px-4">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-14 bg-transparent p-0 gap-1">
              <TabsTrigger
                value="my-university"
                className="data-[state=active]:bg-indigo-500/20 rounded-lg"
              >
                🔥 My University
              </TabsTrigger>
              <TabsTrigger
                value="global"
                className="data-[state=active]:bg-emerald-500/20 rounded-lg"
              >
                🌍 Global
              </TabsTrigger>
              <TabsTrigger
                value="competitions"
                className="data-[state=active]:bg-orange-500/20 rounded-lg"
              >
                🏆 Competitions
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="data-[state=active]:bg-purple-500/20 rounded-lg"
              >
                👑 Leaderboard
              </TabsTrigger>
              <TabsTrigger value="search" className="rounded-lg">
                <Search className="w-4 h-4 mr-1" />
                Search
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      {/* UNIVERSITY STATS BAR */}
      {currentUniversity && (
        <UniversityStatsBar
          universities={universities}
          currentUniversity={currentUniversity}
        />
      )}

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-8">
        {/* My University / Global / Competitions Feeds */}
        {(activeTab === "my-university" || activeTab === "global" || activeTab === "competitions") && (
          <div className="mt-0">
              <div className="max-w-4xl mx-auto space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    {Array(6)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="h-32 bg-slate-800/50 animate-pulse rounded-xl"
                        />
                      ))}
                  </div>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <div key={post.id}>
                      <CommunityPostCard post={post} userId={userId} />
                      {expandedPostId === post.id && (
                        <CommentThread
                          postId={post.id}
                          comments={[]} // This should be fetched from the hook
                          userId={userId}
                        />
                      )}
                      {expandedPostId !== post.id && (
                        <button
                          onClick={() => setExpandedPostId(post.id)}
                          className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
                        >
                          View comments ({post.comment_count || 0})
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-lg mb-4">No posts yet</p>
                    <p className="text-slate-500 text-sm">
                      Be the first to share something with the community!
                    </p>
                  </div>
                )}
              </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div className="mt-0">
              <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {currentUniversity && (
                  <LeaderboardWidget
                    scope="university"
                    userId={userId}
                  />
                )}
                <LeaderboardWidget scope="global" userId={userId} />
              </div>
          </div>
        )}

        {/* Search Tab - Commented out for now as 'search' is not in activeTab union */}
        {/* {activeTab === "search" && (
          <div className="mt-0">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search posts, users, topics..."
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="text-center py-12">
                  <p className="text-slate-400">Search functionality coming soon</p>
                </div>
              </div>
          </div>
        )} */}
      </div>

      {/* FAB - Create Post Button */}
      {activeTab !== "leaderboard" && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center text-xl shadow-indigo-500/25 transition-transform hover:scale-110 z-50"
          aria-label="Create post"
        >
          ✏️
        </button>
      )}

      {/* Create Post Modal */}
      {communityId && (
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          userId={userId}
          permissions={{
            canPost: true,
            canComment: true,
            canReact: true,
            canModerate: false,
            canPinEvents: false,
            canApproveTracks: false,
            canManageMentors: false,
            canViewAnalytics: false,
            canModerateAll: false,
            canManageUniversities: false,
            readOnlyAccess: false,
          }}
        />
      )}
    </div>
  )
}

