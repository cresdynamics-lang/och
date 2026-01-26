/**
 * Redesigned Left Sidebar
 * Consistent with Mission Control theme.
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardStore } from '../lib/store/dashboardStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Compass,
  Target,
  MessageSquare,
  Briefcase,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Flame,
  Zap,
  Star,
  Shield,
  LayoutDashboard,
  Bell,
  LogOut,
  Store,
  Activity,
  Target as TargetIcon,
  User,
  CreditCard,
  Lock
} from 'lucide-react';
import clsx from 'clsx';

export function LeftSidebar() {
  const { 
    trackOverview, 
    isSidebarCollapsed: isCollapsed, 
    setSidebarCollapsed: setIsCollapsed 
  } = useDashboardStore();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Control Center', icon: LayoutDashboard, href: '/dashboard/student' },
    { label: 'Curriculum GPS', icon: Compass, href: '/dashboard/student/curriculum' },
    { label: 'Mission Hub', icon: Target, href: '/dashboard/student/missions' },
    { label: 'Coaching OS', icon: MessageSquare, href: '/dashboard/student/coaching' },
    { label: 'Repository', icon: Briefcase, href: '/dashboard/student/portfolio' },
    { label: 'Mentorship', icon: Users, href: '/dashboard/student/mentorship' },
    { label: 'Marketplace', icon: Store, href: '/dashboard/student/marketplace' },
    { label: 'Profiling Results', icon: Star, href: '/dashboard/student/profiling' },
  ];

  const settingsMenuItems = [
    { label: 'Overview', icon: Activity, href: '/dashboard/student/settings/overview' },
    { label: 'Onboarding', icon: TargetIcon, href: '/dashboard/student/settings/onboarding' },
    { label: 'Profile & Identity', icon: User, href: '/dashboard/student/settings/profile' },
    { label: 'Subscription', icon: CreditCard, href: '/dashboard/student/settings/subscription' },
    { label: 'Privacy & Consent', icon: Shield, href: '/dashboard/student/settings/privacy' },
    { label: 'Security', icon: Lock, href: '/dashboard/student/settings/security' },
  ];

  const isSettingsActive = pathname?.startsWith('/dashboard/student/settings');

  return (
    <div className="relative flex flex-col h-full bg-och-midnight border-r border-och-steel/10 w-full">
      
      {/* 1. BRANDING & TOGGLE */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-och-gold flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <span className="font-black text-white uppercase tracking-tighter text-lg">OCH HUB</span>
          </motion.div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-och-gold flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5 text-black" />
          </div>
        )}
      </div>

      {/* 1.5 NOTIFICATION & QUICK ACTIONS (New) */}
      {!isCollapsed && (
        <div className="px-6 pb-4 flex items-center gap-2">
           <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 text-och-steel hover:text-och-gold hover:border-och-gold/20 transition-all relative group">
              <Bell className="w-4 h-4 group-hover:animate-bounce" />
              <span className="text-[9px] font-black uppercase tracking-widest">Alerts</span>
              <div className="absolute top-2 right-3 w-2 h-2 bg-och-defender rounded-full border-2 border-och-midnight" />
           </button>
           <button 
            onClick={() => setIsCollapsed?.(true)}
            className="p-3 rounded-2xl bg-white/5 border border-white/5 text-och-steel hover:text-white transition-all"
           >
             <ChevronLeft className="w-4 h-4" />
           </button>
        </div>
      )}

      {isCollapsed && (
        <div className="flex flex-col items-center gap-4 pb-4">
           <button className="p-3 rounded-2xl bg-white/5 border border-white/5 text-och-steel hover:text-och-gold transition-all relative">
              <Bell className="w-4 h-4" />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-och-defender rounded-full" />
           </button>
           <button 
            onClick={() => setIsCollapsed?.(false)}
            className="p-3 rounded-2xl bg-white/5 border border-white/5 text-och-steel hover:text-white transition-all"
           >
             <ChevronRight className="w-4 h-4" />
           </button>
        </div>
      )}

      {/* 2. NAVIGATION */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={clsx(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative",
                isActive 
                  ? "bg-och-gold text-black shadow-lg shadow-och-gold/20" 
                  : "text-och-steel hover:bg-white/5 hover:text-white"
              )}
            >
              <link.icon className={clsx("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-black" : "text-och-gold/60 group-hover:text-och-gold")} />
              {!isCollapsed && (
                <span className="text-[10px] font-black uppercase tracking-widest truncate">{link.label}</span>
              )}
              {isActive && !isCollapsed && (
                <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-black rounded-r-full" />
              )}
            </button>
          );
        })}

        {/* Settings with Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              if (isCollapsed) {
                router.push('/dashboard/student/settings/overview');
              } else {
                setSettingsDropdownOpen(!settingsDropdownOpen);
              }
            }}
            className={clsx(
              "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative",
              isSettingsActive 
                ? "bg-och-gold text-black shadow-lg shadow-och-gold/20" 
                : "text-och-steel hover:bg-white/5 hover:text-white"
            )}
          >
            <Settings className={clsx("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isSettingsActive ? "text-black" : "text-och-gold/60 group-hover:text-och-gold")} />
            {!isCollapsed && (
              <>
                <span className="text-[10px] font-black uppercase tracking-widest truncate flex-1 text-left">Settings</span>
                {settingsDropdownOpen ? (
                  <ChevronUp className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0" />
                )}
              </>
            )}
            {isSettingsActive && !isCollapsed && (
              <motion.div layoutId="active-settings-pill" className="absolute left-0 w-1 h-6 bg-black rounded-r-full" />
            )}
          </button>

          {/* Settings Dropdown Menu */}
          {!isCollapsed && settingsDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 ml-4 space-y-1 border-l-2 border-och-steel/20 pl-4"
            >
              {settingsMenuItems.map((item) => {
                const isItemActive = pathname === item.href;
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setSettingsDropdownOpen(false);
                    }}
                    className={clsx(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative",
                      isItemActive
                        ? "bg-och-mint/10 text-och-mint border border-och-mint/30"
                        : "text-och-steel hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <ItemIcon className={clsx("w-4 h-4 shrink-0", isItemActive ? "text-och-mint" : "text-och-steel/60")} />
                    <span className="text-[9px] font-semibold uppercase tracking-wide truncate">{item.label}</span>
                    {isItemActive && (
                      <div className="absolute left-0 w-1 h-4 bg-och-mint rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>
      </nav>

      {/* 3. QUICK TELEMETRY (Only if not collapsed) */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-6 space-y-6"
          >
            <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-och-steel uppercase tracking-widest">Track Progress</span>
                  <span className="text-[10px] font-black text-white">{trackOverview?.completedMilestones || 0}/{trackOverview?.totalMilestones || 0}</span>
               </div>
               <ProgressBar value={(trackOverview?.completedMilestones || 0) / (trackOverview?.totalMilestones || 1) * 100} max={100} variant="gold" showLabel={false} className="h-1.5" />
            </div>

            <div className="grid grid-cols-2 gap-2">
               {[
                 { label: 'Rank', val: 'Gold', icon: Star, color: 'text-och-gold' },
                 { label: 'Streak', val: '12d', icon: Flame, color: 'text-och-orange' },
               ].map((stat, i) => (
                 <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                    <stat.icon className={clsx("w-3.5 h-3.5", stat.color)} />
                    <span className="text-[8px] font-black text-och-steel uppercase tracking-widest">{stat.label}</span>
                    <span className="text-[10px] font-bold text-white">{stat.val}</span>
                 </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. USER PROFILE PREVIEW */}
      <div className="p-4 mt-auto space-y-2">
         <div className="flex items-center gap-2">
           <button 
            onClick={() => router.push('/dashboard/student/settings?tab=profile')}
            className={clsx(
              "flex-1 p-3 rounded-[2rem] bg-black/40 border border-och-steel/10 flex items-center gap-3 hover:border-och-gold/30 transition-all group overflow-hidden",
              isCollapsed && "justify-center px-0"
            )}
           >
              <div className="w-10 h-10 rounded-full bg-och-gold/20 flex items-center justify-center border border-och-gold/30 shrink-0">
                 <span className="text-sm font-black text-och-gold uppercase">
                   {user?.first_name?.[0] || 'S'}{user?.last_name?.[0] || 'B'}
                 </span>
              </div>
              {!isCollapsed && (
                <div className="min-w-0 text-left">
                   <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">
                     {user?.first_name} {user?.last_name}
                   </p>
                   <p className="text-[8px] text-och-steel truncate">Professional Tier</p>
                </div>
              )}
           </button>

           {!isCollapsed && (
             <button 
               onClick={() => logout()}
               className="p-3 rounded-2xl bg-och-defender/5 border border-och-defender/20 text-och-defender hover:bg-och-defender hover:text-black transition-all group"
               title="Sign Out"
             >
               <LogOut className="w-4 h-4" />
             </button>
           )}
         </div>

         {isCollapsed && (
           <button 
             onClick={() => logout()}
             className="w-full p-3 rounded-2xl bg-och-defender/5 border border-och-defender/20 text-och-defender hover:bg-och-defender hover:text-black transition-all flex justify-center"
             title="Sign Out"
           >
             <LogOut className="w-4 h-4" />
           </button>
         )}
      </div>
    </div>
  );
}
