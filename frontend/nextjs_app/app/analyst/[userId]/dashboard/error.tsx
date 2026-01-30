'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function AnalystDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Analyst Dashboard Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-och-midnight-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="text-6xl">⚠️</div>

        {/* Error Title */}
        <div>
          <h1 className="text-2xl font-bold text-och-signal-orange mb-2">
            Dashboard Error
          </h1>
          <p className="text-och-steel-grey">
            Something went wrong loading your analyst dashboard.
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-och-steel-grey/30 p-4 rounded-lg text-left">
          <div className="text-sm text-och-steel-grey mb-2">Error Details:</div>
          <div className="text-xs font-mono text-och-signal-orange bg-och-midnight-black/50 p-2 rounded">
            {error.message || 'Unknown error occurred'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={reset}
            variant="defender"
            className="w-full"
          >
            Try Again
          </Button>

          <Button
            onClick={() => window.location.href = '/login/analyst'}
            variant="outline"
            className="w-full"
          >
            Back to Login
          </Button>
        </div>

        {/* Support Info */}
        <div className="text-xs text-och-steel-grey/70">
          If this problem persists, please contact OCH support with the error details above.
        </div>
      </div>
    </div>
  );
}
