'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Building2,
  Users,
  Eye,
  MessageSquare,
  FileText,
  Download,
  UserPlus,
  TrendingUp,
  Target,
  Briefcase
} from 'lucide-react';
import type { EmployerSignalsProps } from '@/types/sponsor';
import { useSponsorExport, useSponsorActions } from '@/hooks/useSponsorDashboard';
import HRInvitationModal from './HRInvitationModal';
import { useState } from 'react';
import { FunnelChart, Funnel, LabelList, ResponsiveContainer } from 'recharts';

export default function EmployerSignals({ employers }: EmployerSignalsProps) {
  const { exportPlacements } = useSponsorExport('mtn'); // TODO: Pass orgId dynamically
  const { inviteHR } = useSponsorActions('mtn'); // TODO: Pass orgId dynamically
  const [isHRModalOpen, setIsHRModalOpen] = useState(false);

  const handleExportPlacements = async () => {
    try {
      const result = await exportPlacements();
      console.log('Placement report exported:', result);
      // In real app, this would trigger a download
    } catch (error) {
      console.error('Failed to export placement report:', error);
    }
  };

  const handleInviteHR = () => {
    setIsHRModalOpen(true);
  };

  const handleCloseHRModal = () => {
    setIsHRModalOpen(false);
  };

  const funnelStages = [
    {
      label: 'Profile Views',
      value: employers.signals.profileViews,
      icon: Eye,
      color: 'blue',
      description: 'Student profiles viewed by employers'
    },
    {
      label: 'Shortlists',
      value: employers.signals.shortlists,
      icon: Target,
      color: 'yellow',
      description: 'Students shortlisted for positions'
    },
    {
      label: 'Interviews',
      value: employers.signals.interviews,
      icon: MessageSquare,
      color: 'orange',
      description: 'Interview requests received'
    },
    {
      label: 'Offers',
      value: employers.signals.offers,
      icon: FileText,
      color: 'green',
      description: 'Job offers extended'
    },
    {
      label: 'Hires',
      value: employers.signals.hires,
      icon: Briefcase,
      color: 'cyan',
      description: 'Successful placements'
    }
  ];

  // Data for funnel chart
  const funnelData = funnelStages.map(stage => ({
    name: stage.label,
    value: stage.value,
    fill: `var(--${stage.color}-500)`
  }));

  const getConversionRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return (current / previous) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Employer Partners */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            Employer Partners
          </CardTitle>
          <p className="text-slate-400">
            Companies hiring your sponsored cybersecurity talent
          </p>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employers.partners.map((partner) => (
              <Card key={partner.name} className="bg-slate-800/50 border-slate-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm">{partner.name}</h4>
                        {partner.external && (
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                            External
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {partner.hiresFromThisSponsor}
                    </div>
                    <div className="text-xs text-slate-400">Hires from your cohorts</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-purple-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">
                {employers.partners.reduce((acc, partner) => acc + partner.hiresFromThisSponsor, 0)} total placements
                from {employers.partners.length} partner companies
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placement Signals Funnel */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Placement Signals
              </CardTitle>
              <p className="text-slate-400">
                Real-time hiring pipeline activity from your sponsored students
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleExportPlacements}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Report
              </Button>

              <Button
                onClick={handleInviteHR}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-400 hover:bg-blue-500/10"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite HR
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Funnel Chart */}
          <div className="mb-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                  animationBegin={0}
                  animationDuration={800}
                >
                  <LabelList
                    position="center"
                    fill="#fff"
                    stroke="none"
                    fontSize={12}
                    formatter={(value: number, entry: any) => `${entry.name}\n${value}`}
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {funnelStages.map((stage, index) => {
              const Icon = stage.icon;
              const previousValue = index > 0 ? funnelStages[index - 1].value : stage.value;
              const conversionRate = index > 0 ? getConversionRate(stage.value, previousValue) : 100;

              return (
                <div key={stage.label} className="relative">
                  {/* Connection line to next stage */}
                  {index < funnelStages.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-8 bg-gradient-to-b from-slate-600 to-slate-500" />
                  )}

                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className={`p-3 rounded-lg bg-${stage.color}-500/20 border border-${stage.color}-500/30`}>
                      <Icon className={`w-6 h-6 text-${stage.color}-400`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-medium">{stage.label}</h4>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white">
                            {stage.value.toLocaleString()}
                          </div>
                          {index > 0 && (
                            <div className="text-xs text-slate-400">
                              {conversionRate.toFixed(1)}% conversion
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-slate-400">{stage.description}</p>

                      {/* Progress bar for conversion */}
                      {index > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Conversion Rate</span>
                            <span>{conversionRate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full bg-${stage.color}-500`}
                              style={{ width: `${Math.min(conversionRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-600">
              <div className="text-lg font-bold text-blue-400">
                {((employers.signals.hires / employers.signals.profileViews) * 100).toFixed(2)}%
              </div>
              <div className="text-xs text-slate-400">Overall Conversion</div>
            </div>

            <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-600">
              <div className="text-lg font-bold text-green-400">
                {employers.signals.hires}
              </div>
              <div className="text-xs text-slate-400">Successful Hires</div>
            </div>

            <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-600">
              <div className="text-lg font-bold text-cyan-400">
                {employers.signals.offers}
              </div>
              <div className="text-xs text-slate-400">Active Offers</div>
            </div>

            <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-600">
              <div className="text-lg font-bold text-orange-400">
                {employers.signals.interviews}
              </div>
              <div className="text-xs text-slate-400">Interviews Scheduled</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HR Invitation Modal */}
      <HRInvitationModal
        isOpen={isHRModalOpen}
        onClose={handleCloseHRModal}
        sponsorName="MTN Group"
      />
    </div>
  );
}
