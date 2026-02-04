/**
 * Redesigned Mobile Bottom Navigation
 * High-tech mobile interface for on-the-go mission control.
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useDashboardStore } from '../../../../stores/dashboardStore';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Compass,
  Target,
  MessageSquare,
  Briefcase,
  User,
  BookOpen
} from 'lucide-react';
import clsx from 'clsx';

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { nextActions } = useDashboardStore();

  const navItems = [
    { path: '/dashboard/student', label: 'Control', icon: LayoutDashboard },
    { path: '/dashboard/student/curriculum', label: 'GPS', icon: Compass },
    { path: '/dashboard/student/curriculum/learn', label: 'Learn', icon: BookOpen },
    { path: '/dashboard/student/missions', label: 'Missions', icon: Target },
    { path: '/dashboard/student/coaching', label: 'OS', icon: MessageSquare },
    { path: '/dashboard/student/portfolio', label: 'Repository', icon: Briefcase },
  ];

  const getBadgeCount = (path: string) => {
    if (path === '/dashboard/student/missions') {
      return nextActions.filter(a => a.type === 'mission' && a.urgency === 'high').length;
    }
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-och-midnight/95 backdrop-blur-xl border-t border-och-steel/10 lg:hidden z-50">
      <div className="flex items-center justify-around h-20 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/dashboard/student' && pathname?.startsWith(item.path));
          const badgeCount = getBadgeCount(item.path);

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={clsx(
                "flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-300",
                isActive ? "text-och-gold" : "text-och-steel hover:text-white"
              )}
              aria-label={item.label}
            >
              <div className={clsx(
                "p-2 rounded-xl transition-all duration-300",
                isActive ? "bg-och-gold/10" : "bg-transparent"
              )}>
                <item.icon className={clsx("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
              </div>
              <span className={clsx(
                "text-[8px] font-black uppercase tracking-widest mt-1",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
              
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-och-gold rounded-b-full" 
                />
              )}
              
              {badgeCount > 0 && (
                <span className="absolute top-2 right-1/4 bg-och-defender text-black text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-och-midnight shadow-lg">
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
