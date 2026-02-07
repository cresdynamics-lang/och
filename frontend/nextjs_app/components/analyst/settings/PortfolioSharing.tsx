'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Eye, Download, Building2, UserCheck } from 'lucide-react';
import { AutoResumeGenerator } from '../AutoResumeGenerator';

interface PortfolioSharingProps {
  portfolio: {
    publicProfile: boolean;
    viewsThisWeek: number;
    employerShare: Array<{
      company: string;
      enabled: boolean;
      views: number;
    }>;
    mentorShare: {
      enabled: boolean;
      mentorId?: string;
      mentorName?: string;
    };
    resumeUrl: string | null;
    resumeExpiry: string | null;
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const PortfolioSharing = ({ portfolio, userId, onUpdate }: PortfolioSharingProps) => {
  const handleTogglePublic = async (enabled: boolean) => {
    await onUpdate({ publicProfile: enabled });
  };

  const handleToggleEmployer = async (company: string, enabled: boolean) => {
    const updated = portfolio.employerShare.map(e =>
      e.company === company ? { ...e, enabled } : e
    );
    await onUpdate({ employerShare: updated });
  };

  const handleToggleMentor = async (enabled: boolean) => {
    await onUpdate({ mentorShare: { ...portfolio.mentorShare, enabled } });
  };

  return (
    <div className="space-y-6">
      {/* Public Profile Toggle */}
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-och-defender-blue" />
            <span className="font-medium">Public Portfolio</span>
          </div>
          <div className="text-sm text-och-steel-grey">
            {portfolio.viewsThisWeek} views this week
          </div>
        </div>
        <Switch
          checked={portfolio.publicProfile}
          onCheckedChange={handleTogglePublic}
        />
      </div>

      {/* Employer Sharing */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-och-defender-blue" />
          Employer Sharing
        </h4>
        <div className="space-y-2">
          {portfolio.employerShare.map((employer) => (
            <div
              key={employer.company}
              className="flex items-center justify-between p-3 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-och-defender-blue/20 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-och-defender-blue">
                    {employer.company.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{employer.company}</div>
                  <div className="text-sm text-och-steel-grey">
                    {employer.views} view{employer.views !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <Switch
                checked={employer.enabled}
                onCheckedChange={(enabled) => handleToggleEmployer(employer.company, enabled)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mentor Sharing */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-och-defender-blue" />
          Mentor Sharing
        </h4>
        <div className="flex items-center justify-between p-3 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
          <div>
            <div className="font-medium">
              {portfolio.mentorShare.mentorName || 'No mentor assigned'}
            </div>
            <div className="text-sm text-och-steel-grey">
              Share your portfolio with assigned mentor
            </div>
          </div>
          <Switch
            checked={portfolio.mentorShare.enabled}
            onCheckedChange={handleToggleMentor}
            disabled={!portfolio.mentorShare.mentorId}
          />
        </div>
      </div>

      {/* Resume Generator */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Download className="w-5 h-5 text-och-defender-blue" />
          Resume PDF
        </h4>
        <AutoResumeGenerator
          userId={userId}
          readinessBadge="ready"
          resumeUrl={portfolio.resumeUrl}
          resumeExpiry={portfolio.resumeExpiry}
          onGenerate={async () => {
            // Resume generation handled by AutoResumeGenerator
          }}
        />
      </div>
    </div>
  );
};

