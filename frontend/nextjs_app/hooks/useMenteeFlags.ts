'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import type { MenteeFlag } from '@/services/types/mentor'

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message
    if (typeof msg === 'string') return msg
  }
  return 'Unknown error'
}

export function useMenteeFlags(mentorId: string | undefined, params?: {
  status?: 'open' | 'acknowledged' | 'resolved' | 'all'
  severity?: 'low' | 'medium' | 'high' | 'critical'
}) {
  const [flags, setFlags] = useState<MenteeFlag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const status = params?.status
  const severity = params?.severity

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await mentorClient.getMenteeFlags(mentorId, { status: status as any, severity })
      setFlags(data)
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load flags')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId, status, severity])

  useEffect(() => {
    load()
  }, [load])

  const flagMentee = useCallback(async (data: {
    mentee_id: string
    flag_type: 'struggling' | 'at_risk' | 'needs_attention' | 'technical_issue'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
  }) => {
    if (!mentorId) return
    try {
      const newFlag = await mentorClient.flagMentee(mentorId, data)
      await load()
      return newFlag
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to flag mentee')
      throw err
    }
  }, [mentorId, load])

  const acknowledgeFlag = useCallback(async (flagId: string) => {
    if (!mentorId) return
    try {
      const updated = await mentorClient.updateMenteeFlag(flagId, { status: 'acknowledged' })
      await load()
      return updated
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to acknowledge flag')
      throw err
    }
  }, [mentorId, load])

  const resolveFlag = useCallback(async (flagId: string, resolution_notes?: string) => {
    if (!mentorId) return
    try {
      const updated = await mentorClient.updateMenteeFlag(flagId, { status: 'resolved', resolution_notes })
      await load()
      return updated
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to resolve flag')
      throw err
    }
  }, [mentorId, load])

  return { flags, isLoading, error, reload: load, flagMentee, acknowledgeFlag, resolveFlag }
}


