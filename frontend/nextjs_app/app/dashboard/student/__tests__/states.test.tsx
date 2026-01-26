/**
 * Loading/Error/Empty States Test
 */
import { render, screen, waitFor } from '@testing-library/react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { EmptyState } from '../components/EmptyState'
import { DashboardSkeleton } from '../components/DashboardSkeleton'

describe('Component States', () => {
  it('should render loading skeleton', () => {
    render(<DashboardSkeleton />)
    
    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it('should render error boundary', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  })

  it('should render empty state', () => {
    render(
      <EmptyState
        title="No items"
        description="Add your first item"
        actionLabel="Add Item"
        onAction={() => {}}
      />
    )

    expect(screen.getByText(/No items/i)).toBeInTheDocument()
    expect(screen.getByText(/Add Item/i)).toBeInTheDocument()
  })
})

