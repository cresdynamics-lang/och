/**
 * Error Boundary for Mission Dashboard Kanban
 * Catches errors and displays fallback UI
 */
'use client'

import { Component, ReactNode } from 'react'
import { ErrorDisplay } from './ErrorDisplay'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class MissionDashboardKanbanErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MissionDashboardKanban Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          error={this.state.error || 'An unexpected error occurred'}
          title="Mission Dashboard Error"
          onRetry={() => {
            this.setState({ hasError: false, error: null })
          }}
        />
      )
    }

    return this.props.children
  }
}

