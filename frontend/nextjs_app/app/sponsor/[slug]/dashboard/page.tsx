'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Shield,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Award,
  ChevronRight,
  Download,
  AlertTriangle,
  Sparkles,
  Clock,
  Briefcase,
  BarChart3,
  Zap,
  Eye,
  Calendar,
  Mail
} from 'lucide-react';

// Import new components
import SponsorDashboard from '@/components/sponsor/SponsorDashboardNew';
import CohortManagement from '@/components/sponsor/CohortManagementNew';

// Legacy components for fallback
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { TrackPerformanceGrid } from './components/TrackPerformanceGrid';
import { TopTalentGrid } from './components/TopTalentGrid';
import { HiringPipeline } from './components/HiringPipeline';
import { AIAlertsPanel } from './components/AIAlertsPanel';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function SponsorDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-slate-600/10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-blue-500/20 rounded-xl">
                  <Shield className="w-12 h-12 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-white">Sponsor Portal</h1>
                    <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      OCH SMP
                    </Badge>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    Comprehensive sponsor dashboard with OCH SMP Technical Specifications
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700">
                <TabsTrigger 
                  value="dashboard" 
                  className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-blue-600/20"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="cohorts" 
                  className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-blue-600/20"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Cohorts
                </TabsTrigger>
                <TabsTrigger 
                  value="finance" 
                  className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-blue-600/20"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Finance
                </TabsTrigger>
              </TabsList>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="mt-0">
                <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                  <SponsorDashboard sponsorSlug={slug} />
                </div>
              </TabsContent>

              {/* Cohorts Tab */}
              <TabsContent value="cohorts" className="mt-0">
                <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                  <CohortManagement sponsorSlug={slug} />
                </div>
              </TabsContent>

              {/* Finance Tab */}
              <TabsContent value="finance" className="mt-0">
                <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden p-6">
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Finance Dashboard</h3>
                    <p className="text-slate-400 mb-6">
                      Financial management and billing features coming soon
                    </p>
                    <Button 
                      onClick={() => router.push(`/sponsor/${slug}/finance`)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Go to Finance Section
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

