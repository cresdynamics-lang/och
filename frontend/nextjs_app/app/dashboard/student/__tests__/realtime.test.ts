/**
 * Real-time Updates Test
 * Tests WebSocket/SSE connection
 */
import { renderHook } from '@testing-library/react'
import { useRealtimeUpdates } from '../lib/hooks/useRealtimeUpdates'

describe('Real-time Updates', () => {
  beforeEach(() => {
    global.EventSource = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: jest.fn(),
      readyState: 1,
    })) as any
  })

  it('should establish SSE connection', () => {
    renderHook(() => useRealtimeUpdates())
    
    expect(global.EventSource).toHaveBeenCalled()
  })

  it('should handle connection errors', () => {
    const mockEventSource = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: jest.fn(),
      readyState: 2,
      onerror: null,
      onmessage: null,
    }

    ;(global.EventSource as jest.Mock).mockReturnValue(mockEventSource)

    renderHook(() => useRealtimeUpdates())
    
    expect(mockEventSource.addEventListener).toHaveBeenCalled()
  })

  it('should cleanup on unmount', () => {
    const mockClose = jest.fn()
    const mockEventSource = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: mockClose,
      readyState: 1,
    }

    ;(global.EventSource as jest.Mock).mockReturnValue(mockEventSource)

    const { unmount } = renderHook(() => useRealtimeUpdates())
    
    unmount()
    
    expect(mockClose).toHaveBeenCalled()
  })
})

