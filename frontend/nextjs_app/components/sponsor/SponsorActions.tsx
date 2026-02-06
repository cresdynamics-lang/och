'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingUp,
  AlertTriangle,
  Plus,
  MessageSquare,
  Star,
  Users,
  Award,
  DollarSign,
  CheckCircle,
  Clock
} from 'lucide-react';
import type { SponsorActionsProps } from '@/types/sponsor';
import { useSponsorActions } from '@/hooks/useSponsorDashboard';

export default function SponsorActions({ summary, actions, cohorts }: SponsorActionsProps) {
  const { increaseSeats, requestSupport } = useSponsorActions('mtn'); // TODO: Pass orgId dynamically

  const handleIncreaseSeats = async () => {
    try {
      await increaseSeats(actions.recommendedSeatIncrease, 'Based on current utilization and demand');
      console.log('Seat increase request submitted');
    } catch (error) {
      console.error('Failed to submit seat increase:', error);
    }
  };

  const handleRequestSupportForCohort = async (cohortId: string) => {
    try {
      await requestSupport(cohortId, 'readiness', 'Requesting support for at-risk cohort');
      console.log('Support request submitted for cohort:', cohortId);
    } catch (error) {
      console.error('Failed to request support:', error);
    }
  };

  const atRiskCohorts = cohorts.filter(cohort =>
    actions.atRiskCohorts.includes(cohort.cohortId)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Hardcoded success stories (as requested)
  const successStories = [
    {
      id: '1',
      title: 'SOC Analyst Success',
      description: '3 students from Nairobi Poly cohort now lead SOC analysts at MTN',
      impact: 'Reduced response time by 40%',
      icon: Award
    },
    {
      id: '2',
      title: 'Network Security Hire',
      description: 'KCB hired 2 graduates for their cybersecurity team',
      impact: 'Enhanced network protection',
      icon: Shield
    },
    {
      id: '3',
      title: 'Incident Response Team',
      description: 'Safaricom built dedicated incident response team from our talent pool',
      impact: '99.9% uptime maintained',
      icon: CheckCircle
    }
  ];

  return (
    <div className="space-y-6">
      {/* Seat Increase Recommendation */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Renew & Expand Investment
          </CardTitle>
          <p className="text-slate-400">
            Optimize your sponsorship impact with data-driven recommendations
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Utilization */}
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-white font-medium">Current Seat Utilization</h4>
                <p className="text-sm text-slate-400">
                  {summary.seatsUsed} of {summary.totalSeatsSponsored} seats used
                </p>
              </div>
              <Badge
                variant={summary.seatsUsed / summary.totalSeatsSponsored > 0.8 ? 'defender' : 'steel'}
                className="text-sm"
              >
                {((summary.seatsUsed / summary.totalSeatsSponsored) * 100).toFixed(1)}% utilized
              </Badge>
            </div>

            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(summary.seatsUsed / summary.totalSeatsSponsored) * 100}%` }}
              />
            </div>
          </div>

          {/* Recommendation */}
          {actions.recommendedSeatIncrease > 0 && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Plus className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Recommended: Add {actions.recommendedSeatIncrease} Seats</h4>
                    <p className="text-sm text-slate-400">
                      Based on utilization trends and placement demand
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-lg font-semibold text-white">
                    {actions.recommendedSeatIncrease}
                  </div>
                  <div className="text-xs text-slate-400">Additional Seats</div>
                </div>
                <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-lg font-semibold text-green-400">
                    {formatCurrency(actions.recommendedSeatIncrease * 45000)}
                  </div>
                  <div className="text-xs text-slate-400">Estimated Cost</div>
                </div>
                <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-400">
                    {summary.totalSeatsSponsored + actions.recommendedSeatIncrease}
                  </div>
                  <div className="text-xs text-slate-400">Total Capacity</div>
                </div>
              </div>

              <Button
                onClick={handleIncreaseSeats}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add {actions.recommendedSeatIncrease} Seats to Next Cohort
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* At-Risk Cohort Interventions */}
      {atRiskCohorts.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              At-Risk Cohorts Need Support
            </CardTitle>
            <p className="text-slate-400">
              These cohorts are behind schedule and could benefit from additional support
            </p>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {atRiskCohorts.map((cohort) => (
                <div key={cohort.cohortId} className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-medium">{cohort.name}</h4>
                      <p className="text-sm text-slate-400">{cohort.institution}</p>
                    </div>
                    <Badge variant="orange" className="text-xs">
                      {cohort.readinessTarget * 100 - cohort.avgReadiness * 100}% behind target
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-slate-400">Current Readiness</div>
                      <div className="text-lg font-semibold text-white">
                        {(cohort.avgReadiness * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Target Readiness</div>
                      <div className="text-lg font-semibold text-orange-400">
                        {(cohort.readinessTarget * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleRequestSupportForCohort(cohort.cohortId)}
                    variant="outline"
                    size="sm"
                    className="w-full border-orange-600 text-orange-400 hover:bg-orange-500/10"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Request Support for This Cohort
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Stories */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Success Stories
          </CardTitle>
          <p className="text-slate-400">
            Real impact from your cybersecurity talent investment
          </p>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {successStories.map((story) => {
              const Icon = story.icon;
              return (
                <div key={story.id} className="p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Icon className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-1">{story.title}</h4>
                      <p className="text-sm text-slate-400 mb-2">{story.description}</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-green-400 font-medium">{story.impact}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400">
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">
                Your sponsorship creates lasting impact in the cybersecurity ecosystem
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
