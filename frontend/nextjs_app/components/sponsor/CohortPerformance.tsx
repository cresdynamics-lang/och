'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  ChevronRight,
  Target,
  Calendar
} from 'lucide-react';
import type { CohortPerformanceProps, Cohort } from '@/types/sponsor';
import { RISK_LEVEL_CONFIG } from '@/types/sponsor';
import { useSponsorActions } from '@/hooks/useSponsorDashboard';
import CohortDetailsModal from './CohortDetailsModal';
import { useState } from 'react';

export default function CohortPerformance({ cohorts }: CohortPerformanceProps) {
  const { requestSupport } = useSponsorActions('mtn'); // TODO: Pass orgId dynamically
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRequestSupport = async (cohort: Cohort) => {
    try {
      await requestSupport(cohort.cohortId, 'readiness', `Requesting support for ${cohort.name} cohort`);
      // Show success message
      console.log('Support request submitted for cohort:', cohort.name);
    } catch (error) {
      console.error('Failed to request support:', error);
    }
  };

  const handleViewDetails = (cohort: Cohort) => {
    setSelectedCohort(cohort);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCohort(null);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRiskConfig = (riskLevel: Cohort['riskLevel']) => {
    return RISK_LEVEL_CONFIG[riskLevel];
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Cohort Performance
            </CardTitle>
            <p className="text-slate-400 mt-1">
              Monitor your sponsored cohorts and track student progress
            </p>
          </div>
          <Badge variant="outline" className="border-slate-600 text-slate-300">
            {cohorts.length} Cohorts
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {cohorts.map((cohort) => {
          const riskConfig = getRiskConfig(cohort.riskLevel);
          const utilizationRate = (cohort.seatsUsed / cohort.seatsSponsored) * 100;

          return (
            <Card key={cohort.cohortId} className="bg-slate-800/50 border-slate-600">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Cohort Info */}
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-white">
                          {cohort.name}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {cohort.institution}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(cohort.startDate)}
                            {cohort.endDate && ` - ${formatDate(cohort.endDate)}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${riskConfig.bgColor} ${riskConfig.borderColor} ${riskConfig.textColor} border`}
                          aria-label={`Cohort risk level: ${riskConfig.label}`}
                        >
                          {riskConfig.label}
                        </Badge>
                        {cohort.riskLevel !== 'on_track' && (
                          <AlertTriangle className={`w-4 h-4 ${riskConfig.textColor}`} />
                        )}
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-lg font-semibold text-white">
                          {cohort.seatsUsed}/{cohort.seatsSponsored}
                        </div>
                        <div className="text-xs text-slate-400">Seats Used</div>
                        <Progress
                          value={utilizationRate}
                          className="mt-2 h-1"
                        />
                      </div>

                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-lg font-semibold text-blue-400">
                          {formatPercentage(cohort.avgReadiness)}
                        </div>
                        <div className="text-xs text-slate-400">Avg Readiness</div>
                        <Progress
                          value={cohort.avgReadiness * 100}
                          className="mt-2 h-1"
                        />
                      </div>

                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-lg font-semibold text-green-400">
                          {formatPercentage(cohort.placementRate)}
                        </div>
                        <div className="text-xs text-slate-400">Placement Rate</div>
                      </div>

                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-lg font-semibold text-cyan-400">
                          {cohort.hired}
                        </div>
                        <div className="text-xs text-slate-400">Hired</div>
                      </div>
                    </div>

                    {/* Readiness Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Readiness Progress</span>
                        <span className="text-slate-300">
                          {formatPercentage(cohort.avgReadiness)} / {formatPercentage(cohort.readinessTarget)}
                        </span>
                      </div>
                      <div className="relative">
                        <Progress
                          value={cohort.avgReadiness * 100}
                          className="h-2"
                        />
                        <div
                          className="absolute top-0 h-2 bg-yellow-500/50 rounded-full"
                          style={{
                            width: `${cohort.readinessTarget * 100}%`,
                            opacity: 0.3
                          }}
                        />
                      </div>
                    </div>

                    {/* Placement Funnel */}
                    <div className="space-y-2">
                      <div className="text-sm text-slate-400">Placement Pipeline</div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-slate-300">Applied: {cohort.applied}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-slate-300">Interviewing: {cohort.interviewing}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-slate-300">Offers: {cohort.offers}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                          <span className="text-slate-300">Hired: {cohort.hired}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:w-48 space-y-3">
                    <Button
                      onClick={() => handleViewDetails(cohort)}
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                      aria-label={`View detailed information for ${cohort.name} cohort`}
                    >
                      <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
                      View Details
                    </Button>

                    {cohort.riskLevel !== 'on_track' && (
                      <Button
                        onClick={() => handleRequestSupport(cohort)}
                        variant="outline"
                        className="w-full border-orange-600 text-orange-400 hover:bg-orange-500/10"
                        aria-label={`Request support for ${cohort.name} cohort due to ${cohort.riskLevel.replace('_', ' ')} status`}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" aria-hidden="true" />
                        Request Support
                      </Button>
                    )}

                    <div className="text-xs text-slate-500 text-center">
                      Last updated: {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {cohorts.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Cohorts Found</h3>
            <p className="text-slate-400">
              Your sponsored cohorts will appear here once they begin.
            </p>
          </div>
        )}

        {/* Cohort Details Modal */}
        <CohortDetailsModal
          cohort={selectedCohort}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onRequestSupport={handleRequestSupport}
        />
      </CardContent>
    </Card>
  );
}
