/**
 * Redesigned Portfolio Timeline Component
 * Activity timeline visualization for portfolio events
 * Follows the OCH dark theme and user story activity feed style.
 */

'use client';

import { Card } from '@/components/ui/Card';
import { 
  Clock, 
  CheckCircle, 
  Eye, 
  MessageSquare, 
  Star, 
  Plus, 
  Zap, 
  ShieldCheck, 
  Target, 
  Rocket,
  Flame
} from 'lucide-react';
import type { TimelineEvent } from '@/hooks/usePortfolioTimeline';
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

interface PortfolioTimelineProps {
  data: TimelineEvent[];
  maxItems?: number;
}

const eventIcons = {
  item_created: Rocket,
  item_approved: ShieldCheck,
  review_received: Zap,
};

const eventColors = {
  item_created: 'text-och-defender bg-och-defender/10 border-och-defender/20',
  item_approved: 'text-och-mint bg-och-mint/10 border-och-mint/20',
  review_received: 'text-och-gold bg-och-gold/10 border-och-gold/20',
};

export function PortfolioTimeline({ data, maxItems = 10 }: PortfolioTimelineProps) {
  const displayData = data.slice(0, maxItems);

  if (displayData.length === 0) {
    return (
      <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2rem]">
        <div className="p-10 text-center">
          <Clock className="w-12 h-12 text-och-steel/20 mx-auto mb-4" />
          <h3 className="font-black text-lg text-white uppercase tracking-tighter mb-2">Telemetry Archive</h3>
          <p className="text-xs text-och-steel font-medium italic">"Your portfolio activity feed is currently inactive."</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-och-defender/10 text-och-defender border border-och-defender/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg text-white uppercase tracking-tighter leading-none mb-1">Telemetry Feed</h3>
            <p className="text-[10px] text-och-steel font-black uppercase tracking-widest">Real-time Activity Archive</p>
          </div>
        </div>

        <div className="space-y-6">
          {displayData.map((event, index) => {
            const Icon = (eventIcons as any)[event.type] || Clock;
            const themeClass = (eventColors as any)[event.type] || 'text-och-steel bg-white/5 border-white/10';

            return (
              <div key={event.id} className="flex gap-6 relative group/item">
                {/* Timeline Line */}
                {index < displayData.length - 1 && (
                  <div className="absolute left-6 top-14 bottom-0 w-px bg-och-steel/10 group-hover/item:bg-och-defender/20 transition-colors" />
                )}

                {/* Icon */}
                <div className={clsx(
                  "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 relative z-10",
                  themeClass,
                  "group-hover/item:scale-110"
                )}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h4 className="font-black text-white text-xs uppercase tracking-tight group-hover/item:text-och-mint transition-colors">
                      {event.title}
                    </h4>
                    <span className="text-[9px] text-och-steel font-black uppercase tracking-widest whitespace-nowrap bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                      {formatDistanceToNow(new Date(event.createdAt))}
                    </span>
                  </div>
                  <p className="text-[11px] text-och-steel font-medium leading-relaxed italic line-clamp-2">
                    "{event.description}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {data.length > maxItems && (
          <div className="mt-4 pt-6 border-t border-och-steel/10 text-center">
            <p className="text-[9px] text-och-steel font-black uppercase tracking-widest">
              TELEMETRY LIMIT REACHED ({maxItems} OF {data.length} EVENTS)
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
