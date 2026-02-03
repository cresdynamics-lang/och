'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CardEnhanced, CardContent } from '@/components/ui/card-enhanced';
import { Download, Share2, UserCheck, TrendingUp, Eye } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/utils/fetcher';
import { JobMatchCard } from './JobMatchCard';
import { AccessDenied } from './AccessDenied';
import { useAuditLog } from '@/hooks/useAuditLog';

interface CareerData {
  matches: Array<{
    id: string;
    employer: string;
    role: string;
    matchScore: number;
    deadline: string;
    status: 'open' | 'interview' | 'closed';
    tierRequired?: string;
    location?: string;
    salary?: string;
  }>;
  portfolio: {
    views: number;
    weeklyGrowth: number;
    employerViews: Record<string, number>;
    shares: number;
  };
  userTier: string;
}

// Mock RBAC check (would be implemented with proper auth)
const hasRole = (user: any, role: string) => {
  return user?.role === role;
};

export const CareerPanel = ({ userId }: { userId: string }) => {
  const [user] = useState({ role: 'analyst', id: userId }); // Mock user
  const logAction = useAuditLog(userId);

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

  const { data, error, isLoading, mutate } = useSWR<CareerData>(
    `/api/analyst/${userId}/career`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const handleApply = async (jobId: string) => {
    try {
      // 1-Click Apply: Portfolio + Resume → Employer
      const response = await fetch(`/api/career/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          autoIncludePortfolio: true,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Application failed');

      // Audit log
      logAction('career.apply', { jobId });

      // Optimistic update
      mutate();

      // Show success feedback
      alert(`✅ Application submitted successfully!\n\nYour portfolio and resume have been sent to the employer. You'll receive updates on the application status.`);

      console.log('Application sent successfully!');
    } catch (error) {
      console.error('Application error:', error);
      alert('❌ Failed to submit application. Please try again.');
    }
  };

  const handleViewDetails = (jobId: string) => {
    logAction('career.view_details', { jobId });
    // Could open modal with full job details
  };

  const handleDownloadResume = () => {
    logAction('career.resume.download');
    // 7-day expiry
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    window.open(`/api/analyst/${userId}/resume.pdf?expires=${expiry}`);
  };

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
      <Button onClick={() => mutate()} variant="outline">
        Retry
      </Button>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
        <h3 className="font-inter text-xl font-bold text-och-defender-blue flex items-center gap-2">
          🎯 CAREER
        </h3>
        <div className="text-xs text-och-steel-grey uppercase tracking-wider">
          SOC Job Pipeline
        </div>
      </div>

      {/* Job Matches */}
      <div className="px-4 py-3 grid grid-cols-2 gap-4 flex-1 overflow-y-auto">
        {data.matches.map((match) => {
          const isUrgent = match.status === 'interview' &&
            new Date(match.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000);

          return (
            <JobMatchCard
              key={match.id}
              match={match}
              onApply={handleApply}
              onViewDetails={handleViewDetails}
              userTier={data.userTier}
              isUrgent={isUrgent}
            />
          );
        })}
      </div>

      {/* Portfolio Analytics */}
      <CardEnhanced className="mx-4 mb-4 border-och-cyber-mint/20 bg-och-cyber-mint/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-och-sahara-gold mb-3 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>PORTFOLIO ANALYTICS</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-och-cyber-mint">
                {data.portfolio.views} views/wk
              </div>
              {data.portfolio.weeklyGrowth > 0 && (
                <div className="text-xs text-och-cyber-mint font-medium">
                  +{data.portfolio.weeklyGrowth} today
                </div>
              )}
            </div>

            <div className="text-xs text-och-steel-grey space-y-1">
              <div className="flex justify-between">
                <span>MTN HR:</span>
                <span className="text-och-cyber-mint">{data.portfolio.employerViews.mtn || 0} views</span>
              </div>
              <div className="flex justify-between">
                <span>Vodacom:</span>
                <span className="text-och-cyber-mint">{data.portfolio.employerViews.vodacom || 0} views</span>
              </div>
              <div className="flex justify-between">
                <span>Ecobank:</span>
                <span className="text-och-cyber-mint">{data.portfolio.employerViews.ecobank || 0} views</span>
              </div>
            </div>
          </div>
        </CardContent>
      </CardEnhanced>

      {/* Resume Download */}
      <div className="p-4 border-t border-och-steel-grey/50 flex-shrink-0">
        <Button
          className="w-full bg-gradient-to-r from-och-defender-blue to-och-cyber-mint hover:from-och-defender-blue/90 h-10 text-white font-medium"
          onClick={handleDownloadResume}
        >
          <Download className="w-4 h-4 mr-2" />
          GENERATE RESUME PDF
        </Button>
      </div>
    </div>
  );
};
