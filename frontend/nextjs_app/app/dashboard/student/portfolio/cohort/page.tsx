/**
 * Cohort Portfolios Page
 * Allows students to view the professional progress of their peers in the same cohort
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  ArrowLeft, 
  Filter, 
  Shield, 
  Target, 
  Zap, 
  Award, 
  LayoutGrid, 
  List,
  Globe,
  TrendingUp,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import clsx from 'clsx';

export default function CohortPortfoliosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [trackFilter, setTrackFilter] = useState('all');
  const [peers, setPeers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real peer data from backend
  useEffect(() => {
    const fetchPeers = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API endpoint when available
        // const response = await apiGateway.get('/community/cohort/peers');
        // setPeers(response || []);
        setPeers([]); // Empty for now until API is ready
      } catch (error) {
        console.error('Failed to fetch peers:', error);
        setPeers([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPeers();
  }, []);

  const filteredPeers = useMemo(() => {
    return peers.filter(peer => {
      const matchesSearch = peer.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            peer.handle?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTrack = trackFilter === 'all' || peer.track?.toLowerCase() === trackFilter.toLowerCase();
      return matchesSearch && matchesTrack;
    });
  }, [peers, searchQuery, trackFilter]);

  return (
    <div className="min-h-screen bg-och-midnight text-slate-200">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="w-12 h-12 rounded-xl bg-och-steel/10 border border-och-steel/20 flex items-center justify-center text-och-steel hover:bg-och-steel/20 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Cohort Intelligence</h1>
                <Badge variant="defender" className="text-[10px] font-black tracking-widest px-2 py-0.5">
                  PEER NETWORK
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-och-steel text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-och-mint" />
                  {user?.cohort_id || 'Alpha 2026'} Cohort
                </p>
                <div className="h-4 w-px bg-och-steel/20" />
                <p className="text-och-steel text-xs font-black uppercase tracking-[0.2em]">
                  {filteredPeers.length} Active Peers
                </p>
              </div>
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            <div className="flex-1 min-w-[200px] px-6 py-4 rounded-2xl bg-och-steel/5 border border-och-steel/10 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-och-mint/10 text-och-mint">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mb-1.5">Average Readiness</p>
                <span className="text-2xl font-black text-white leading-none">78%</span>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] px-6 py-4 rounded-2xl bg-och-steel/5 border border-och-steel/10 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-och-gold/10 text-och-gold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mb-1.5">Total Outcomes</p>
                <span className="text-2xl font-black text-white leading-none">142</span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-och-midnight/50 p-4 rounded-3xl border border-och-steel/10 backdrop-blur-md shadow-2xl mb-8">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-och-steel" />
            <input 
              type="text" 
              placeholder="SEARCH PEERS BY NAME OR HANDLE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-och-midnight/80 border border-och-steel/20 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white placeholder:text-och-steel/50 focus:border-och-defender/50 outline-none transition-all shadow-inner uppercase tracking-wider"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="bg-och-midnight/80 border border-och-steel/20 rounded-2xl py-2.5 px-4 text-[10px] font-black text-white uppercase tracking-widest focus:border-och-gold/50 outline-none transition-all cursor-pointer shadow-inner"
            >
              <option value="all">ALL TRACKS</option>
              <option value="defender">DEFENDER</option>
              <option value="offensive">OFFENSIVE</option>
              <option value="grc">GRC</option>
            </select>
            
            <div className="flex bg-och-midnight/80 rounded-2xl border border-och-steel/20 p-1 shadow-inner">
              <button 
                onClick={() => setViewMode('grid')}
                className={clsx(
                  "p-2.5 rounded-xl transition-all", 
                  viewMode === 'grid' ? "bg-och-steel/20 text-white shadow-lg" : "text-och-steel hover:text-white"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={clsx(
                  "p-2.5 rounded-xl transition-all", 
                  viewMode === 'list' ? "bg-och-steel/20 text-white shadow-lg" : "text-och-steel hover:text-white"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* PEER GRID */}
        {filteredPeers.length > 0 ? (
          <div className={clsx(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
              : "flex flex-col gap-4"
          )}>
            <AnimatePresence mode="popLayout">
              {filteredPeers.map((peer) => (
                <motion.div
                  key={peer.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="group relative overflow-hidden bg-och-midnight/60 border border-och-steel/10 p-6 rounded-[2rem] hover:border-och-mint/30 transition-all duration-500 hover:shadow-2xl hover:shadow-och-mint/5">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-och-steel/10 border border-och-steel/20 flex items-center justify-center text-och-steel text-xl font-black">
                          {peer.name[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-och-mint transition-colors">{peer.name}</h3>
                          <p className="text-[10px] text-och-steel font-bold uppercase tracking-widest">@{peer.handle}</p>
                        </div>
                      </div>
                      <Badge variant={peer.status === 'job_ready' ? 'mint' : peer.status === 'emerging' ? 'gold' : 'steel'} className="text-[8px] font-black uppercase tracking-widest">
                        {peer.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 rounded-xl bg-white/5 border border-och-steel/5">
                        <p className="text-[9px] text-och-steel font-black uppercase tracking-widest mb-1">Readiness</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-white">{peer.readiness}%</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-och-steel/5">
                        <p className="text-[9px] text-och-steel font-black uppercase tracking-widest mb-1">Health</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-och-gold">{peer.health}</span>
                          <span className="text-[10px] text-och-steel">/10</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4 border-t border-och-steel/5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[8px]">{peer.track}</Badge>
                        <span className="text-[10px] text-och-steel font-bold">{peer.items} Items</span>
                      </div>
                      <button 
                        className="text-och-mint text-[10px] font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all"
                        onClick={() => window.open(`/student/${peer.handle}`, '_blank')}
                      >
                        Explore <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-och-steel/10 rounded-[3rem]">
            <Users className="w-12 h-12 text-och-steel/30 mb-4" />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">No Peers Detected</h3>
            <p className="text-och-steel text-sm max-w-md italic">"No peer profiles matching your current search parameters."</p>
          </div>
        )}
      </div>
    </div>
  );
}

