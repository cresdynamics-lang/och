'use client'

import { QueryClient, QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { useState } from 'react'
import { ErrorBoundary as CustomErrorBoundary } from './components/ErrorBoundary'

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-dashboard-bg flex items-center justify-center p-6">
      <div className="glass-card p-6 text-center max-w-md w-full">
        <h3 className="text-lg font-bold text-white mb-2">Something went wrong</h3>
        <p className="text-och-steel mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
            throwOnError: false, // Don't throw errors, handle them gracefully
          },
          mutations: {
            throwOnError: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary FallbackComponent={ErrorFallback} onReset={reset}>
            <CustomErrorBoundary>
              {children}
            </CustomErrorBoundary>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </QueryClientProvider>
  )
}

