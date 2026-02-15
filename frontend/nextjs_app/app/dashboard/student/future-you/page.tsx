'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { profilerClient } from '@/services/profilerClient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles, TrendingUp, Target, Zap, AlertCircle, Star,
  ChevronRight, Clock, BookOpen, Award, Brain, Briefcase,
  ArrowUpRight, Flame, Layers, BarChart3, CheckCircle2,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Track themes
const trackThemes: Record<string, { gradient: string; border: string; text: string; bg: string; icon: string; label: string }> = {
  defender:   { gradient: 'from-indigo-600/30 via-blue-600/20 to-indigo-600/30',   border: 'border-indigo-500/40',   text: 'text-indigo-400',   bg: 'bg-indigo-500/20',   icon: '🛡️', label: 'Cyber Defender' },
  offensive:  { gradient: 'from-red-600/30 via-orange-600/20 to-red-600/30',       border: 'border-red-500/40',      text: 'text-red-400',      bg: 'bg-red-500/20',      icon: '⚔️', label: 'Offensive Security' },
  grc:        { gradient: 'from-emerald-600/30 via-teal-600/20 to-emerald-600/30', border: 'border-emerald-500/40',  text: 'text-emerald-400',  bg: 'bg-emerald-500/20',  icon: '📋', label: 'GRC Specialist' },
  innovation: { gradient: 'from-cyan-600/30 via-sky-600/20 to-cyan-600/30',        border: 'border-cyan-500/40',     text: 'text-cyan-400',     bg: 'bg-cyan-500/20',     icon: '🔬', label: 'Security Innovator' },
  leadership: { gradient: 'from-amber-600/30 via-yellow-600/20 to-amber-600/30',   border: 'border-amber-500/40',   text: 'text-amber-400',    bg: 'bg-amber-500/20',    icon: '👑', label: 'Security Leader' },
};

const priorityColors = {
  high:   'bg-red-500/20 border-red-500/40 text-red-300',
  medium: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  low:    'bg-green-500/20 border-green-500/40 text-green-300',
};

function StatCard({ label, value, color, icon: Icon }: { label: string; value: string | number; color: string; icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
      <Icon className={`w-5 h-5 mb-2 ${color}`} />
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 font-medium mt-1 text-center">{label}</div>
    </div>
  );
}

function ReadinessRing({ score }: { score: number }) {
  const r = 80;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#6366f1';

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 196 196">
        <circle cx="98" cy="98" r={r} strokeWidth="14" fill="none" stroke="#1e293b" />
        <circle
          cx="98" cy="98" r={r} strokeWidth="14" fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-white">{score}%</span>
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Readiness</span>
      </div>
    </div>
  );
}

export default function FutureYouPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    profilerClient.getFutureYouInsights()
      .then(setData)
      .catch((err: any) => setError(err.message || 'Failed to load insights'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-10 w-64 bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-48 bg-slate-800 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 bg-slate-800 rounded-2xl animate-pulse" />
            <div className="h-72 bg-slate-800 rounded-2xl animate-pulse" />
          </div>
          <div className="h-96 bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex items-center justify-center">
        <Card className="p-10 text-center max-w-md border-slate-700">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Something went wrong</h2>
          <p className="text-slate-400 mb-6">{error || 'Unable to load your Future You insights.'}</p>
          <Link href="/dashboard/student" className="inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
            Back to Dashboard
          </Link>
        </Card>
      </div>
    );
  }

  const { persona, profiler, analytics, track_progress, ai_insights, student_name } = data;
  const trackKey = (user?.track_key || profiler?.recommended_track || 'defender').toLowerCase();
  const theme = trackThemes[trackKey] || trackThemes.defender;

  // Persona is either from profiler session OR from GPT prediction (already merged in backend)
  const predictedPersona = ai_insights?.predicted_persona || {};
  const displayPersona = persona && Object.keys(persona).length > 0 ? persona : predictedPersona;

  // Build skills radar: use mastered skills, or projected skills from AI, or track defaults
  const projectedSkills: string[] = displayPersona?.projected_skills || [];
  const skillsRadarData = track_progress?.skills_mastered && Object.keys(track_progress.skills_mastered).length > 0
    ? Object.entries(track_progress.skills_mastered).slice(0, 7).map(([skill, level]: [string, any]) => ({
        subject: skill.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        current: typeof level === 'number' ? Math.round(level) : 0,
        projected: typeof level === 'number' ? Math.min(Math.round(level) + 25, 100) : 25,
      }))
    : projectedSkills.slice(0, 5).map((skill: string, i: number) => ({
        subject: skill.length > 20 ? skill.slice(0, 20) : skill,
        current: 0,
        projected: [35, 30, 25, 40, 20][i] || 25,
      })).concat(projectedSkills.length === 0 ? [
        { subject: 'Network Defense', current: 0, projected: 30 },
        { subject: 'Threat Analysis', current: 0, projected: 25 },
        { subject: 'Incident Response', current: 0, projected: 20 },
        { subject: 'Security Tools', current: 0, projected: 35 },
        { subject: 'Risk Assessment', current: 0, projected: 20 },
      ] : []);

  const readinessScore = ai_insights?.readiness_assessment?.percentage || track_progress?.readiness_score || 0;
  const hasAI = !!ai_insights;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── PAGE HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Future You</h1>
              <p className="text-sm text-slate-400">Your AI-powered career trajectory & growth insights</p>
            </div>
          </div>
        </motion.div>

        {/* ── PERSONA HERO CARD ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className={`rounded-2xl border bg-gradient-to-br ${theme.gradient} ${theme.border} p-6 relative overflow-hidden`}>
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">

              {/* Top meta row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-2xl">{theme.icon}</span>
                <Badge className={`${theme.bg} ${theme.text} border ${theme.border} text-xs font-bold uppercase tracking-wider`}>
                  {theme.label} Track
                </Badge>
                {displayPersona?.estimated_career_level && (
                  <Badge className="bg-white/10 text-white border-white/20 text-xs font-semibold">
                    {displayPersona.estimated_career_level}
                  </Badge>
                )}
                {profiler?.track_confidence ? (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                    {Math.round(profiler.track_confidence)}% Track Match
                  </Badge>
                ) : null}
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full border ${
                  ai_insights?.ai_source === 'fallback'
                    ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                    : ai_insights?.ai_source === 'db_cache'
                    ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                    : 'text-slate-500 bg-black/20 border-white/10'
                }`}>
                  {ai_insights?.ai_source === 'fallback'
                    ? 'Track-Based Prediction'
                    : ai_insights?.ai_source === 'db_cache'
                    ? 'Saved AI Prediction'
                    : 'AI Predicted'}
                </span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex-1">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme.text}`}>
                    {displayPersona?.archetype || theme.label}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
                    {displayPersona?.name
                      ? displayPersona.name
                      : `The Future ${theme.label}`}
                  </h2>
                  <p className="text-slate-300 leading-relaxed text-sm max-w-2xl">
                    {displayPersona?.career_vision ||
                      `Hi ${student_name || 'there'}, you are on the path to becoming a skilled ${theme.label}. As you complete missions and modules, this prediction will evolve to reflect your exact career trajectory.`}
                  </p>

                  {/* Predicted roles */}
                  {displayPersona?.predicted_roles?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Predicted Career Roles</p>
                      <div className="flex flex-wrap gap-2">
                        {displayPersona.predicted_roles.map((role: string, i: number) => (
                          <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 border border-white/15 text-white">
                            <Briefcase className="w-3 h-3 opacity-60" /> {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Projected skills pills */}
                {projectedSkills.length > 0 && (
                  <div className="lg:max-w-xs">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Skills You Will Master</p>
                    <div className="flex flex-wrap gap-2">
                      {projectedSkills.slice(0, 6).map((skill: string, i: number) => (
                        <span key={i} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${theme.bg} ${theme.border} ${theme.text}`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick CTA row */}
              <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-white/10">
                <Link href="/dashboard/student/curriculum" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${theme.bg} ${theme.text} border ${theme.border} hover:opacity-80`}>
                  <BookOpen className="w-4 h-4" /> Continue Learning
                </Link>
                <Link href="/dashboard/student/missions" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-all">
                  <Target className="w-4 h-4" /> View Missions
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── ROW: READINESS + JOURNEY STATS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Career Readiness */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-slate-900/80 border-slate-700/60 h-full">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  Career Readiness
                </h3>
                <ReadinessRing score={readinessScore} />
                <p className="text-sm text-slate-400 text-center mt-4 leading-relaxed max-w-sm mx-auto">
                  {ai_insights?.readiness_assessment?.explanation ||
                    (readinessScore === 0
                      ? 'Complete missions and modules to build your readiness score. Every action brings you closer to your future.'
                      : `You are ${readinessScore}% ready for your target career. Keep progressing through the curriculum.`)}
                </p>
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Track Progress</span>
                    <span>{Math.round(track_progress?.progress_percentage || 0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${track_progress?.progress_percentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Journey Progress */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-slate-900/80 border-slate-700/60 h-full">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Journey Progress
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Circle Level"  value={analytics?.circle_level || 1}              color="text-indigo-400"  icon={Award} />
                  <StatCard label="Missions Done"  value={analytics?.total_missions_completed || 0}  color="text-emerald-400" icon={Target} />
                  <StatCard label="Modules Done"   value={analytics?.modules_completed || 0}          color="text-purple-400"  icon={Layers} />
                  <StatCard label="Lessons Done"   value={analytics?.lessons_completed || 0}          color="text-cyan-400"    icon={BookOpen} />
                  <StatCard label="Avg Score"      value={analytics?.average_score ? `${Math.round(analytics.average_score)}%` : '—'} color="text-yellow-400" icon={BarChart3} />
                  <StatCard label="Time Invested"  value={analytics?.total_time_spent_hours ? `${Math.round(analytics.total_time_spent_hours)}h` : '0h'} color="text-rose-400" icon={Clock} />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ── SKILLS RADAR ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-slate-900/80 border-slate-700/60">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Skills Profile
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500/60 inline-block" /> Current</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500/60 inline-block" /> Projected</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={skillsRadarData} outerRadius="70%">
                  <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} tickCount={5} />
                  <Radar name="Current" dataKey="current" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                  <Radar name="Projected" dataKey="projected" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} strokeDasharray="5 3" />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                    itemStyle={{ color: '#94a3b8' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
              {track_progress?.weak_areas?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Focus Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {track_progress.weak_areas.map((area: string, i: number) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-300">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── AI CAREER INSIGHTS ── */}
        {hasAI && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-slate-900/80 border-slate-700/60">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI Career Insights
                  <span className="ml-auto text-[10px] font-semibold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                    GPT-Powered
                  </span>
                </h3>

                {/* Career narrative */}
                {ai_insights.career_narrative && (
                  <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <h4 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Star className="w-4 h-4" /> Your Career Path
                    </h4>
                    <p className="text-slate-300 leading-relaxed text-sm">{ai_insights.career_narrative}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gap Analysis */}
                  {ai_insights.gap_analysis?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-orange-400" /> Gap Analysis
                      </h4>
                      <div className="space-y-2">
                        {ai_insights.gap_analysis.map((gap: any, idx: number) => {
                          const priority = (gap.priority || 'medium').toLowerCase() as keyof typeof priorityColors;
                          const gapLabel = gap.gap || gap.skill || gap.area || gap.title || 'Skill Gap';
                          const gapDesc = gap.description || gap.recommendation || gap.action || '';
                          return (
                            <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${priorityColors[priority] || priorityColors.medium}`}>
                              <span className="text-[10px] font-black uppercase mt-0.5 shrink-0">{priority}</span>
                              <div className="min-w-0">
                                <div className="font-semibold text-sm">{gapLabel}</div>
                                {gapDesc && <div className="text-xs opacity-75 mt-0.5">{gapDesc}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {ai_insights.recommended_next_steps?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-yellow-400" /> Recommended Next Steps
                      </h4>
                      <div className="space-y-2">
                        {ai_insights.recommended_next_steps.map((step: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-slate-300 text-sm leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── STRENGTHS + STRENGTHS ANALYSIS + GROWTH AREAS ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card className="bg-slate-900/80 border-slate-700/60">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-emerald-400" /> Your Strengths
                </h3>
                <div className="space-y-2">
                  {(profiler?.strengths?.length > 0 || ai_insights?.strengths_analysis?.length > 0) ? (
                    <>
                      {/* AI strengths analysis (more detailed) */}
                      {ai_insights?.strengths_analysis?.length > 0
                        ? ai_insights.strengths_analysis.map((item: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-semibold text-emerald-300 text-sm">{item.strength || item}</div>
                                {item.career_outcome && (
                                  <div className="text-xs text-emerald-400/70 mt-0.5 flex items-center gap-1">
                                    <ArrowUpRight className="w-3 h-3" /> {item.career_outcome}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                        : profiler.strengths.map((s: string, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-emerald-300 text-sm font-medium">{s}</span>
                          </div>
                        ))}
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <Star className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">Complete missions to reveal your strengths</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Growth Areas */}
            <Card className="bg-slate-900/80 border-slate-700/60">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" /> Growth Areas
                </h3>
                <div className="space-y-2">
                  {profiler?.areas_for_growth?.length > 0 ? (
                    profiler.areas_for_growth.map((area: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/30 flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-amber-300 text-sm font-medium">{area}</span>
                      </div>
                    ))
                  ) : track_progress?.weak_areas?.length > 0 ? (
                    track_progress.weak_areas.map((area: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/30 flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-amber-300 text-sm font-medium">{area}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <TrendingUp className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">Your growth areas will appear as you progress</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
