'use client';

import useSWR from 'swr';
import { ANALYST_ENDPOINTS } from '@/lib/analyst-api';

interface ProgressShelfProps {
  userId: string;
}

export const ProgressShelf = ({ userId }: ProgressShelfProps) => {
  const { data: progress, error, isLoading } = useSWR(ANALYST_ENDPOINTS.progress(userId));

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center animate-pulse">
            <div className="h-8 bg-och-steel-grey/50 rounded mb-2 mx-auto w-16"></div>
            <div className="h-4 bg-och-steel-grey/30 rounded mx-auto w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center text-red-400">
        <div className="text-sm">Failed to load progress</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="text-center">
        <div className="text-2xl font-bold text-och-cyber-mint">
          {progress?.readiness || 0}%
        </div>
        <div className="text-och-steel-grey text-sm uppercase tracking-wide">
          SOC L1 Ready
        </div>
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-och-sahara-gold">
          {progress?.streak || 0} days
        </div>
        <div className="text-och-steel-grey text-sm uppercase tracking-wide">
          Streak
        </div>
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-och-defender-blue">
          {progress?.careerMatch || 0}%
        </div>
        <div className="text-och-steel-grey text-sm uppercase tracking-wide">
          Career Match
        </div>
      </div>
    </div>
  );
};
