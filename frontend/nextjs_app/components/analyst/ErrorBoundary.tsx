'use client';

import React from 'react';
import { DashboardSkeleton } from './DashboardSkeleton';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  skeleton?: 'full' | 'component';
}

export class AnalystErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analyst Dashboard Error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
          <div className="text-red-400 font-semibold mb-2">Dashboard Error</div>
          <div className="text-red-300 text-sm mb-4">
            Something went wrong loading the analyst dashboard.
          </div>
          <button
            onClick={this.resetError}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
export const AnalystErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
  <div className="bg-och-steel-grey/30 rounded-lg p-6 text-center">
    <div className="text-och-signal-orange font-semibold mb-2">⚠️ Component Error</div>
    <div className="text-och-steel-grey text-sm mb-4">
      {error.message || 'An error occurred while loading this component.'}
    </div>
    <button
      onClick={resetError}
      className="px-4 py-2 bg-och-defender-blue/20 hover:bg-och-defender-blue/30 text-och-defender-blue rounded transition-colors"
      aria-label="Retry loading component"
    >
      Reload Component
    </button>
  </div>
);

// Specialized error boundary for dashboard components with skeletons
export const DashboardErrorBoundary = ({
  children,
  skeleton = 'component'
}: {
  children: React.ReactNode;
  skeleton?: 'full' | 'component';
}) => (
  <AnalystErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="space-y-4">
        <DashboardSkeleton variant={skeleton} />
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
          <div className="text-red-400 font-medium mb-2">Failed to Load</div>
          <div className="text-red-300 text-sm mb-4">{error.message}</div>
          <button
            onClick={resetError}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
          >
            Reload Component
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </AnalystErrorBoundary>
);
