import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

interface SeverityBadgeProps {
  severity: SeverityLevel;
}

export const SeverityBadge = ({ severity }: SeverityBadgeProps) => {
  const config = {
    low: { variant: 'mint' as const, text: 'LOW' },
    medium: { variant: 'gold' as const, text: 'MEDIUM' },
    high: { variant: 'orange' as const, text: 'HIGH' },
    critical: { variant: 'orange' as const, text: 'CRITICAL' }
  };

  const { variant, text } = config[severity];

  return (
    <Badge
      variant={variant}
      className="font-mono uppercase tracking-wide"
      role="status"
      aria-label={`Severity level: ${text}`}
    >
      {text}
    </Badge>
  );
};

interface TaskCardProps {
  title: string;
  severity: SeverityLevel;
  time: string;
  subtitle?: string;
  ioc?: string;
  actions: string[];
}

export const TaskCard = ({ title, severity, time, subtitle, ioc, actions }: TaskCardProps) => (
  <article
    className="group bg-och-steel-grey/50 hover:bg-och-steel-grey/70 p-6 rounded-2xl border border-och-steel-grey/50 transition-all duration-200 hover:shadow-2xl hover:shadow-och-defender-blue/20"
    role="article"
    aria-labelledby={`task-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
  >
    <div className="flex justify-between items-start mb-3">
      <h3
        id={`task-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className="font-inter font-semibold text-lg"
      >
        {title}
      </h3>
      <SeverityBadge severity={severity} />
    </div>

    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2 text-och-steel-grey text-sm" aria-label={`Due: ${time}`}>
        <Clock className="w-4 h-4" aria-hidden="true" />
        <span>{time}</span>
      </div>
      {subtitle && (
        <div className="text-och-steel-grey text-sm" aria-label="Additional information">
          {subtitle}
        </div>
      )}
      {ioc && (
        <div
          className="font-mono text-och-cyber-mint text-sm bg-och-midnight-black/50 px-3 py-1 rounded"
          aria-label={`Indicator of compromise: ${ioc}`}
          role="text"
        >
          {ioc}
        </div>
      )}
    </div>

    <div className="flex gap-2 flex-wrap" role="group" aria-label="Available actions">
      {actions.map((action, i) => (
        <button
          key={i}
          className={`px-4 py-2 text-xs font-inter font-medium uppercase tracking-wide rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-och-defender-blue/50 ${
            i === 0
              ? 'bg-och-defender-blue text-white hover:bg-och-defender-blue/80 shadow-lg hover:shadow-och-defender-blue/20'
              : 'bg-och-steel-grey/30 text-och-steel-grey hover:bg-och-steel-grey/50 border border-och-steel-grey/50'
          }`}
          aria-label={`${action} for ${title}`}
        >
          {action}
        </button>
      ))}
    </div>
  </article>
);
