/**
 * Enhanced Student Sidebar - Track-Aware, Data-Driven
 * Displays user profile, track progress, and intelligent navigation
 * Fully synced with backend data (recommended track, progress, stats)
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardStore } from '../lib/store/dashboardStore';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { curriculumClient } from '@/services/curriculumClient';
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  FileText,
  Rocket,
  Crown,
  Settings,
  LogOut,
  Bell,
  User,
  UserCircle,
  LayoutDashboard,
  BookOpen,
  Target,
  MessageSquare,
  Briefcase,
  Users,
  Store,
  Star,
  TrendingUp,
  Lock,
  UnlockIcon,
  Flame,
  Sparkles,
  Compass,
  Activity,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import clsx from 'clsx';
import type { UserTrackProgress } from '@/services/types/curriculum';

// Track theme configuration
const trackThemes: Record<string, {
  icon: React.ReactNode;
  label: string;
  bgGradient: string;
  accentColor: string;
  borderColor: string;
  lightBg: string;
}> = {
  defender: {
    icon: <Shield className="w-5 h-5" />,
    label: 'Defender',
    bgGradient: 'from-indigo-500/10 to-blue-500/10',
    accentColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    lightBg: 'bg-indigo-500/20',
  },
  offensive: {
    icon: <Zap className="w-5 h-5" />,
    label: 'Offensive',
    bgGradient: 'from-red-500/10 to-orange-500/10',
    accentColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    lightBg: 'bg-red-500/20',
  },
  grc: {
    icon: <FileText className="w-5 h-5" />,
    label: 'GRC',
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    lightBg: 'bg-emerald-500/20',
  },
  innovation: {
    icon: <Rocket className="w-5 h-5" />,
    label: 'Innovation',
    bgGradient: 'from-cyan-500/10 to-sky-500/10',
    accentColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    lightBg: 'bg-cyan-500/20',
  },
  leadership: {
    icon: <Crown className="w-5 h-5" />,
    label: 'Leadership',
    bgGradient: 'from-och-gold/10 to-amber-500/10',
    accentColor: 'text-och-gold',
    borderColor: 'border-och-gold/30',
    lightBg: 'bg-och-gold/20',
  },
};

interface SidebarProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function EnhancedSidebar({ isCollapsed = false, onCollapsedChange }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, reloadUser } = useAuth();
  const [trackProgress, setTrackProgress] = useState<UserTrackProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // Refresh user data on mount to ensure we have latest track_key
  useEffect(() => {
    if (reloadUser && user?.id) {
      // Only reload if we don't have track_key or it's still 'defender' (might be stale)
      if (!user.track_key || user.track_key.toLowerCase() === 'defender') {
        console.log('[EnhancedSidebar] Reloading user data to get latest track_key...');
        reloadUser();
      }
    }
  }, [reloadUser, user?.id]);

  // Get track theme - check multiple locations for track data
  const trackKey = (user?.track_key || 
                    user?.recommended_track || 
                    user?.role_specific_data?.student?.track_key ||
                    '').toLowerCase();
  
  // Debug logging to see what track data we have
  if (user && (!user.track_key || trackKey === 'defender')) {
    console.log('[EnhancedSidebar] User track data:', {
      track_key: user.track_key,
      recommended_track: user.recommended_track,
      role_specific_data: user.role_specific_data,
      final_trackKey: trackKey,
      user_id: user.id,
      email: user.email
    });
  }
  
  const theme = trackThemes[trackKey] || trackThemes.defender;

  // Fetch track progress
  useEffect(() => {
    if (!user?.id || !trackKey) {
      setLoadingProgress(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        // Fetch progress for the user's recommended track
        const tracks = await curriculumClient.getTracks();
        const currentTrack = tracks.find(
          t => t.code.toLowerCase().includes(trackKey) && t.tier === 2
        );

        if (currentTrack) {
          // In a real implementation, this would fetch actual progress
          // For now, we'll use mock data or query the backend directly
          const progress = currentTrack.user_progress;
          if (progress) {
            setTrackProgress(progress as UserTrackProgress);
          }
        }
      } catch (error) {
        console.error('Failed to fetch track progress:', error);
      } finally {
        setLoadingProgress(false);
      }
    };

    fetchProgress();
  }, [user?.id, trackKey]);

  const mainNav = [
    { label: 'Control Center', icon: LayoutDashboard, href: '/dashboard/student' },
    { label: 'My Profile', icon: Activity, href: '/dashboard/student/profiling' },
    { label: 'Curriculum', icon: Compass, href: '/dashboard/student/curriculum' },
    { label: 'My Learning', icon: BookOpen, href: '/dashboard/student/curriculum/learn' },
    { label: 'Missions', icon: Target, href: '/dashboard/student/missions' },
    { label: 'Coaching', icon: MessageSquare, href: '/dashboard/student/coaching' },
    { label: 'Portfolio', icon: Briefcase, href: '/dashboard/student/portfolio' },
    { label: 'Mentorship', icon: Users, href: '/dashboard/student/mentorship' },
    { label: 'Marketplace', icon: Store, href: '/dashboard/student/marketplace' },
  ];

  const settingsNav = [
    { label: 'Profile', icon: User, href: '/dashboard/student/settings/profile' },
    { label: 'Subscription', icon: CreditCard, href: '/dashboard/student/settings/subscription' },
    { label: 'Security', icon: Shield, href: '/dashboard/student/settings/security' },
  ];

  const isSettingsActive = pathname?.startsWith('/dashboard/student/settings');

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navigateTo = (href: string) => {
    router.push(href);
    if (isCollapsed) {
      onCollapsedChange?.(false);
    }
  };

  return (
    <div className={clsx(
      "flex flex-col h-full bg-gradient-to-b from-och-midnight to-och-midnight/95 border-r border-och-steel/20",
      "transition-all duration-300 overflow-hidden"
    )}>
      {/* ============ HEADER SECTION ============ */}
      <div className="p-4 lg:p-6 border-b border-och-steel/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-lg bg-och-gold flex items-center justify-center">
                <Shield className="w-4 h-4 text-black font-black" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white uppercase tracking-tighter">OCH HUB</span>
                <span className="text-[10px] text-och-steel/60 font-medium">Control Panel</span>
              </div>
            </motion.div>
          )}
          
          <button
            onClick={() => onCollapsedChange?.(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-white/5 text-och-steel hover:text-white transition-all"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* ============ PROFILE CARD SECTION ============ */}
      {!isCollapsed && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 border-b border-och-steel/10"
        >
          <div className={clsx(
            "p-4 rounded-2xl border",
            `bg-gradient-to-br ${theme.bgGradient}`,
            theme.borderColor,
            "relative overflow-hidden group cursor-pointer hover:border-opacity-100 transition-all"
          )}
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          >
            {/* Background accent */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/5 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex items-start gap-3">
              {/* Avatar */}
              <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                theme.lightBg,
                theme.borderColor
              )}>
                <UserCircle className={clsx("w-6 h-6", theme.accentColor)} />
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-black text-white uppercase tracking-tighter truncate">
                  {user?.first_name || 'Student'}
                </h3>
                <p className="text-[11px] text-och-steel/70 font-medium truncate">
                  {user?.email}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {theme.icon}
                  <span className={clsx("text-[10px] font-bold uppercase tracking-widest", theme.accentColor)}>
                    {theme.label}
                  </span>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex flex-col items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] text-och-steel/60 mt-1">Active</span>
              </div>
            </div>

            {/* Profile dropdown menu */}
            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-4 right-4 mt-2 bg-och-midnight border border-och-steel/20 rounded-lg shadow-xl z-20"
                >
                  <button
                    onClick={() => {
                      navigateTo('/dashboard/student/settings/profile');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-och-steel hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    View Profile
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Collapsed profile indicator */}
      {isCollapsed && (
        <div className="flex justify-center p-4 border-b border-och-steel/10">
          <div className={clsx(
            "w-10 h-10 rounded-lg flex items-center justify-center border",
            theme.lightBg,
            theme.borderColor
          )}>
            {theme.icon}
          </div>
        </div>
      )}

      {/* ============ TRACK PROGRESS SECTION ============ */}
      {!isCollapsed && trackKey && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 border-b border-och-steel/10"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-och-steel uppercase tracking-widest">
                Track Progress
              </span>
              {trackProgress?.completion_percentage && (
                <Badge variant="outline" className="text-[9px]">
                  {Math.round(trackProgress.completion_percentage)}%
                </Badge>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <motion.div
                className={clsx(
                  "h-full rounded-full",
                  trackKey === 'defender' && 'bg-indigo-500',
                  trackKey === 'offensive' && 'bg-red-500',
                  trackKey === 'grc' && 'bg-emerald-500',
                  trackKey === 'innovation' && 'bg-cyan-500',
                  trackKey === 'leadership' && 'bg-och-gold',
                )}
                initial={{ width: 0 }}
                animate={{ width: `${trackProgress?.completion_percentage || 0}%` }}
                transition={{ delay: 0.2, duration: 1 }}
              />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-bold text-och-steel/70 pt-1">
              <div>
                <div className="text-white">{trackProgress?.circle_level || 0}</div>
                <div className="text-[8px]">Level</div>
              </div>
              <div>
                <div className="text-white">{trackProgress?.current_streak_days || 0}d</div>
                <div className="text-[8px]">Streak</div>
              </div>
              <div>
                <div className="text-white">{trackProgress?.total_points || 0}</div>
                <div className="text-[8px]">Points</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============ MAIN NAVIGATION ============ */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1.5">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <motion.button
              key={item.href}
              onClick={() => navigateTo(item.href)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group",
                isActive
                  ? `bg-och-gold text-black shadow-lg shadow-och-gold/20`
                  : `text-och-steel hover:text-white hover:bg-white/5`,
              )}
            >
              <Icon className={clsx(
                "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                isActive ? "text-black" : "group-hover:text-och-gold"
              )} />
              
              {!isCollapsed && (
                <span className="text-xs font-bold uppercase tracking-wider truncate">
                  {item.label}
                </span>
              )}

              {isActive && !isCollapsed && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-black rounded-r-full"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* ============ SETTINGS SECTION ============ */}
      <div className="px-3 py-2 border-t border-och-steel/10 space-y-1.5">
        {/* Settings Dropdown */}
        <div>
          <motion.button
            onClick={() => setSettingsOpen(!settingsOpen)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
              isSettingsActive
                ? `bg-och-gold text-black shadow-lg shadow-och-gold/20`
                : `text-och-steel hover:text-white hover:bg-white/5`,
            )}
          >
            <Settings className={clsx(
              "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
              isSettingsActive ? "text-black" : "group-hover:text-och-gold"
            )} />
            
            {!isCollapsed && (
              <>
                <span className="text-xs font-bold uppercase tracking-wider flex-1 text-left">
                  Settings
                </span>
                {settingsOpen ? (
                  <ChevronUp className="w-3 h-3 shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 shrink-0" />
                )}
              </>
            )}
          </motion.button>

          {/* Settings submenu */}
          <AnimatePresence>
            {!isCollapsed && settingsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 ml-3 space-y-1 border-l-2 border-och-steel/20 pl-3"
              >
                {settingsNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <motion.button
                      key={item.href}
                      onClick={() => navigateTo(item.href)}
                      whileHover={{ x: 2 }}
                      className={clsx(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all",
                        isActive
                          ? "text-och-gold bg-och-gold/10"
                          : "text-och-steel/60 hover:text-och-steel hover:bg-white/5"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="truncate">{item.label}</span>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Alerts Button */}
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-och-steel hover:text-white hover:bg-white/5 transition-all group relative"
        >
          <Bell className="w-4 h-4 shrink-0 group-hover:text-och-gold" />
          {!isCollapsed && (
            <>
              <span className="text-xs font-bold uppercase tracking-wider flex-1 text-left">
                Alerts
              </span>
              <div className="w-2 h-2 bg-och-defender rounded-full animate-pulse" />
            </>
          )}
          {isCollapsed && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-och-defender rounded-full animate-pulse" />
          )}
        </motion.button>

        {/* Logout Button */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-och-steel hover:text-red-400 hover:bg-red-500/10 transition-all group mt-2 border-t border-och-steel/10 pt-3"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
          {!isCollapsed && (
            <span className="text-xs font-bold uppercase tracking-wider">Logout</span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
