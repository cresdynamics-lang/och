/**
 * Redesigned Portfolio Item Card Component
 * Immersive "Professional Stat Sheet" / "Highlight Reel" Card
 * Follows the OCH dark theme and strictly implements the user story requirements.
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Eye,
  Star,
  Target,
  Github,
  Award,
  FileText,
  ExternalLink,
  ArrowRight,
  Shield,
  Zap,
  BookOpen,
  CheckCircle2,
  Lock,
  MessageSquare,
  TrendingUp,
  FileCode,
  ArrowUpRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EvidenceGallery } from './EvidenceGallery';
import type { PortfolioItem } from '@/hooks/usePortfolio';
import clsx from 'clsx';

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 1) return 'JUST NOW';
  if (diffMins < 60) return `${diffMins}M AGO`;
  if (diffHours < 24) return `${diffHours}H AGO`;
  if (diffDays < 7) return `${diffDays}D AGO`;
  if (diffWeeks < 4) return `${diffWeeks}W AGO`;
  if (diffMonths < 12) return `${diffMonths}MO AGO`;
  return `${diffYears}Y AGO`;
}

interface PortfolioItemCardProps {
  item: PortfolioItem;
  showMentorControls?: boolean;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (itemId: string) => void;
  canRequestReview?: boolean;
}

export function PortfolioItemCard({
  item,
  showMentorControls = false,
  onEdit,
  onDelete,
  canRequestReview = false,
}: PortfolioItemCardProps) {
  const typeIcons = {
    mission: Target,
    reflection: BookOpen,
    certification: Award,
    github: Github,
    lab_report: FileCode,
    research: SearchIcon,
    external: ExternalLink,
  };

  const TypeIcon = (typeIcons as any)[item.type] || FileText;

  const averageScore = item.competencyScores && Object.keys(item.competencyScores).length > 0
    ? (Object.values(item.competencyScores) as number[]).reduce((a: number, b: number) => a + b, 0) /
      Object.keys(item.competencyScores).length
    : null;

  const isApproved = item.status === 'approved';
  const isPending = item.status === 'in_review' || item.status === 'submitted' || item.status === 'pending';
  const isDraft = item.status === 'draft';

  const getStatusTheme = () => {
    if (isApproved) return { color: 'text-och-mint', bg: 'bg-och-mint/10', border: 'border-och-mint/20', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' };
    if (isPending) return { color: 'text-och-gold', bg: 'bg-och-gold/10', border: 'border-och-gold/20', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.15)]' };
    return { color: 'text-och-steel', bg: 'bg-och-steel/10', border: 'border-och-steel/20', glow: '' };
  };

  const theme = getStatusTheme();

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full"
    >
      <Card
        className={clsx(
          "h-full relative overflow-hidden group transition-all duration-500 rounded-[2rem] border backdrop-blur-md",
          "bg-och-midnight/60",
          theme.border,
          theme.glow,
          "hover:bg-och-midnight/80 hover:shadow-2xl"
        )}
      >
        {/* STATUS BAR (Top) */}
        <div 
          className={clsx(
            "absolute top-0 left-0 w-full h-1 transition-all duration-500",
            isApproved ? "bg-och-mint" : isPending ? "bg-och-gold" : "bg-och-steel/30"
          )} 
        />
        
        <div className="p-6 flex flex-col h-full relative z-10">
          {/* HEADER: Status + Type + Views */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={isApproved ? "mint" : isPending ? "gold" : "steel"} 
                className="text-[8px] font-black tracking-[0.2em] px-2 py-0.5 uppercase h-5"
              >
                {item.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-[8px] font-black tracking-[0.2em] px-2 py-0.5 uppercase h-5 border-white/10 bg-white/5">
                {item.type.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* TITLE & SUMMARY */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[9px] text-och-steel font-black uppercase tracking-[0.2em]">
                {formatDistanceToNow(new Date(item.createdAt || Date.now()))}
              </p>
              <div className="h-1 w-1 rounded-full bg-och-steel/30" />
              <span className="text-[9px] text-och-steel font-black uppercase tracking-[0.2em]">OUTCOME-ID: {item.id.slice(0, 8)}</span>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none group-hover:text-och-gold transition-colors line-clamp-2 min-h-[2.5rem] mb-2">
              {item.title || 'UNCLASSIFIED OUTCOME'}
            </h3>
            <p className="text-xs text-och-steel font-medium line-clamp-2 italic leading-relaxed">
              "{item.summary || 'No summary registered for this outcome...'}"
            </p>
          </div>

          {/* SKILL TAGS */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-1.5">
              {(item.skillTags || []).slice(0, 4).map((tag: string) => (
                <span key={tag} className="text-[8px] font-black text-white uppercase tracking-widest px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 group-hover:border-och-gold/30 transition-all">
                  {tag}
                </span>
              ))}
              {(item.skillTags?.length || 0) > 4 && (
                <span className="text-[8px] font-black text-och-steel uppercase tracking-widest px-2.5 py-1">
                  +{(item.skillTags?.length || 0) - 4} MORE
                </span>
              )}
            </div>
          </div>

          {/* EVIDENCE PREVIEW */}
          {(item.evidenceFiles?.length || 0) > 0 && (
            <div className="mb-6 flex-1">
               <p className="text-[9px] font-black text-och-steel uppercase tracking-widest mb-2 flex items-center gap-2">
                 <FileCode className="w-3 h-3" /> Artifact Verification
               </p>
               <div className="grid grid-cols-3 gap-2">
                 {(item.evidenceFiles || []).slice(0, 3).map((file: any, i: number) => (
                   <div key={i} className="aspect-square rounded-xl bg-och-midnight/80 border border-och-steel/20 flex items-center justify-center group-hover:border-och-gold/30 transition-all overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-och-midnight to-transparent opacity-40" />
                      <TypeIcon className="w-4 h-4 text-och-steel" />
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* MENTOR SCORE / FEEDBACK */}
          {averageScore && (
            <div className="p-4 rounded-2xl bg-och-mint/5 border border-och-mint/20 mb-6 group-hover:bg-och-mint/10 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-och-mint uppercase tracking-widest flex items-center gap-2">
                  <Star className="w-3 h-3 fill-och-mint" /> Mentor Score
                </span>
                <span className="text-lg font-black text-och-mint leading-none">{averageScore.toFixed(1)}/10</span>
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={clsx("h-1 flex-1 rounded-full", i < Math.floor(averageScore / 2) ? "bg-och-mint" : "bg-och-mint/20")} />
                ))}
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="mt-auto space-y-3">
            <Link href={`/dashboard/student/portfolio/${item.id}`} className="block">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-och-steel/20 text-och-steel hover:border-white hover:text-white transition-all group/btn"
              >
                Inspect Outcome
                <ArrowUpRight className="w-3 h-3 ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </Button>
            </Link>
            
            {canRequestReview && (isDraft || item.status === 'submitted') && (
              <Button 
                variant="outline" 
                className="w-full h-11 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-och-gold/30 text-och-gold hover:bg-och-gold hover:text-black transition-all"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Request mentor review for:', item.id);
                }}
              >
                <Zap className="w-3 h-3 mr-2 fill-current" />
                Request Mentor Review
              </Button>
            )}
          </div>
        </div>

        {/* BACKGROUND DECORATION */}
        <div className="absolute -bottom-12 -right-12 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none select-none">
           <TypeIcon className="w-48 h-48" />
        </div>
      </Card>
    </motion.div>
  );
}

function SearchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
