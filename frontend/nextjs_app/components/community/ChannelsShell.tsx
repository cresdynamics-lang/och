"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ChannelCard } from "./ChannelCard"
import { SquadCard } from "./SquadCard"
import { CreateChannelModal } from "./CreateChannelModal"
import { CreateSquadModal } from "./CreateSquadModal"
import { 
  Hash, Users, Star, Plus, Search, Filter, 
  Sparkles, Trophy, Target 
} from "lucide-react"
import type { Channel, ChannelListItem, StudySquad } from "@/services/types/community"
import { useCommunityChannels } from "@/hooks/useCommunityChannels"
import { cn } from "@/lib/utils"

interface ChannelsShellProps {
  userId: string
  universityId?: string
}

const tabConfig = [
  { id: 'all', label: 'All Channels', icon: Hash, color: 'text-indigo-400' },
  { id: 'track', label: 'Track Channels', icon: Target, color: 'text-emerald-400' },
  { id: 'squads', label: 'Study Squads', icon: Users, color: 'text-purple-400' },
  { id: 'recommended', label: 'Recommended', icon: Star, color: 'text-amber-400' },
]

export function ChannelsShell({ userId, universityId }: ChannelsShellProps) {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showCreateSquad, setShowCreateSquad] = useState(false)
  
  const { 
    channels, 
    squads, 
    loading, 
    joinChannel, 
    leaveChannel,
    joinSquad,
    leaveSquad,
    createChannel,
    createSquad,
    refetch
  } = useCommunityChannels(userId, universityId)
  
  // Filter channels/squads based on search
  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredSquads = squads.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.goal?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Filter by type for track channels
  const trackChannels = filteredChannels.filter(c => c.channel_type === 'track')
  
  // Recommended based on user's track/circle (placeholder)
  const recommendedChannels = filteredChannels.filter(c => !c.is_member).slice(0, 6)
  const recommendedSquads = filteredSquads.filter(s => !s.is_member && s.is_open).slice(0, 4)

  const handleJoinChannel = useCallback(async (channelId: string) => {
    await joinChannel(channelId)
  }, [joinChannel])

  const handleJoinSquad = useCallback(async (squadId: string) => {
    await joinSquad(squadId)
  }, [joinSquad])

  const handleCreateChannel = useCallback(async (data: any) => {
    await createChannel(data)
    setShowCreateChannel(false)
  }, [createChannel])

  const handleCreateSquad = useCallback(async (data: any) => {
    await createSquad(data)
    setShowCreateSquad(false)
  }, [createSquad])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-slate-900/70 border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Channels & Squads
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Join topic channels and study squads to collaborate with peers
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-slate-800/50 border-slate-700/50 focus:border-indigo-500/50"
                />
              </div>
              
              {/* Create buttons */}
              <Button
                onClick={() => setShowCreateChannel(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Channel
              </Button>
              <Button
                onClick={() => setShowCreateSquad(true)}
                variant="outline"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              >
                <Users className="w-4 h-4 mr-2" />
                New Squad
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="container mx-auto px-4 pt-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-slate-900/50 backdrop-blur-xl rounded-2xl p-2 border border-slate-800/50">
          {tabConfig.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex items-center gap-2 py-3 rounded-xl transition-all",
                "data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/20 data-[state=active]:to-purple-500/20",
                "data-[state=active]:border data-[state=active]:border-indigo-500/30"
              )}
            >
              <tab.icon className={cn("w-4 h-4", tab.color)} />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All Channels */}
        <TabsContent value="all" className="py-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <LoadingGrid />
            ) : filteredChannels.length === 0 ? (
              <EmptyState
                icon={Hash}
                title="No channels yet"
                description="Create a channel to start collaborating with your university peers"
                action={() => setShowCreateChannel(true)}
                actionLabel="Create Channel"
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredChannels.map((channel, index) => (
                  <motion.div
                    key={channel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ChannelCard
                      channel={channel}
                      onJoin={handleJoinChannel}
                      onLeave={leaveChannel}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Track Channels */}
        <TabsContent value="track" className="py-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <LoadingGrid />
            ) : trackChannels.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No track channels"
                description="Track channels are created for specific learning tracks like DFIR, Cloud Security, etc."
                action={() => setShowCreateChannel(true)}
                actionLabel="Create Track Channel"
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {trackChannels.map((channel, index) => (
                  <motion.div
                    key={channel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ChannelCard
                      channel={channel}
                      onJoin={handleJoinChannel}
                      onLeave={leaveChannel}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Study Squads */}
        <TabsContent value="squads" className="py-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <LoadingGrid />
            ) : filteredSquads.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No study squads"
                description="Create a squad to collaborate with 4-8 peers on missions and goals"
                action={() => setShowCreateSquad(true)}
                actionLabel="Create Squad"
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredSquads.map((squad, index) => (
                  <motion.div
                    key={squad.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SquadCard
                      squad={squad}
                      onJoin={handleJoinSquad}
                      onLeave={leaveSquad}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Recommended */}
        <TabsContent value="recommended" className="py-8 space-y-8">
          {/* Recommended Channels */}
          {recommendedChannels.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-slate-100">Recommended Channels</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedChannels.map((channel, index) => (
                  <motion.div
                    key={channel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ChannelCard
                      channel={channel}
                      onJoin={handleJoinChannel}
                      onLeave={leaveChannel}
                      highlighted
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Squads */}
          {recommendedSquads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-slate-100">Open Squads to Join</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedSquads.map((squad, index) => (
                  <motion.div
                    key={squad.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SquadCard
                      squad={squad}
                      onJoin={handleJoinSquad}
                      onLeave={leaveSquad}
                      highlighted
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {recommendedChannels.length === 0 && recommendedSquads.length === 0 && (
            <EmptyState
              icon={Star}
              title="All caught up!"
              description="You've joined all available channels and squads. Check back later for new ones."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AnimatePresence>
        {showCreateChannel && (
          <CreateChannelModal
            onClose={() => setShowCreateChannel(false)}
            onCreate={handleCreateChannel}
          />
        )}
        {showCreateSquad && (
          <CreateSquadModal
            onClose={() => setShowCreateSquad(false)}
            onCreate={handleCreateSquad}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Loading Grid
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-48 bg-slate-800/30 rounded-2xl animate-pulse"
        />
      ))}
    </div>
  )
}

// Empty State
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
}: {
  icon: React.ElementType
  title: string
  description: string
  action?: () => void
  actionLabel?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-slate-600" />
      </div>
      <h3 className="text-xl font-semibold text-slate-300 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-md mb-6">{description}</p>
      {action && actionLabel && (
        <Button
          onClick={action}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}

