'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  User,
  Mail,
  Trophy,
  Clock,
  Target,
  Calendar,
  MessageSquare,
  Eye,
  ChevronRight
} from 'lucide-react';

interface TopTalent {
  id: string;
  name: string;
  email: string;
  readiness_score: number;
  track_completion_pct: number;
  top_skills: string[];
  cohort_rank: number;
  last_activity_days: number;
  mentor_sessions_completed: number;
  missions_completed: number;
}

interface TopTalentGridProps {
  talent: TopTalent[];
}

function getReadinessColor(score: number): string {
  if (score >= 90) return 'text-green-400 bg-green-500/20 border-green-500/30';
  if (score >= 80) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
  if (score >= 70) return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
  return 'text-red-400 bg-red-500/20 border-red-500/30';
}

function getReadinessLabel(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Strong';
  if (score >= 70) return 'Good';
  return 'Developing';
}

export function TopTalentGrid({ talent }: TopTalentGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {talent.map((student, index) => (
        <Card key={student.id} className="p-4 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all duration-200">
          {/* Header with Rank and Readiness */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Trophy className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">#{student.cohort_rank}</p>
                <p className="text-slate-400 text-xs">Rank</p>
              </div>
            </div>

            <Badge className={`${getReadinessColor(student.readiness_score)} text-xs px-2 py-1`}>
              {student.readiness_score}
            </Badge>
          </div>

          {/* Student Info */}
          <div className="mb-4">
            <h3 className="text-white font-semibold text-base mb-1">{student.name}</h3>
            <div className="flex items-center gap-1 text-slate-400 text-sm mb-2">
              <Mail className="w-3 h-3" />
              <span className="truncate">{student.email}</span>
            </div>

            <div className="text-xs text-slate-400 mb-2">
              {getReadinessLabel(student.readiness_score)} Readiness
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs">Track Completion</span>
              <span className="text-white text-xs font-medium">{student.track_completion_pct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-blue-500"
                style={{ width: `${student.track_completion_pct}%` }}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="mb-4">
            <p className="text-slate-400 text-xs mb-2">Top Skills</p>
            <div className="flex flex-wrap gap-1">
              {student.top_skills.slice(0, 3).map((skill, skillIndex) => (
                <Badge key={skillIndex} className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5">
                  {skill}
                </Badge>
              ))}
              {student.top_skills.length > 3 && (
                <Badge className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5">
                  +{student.top_skills.length - 3}
                </Badge>
              )}
            </div>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div>
              <div className="text-white font-semibold text-sm">{student.missions_completed}</div>
              <div className="text-slate-400 text-xs">Missions</div>
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{student.mentor_sessions_completed}</div>
              <div className="text-slate-400 text-xs">Mentor Sessions</div>
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{student.last_activity_days}d</div>
              <div className="text-slate-400 text-xs">Last Active</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-slate-400 border-slate-600 hover:text-white hover:border-slate-500"
            >
              <Eye className="w-3 h-3 mr-1" />
              View Profile
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Contact
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

