'use client';

import React from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/fetcher';

interface ProgressShelfMicroProps {
  userId: string;
}

interface ProgressData {
  readiness: number;
  streak: number;
  matchScore: number;
}

export const ProgressShelfMicro = ({ userId }: ProgressShelfMicroProps) => {
  const { data: progress, error, isLoading } = useSWR(
    `/api/analyst/${userId}/progress`,
    fetcher,
    { refreshInterval: 60000 }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 text-xs">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="h-4 bg-och-steel-grey/30 rounded animate-pulse mb-1"></div>
            <div className="h-3 bg-och-steel-grey/30 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-3 gap-3 text-xs text-och-steel-grey">
        <div className="text-center">82%</div>
        <div className="text-center">18m</div>
        <div className="text-center">91%</div>
      </div>
    );
  }

  const mockProgress: ProgressData = {
    readiness: 82,
    streak: 18,
    matchScore: 91
  };

  const displayProgress = progress || mockProgress;

  return (
    <div className="grid grid-cols-3 gap-3 text-xs">
      <div className="text-center">
        <div className="font-bold text-och-cyber-mint text-sm">
          {displayProgress.readiness}%
        </div>
        <div className="text-och-steel-grey uppercase tracking-wider">
          Ready
        </div>
      </div>

      <div className="text-center">
        <div className="font-bold text-och-sahara-gold text-sm">
          {displayProgress.streak}m
        </div>
        <div className="text-och-steel-grey uppercase tracking-wider">
          Streak
        </div>
      </div>

      <div className="text-center">
        <div className="font-bold text-och-signal-orange text-sm">
          {displayProgress.matchScore}%
        </div>
        <div className="text-och-steel-grey uppercase tracking-wider">
          Match
        </div>
      </div>
    </div>
  );
};
