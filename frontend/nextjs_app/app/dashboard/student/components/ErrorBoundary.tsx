'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="glass-card p-6 text-center">
          <h3 className="text-lg font-bold text-white mb-2">Something went wrong</h3>
          <p className="text-och-steel mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button variant="mint" onClick={this.handleRetry}>
            Try Again
          </Button>
        </Card>
      )
    }

    return this.props.children
  }
}

