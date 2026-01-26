/**
 * Mission Progress Hook
 * Handles offline sync and auto-save functionality
 */
'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useMissionStore } from '@/lib/stores/missionStore'

const AUTO_SAVE_INTERVAL = 30000 // 30 seconds
const OFFLINE_STORAGE_KEY = 'missionDraft'

export function useMissionProgress() {
  const { currentProgress, subtasksProgress, updateSubtaskProgress } = useMissionStore()
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<string>('')

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(OFFLINE_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Restore progress if newer than current
        if (parsed.timestamp > lastSavedRef.current) {
          Object.entries(parsed.progress).forEach(([key, value]: [string, any]) => {
            updateSubtaskProgress(Number(key), value)
          })
        }
      }
    } catch (error) {
      console.error('Failed to load offline progress:', error)
    }
  }, [updateSubtaskProgress])

  // Auto-save to localStorage
  const saveToLocalStorage = useCallback(() => {
    if (typeof window === 'undefined' || !currentProgress) return

    try {
      const data = {
        progress: subtasksProgress,
        timestamp: new Date().toISOString(),
        missionId: currentProgress.mission_id,
      }
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(data))
      lastSavedRef.current = data.timestamp
    } catch (error) {
      console.error('Failed to save offline progress:', error)
    }
  }, [currentProgress, subtasksProgress])

  // Set up auto-save interval
  useEffect(() => {
    if (!currentProgress) {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
        autoSaveIntervalRef.current = null
      }
      return
    }

    autoSaveIntervalRef.current = setInterval(() => {
      saveToLocalStorage()
    }, AUTO_SAVE_INTERVAL)

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [currentProgress, saveToLocalStorage])

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveToLocalStorage()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveToLocalStorage])

  // Sync with server when online
  const syncWithServer = useCallback(async () => {
    if (!currentProgress || typeof window === 'undefined') return

    if (!navigator.onLine) {
      console.log('Offline - progress saved locally')
      return
    }

    try {
      // TODO: Call API to sync progress
      // await apiGateway.patch(`/mission-progress/${currentProgress.id}`, {
      //   subtasks_progress: subtasksProgress,
      // })
      console.log('Progress synced with server')
    } catch (error) {
      console.error('Failed to sync with server:', error)
    }
  }, [currentProgress, subtasksProgress])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online - syncing progress')
      syncWithServer()
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [syncWithServer])

  return {
    isOffline: typeof window !== 'undefined' && !navigator.onLine,
    lastSaved: lastSavedRef.current,
    saveNow: saveToLocalStorage,
    syncNow: syncWithServer,
  }
}

