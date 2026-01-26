/**
 * Missing Fields Nudges Component
 * Redesigned for OCH Mission Control
 */

'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Upload, Linkedin, FileText, Globe, CheckCircle, User, Zap, ChevronRight, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import clsx from 'clsx';

export interface UserSettings {
  avatarUploaded?: boolean;
  name?: string;
  headline?: string;
  location?: string;
  track?: string;
  linkedinLinked?: boolean;
  bioCompleted?: boolean;
  timezoneSet?: string | boolean;
  portfolioVisibility?: string;
  profileCompleteness?: number;
  [key: string]: any;
}

export interface SettingsUpdate {
  [key: string]: any;
}

interface BreakdownItem {
  field: string;
  label: string;
  completed: boolean;
  weight: number;
}

export function getCompletenessBreakdown(settings: UserSettings, hasPortfolioItems: boolean): BreakdownItem[] {
  return [
    { field: 'avatarUploaded', label: 'Biometric Avatar', completed: !!settings.avatarUploaded, weight: 10 },
    { field: 'name', label: 'Operative Name', completed: !!settings.name, weight: 10 },
    { field: 'headline', label: 'Specialization', completed: !!settings.headline, weight: 10 },
    { field: 'location', label: 'Node Location', completed: !!settings.location, weight: 5 },
    { field: 'track', label: 'Mission Track', completed: !!settings.track, weight: 10 },
    { field: 'linkedinLinked', label: 'LinkedIn Sync', completed: !!settings.linkedinLinked, weight: 15 },
    { field: 'bioCompleted', label: 'Operative Dossier', completed: !!settings.bioCompleted, weight: 15 },
    { field: 'timezoneSet', label: 'Chronos Sync', completed: !!settings.timezoneSet, weight: 5 },
    { field: 'portfolioVisibility', label: 'Portfolio Visibility', completed: !!settings.portfolioVisibility, weight: 10 },
    { field: 'hasPortfolioItems', label: 'Evidence Uploads', completed: hasPortfolioItems, weight: 10 },
  ];
}

interface MissingFieldsNudgesProps {
  settings: UserSettings;
  hasPortfolioItems: boolean;
  onUpdate: (updates: SettingsUpdate) => void;
}

export function MissingFieldsNudges({ settings, hasPortfolioItems, onUpdate }: MissingFieldsNudgesProps) {
  const breakdown = getCompletenessBreakdown(settings, hasPortfolioItems);
  const missingFields = breakdown.filter(item => !item.completed);

  if (missingFields.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-och-mint/10 to-transparent border-och-mint/20 overflow-hidden relative">
          <div className="p-8 text-center relative z-10">
            <div className="w-16 h-16 rounded-full bg-och-mint/20 border border-och-mint/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-och-mint" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">Node Fully Synchronized</h3>
            <p className="text-och-steel text-[10px] font-black uppercase tracking-widest leading-relaxed">
              Your profile integrity is optimized for mission engagement
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  const fieldIcons = {
    avatarUploaded: Upload,
    name: User,
    headline: Zap,
    location: Globe,
    track: Target,
    linkedinLinked: Linkedin,
    bioCompleted: FileText,
    timezoneSet: Globe,
    portfolioVisibility: Globe,
    hasPortfolioItems: FileText,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-och-gold/30 bg-och-midnight/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <div className="p-8 xl:p-10 relative z-10">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-och-gold/10 border border-och-gold/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-och-gold animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight">
                Integrity Alerts
              </h3>
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">
                Complete synchronization to unlock full system capabilities
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {missingFields.slice(0, 4).map((field) => {
              const Icon = fieldIcons[field.field as keyof typeof fieldIcons] || FileText;
              return (
                <button
                  key={field.field}
                  className="p-4 rounded-2xl bg-white/5 border border-och-steel/10 hover:border-och-gold/40 hover:bg-och-gold/5 transition-all text-left flex items-center justify-between group"
                  onClick={() => {
                    // Quick actions for common fields
                    if (field.field === 'bioCompleted') onUpdate({ bioCompleted: true });
                    if (field.field === 'timezoneSet') onUpdate({ timezoneSet: 'Africa/Nairobi' });
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-och-midnight border border-och-steel/20 group-hover:border-och-gold/30 transition-colors">
                      <Icon className="w-4 h-4 text-och-gold" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-tighter">{field.label}</p>
                      <p className="text-[8px] text-och-gold font-bold uppercase tracking-widest mt-0.5">+{field.weight}% Signal</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-och-steel group-hover:text-white transition-all opacity-0 group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
