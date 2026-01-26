/**
 * Portfolio Sidebar Component
 * Persistent sidebar navigation for portfolio dashboard
 */
'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Plus,
  Filter,
  Eye,
  Settings,
  Target,
  FileText,
  Award,
  TrendingUp,
  Menu,
  X,
  Home,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/hooks/useAuth';

interface PortfolioSidebarProps {
  onNavigate?: (section: string) => void;
}

export function PortfolioSidebar({ onNavigate }: PortfolioSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();
  const userId = user?.id?.toString();

  const { items, approvedItems, pendingReviews, healthMetrics } = usePortfolio(userId);

  const navItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard/student', badge: 0 },
    { icon: Briefcase, label: 'Portfolio', href: '/dashboard/student/portfolio', badge: 0, active: true },
    { icon: Target, label: 'Missions', href: '/dashboard/student/missions', badge: 0 },
    { icon: BarChart3, label: 'Coaching', href: '/dashboard/student/coaching', badge: 0 },
    { icon: Settings, label: 'Settings', href: '/dashboard/student/settings', badge: 0 },
  ];

  const quickActions = [
    { icon: Plus, label: 'New Item', action: () => router.push('/dashboard/student/portfolio?new=true') },
    { icon: Filter, label: 'Filters', action: () => onNavigate?.('filters') },
    { icon: Eye, label: 'Preview', action: () => onNavigate?.('preview') },
    { icon: TrendingUp, label: 'Analytics', action: () => onNavigate?.('analytics') },
  ];

  const portfolioStats = [
    { label: 'Total Items', value: items.length, color: 'text-slate-300' },
    { label: 'Approved', value: approvedItems.length, color: 'text-emerald-400' },
    { label: 'Pending', value: pendingReviews.length, color: 'text-yellow-400' },
    { label: 'Health', value: healthMetrics ? `${Math.round(healthMetrics.healthScore * 10)}%` : '0%', color: 'text-indigo-400' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-slate-900/95 to-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 z-50 hidden lg:block"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              Portfolio
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Portfolio Health</span>
                <Badge variant="outline" className="text-xs">
                  {healthMetrics ? `${Math.round(healthMetrics.healthScore * 10)}%` : '0%'}
                </Badge>
              </div>
            </motion.div>
          )}
        </div>

        {/* Navigation Items */}
        {!isCollapsed && (
          <nav className="p-4 space-y-2 border-b border-slate-800">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard/student' && pathname?.startsWith(item.href));
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    onNavigate?.(item.href);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-300 border-l-4 border-indigo-400'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <Badge variant="steel" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="p-4 space-y-2 border-b border-slate-800">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Quick Actions</h3>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800/50 hover:text-indigo-300"
                  onClick={action.action}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}

        {/* Stats Summary */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900/50">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Portfolio Stats</h3>
            <div className="space-y-2 text-sm">
              {portfolioStats.map((stat) => (
                <div key={stat.label} className="flex justify-between items-center">
                  <span className="text-slate-400">{stat.label}</span>
                  <span className={`font-semibold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.aside>

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50 lg:hidden">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard/student' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                variant="outline"
                size="sm"
                className={`flex flex-col items-center gap-1 py-3 border-0 ${
                  isActive
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-indigo-300'
                }`}
                onClick={() => {
                  router.push(item.href);
                  setIsMobileOpen(true);
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label.split(' ')[0]}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Mobile Full Modal */}
      {isMobileOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="fixed inset-0 bg-slate-900 z-50 lg:hidden"
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              Portfolio Navigation
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileOpen(false)}
              className="border-slate-700 text-slate-400"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Navigation</h3>
              <div className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard/student' && pathname?.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.href}
                      variant="outline"
                      size="lg"
                      className={`w-full justify-start border-slate-700 ${
                        isActive
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'text-slate-300'
                      }`}
                      onClick={() => {
                        router.push(item.href);
                        setIsMobileOpen(false);
                      }}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="lg"
                      className="w-full justify-start border-slate-700 text-slate-300"
                      onClick={() => {
                        action.action();
                        setIsMobileOpen(false);
                      }}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {portfolioStats.map((stat) => (
                  <div key={stat.label} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
                    <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

