'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { curriculumClient } from '@/services/curriculumClient';
import {
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Award,
  Target,
} from 'lucide-react';
import clsx from 'clsx';

const TIER_LABELS: Record<number, string> = {
  0: 'Foundations',
  1: 'Foundations',
  2: 'Beginner',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Mastery',
  6: 'Cross-track',
  7: 'Missions',
  8: 'Ecosystem',
  9: 'Enterprise',
};

interface TrackReport {
  trackCode: string;
  trackName: string;
  tier: number;
  tierLabel: string;
  completionPercentage: number;
  modulesCompleted: number;
  lessonsCompleted: number;
  totalPoints: number;
  modules: Array<{
    id: string;
    title: string;
    level: string;
    lessonCount: number;
    completionPercentage: number;
    status: 'completed' | 'in_progress' | 'pending';
  }>;
}

interface ReportData {
  tracks: TrackReport[];
  totalPoints: number;
  totalTracksEnrolled: number;
  totalTracksCompleted: number;
  overallProgress: number;
  completedCount: number;
  pendingCount: number;
}

interface CurriculumProgressReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CurriculumProgressReportModal({
  open,
  onOpenChange,
}: CurriculumProgressReportModalProps) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      loadReport();
    }
  }, [open]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const [myProgress, tracksList] = await Promise.all([
        curriculumClient.getMyProgress(),
        curriculumClient.getTracks(),
      ]);

      const tracks = myProgress?.tracks ?? [];
      const trackReports: TrackReport[] = [];

      for (const tp of tracks) {
        const code = tp.track_code ?? tp.track;
        if (!code) continue;

        try {
          const slug = (typeof code === 'string' ? code : '').toLowerCase();
          const trackDetail = await curriculumClient.getTrack(slug);
          const modules = trackDetail?.modules ?? [];

          const tier = trackDetail?.tier ?? 2;
          const tierLabel = TIER_LABELS[tier] ?? 'Unknown';

          const moduleReports = modules.map((m: any) => {
            const pct = m.completion_percentage ?? 0;
            let status: 'completed' | 'in_progress' | 'pending' = 'pending';
            if (pct >= 100) status = 'completed';
            else if (pct > 0) status = 'in_progress';

            return {
              id: m.id,
              title: m.title || 'Untitled',
              level: m.level || 'beginner',
              lessonCount: m.lesson_count ?? 0,
              completionPercentage: pct,
              status,
            };
          });

          trackReports.push({
            trackCode: code,
            trackName: tp.track_name ?? trackDetail?.name ?? trackDetail?.title ?? code,
            tier,
            tierLabel,
            completionPercentage: tp.completion_percentage ?? 0,
            modulesCompleted: tp.modules_completed ?? 0,
            lessonsCompleted: tp.lessons_completed ?? 0,
            totalPoints: tp.total_points ?? 0,
            modules: moduleReports,
          });
        } catch (e) {
          console.warn(`Could not load track ${code}:`, e);
          trackReports.push({
            trackCode: code,
            trackName: tp.track_name ?? code,
            tier: 2,
            tierLabel: 'Beginner',
            completionPercentage: tp.completion_percentage ?? 0,
            modulesCompleted: tp.modules_completed ?? 0,
            lessonsCompleted: tp.lessons_completed ?? 0,
            totalPoints: tp.total_points ?? 0,
            modules: [],
          });
        }
      }

      const totalPoints = trackReports.reduce((s, t) => s + t.totalPoints, 0);
      const totalTracksEnrolled = trackReports.length;
      const totalTracksCompleted = trackReports.filter(
        (t) => t.completionPercentage >= 100
      ).length;
      const allModules = trackReports.flatMap((t) => t.modules);
      const completedCount = allModules.filter((m) => m.status === 'completed').length;
      const pendingCount = allModules.filter((m) => m.status !== 'completed').length;
      const overallProgress =
        totalTracksEnrolled > 0
          ? Math.round(
              trackReports.reduce((s, t) => s + t.completionPercentage, 0) /
                totalTracksEnrolled
            )
          : 0;

      setData({
        tracks: trackReports,
        totalPoints,
        totalTracksEnrolled,
        totalTracksCompleted,
        overallProgress,
        completedCount,
        pendingCount,
      });
      setExpandedTracks(new Set(trackReports.map((t) => t.trackCode)));
    } catch (err: any) {
      console.error('Failed to load curriculum report:', err);
      setError(err?.message ?? 'Failed to load report');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrack = (code: string) => {
    setExpandedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Curriculum Progress Report
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
            <p className="text-slate-400 text-sm">Loading your progress...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={loadReport}>
              Retry
            </Button>
          </div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-slate-400 font-medium">Overall</span>
                </div>
                <p className="text-2xl font-bold text-white">{data.overallProgress}%</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-400 font-medium">Completed</span>
                </div>
                <p className="text-2xl font-bold text-white">{data.completedCount}</p>
                <p className="text-[10px] text-slate-500">modules</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400 font-medium">Pending</span>
                </div>
                <p className="text-2xl font-bold text-white">{data.pendingCount}</p>
                <p className="text-[10px] text-slate-500">modules</p>
              </div>
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-400 font-medium">Points</span>
                </div>
                <p className="text-2xl font-bold text-white">{data.totalPoints}</p>
              </div>
            </div>

            {/* Tracks */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Tracks & modules
              </h3>
              {data.tracks.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">
                  No tracks enrolled. Start a track to see your progress here.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.tracks.map((track) => {
                    const isExpanded = expandedTracks.has(track.trackCode);
                    return (
                      <div
                        key={track.trackCode}
                        className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleTrack(track.trackCode)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                            <div>
                              <p className="font-semibold text-white">{track.trackName}</p>
                              <p className="text-xs text-slate-500">
                                {track.tierLabel} • {track.modulesCompleted} modules • {track.lessonsCompleted} lessons • {track.totalPoints} pts
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={track.completionPercentage >= 100 ? 'default' : 'outline'}
                            className={clsx(
                              'shrink-0',
                              track.completionPercentage >= 100
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'text-slate-400'
                            )}
                          >
                            {Math.round(track.completionPercentage)}%
                          </Badge>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-slate-700/50"
                            >
                              <div className="p-4 pt-2 space-y-2 max-h-48 overflow-y-auto">
                                {track.modules.length === 0 ? (
                                  <p className="text-xs text-slate-500">No modules</p>
                                ) : (
                                  track.modules.map((mod) => (
                                    <div
                                      key={mod.id}
                                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        {mod.status === 'completed' ? (
                                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                        ) : mod.status === 'in_progress' ? (
                                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                        ) : (
                                          <div className="w-4 h-4 rounded-full border border-slate-500 shrink-0" />
                                        )}
                                        <span className="text-sm text-slate-200 truncate">
                                          {mod.title}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] shrink-0 capitalize"
                                        >
                                          {mod.level}
                                        </Badge>
                                      </div>
                                      <span
                                        className={clsx(
                                          'text-xs font-medium shrink-0 ml-2',
                                          mod.status === 'completed'
                                            ? 'text-emerald-400'
                                            : mod.status === 'in_progress'
                                            ? 'text-amber-400'
                                            : 'text-slate-500'
                                        )}
                                      >
                                        {mod.status === 'completed'
                                          ? 'Done'
                                          : mod.status === 'in_progress'
                                          ? `${Math.round(mod.completionPercentage)}%`
                                          : 'Pending'}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
