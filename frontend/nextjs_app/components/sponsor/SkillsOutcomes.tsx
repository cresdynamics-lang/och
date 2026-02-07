'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  BookOpen,
  Target,
  TrendingUp,
  Award,
  Zap,
  Clock,
  Star
} from 'lucide-react';
import type { SkillsOutcomesProps } from '@/types/sponsor';
import { TRACK_CONFIG } from '@/types/sponsor';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SkillsOutcomes({ skills }: SkillsOutcomesProps) {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDays = (days: number) => {
    if (days < 30) {
      return `${days} days`;
    }
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Skills Section */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Top Skills Your Funding Unlocked
          </CardTitle>
          <p className="text-slate-400">
            Critical cybersecurity competencies developed through your investment
          </p>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {skills.topSkills.map((skill, index) => (
              <div key={skill.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-lg">
                      <span className="text-sm font-semibold text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{skill.name}</h4>
                      <p className="text-xs text-slate-400">
                        Completion Rate: {formatPercentage(skill.completionRate)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={skill.completionRate >= 0.8 ? 'defender' : skill.completionRate >= 0.6 ? 'steel' : 'orange'}
                    className="text-xs"
                  >
                    {skill.completionRate >= 0.8 ? 'Excellent' : skill.completionRate >= 0.6 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </div>
                <Progress
                  value={skill.completionRate * 100}
                  className="h-2"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">
                Your investment directly enables these critical skills
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Track Performance Section */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Track Performance & Proficiency
          </CardTitle>
          <p className="text-slate-400">
            How quickly your sponsored students achieve job-ready proficiency
          </p>
        </CardHeader>

        <CardContent>
          {/* Track Readiness Chart */}
          <div className="mb-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skills.tracks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="trackName"
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  label={{ value: 'Readiness %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                  labelStyle={{ color: '#f9fafb' }}
                />
                <Bar
                  dataKey="avgReadiness"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skills.tracks.map((track) => {
              const trackConfig = TRACK_CONFIG[track.trackKey as keyof typeof TRACK_CONFIG];
              const isHighPerforming = track.avgReadiness >= 0.75;
              const isFastTrack = track.avgTimeToProficiencyDays <= 50;

              return (
                <Card key={track.trackKey} className="bg-slate-800/50 border-slate-600">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Track Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: trackConfig.color }}
                          >
                            {track.trackName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">{track.trackName}</h4>
                            <p className="text-xs text-slate-400">Career Track</p>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          {isHighPerforming && (
                            <Badge variant="defender" className="text-xs">
                              High Readiness
                            </Badge>
                          )}
                          {isFastTrack && (
                            <Badge variant="steel" className="text-xs">
                              Fast Track
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Readiness Score */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Avg Readiness</span>
                          <span className="text-white font-medium">
                            {formatPercentage(track.avgReadiness)}
                          </span>
                        </div>
                        <Progress
                          value={track.avgReadiness * 100}
                          className="h-2"
                        />
                      </div>

                      {/* Time to Proficiency */}
                      <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm text-slate-400">Time to Proficiency</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-cyan-400">
                            {formatDays(track.avgTimeToProficiencyDays)}
                          </div>
                          <div className="text-xs text-slate-500">avg completion</div>
                        </div>
                      </div>

                      {/* Performance Indicator */}
                      <div className="flex items-center gap-2 text-sm">
                        {isHighPerforming ? (
                          <>
                            <Award className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Excellent outcomes</span>
                          </>
                        ) : track.avgReadiness >= 0.6 ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-400">Good progress</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-400">Room for improvement</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-600">
              <div className="text-2xl font-bold text-white mb-1">
                {formatPercentage(
                  skills.tracks.reduce((acc, track) => acc + track.avgReadiness, 0) / skills.tracks.length
                )}
              </div>
              <div className="text-sm text-slate-400">Overall Readiness</div>
            </div>

            <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-600">
              <div className="text-2xl font-bold text-cyan-400 mb-1">
                {formatDays(
                  Math.round(
                    skills.tracks.reduce((acc, track) => acc + track.avgTimeToProficiencyDays, 0) / skills.tracks.length
                  )
                )}
              </div>
              <div className="text-sm text-slate-400">Avg Proficiency Time</div>
            </div>

            <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-600">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {skills.topSkills.filter(skill => skill.completionRate >= 0.8).length}
              </div>
              <div className="text-sm text-slate-400">Skills at 80%+ Completion</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
