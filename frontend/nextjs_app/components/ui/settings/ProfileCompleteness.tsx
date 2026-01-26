/**
 * Profile Completeness Component
 * Redesigned for OCH Mission Control
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Upload, Sparkles, AlertTriangle, Linkedin, Globe, FileText, Rocket, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePortfolio } from '@/hooks/usePortfolio';
import { MissingFieldsNudges } from './MissingFieldsNudges';
import { useAuth } from '@/hooks/useAuth';
import clsx from 'clsx';

export interface UserSettings {
  avatarUploaded?: boolean;
  profileCompleteness?: number;
  integrations?: {
    futureYouPersona?: string;
    recommendedTrack?: string;
  };
  [key: string]: any;
}

export interface SettingsUpdate {
  [key: string]: any;
}

interface ProfileCompletenessProps {
  settings: UserSettings;
  updateSettings: (updates: SettingsUpdate) => void;
  userId?: string;
}

export function ProfileCompleteness({ settings, updateSettings, userId }: ProfileCompletenessProps) {
  const { user } = useAuth();
  const { items } = usePortfolio(userId);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const hasPortfolioItems = (items || []).length > 0;
  const futureYouPersona = settings.integrations?.futureYouPersona || 'Cybersecurity Professional';
  const recommendedTrack = settings.integrations?.recommendedTrack || 'Defender';

  const handleAvatarUpload = async (file: File) => {
    try {
      if (!user) return;
      // Mock successful upload
      setAvatarUrl(URL.createObjectURL(file));
      updateSettings({ avatarUploaded: true });
    } catch (error) {
      console.error('Avatar upload failed:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* AVATAR + FUTURE-YOU SECTION */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-och-gold/10 to-transparent border-och-gold/20 overflow-hidden relative group h-full">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
            <Rocket className="w-48 h-48 text-och-gold" />
          </div>

          <div className="p-8 flex flex-col h-full relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
              {/* Avatar Upload Terminal */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl border-2 border-och-steel/20 group-hover:border-och-gold/50 shadow-2xl transition-all overflow-hidden bg-och-midnight flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-och-steel/40" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-3xl backdrop-blur-[2px]">
                  <Upload className="w-6 h-6 text-och-gold" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                    }}
                  />
                </label>
              </div>

              {/* Persona Metadata */}
              <div className="text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-och-gold animate-pulse" />
                  <span className="text-[10px] font-black text-och-gold uppercase tracking-widest leading-none">Identity Archetype</span>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-3 leading-tight">
                  {futureYouPersona}
                </h2>
                <Badge variant="gold" className="px-4 py-1 text-[10px] font-black tracking-widest uppercase bg-och-gold text-black border-none">
                  {recommendedTrack} Track
                </Badge>
              </div>
            </div>

            {/* Integrity Metrics */}
            <div className="mt-auto space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-och-steel">
                  <Target className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Node Integrity</span>
                </div>
                <span className="text-sm font-black text-och-mint">{settings.profileCompleteness || 0}%</span>
              </div>
              
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${settings.profileCompleteness || 0}%` }}
                  className="h-full bg-gradient-to-r from-och-gold to-och-mint transition-all duration-1000"
                />
              </div>

              {settings.profileCompleteness < 80 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-och-orange/5 border border-och-orange/20">
                  <AlertTriangle className="w-3 h-3 text-och-orange" />
                  <p className="text-[9px] text-och-orange font-bold uppercase tracking-wide italic">
                    {80 - settings.profileCompleteness}% more needed for profile optimization
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* MISSING FIELDS NUDGES */}
      <MissingFieldsNudges 
        settings={settings} 
        hasPortfolioItems={hasPortfolioItems} 
        onUpdate={updateSettings} 
      />
    </div>
  );
}
