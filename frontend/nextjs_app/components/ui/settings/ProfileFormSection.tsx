/**
 * Profile Form Section Component
 * Redesigned for OCH Mission Control
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, FileText, Globe, Languages, Linkedin, Shield, Target, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import clsx from 'clsx';

export interface UserSettings {
  name?: string;
  headline?: string;
  location?: string;
  track?: string;
  timezoneSet?: string;
  languagePreference?: string;
  linkedinLinked?: boolean;
  integrations?: Record<string, any>;
  [key: string]: any;
}

export interface SettingsUpdate {
  [key: string]: any;
}

interface ProfileFormSectionProps {
  settings: UserSettings;
  updateSettings: (updates: SettingsUpdate) => void;
}

export function ProfileFormSection({ settings, updateSettings }: ProfileFormSectionProps) {
  const timezones = [
    'Africa/Nairobi', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Cairo', 'America/New_York', 
    'America/Los_Angeles', 'America/Chicago', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 
    'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney'
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'sw', name: 'Swahili' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="bg-och-midnight/60 border border-och-steel/10 overflow-hidden relative backdrop-blur-md rounded-[2.5rem]">
        <div className="p-8 xl:p-12 relative z-10">
          <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8">
            <div className="w-12 h-12 rounded-2xl bg-och-defender/10 flex items-center justify-center border border-och-defender/20">
              <Shield className="w-6 h-6 text-och-defender" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Identity Parameters</h3>
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Core profile synchronization</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Full Name */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-och-steel uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3 text-och-gold" />
                Authorized Name
              </label>
              <input
                type="text"
                placeholder="OPERATIVE NAME"
                defaultValue={settings.name || ''}
                onBlur={(e) => updateSettings({ name: e.target.value.trim() })}
                className="w-full bg-black/40 border border-och-steel/20 rounded-xl px-5 py-4 text-white text-xs font-bold focus:border-och-gold focus:outline-none transition-all placeholder:text-och-steel/30 uppercase tracking-wider"
              />
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-och-steel uppercase tracking-widest flex items-center gap-2">
                <Target className="w-3 h-3 text-och-gold" />
                Mission Specialization
              </label>
              <input
                type="text"
                placeholder="CYBERSECURITY ARCHITECT | THREAT HUNTER"
                defaultValue={settings.headline || ''}
                onBlur={(e) => updateSettings({ headline: e.target.value.trim() })}
                className="w-full bg-black/40 border border-och-steel/20 rounded-xl px-5 py-4 text-white text-xs font-bold focus:border-och-gold focus:outline-none transition-all placeholder:text-och-steel/30 uppercase tracking-wider"
              />
            </div>

            {/* Location */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-och-steel uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3 h-3 text-och-gold" />
                Operational Node (City, Country)
              </label>
              <input
                type="text"
                placeholder="NAIROBI, KENYA"
                defaultValue={settings.location || ''}
                onBlur={(e) => updateSettings({ location: e.target.value.trim() })}
                className="w-full bg-black/40 border border-och-steel/20 rounded-xl px-5 py-4 text-white text-xs font-bold focus:border-och-gold focus:outline-none transition-all placeholder:text-och-steel/30 uppercase tracking-wider"
              />
            </div>

            {/* Career Track */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-och-steel uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-3 h-3 text-och-gold" />
                Engagement Track
              </label>
              <select
                value={settings.track || 'defender'}
                onChange={(e) => updateSettings({ track: e.target.value })}
                className="w-full bg-black/40 border border-och-steel/20 rounded-xl px-5 py-4 text-white text-xs font-bold focus:border-och-gold focus:outline-none transition-all appearance-none cursor-pointer uppercase tracking-wider"
              >
                <option value="defender">DEFENDER PROTOCOL</option>
                <option value="offensive">OFFENSIVE PROTOCOL</option>
                <option value="grc">GRC PROTOCOL</option>
                <option value="innovation">INNOVATION PROTOCOL</option>
              </select>
            </div>
          </div>

          {/* Bio/About */}
          <div className="space-y-3 mb-12">
            <label className="text-[10px] font-black text-och-steel uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3 h-3 text-och-gold" />
              Operative Dossier (Bio)
            </label>
            <textarea
              placeholder="DOCUMENT YOUR JOURNEY, SKILLS, AND OBJECTIVES..."
              className="w-full bg-black/40 border border-och-steel/20 rounded-2xl px-6 py-5 text-white text-xs font-bold focus:border-och-gold focus:outline-none transition-all placeholder:text-och-steel/30 min-h-[160px] resize-none uppercase tracking-wider leading-relaxed"
              defaultValue={settings.integrations?.bio || ''}
              onBlur={(e) => updateSettings({ bioCompleted: true, integrations: { ...settings.integrations, bio: e.target.value } })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Timezone */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-och-steel uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3 h-3 text-och-gold" />
                Chronological Sync (Timezone)
              </label>
              <select
                value={settings.timezoneSet || 'Africa/Nairobi'}
                onChange={(e) => updateSettings({ timezoneSet: e.target.value })}
                className="w-full bg-black/40 border border-och-steel/20 rounded-xl px-5 py-4 text-white text-xs font-bold focus:border-och-gold focus:outline-none transition-all appearance-none cursor-pointer uppercase tracking-wider"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-och-steel uppercase tracking-widest flex items-center gap-2">
                <Languages className="w-3 h-3 text-och-gold" />
                Interface Protocol (Language)
              </label>
              <select
                value={settings.languagePreference || 'en'}
                onChange={(e) => updateSettings({ languagePreference: e.target.value })}
                className="w-full bg-black/40 border border-och-steel/20 rounded-xl px-5 py-4 text-white text-xs font-bold focus:border-och-gold focus:outline-none transition-all appearance-none cursor-pointer uppercase tracking-wider"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-och-steel uppercase tracking-widest flex items-center gap-2">
              <Linkedin className="w-3 h-3 text-och-gold" />
              Professional Verification (LinkedIn)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="url"
                placeholder="HTTPS://LINKEDIN.COM/IN/USERNAME"
                className="flex-1 bg-black/40 border border-och-steel/20 rounded-xl px-5 py-4 text-white text-xs font-bold focus:border-och-gold focus:outline-none transition-all placeholder:text-och-steel/30 tracking-wider"
                defaultValue={settings.integrations?.linkedinUrl || ''}
                onBlur={(e) => updateSettings({ linkedinLinked: true, integrations: { ...settings.integrations, linkedinUrl: e.target.value } })}
              />
              {settings.linkedinLinked && (
                <Badge variant="mint" className="h-12 px-4 rounded-xl text-[8px] font-black tracking-widest uppercase">Connected</Badge>
              )}
            </div>
          </div>

          {/* Impact Telemetry */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-och-gold/10 to-transparent border border-och-gold/20 flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-och-gold/20 flex items-center justify-center border border-och-gold/30 shrink-0">
              <Zap className="w-6 h-6 text-och-gold" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-tight mb-1">Synchronization Impact</h4>
              <p className="text-[10px] text-och-steel leading-relaxed italic">
                "Complete identity parameters boost profile integrity and improve AI Coach personalization fidelity."
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
