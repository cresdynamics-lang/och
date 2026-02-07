'use client';

import React from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/fetcher';
import { CareerPipelinePanel } from './CareerPipelinePanel';
import { AccessDenied } from './AccessDenied';
import type { CareerPipeline } from '@/types/analyst-career';

// Mock RBAC check (would be implemented with proper auth)
const hasRole = (user: any, role: string) => {
  return user?.role === role;
};

export const CareerPanel = ({ userId }: { userId: string }) => {
  const [user] = React.useState({ role: 'analyst', id: userId }); // Mock user

  // RBAC Check
  if (!hasRole(user, 'analyst')) {
    return (
      <AccessDenied
        requiredRole="analyst"
        feature="Career panel"
        onUpgrade={() => {
          // Would navigate to upgrade flow
          console.log('Redirecting to upgrade page...');
        }}
      />
    );
  }

  const { data, error, isLoading, mutate } = useSWR<CareerPipeline>(
    `/api/analyst/${userId}/career`,
    fetcher,
    { refreshInterval: 30000 }
  );


  if (isLoading) return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
        <div className="h-6 bg-och-defender-blue/30 rounded w-1/2 animate-pulse"></div>
      </div>
      <div className="px-4 py-3 space-y-3 flex-1">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="bg-och-steel-grey/30 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-och-steel-grey/50 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-och-steel-grey/40 rounded w-1/2 mb-3"></div>
            <div className="h-9 bg-och-defender-blue/30 rounded"></div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-och-steel-grey/50">
        <div className="h-10 bg-och-defender-blue/30 rounded animate-pulse"></div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-lg font-medium text-och-signal-orange mb-2">Career Data Unavailable</h3>
      <p className="text-och-steel-grey text-sm mb-4">
        Unable to load career matches. Please try again later.
      </p>
      <button onClick={() => mutate()} className="px-4 py-2 border border-och-steel-grey/30 rounded hover:bg-och-steel-grey/20">
        Retry
      </button>
    </div>
  );

  return (
    <CareerPipelinePanel
      career={data}
      userId={userId}
      onUpdate={() => mutate()}
    />
  );
};
