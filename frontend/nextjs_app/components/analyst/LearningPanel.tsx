'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { LearningContentPanel } from './LearningContentPanel';
import type { AnalystContent } from '@/types/analyst-content';

interface LearningPanelProps {
  userId: string;
}

// Skeleton Loader Component
const LearningSkeleton = () => (
  <div className="h-full flex flex-col overflow-hidden">
    {/* Header Skeleton */}
    <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
      <div className="h-6 bg-och-steel-grey/50 rounded w-24 mb-4 animate-pulse"></div>
      <div className="space-y-2">
        <div className="h-3 bg-och-steel-grey/50 rounded w-20 animate-pulse"></div>
        <div className="flex items-center gap-2">
          <div className="h-3 bg-och-steel-grey/50 rounded w-32 animate-pulse"></div>
          <div className="flex-1 h-2 bg-och-steel-grey/50 rounded-full animate-pulse"></div>
          <div className="h-3 bg-och-steel-grey/50 rounded w-8 animate-pulse"></div>
        </div>
      </div>
    </div>

    {/* Next Video Skeleton */}
    <div className="m-4 border border-och-defender-blue/20 bg-och-steel-grey/30 flex-shrink-0 rounded-lg">
      <div className="p-4 pt-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-och-steel-grey/50 rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-och-steel-grey/50 rounded w-3/4 mb-1 animate-pulse"></div>
            <div className="h-3 bg-och-steel-grey/50 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
        <div className="h-10 bg-och-defender-blue/50 rounded animate-pulse"></div>
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="px-4 flex-1 overflow-y-auto space-y-3">
      <div className="h-4 bg-och-steel-grey/50 rounded w-24 animate-pulse"></div>
      {[1, 2].map((i) => (
        <div key={i} className="bg-och-steel-grey/30 rounded-lg animate-pulse">
          <div className="p-4">
            <div className="h-4 bg-och-steel-grey/50 rounded w-full mb-2 animate-pulse"></div>
            <div className="h-3 bg-och-steel-grey/50 rounded w-2/3 mb-3 animate-pulse"></div>
            <div className="h-9 bg-och-steel-grey/50 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Empty State Component
const LearningEmptyState = () => (
  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
    <div className="text-6xl mb-4">📚</div>
    <h3 className="text-lg font-medium text-och-cyber-mint mb-2">Learning Dashboard</h3>
    <p className="text-och-steel-grey text-sm mb-4">
      Your learning journey begins here. Complete assessments to unlock the next level.
    </p>
  </div>
);

export const LearningPanel = ({ userId }: LearningPanelProps) => {
  const { data: content, error, isLoading, mutate } = useSWR<AnalystContent>(
    `/api/analyst/${userId}/content`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch content');
      return res.json();
    },
    { refreshInterval: 30000 }
  );

  if (isLoading) return <LearningSkeleton />;
  if (error || !content) return <LearningEmptyState />;

  return (
    <LearningContentPanel
      content={content}
      userId={userId}
      onContentUpdate={() => mutate()}
    />
  );
};
