'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  X,
  Users,
  Calendar,
  TrendingUp,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import type { Cohort } from '@/types/sponsor';
import { RISK_LEVEL_CONFIG } from '@/types/sponsor';

interface CohortDetailsModalProps {
  cohort: Cohort | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestSupport?: (cohortId: string) => void;
}

export default function CohortDetailsModal({
  cohort,
  isOpen,
  onClose,
  onRequestSupport
}: CohortDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'performance'>('overview');

  if (!cohort) return null;

  const riskConfig = RISK_LEVEL_CONFIG[cohort.riskLevel as keyof typeof RISK_LEVEL_CONFIG];

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

  // Mock student data for the cohort
  const mockStudents = [
    {
      id: '1',
      name: 'John Mwangi',
      readiness: 0.85,
      status: 'active',
      skillsCompleted: 12,
      totalSkills: 15,
      lastActivity: '2024-01-15'
    },
    {
      id: '2',
      name: 'Sarah Wanjiku',
      readiness: 0.92,
      status: 'active',
      skillsCompleted: 14,
      totalSkills: 15,
      lastActivity: '2024-01-14'
    },
    {
      id: '3',
      name: 'David Kiprop',
      readiness: 0.78,
      status: 'active',
      skillsCompleted: 11,
      totalSkills: 15,
      lastActivity: '2024-01-13'
    },
    {
      id: '4',
      name: 'Grace Achieng',
      readiness: 0.65,
      status: 'at_risk',
      skillsCompleted: 9,
      totalSkills: 15,
      lastActivity: '2024-01-10'
    }
  ];

  const handleRequestSupport = () => {
    if (onRequestSupport) {
      onRequestSupport(cohort.cohortId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              {cohort.name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>{cohort.institution}</span>
            <Badge
              className={`${riskConfig.bgColor} ${riskConfig.borderColor} ${riskConfig.textColor} border`}
            >
              {riskConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400">Enrollment</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {cohort.seatsUsed}/{cohort.seatsSponsored}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-400">Readiness</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {formatPercentage(cohort.avgReadiness)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">Placement</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {formatPercentage(cohort.placementRate)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-slate-400">Hired</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {cohort.hired}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'performance', label: 'Performance', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Cohort Timeline */}
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Cohort Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div className="w-0.5 h-8 bg-slate-600"></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">Start Date</div>
                        <div className="text-sm text-slate-400">{formatDate(cohort.startDate)}</div>
                      </div>
                    </div>

                    {cohort.endDate && (
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <div className="w-0.5 h-8 bg-slate-600"></div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">End Date</div>
                          <div className="text-sm text-slate-400">{formatDate(cohort.endDate)}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          cohort.riskLevel === 'on_track' ? 'bg-green-400' :
                          cohort.riskLevel === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">Current Status</div>
                        <div className="text-sm text-slate-400 capitalize">{cohort.riskLevel.replace('_', ' ')}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Readiness vs Target */}
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Readiness Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Current Readiness</div>
                        <div className="text-2xl font-bold text-white">
                          {formatPercentage(cohort.avgReadiness)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Target Readiness</div>
                        <div className="text-2xl font-bold text-blue-400">
                          {formatPercentage(cohort.readinessTarget)}
                        </div>
                      </div>
                    </div>
                    <Progress
                      value={cohort.avgReadiness * 100}
                      className="h-3"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>0%</span>
                      <span className="text-blue-400">{formatPercentage(cohort.readinessTarget)} Target</span>
                      <span>100%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Placement Pipeline */}
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Placement Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-xl font-bold text-blue-400 mb-1">{cohort.applied}</div>
                        <div className="text-xs text-slate-400">Applied</div>
                      </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-xl font-bold text-yellow-400 mb-1">{cohort.interviewing}</div>
                        <div className="text-xs text-slate-400">Interviewing</div>
                      </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-xl font-bold text-green-400 mb-1">{cohort.offers}</div>
                        <div className="text-xs text-slate-400">Offers</div>
                      </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-xl font-bold text-cyan-400 mb-1">{cohort.hired}</div>
                        <div className="text-xs text-slate-400">Hired</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Student Progress</h3>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    {mockStudents.length} Students
                  </Badge>
                </div>

                <div className="space-y-3">
                  {mockStudents.map((student) => (
                    <Card key={student.id} className="bg-slate-800/50 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-400">
                                {student.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-medium">{student.name}</div>
                              <div className="text-xs text-slate-400">
                                Skills: {student.skillsCompleted}/{student.totalSkills}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-semibold text-white mb-1">
                              {formatPercentage(student.readiness)}
                            </div>
                            <Badge
                              variant={student.status === 'active' ? 'defender' : 'orange'}
                              className="text-xs"
                            >
                              {student.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-3">
                          <Progress
                            value={student.readiness * 100}
                            className="h-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Completion Rate</div>
                        <div className="text-xl font-bold text-white">
                          {((cohort.seatsUsed / cohort.seatsSponsored) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Retention Rate</div>
                        <div className="text-xl font-bold text-green-400">95.2%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Avg. Session Time</div>
                        <div className="text-xl font-bold text-blue-400">2.4h</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Engagement Score</div>
                        <div className="text-xl font-bold text-cyan-400">8.7/10</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Risk Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cohort.riskLevel === 'at_risk' && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-medium">High Risk Factors</span>
                          </div>
                          <ul className="text-xs text-slate-300 mt-2 space-y-1 ml-6">
                            <li>• Low readiness progress vs target</li>
                            <li>• Below-average placement rate</li>
                            <li>• Limited student engagement</li>
                          </ul>
                        </div>
                      )}

                      {cohort.riskLevel === 'warning' && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-medium">Moderate Risk Factors</span>
                          </div>
                          <ul className="text-xs text-slate-300 mt-2 space-y-1 ml-6">
                            <li>• Readiness slightly below target</li>
                            <li>• Placement pipeline needs attention</li>
                          </ul>
                        </div>
                      )}

                      {cohort.riskLevel === 'on_track' && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">On Track Performance</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-2 ml-6">
                            Cohort is performing well with strong readiness and placement metrics.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            {cohort.riskLevel !== 'on_track' && (
              <Button
                onClick={handleRequestSupport}
                variant="outline"
                className="border-orange-600 text-orange-400 hover:bg-orange-500/10"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Request Support
              </Button>
            )}
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
