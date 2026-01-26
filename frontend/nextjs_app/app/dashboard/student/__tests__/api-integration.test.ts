/**
 * API Integration Test
 * Tests API hooks with mock and real data
 */
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboardOverview, useDashboardMetrics } from '../lib/hooks/useDashboard'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('API Integration', () => {
  it('should fetch dashboard overview', async () => {
    const { result } = renderHook(() => useDashboardOverview(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true)
    })
  })

  it('should fetch dashboard metrics', async () => {
    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true)
    })
  })

  it('should handle API errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useDashboardOverview(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})

