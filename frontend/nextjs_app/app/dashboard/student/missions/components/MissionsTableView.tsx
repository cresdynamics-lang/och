/**
 * Missions Table View Component
 * Displays missions in a tabular format with pagination, filtering, and locking
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Target,
  Shield,
  Zap,
  Award,
  Clock,
  Lock,
  ChevronRight,
  ChevronLeft,
  Eye,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Map,
  BookOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import clsx from 'clsx';

interface Mission {
  id: string;
  code: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'capstone';
  type?: string;
  estimated_time_minutes?: number;
  competency_tags?: string[];
  track_key?: string;
  status?: string;
  progress_percent?: number;
  ai_score?: number;
  submission_id?: string;
  artifacts_uploaded?: number;
  artifacts_required?: number;
  is_locked?: boolean;
  lock_reason?: string;
}

interface MissionsTableViewProps {
  missions: Mission[];
  loading?: boolean;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    has_next: boolean;
    has_previous: boolean;
  };
  onPageChange: (page: number) => void;
  studentTrack?: string;
  studentDifficulty?: string;
}

const TRACK_NAMES: Record<string, string> = {
  defender: 'Defender',
  offensive: 'Offensive',
  grc: 'GRC',
  innovation: 'Innovation',
  leadership: 'Leadership',
};

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced', 'capstone'] as const;

export function MissionsTableView({
  missions,
  loading,
  pagination,
  onPageChange,
  studentTrack,
  studentDifficulty = 'beginner',
}: MissionsTableViewProps) {
  const router = useRouter();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return {
          color: 'och-mint',
          bgClass: 'bg-och-mint/20',
          borderClass: 'border-och-mint/40',
          textClass: 'text-och-mint',
          icon: Shield,
          label: 'Beginner',
        };
      case 'intermediate':
        return {
          color: 'och-defender',
          bgClass: 'bg-och-defender/20',
          borderClass: 'border-och-defender/40',
          textClass: 'text-och-defender',
          icon: Target,
          label: 'Intermediate',
        };
      case 'advanced':
        return {
          color: 'och-orange',
          bgClass: 'bg-och-orange/20',
          borderClass: 'border-och-orange/40',
          textClass: 'text-och-orange',
          icon: Zap,
          label: 'Advanced',
        };
      case 'capstone':
        return {
          color: 'och-gold',
          bgClass: 'bg-och-gold/20',
          borderClass: 'border-och-gold/40',
          textClass: 'text-och-gold',
          icon: Award,
          label: 'Capstone',
        };
      default:
        return {
          color: 'och-steel',
          bgClass: 'bg-och-steel/20',
          borderClass: 'border-och-steel/40',
          textClass: 'text-och-steel',
          icon: Shield,
          label: difficulty,
        };
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'not_started') {
      return <Badge variant="steel" className="text-xs">Not Started</Badge>;
    }

    switch (status) {
      case 'approved':
      case 'completed':
        return <Badge variant="mint" className="text-xs">Approved</Badge>;
      case 'in_ai_review':
        return <Badge variant="defender" className="text-xs">AI Review</Badge>;
      case 'in_mentor_review':
        return <Badge variant="orange" className="text-xs">Mentor Review</Badge>;
      case 'submitted':
        return <Badge variant="steel" className="text-xs">Submitted</Badge>;
      case 'in_progress':
      case 'draft':
        return <Badge variant="defender" className="text-xs">In Progress</Badge>;
      case 'changes_requested':
      case 'failed':
        return <Badge variant="orange" className="text-xs">Changes Requested</Badge>;
      default:
        return <Badge variant="steel" className="text-xs">{status}</Badge>;
    }
  };

  const isMissionLocked = (mission: Mission): boolean => {
    // Lock if mission track doesn't match student track
    if (studentTrack && mission.track_key && mission.track_key !== studentTrack) {
      return true;
    }

    // Lock if difficulty is higher than student's current level
    const difficultyIndex = DIFFICULTY_LEVELS.indexOf(mission.difficulty);
    const studentIndex = DIFFICULTY_LEVELS.indexOf(studentDifficulty as typeof DIFFICULTY_LEVELS[number]);
    
    if (difficultyIndex > studentIndex) {
      return true;
    }

    return mission.is_locked || false;
  };

  const getLockReason = (mission: Mission): string => {
    if (studentTrack && mission.track_key && mission.track_key !== studentTrack) {
      return `This mission is for ${TRACK_NAMES[mission.track_key] || mission.track_key} track. Your track is ${TRACK_NAMES[studentTrack] || studentTrack}.`;
    }

    const difficultyIndex = DIFFICULTY_LEVELS.indexOf(mission.difficulty);
    const studentIndex = DIFFICULTY_LEVELS.indexOf(studentDifficulty as typeof DIFFICULTY_LEVELS[number]);
    
    if (difficultyIndex > studentIndex) {
      return `Complete more ${studentDifficulty} missions to unlock ${mission.difficulty} level missions.`;
    }

    return mission.lock_reason || 'This mission is currently locked.';
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleMissionClick = (mission: Mission) => {
    if (isMissionLocked(mission)) {
      return; // Don't navigate if locked
    }
    router.push(`/dashboard/student/missions/${mission.id}`);
  };

  const totalPages = Math.ceil(pagination.total / pagination.page_size);

  if (loading && missions.length === 0) {
    return (
      <Card className="p-12 bg-och-midnight/60 border border-och-steel/20 rounded-2xl">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-och-gold/10 flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-och-gold animate-pulse" />
          </div>
          <p className="text-och-steel font-medium">Loading missions...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Table Container */}
      <Card className="bg-och-midnight/60 border border-och-steel/20 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-och-steel/20">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-och-steel uppercase tracking-wider">
                  Mission
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-och-steel uppercase tracking-wider">
                  Track
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-och-steel uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-och-steel uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-och-steel uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-och-steel uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-4 text-center text-xs font-black text-och-steel uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-och-steel/10">
              {missions.map((mission, idx) => {
                const locked = isMissionLocked(mission);
                const difficultyConfig = getDifficultyConfig(mission.difficulty);
                const DifficultyIcon = difficultyConfig.icon;

                return (
                  <motion.tr
                    key={mission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={clsx(
                      'group hover:bg-white/5 transition-colors',
                      locked && 'opacity-60',
                      expandedRow === mission.id && 'bg-white/5'
                    )}
                  >
                    {/* Mission Title & Code */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          {mission.code && (
                            <p className="text-[10px] text-och-steel font-mono mb-1">{mission.code}</p>
                          )}
                          <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">
                            {mission.title}
                          </h3>
                          {expandedRow === mission.id && mission.description && (
                            <p className="text-xs text-och-steel mt-2 line-clamp-2">{mission.description}</p>
                          )}
                        </div>
                        {locked && (
                          <Lock className="w-4 h-4 text-och-steel shrink-0 mt-1" />
                        )}
                      </div>
                    </td>

                    {/* Track */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Map className="w-4 h-4 text-och-steel" />
                        <span className="text-xs text-white font-medium capitalize">
                          {mission.track_key ? (TRACK_NAMES[mission.track_key] || mission.track_key) : 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Difficulty */}
                    <td className="px-6 py-4">
                      <Badge
                        variant={difficultyConfig.color as any}
                        className="text-xs font-bold uppercase"
                      >
                        <DifficultyIcon className="w-3 h-3 mr-1" />
                        {difficultyConfig.label}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {getStatusBadge(mission.status)}
                    </td>

                    {/* Time */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-och-steel">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(mission.estimated_time_minutes)}</span>
                      </div>
                    </td>

                    {/* Progress */}
                    <td className="px-6 py-4">
                      {mission.progress_percent !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden min-w-[60px]">
                            <div
                              className="h-full bg-och-defender rounded-full transition-all"
                              style={{ width: `${mission.progress_percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-white font-bold min-w-[35px]">
                            {mission.progress_percent}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-och-steel">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {locked ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              // Show lock reason tooltip/modal
                              alert(getLockReason(mission));
                            }}
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => setExpandedRow(expandedRow === mission.id ? null : mission.id)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="defender"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleMissionClick(mission)}
                            >
                              {mission.status === 'not_started' || !mission.status ? (
                                <>
                                  <PlayCircle className="w-3 h-3 mr-1" />
                                  Start
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-3 h-3 mr-1" />
                                  Continue
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {missions.length === 0 && !loading && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-och-steel/10 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-och-steel" />
            </div>
            <h3 className="text-lg font-black text-white mb-2 uppercase">No Missions Found</h3>
            <p className="text-sm text-och-steel">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination.total > pagination.page_size && (
        <div className="flex items-center justify-between pt-4 border-t border-och-steel/20">
          <div className="text-sm text-och-steel font-medium">
            Showing <span className="text-white font-bold">
              {((pagination.page - 1) * pagination.page_size) + 1}
            </span> to{' '}
            <span className="text-white font-bold">
              {Math.min(pagination.page * pagination.page_size, pagination.total)}
            </span> of{' '}
            <span className="text-white font-bold">{pagination.total}</span> missions
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.has_previous || loading}
              className="text-xs"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'defender' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    disabled={loading}
                    className="text-xs min-w-[40px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.has_next || loading}
              className="text-xs"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}



