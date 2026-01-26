/**
 * Redesigned Portfolio Dashboard
 * Immersive "Portfolio Engine" and "Proof of Transformation" Hub
 * Follows the OCH dark theme and strictly implements the user story lifecycle.
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Plus, 
  Filter, 
  Eye, 
  Settings, 
  CheckCircle, 
  TrendingUp, 
  Shield, 
  Award, 
  FileCode, 
  FileText,
  Zap, 
  LayoutGrid, 
  List, 
  Search,
  ExternalLink,
  Globe,
  User,
  ArrowUpRight,
  BarChart3,
  Flame,
  Clock,
  EyeOff,
  Users
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { PortfolioItemCard } from './PortfolioItemCard';
import { PortfolioItemForm } from './PortfolioItemForm';
import { PortfolioHealthCard } from './PortfolioHealthCard';
import { PortfolioSkillsRadar } from './PortfolioSkillsRadar';
import { PortfolioTimeline } from './PortfolioTimeline';
import { PortfolioDashboardSkeleton } from './PortfolioSkeleton';
import { ErrorDisplay } from './ErrorDisplay';
import { usePortfolioTimeline } from '@/hooks/usePortfolioTimeline';
import { useAuth } from '@/hooks/useAuth';
import type { PortfolioItem } from '@/hooks/usePortfolio';
import clsx from 'clsx';

// Local type definitions to match user story
type PortfolioItemStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'published';
type PortfolioItemType = 'mission' | 'reflection' | 'certification' | 'github' | 'lab_report' | 'research';

export function PortfolioDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id?.toString();
  
  const {
    items = [],
    healthMetrics,
    topSkills = [],
    pendingReviews = [],
    approvedItems = [],
    isLoading,
    error,
    refetch,
  } = usePortfolio(userId);

  const { settings, entitlements } = useSettingsMaster(userId);
  const { timelineData } = usePortfolioTimeline({ items, isLoading });
  
  // Entitlement checks (Starter 3 vs Professional 7)
  const isProfessional = entitlements?.tier === 'professional';
  const isStarterEnhanced = entitlements?.tier === 'starter' && entitlements?.enhancedAccessUntil && new Date(entitlements.enhancedAccessUntil) > new Date();
  const canRequestReview = isProfessional && entitlements?.mentorAccess === true;
  const maxItemsView = isProfessional ? Infinity : (isStarterEnhanced ? Infinity : 5);

  // TalentScope Metrics
  const healthScore = healthMetrics?.healthScore ? Math.round(healthMetrics.healthScore * 10) : 0;
  const readinessScore = 742; // TODO: Implement TalentScope API

  const [statusFilter, setStatusFilter] = useState<PortfolioItemStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<PortfolioItemType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Check for 'new=true' in URL
  useEffect(() => {
    if (searchParams?.get('new') === 'true') {
      setIsFormOpen(true);
      // Clean up URL without reload
      const newUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }
  }, [searchParams]);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  if (isLoading && items.length === 0 && !error) {
    return <PortfolioDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-och-midnight text-slate-200">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        
        {/* 1. PORTFOLIO ENGINE HEADER */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-och-gold/20 to-och-gold/5 border border-och-gold/30 flex items-center justify-center relative overflow-hidden group shadow-lg shadow-och-gold/10">
                <div className="absolute inset-0 bg-och-gold/5 animate-pulse" />
                <Briefcase className="w-7 h-7 text-och-gold relative z-10 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Portfolio</h1>
                  <Badge variant={isProfessional ? "gold" : "steel"} className="text-[9px] font-bold tracking-wider px-2.5 py-1">
                    {isProfessional ? "Pro" : "Starter"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-och-mint animate-pulse" />
                    <span className="font-medium">{items.length} Items</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="font-medium">{approvedItems.length} Verified</span>
                </div>
              </div>
            </div>
            
            <Button 
              variant="defender" 
              onClick={() => setIsFormOpen(true)}
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-och-gold to-och-gold/80 hover:from-och-gold/90 hover:to-och-gold/70 text-black font-bold tracking-wide shadow-lg shadow-och-gold/20 hover:shadow-xl hover:shadow-och-gold/30 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Item
            </Button>
          </div>

          {/* METRICS OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Readiness Score', value: readinessScore, trend: '+14', icon: TrendingUp, color: 'och-mint', bgGradient: 'from-emerald-500/10 to-emerald-500/5' },
              { label: 'Portfolio Health', value: `${healthScore}%`, icon: Shield, color: 'och-defender', bgGradient: 'from-red-500/10 to-red-500/5' },
              { label: 'Verified Items', value: approvedItems.length, icon: CheckCircle, color: 'och-gold', bgGradient: 'from-och-gold/10 to-och-gold/5' },
            ].map((stat, i) => (
              <div key={i} className={clsx(
                "px-6 py-5 rounded-2xl border bg-gradient-to-br transition-all group cursor-default",
                stat.bgGradient,
                "border-" + stat.color + "/20 hover:border-" + stat.color + "/40"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 tracking-wide">{stat.label}</span>
                  <div className={clsx(
                    "p-2 rounded-lg bg-" + stat.color + "/10 border border-" + stat.color + "/20 transition-transform group-hover:scale-110",
                    "text-" + stat.color
                  )}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{stat.value}</span>
                  {stat.trend && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {stat.trend}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 2. ANALYTICS & PROFILE SIDEBAR */}
          <aside className="lg:col-span-3 space-y-6 sticky top-24">
            
            {/* PROFILE CARD */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-och-gold/10 to-och-gold/5 border border-och-gold/20 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform">
                <Globe className="w-32 h-32 text-och-gold" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="gold" className="text-[8px] px-2 py-1 font-bold tracking-wider">Public Profile</Badge>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-och-gold/20 border border-och-gold/30 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-och-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-semibold truncate">
                      {user?.first_name && user?.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user?.first_name || 'Student'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email || 'No email'}
                    </p>
                  </div>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                  {settings?.bio || 'Set up your professional bio to showcase your expertise and journey in cybersecurity.'}
                </p>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs font-medium border-och-gold/30 text-och-gold hover:bg-och-gold hover:text-black transition-all"
                  onClick={() => router.push('/dashboard/student/settings?tab=profile')}
                >
                  Edit Profile
                  <Settings className="w-3.5 h-3.5 ml-2" />
                </Button>
              </div>
            </div>

            {/* SKILLS RADAR */}
            <div className="space-y-3">
               <div className="flex items-center gap-2 px-2">
                 <BarChart3 className="w-4 h-4 text-och-mint" />
                 <span className="text-xs font-semibold text-slate-300">Skills Overview</span>
               </div>
               <PortfolioSkillsRadar skills={topSkills} />
            </div>

            {/* RECENT ACTIVITY */}
            <div className="space-y-3">
               <div className="flex items-center gap-2 px-2">
                 <Clock className="w-4 h-4 text-blue-400" />
                 <span className="text-xs font-semibold text-slate-300">Recent Activity</span>
               </div>
               <PortfolioTimeline data={timelineData} />
            </div>
          </aside>

          {/* 3. REPOSITORY TERMINAL */}
          <main className="lg:col-span-9 space-y-8">
            
            {/* SEARCH & FILTERS BAR */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by title, tags, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 bg-och-midnight/60 border border-slate-700 rounded-xl pl-12 pr-4 text-sm font-medium text-white placeholder:text-slate-500 focus:border-och-gold/50 focus:bg-och-midnight/80 outline-none transition-all"
                />
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PortfolioItemStatus | 'all')}
                  className="h-12 px-4 bg-och-midnight/60 border border-slate-700 rounded-xl text-sm font-medium text-white focus:border-och-gold/50 outline-none transition-all cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                </select>
                
                <div className="flex bg-och-midnight/60 rounded-xl border border-slate-700 p-1">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={clsx(
                      "p-2 rounded-lg transition-all", 
                      viewMode === 'grid' ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                    )}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={clsx(
                      "p-2 rounded-lg transition-all", 
                      viewMode === 'list' ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                    )}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => router.push('/dashboard/student/portfolio/cohort')}
                  className="h-12 px-5 rounded-xl border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 font-medium transition-all"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Peers
                </Button>
              </div>
            </div>

            {/* STATUS OVERVIEW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
               {[
                 { label: 'Drafts', status: 'draft' as PortfolioItemStatus, count: items.filter(i => i.status === 'draft').length, color: 'slate-400', icon: FileText },
                 { label: 'Submitted', status: 'submitted' as PortfolioItemStatus, count: items.filter(i => i.status === 'submitted').length, color: 'blue-400', icon: ArrowUpRight },
                 { label: 'In Review', status: 'in_review' as PortfolioItemStatus, count: pendingReviews.length, color: 'amber-400', icon: Clock },
                 { label: 'Approved', status: 'approved' as PortfolioItemStatus, count: approvedItems.length, color: 'emerald-400', icon: CheckCircle },
               ].map((phase, i) => (
                 <button
                   key={i}
                   onClick={() => setStatusFilter(phase.status)}
                   className={clsx(
                     "p-4 rounded-xl border transition-all group text-left",
                     statusFilter === phase.status 
                       ? "bg-och-gold/10 border-och-gold/40 shadow-lg shadow-och-gold/10" 
                       : "bg-och-midnight/40 border-slate-700 hover:border-slate-600 hover:bg-och-midnight/60"
                   )}
                 >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-400">{phase.label}</span>
                      <phase.icon className={clsx("w-4 h-4", `text-${phase.color}`)} />
                    </div>
                    <span className={clsx("text-2xl font-bold", `text-${phase.color}`)}>{phase.count}</span>
                 </button>
               ))}
            </div>

            {/* REPOSITORY GRID */}
            {filteredItems.length > 0 ? (
              <div className={clsx(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                  : "flex flex-col gap-4"
              )}>
                <AnimatePresence mode="popLayout">
                  {filteredItems.slice(0, maxItemsView).map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PortfolioItemCard 
                        item={item} 
                        canRequestReview={canRequestReview}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No items found</h3>
                <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
                  No portfolio items match your current filters. Try adjusting your search or clear filters to see all items.
                </p>
                <Button 
                  variant="outline" 
                  className="h-11 px-6 rounded-xl border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 font-medium transition-all"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-och-gold/20 to-och-gold/5 border border-och-gold/30 flex items-center justify-center mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-och-gold/5 animate-pulse" />
                  <Briefcase className="w-10 h-10 text-och-gold relative z-10" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Start building your portfolio</h3>
                <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
                  Showcase your skills and achievements. Complete missions, upload certifications, or document your projects.
                </p>
                <Button 
                  variant="outline" 
                  className="h-11 px-6 rounded-xl border-och-gold/40 text-och-gold hover:bg-och-gold hover:text-black font-medium transition-all"
                  onClick={() => setIsFormOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Item
                </Button>
              </div>
            )}

            {/* UPGRADE CALLOUT (If applicable) */}
            {filteredItems.length > maxItemsView && !isProfessional && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-och-gold/10 to-amber-500/5 border border-och-gold/30 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-och-gold/20 border border-och-gold/30 flex items-center justify-center shrink-0">
                     <Shield className="w-6 h-6 text-och-gold" />
                   </div>
                   <div>
                     <h4 className="text-base font-bold text-white mb-1">Unlock Unlimited Portfolio</h4>
                     <p className="text-sm text-slate-400">Upgrade to Professional for unlimited items, mentor reviews, and verification badges.</p>
                   </div>
                 </div>
                 <Button 
                   variant="defender" 
                   className="h-11 px-6 rounded-xl bg-och-gold text-black hover:bg-och-gold/90 font-bold transition-all whitespace-nowrap"
                   onClick={() => router.push('/dashboard/student/settings?tab=subscription')}
                 >
                   Upgrade Now
                 </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 4. IMMERSIVE OVERLAYS */}

      <AnimatePresence>
        {isFormOpen && (
          <PortfolioItemForm 
            onClose={() => {
              setIsFormOpen(false)
              // Refetch items after closing form to ensure new items appear
              refetch()
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
