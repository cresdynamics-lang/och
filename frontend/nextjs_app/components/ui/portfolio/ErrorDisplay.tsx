/**
 * Error Display Component
 * User-friendly error messages
 */

'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ErrorDisplayProps {
  error: Error | string | null;
  onRetry?: () => void;
  title?: string;
}

export function ErrorDisplay({ error, onRetry, title = 'Something went wrong' }: ErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Card className="border-red-500/50 bg-red-500/5">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-400 mb-2">{title}</h3>
            <p className="text-slate-300 mb-4">{errorMessage}</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

