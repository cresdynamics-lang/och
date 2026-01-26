'use client'

import { useRealtimeUpdates } from '../lib/hooks/useRealtimeUpdates'

/**
 * WebSocket Simulator - Removed random data generation
 * Now only uses real-time updates from backend via useRealtimeUpdates hook
 */
export function WebSocketSimulator() {
  // Only use real-time updates from backend - no mock data
  useRealtimeUpdates()

  return null
}

