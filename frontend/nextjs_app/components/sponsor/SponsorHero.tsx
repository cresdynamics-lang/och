'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Download,
  FileText,
  TrendingUp,
  Users,
  Target,
  ArrowRight,
  Shield
} from 'lucide-react';
import type { SponsorHeroProps } from '@/types/sponsor';
import { useSponsorExport } from '@/hooks/useSponsorDashboard';

const SponsorHero = React.memo(function SponsorHero({ sponsor, summary }: SponsorHeroProps) {
  const { exportROI, exportCohorts } = useSponsorExport(sponsor.orgId);

  const handleExportROI = async () => {
    try {
      const result = await exportROI();
      // In a real app, this would trigger a download
      // For now, we'll just log it
      console.log('ROI PDF exported:', result);
      // You could use a library like file-saver to handle the download
      // saveAs(result.blob, `${sponsor.orgId}-roi-report.pdf`);
    } catch (error) {
      console.error('Failed to export ROI PDF:', error);
    }
  };

  const handleExportCohorts = async () => {
    try {
      const result = await exportCohorts();
      console.log('Cohort CSV exported:', result);
      // saveAs(result.blob, `${sponsor.orgId}-cohorts.csv`);
    } catch (error) {
      console.error('Failed to export cohort CSV:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: sponsor.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900/20 to-slate-900 border-slate-700">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <CardContent className="relative p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left Side - Sponsor Info & ROI */}
          <div className="flex-1 space-y-6">
            {/* Sponsor Header */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">{sponsor.name}</h1>
                  <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    OCH Partner
                  </Badge>
                </div>
                <p className="text-slate-300 text-lg">
                  Cybersecurity Training Investment Dashboard
                </p>
              </div>
            </div>

            {/* ROI Display */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-400 uppercase tracking-wide">
                  Investment
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className="text-sm text-slate-400 uppercase tracking-wide">
                  Value Created
                </div>
              </div>

              <div className="flex items-baseline gap-4">
                <div className="text-2xl font-semibold text-slate-300">
                  {formatCurrency(sponsor.totalSponsoredAmount)}
                </div>
                <ArrowRight className="w-6 h-6 text-blue-400" />
                <div className="text-4xl font-bold text-white">
                  {formatCurrency(summary.totalValueCreated)}
                </div>
                <div className="text-2xl font-semibold text-green-400">
                  {summary.roiMultiple.toFixed(1)}x ROI
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {formatPercentage(summary.avgReadiness)}
                </div>
                <div className="text-sm text-slate-400">Avg Readiness</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {formatPercentage(summary.placementRate)}
                </div>
                <div className="text-sm text-slate-400">Placement Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-1">
                  {summary.seatsUsed}/{summary.totalSeatsSponsored}
                </div>
                <div className="text-sm text-slate-400">Seats Utilized</div>
              </div>
            </div>

            {/* Status Update */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Updated {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="lg:w-80 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Export Reports</h3>

            <div className="space-y-3">
              <Button
                onClick={handleExportROI}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 h-12"
                size="lg"
                aria-label={`Download ROI PDF report showing ${formatCurrency(summary.totalValueCreated)} in value created`}
              >
                <Download className="w-5 h-5 mr-3" aria-hidden="true" />
                Download ROI PDF
                <span className="ml-auto text-sm opacity-80" aria-label={`${formatCurrency(summary.totalValueCreated)} total value created`}>
                  {formatCurrency(summary.totalValueCreated)}
                </span>
              </Button>

              <Button
                onClick={handleExportCohorts}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white h-12"
                size="lg"
                aria-label={`Export cohort data CSV file with ${summary.totalSeatsSponsored} total seats information`}
              >
                <FileText className="w-5 h-5 mr-3" aria-hidden="true" />
                Export Cohort CSV
                <span className="ml-auto text-sm opacity-80" aria-label={`${summary.totalSeatsSponsored} total seats sponsored`}>
                  {summary.totalSeatsSponsored} seats
                </span>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="pt-4 border-t border-slate-700">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-white">
                    {summary.totalSeatsSponsored}
                  </div>
                  <div className="text-xs text-slate-400">Total Seats</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-400">
                    {summary.roiMultiple.toFixed(1)}x
                  </div>
                  <div className="text-xs text-slate-400">ROI Multiple</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SponsorHero.displayName = 'SponsorHero';

export default SponsorHero;
