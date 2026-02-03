'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CardEnhanced, CardContent } from '@/components/ui/card-enhanced';
import { Download, Mail, Share, Calendar, Plus, FileText } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/utils/fetcher';
import { ReportCard } from './ReportCard';
import { useAuditLog } from '@/hooks/useAuditLog';

interface Report {
  id: string;
  type: 'daily' | 'weekly' | 'lab' | 'custom';
  title: string;
  generatedAt?: string;
  status: 'ready' | 'generating' | 'expired';
  size?: string;
  shareable?: boolean;
  metrics?: {
    readiness?: number;
    cohortAvg?: number;
    mttr?: number;
    accuracy?: number;
    sponsorValue?: string;
  };
}

interface ReportsPanelProps {
  userId: string;
}

export const ReportsPanel = ({ userId }: ReportsPanelProps) => {
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    end: new Date()
  });

  const logAction = useAuditLog(userId);

  const { data: reports, error, isLoading, mutate } = useSWR<Report[]>(
    `/api/analyst/${userId}/reports`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const generateReport = async (type: Report['type'], format: 'pdf' | 'csv' = 'pdf') => {
    try {
      logAction('reports.generate', { type, format });

      const response = await fetch(`/api/analyst/${userId}/reports/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          dateRange: type === 'custom' ? selectedDateRange : undefined
        })
      });

      if (!response.ok) throw new Error('Report generation failed');

      const { downloadUrl } = await response.json();

      // Open download in new tab
      window.open(downloadUrl, '_blank');

      // Refresh reports list
      mutate();

      // Show success feedback
      alert(`✅ ${format.toUpperCase()} report generated successfully!\n\nThe report has been downloaded and is also available in your reports list.`);

      console.log(`${format.toUpperCase()} report generated successfully!`);
    } catch (error) {
      console.error('Report generation error:', error);
      alert('❌ Failed to generate report. Please try again.');
    }
  };

  const sendToMentor = async (type: Report['type']) => {
    try {
      logAction('reports.email_mentor', { type });

      await fetch(`/api/analyst/${userId}/reports/${type}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: 'mentor' })
      });

      alert('✅ Report sent to mentor successfully!\n\nYour mentor will receive the report via email.');
      console.log('Report sent to mentor successfully!');
    } catch (error) {
      console.error('Email error:', error);
      alert('❌ Failed to send email. Please try again.');
    }
  };

  const shareWithSponsor = async (type: Report['type']) => {
    try {
      logAction('reports.share_sponsor', { type });

      await fetch(`/api/analyst/${userId}/reports/${type}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorType: 'primary' })
      });

      alert('✅ Report shared with sponsor successfully!\n\nThe sponsor team will receive the report for ROI tracking and performance evaluation.');
      console.log('Report shared with sponsor successfully!');
    } catch (error) {
      console.error('Share error:', error);
      alert('❌ Failed to share report. Please try again.');
    }
  };

  // Group reports by type
  const reportsByType = {
    daily: reports?.find(r => r.type === 'daily'),
    weekly: reports?.find(r => r.type === 'weekly'),
    lab: reports?.find(r => r.type === 'lab')
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
          <div className="h-6 bg-och-defender-blue/30 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="px-4 py-3 flex-1 overflow-y-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <ReportCard key={i} actions={[]} isLoading={true} />
          ))}
        </div>
        <div className="p-4 border-t border-och-steel-grey/50">
          <div className="h-10 bg-och-sahara-gold/30 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-och-signal-orange mb-2">Reports Unavailable</h3>
        <p className="text-och-steel-grey text-sm mb-4">
          Unable to load reports. Please try again later.
        </p>
        <Button onClick={() => mutate()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
        <h3 className="font-inter text-xl font-bold text-och-defender-blue flex items-center gap-2">
          📋 REPORTS
        </h3>
        <div className="text-xs text-och-steel-grey uppercase tracking-wider">
          Export Center
        </div>
      </div>

      {/* Reports List */}
      <div className="px-4 py-3 flex-1 overflow-y-auto space-y-4">
        {/* Daily Digest */}
        <ReportCard
          report={reportsByType.daily}
          actions={[
            {
              icon: Download,
              label: 'PDF',
              onClick: () => generateReport('daily', 'pdf'),
              variant: 'outline'
            },
            {
              icon: Download,
              label: 'CSV',
              onClick: () => generateReport('daily', 'csv'),
              variant: 'outline'
            },
            {
              icon: Mail,
              label: 'EMAIL MENTOR',
              onClick: () => sendToMentor('daily'),
              variant: 'primary'
            }
          ]}
        />

        {/* Weekly Cohort */}
        <ReportCard
          report={reportsByType.weekly}
          badge="SPONSOR SHAREABLE"
          actions={[
            {
              icon: Download,
              label: 'PDF',
              onClick: () => generateReport('weekly', 'pdf'),
              variant: 'outline'
            },
            {
              icon: Download,
              label: 'CSV',
              onClick: () => generateReport('weekly', 'csv'),
              variant: 'outline'
            },
            {
              icon: Share,
              label: 'SHARE SPONSOR',
              onClick: () => shareWithSponsor('weekly'),
              variant: 'primary'
            }
          ]}
        />

        {/* Lab Performance */}
        <ReportCard
          report={reportsByType.lab}
          actions={[
            {
              icon: Download,
              label: 'PDF',
              onClick: () => generateReport('lab', 'pdf'),
              variant: 'outline'
            },
            {
              icon: Download,
              label: 'CSV',
              onClick: () => generateReport('lab', 'csv'),
              variant: 'outline'
            }
          ]}
        />

        {/* Custom Reports Section */}
        <CardEnhanced className="border-och-defender-blue/20 bg-och-defender-blue/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-och-defender-blue" />
              <span className="text-sm font-medium text-och-defender-blue">Custom Reports</span>
            </div>
            <div className="text-xs text-och-steel-grey mb-3">
              Generate reports for specific date ranges and metrics
            </div>
            <div className="text-xs text-och-cyber-mint">
              Available: Performance Analytics, Learning Progress, Career Insights
            </div>
          </CardContent>
        </CardEnhanced>
      </div>

      {/* Generate Custom Section */}
      <div className="p-4 border-t border-och-steel-grey/50 flex-shrink-0 bg-och-steel-grey/30">
        <div className="space-y-3">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-och-steel-grey" />
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                type="date"
                value={selectedDateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDateRange(prev => ({
                  ...prev,
                  start: new Date(e.target.value)
                }))}
                className="px-2 py-1 text-xs bg-och-midnight-black border border-och-steel-grey/50 rounded text-och-steel-grey"
              />
              <input
                type="date"
                value={selectedDateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDateRange(prev => ({
                  ...prev,
                  end: new Date(e.target.value)
                }))}
                className="px-2 py-1 text-xs bg-och-midnight-black border border-och-steel-grey/50 rounded text-och-steel-grey"
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            className="w-full bg-gradient-to-r from-och-sahara-gold to-och-signal-orange hover:from-och-sahara-gold/90 h-10 text-black font-medium"
            onClick={() => generateReport('custom', 'pdf')}
          >
            <Plus className="w-4 h-4 mr-2" />
            GENERATE CUSTOM REPORT
          </Button>
        </div>
      </div>
    </div>
  );
};