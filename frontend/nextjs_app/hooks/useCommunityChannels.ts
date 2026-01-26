"use client"

import { useState, useEffect, useCallback } from "react"
import type { 
  Channel, 
  ChannelListItem, 
  StudySquad, 
  CreateChannelData, 
  CreateSquadData 
} from "@/services/types/community"

interface UseCommunityChannelsReturn {
  channels: Channel[]
  squads: StudySquad[]
  loading: boolean
  error: string | null
  joinChannel: (channelId: string) => Promise<void>
  leaveChannel: (channelId: string) => Promise<void>
  joinSquad: (squadId: string) => Promise<void>
  leaveSquad: (squadId: string) => Promise<void>
  createChannel: (data: CreateChannelData) => Promise<Channel | null>
  createSquad: (data: CreateSquadData) => Promise<StudySquad | null>
  refetch: () => Promise<void>
}

const API_BASE = '/api/community'

export function useCommunityChannels(
  userId: string, 
  universityId?: string
): UseCommunityChannelsReturn {
  const [channels, setChannels] = useState<Channel[]>([])
  const [squads, setSquads] = useState<StudySquad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChannels = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (universityId) params.set('university_id', universityId)
      
      const response = await fetch(`${API_BASE}/channels/?${params}`)
      if (!response.ok) throw new Error('Failed to fetch channels')
      
      const data = await response.json()
      // Handle both array and paginated response
      setChannels(Array.isArray(data) ? data : data.results || [])
    } catch (err: any) {
      console.error('Error fetching channels:', err)
      setError(err.message)
      setChannels([])
    }
  }, [universityId])

  const fetchSquads = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (universityId) params.set('university_id', universityId)
      
      const response = await fetch(`${API_BASE}/squads/?${params}`)
      if (!response.ok) throw new Error('Failed to fetch squads')
      
      const data = await response.json()
      setSquads(Array.isArray(data) ? data : data.results || [])
    } catch (err: any) {
      console.error('Error fetching squads:', err)
      setError(err.message)
      setSquads([])
    }
  }, [universityId])

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    await Promise.all([fetchChannels(), fetchSquads()])
    setLoading(false)
  }, [fetchChannels, fetchSquads])

  useEffect(() => {
    refetch()
  }, [refetch])

  // Join a channel
  const joinChannel = useCallback(async (channelId: string) => {
    try {
      const channel = channels.find(c => c.id === channelId)
      if (!channel) return
      
      const response = await fetch(`${API_BASE}/channels/${channel.slug}/join/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to join channel')
      }
      
      const data = await response.json()
      
      // Optimistically update local state
      setChannels(prev => prev.map(c => 
        c.id === channelId 
          ? { ...c, is_member: true, member_count: data.member_count || c.member_count + 1 }
          : c
      ))
    } catch (err: any) {
      console.error('Error joining channel:', err)
      throw err
    }
  }, [channels])

  // Leave a channel
  const leaveChannel = useCallback(async (channelId: string) => {
    try {
      const channel = channels.find(c => c.id === channelId)
      if (!channel) return
      
      const response = await fetch(`${API_BASE}/channels/${channel.slug}/leave/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to leave channel')
      }
      
      const data = await response.json()
      
      setChannels(prev => prev.map(c => 
        c.id === channelId 
          ? { ...c, is_member: false, member_count: data.member_count || Math.max(0, c.member_count - 1) }
          : c
      ))
    } catch (err: any) {
      console.error('Error leaving channel:', err)
      throw err
    }
  }, [channels])

  // Join a squad
  const joinSquad = useCallback(async (squadId: string) => {
    try {
      const response = await fetch(`${API_BASE}/squads/${squadId}/join/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to join squad')
      }
      
      const data = await response.json()
      
      setSquads(prev => prev.map(s => 
        s.id === squadId 
          ? { ...s, is_member: true, member_count: data.member_count || s.member_count + 1 }
          : s
      ))
    } catch (err: any) {
      console.error('Error joining squad:', err)
      throw err
    }
  }, [])

  // Leave a squad
  const leaveSquad = useCallback(async (squadId: string) => {
    try {
      const response = await fetch(`${API_BASE}/squads/${squadId}/leave/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to leave squad')
      }
      
      const data = await response.json()
      
      setSquads(prev => prev.map(s => 
        s.id === squadId 
          ? { ...s, is_member: false, user_role: undefined, member_count: data.member_count || Math.max(0, s.member_count - 1) }
          : s
      ))
    } catch (err: any) {
      console.error('Error leaving squad:', err)
      throw err
    }
  }, [])

  // Create a new channel
  const createChannel = useCallback(async (data: CreateChannelData): Promise<Channel | null> => {
    try {
      const response = await fetch(`${API_BASE}/channels/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create channel')
      }
      
      const newChannel = await response.json()
      setChannels(prev => [newChannel, ...prev])
      return newChannel
    } catch (err: any) {
      console.error('Error creating channel:', err)
      throw err
    }
  }, [])

  // Create a new squad
  const createSquad = useCallback(async (data: CreateSquadData): Promise<StudySquad | null> => {
    try {
      const response = await fetch(`${API_BASE}/squads/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create squad')
      }
      
      const newSquad = await response.json()
      setSquads(prev => [newSquad, ...prev])
      return newSquad
    } catch (err: any) {
      console.error('Error creating squad:', err)
      throw err
    }
  }, [])

  return {
    channels,
    squads,
    loading,
    error,
    joinChannel,
    leaveChannel,
    joinSquad,
    leaveSquad,
    createChannel,
    createSquad,
    refetch,
  }
}

