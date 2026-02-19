"use client"

import { Suspense, useState } from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent } from "@/components/ui/card-enhanced";
import { useAuth } from '@/hooks/useAuth';
import { PipelineChart, PlacementPipeline, FinanceDashboardSkeleton } from "../dashboard/components";
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Filter, Building2 } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function PlacementsContent() {
  const { user } = useAuth();
  const userId = user?.id || 'finance-user';
  const [selectedOrg, setSelectedOrg] = useState('all');

  const { data: revenueData } = useSWR(`/api/finance/${userId}/revenue`, fetcher);
  const { data: realtimeData } = useSWR(`/api/finance/${userId}/realtime`, fetcher);
  const { data: placementsData } = useSWR(`/api/finance/${userId}/placements`, fetcher);
  const { data: sponsorsData } = useSWR(`/api/finance/${userId}/sponsors`, fetcher);

  const placements = Array.isArray(placementsData) ? placementsData : [];
  const sponsors = Array.isArray(sponsorsData) ? sponsorsData : [];

  const organizations = ['all', ...Array.from(new Set(sponsors.map((s: any) => s.name)))];
  
  const filteredSponsors = selectedOrg === 'all' 
    ? sponsors 
    : sponsors.filter((s: any) => s.name === selectedOrg);

  const sponsorSummary = filteredSponsors.reduce((acc: any, sponsor: any) => {
    const name = sponsor.name || 'Unknown';
    if (!acc[name]) {
      acc[name] = { count: 0, total: 0 };
    }
    acc[name].count++;
    acc[name].total += sponsor.amount || 0;
    return acc;
  }, {});

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Placement Pipeline</h1>
        
        {organizations.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Organizations</option>
              {organizations.filter(o => o !== 'all').map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Suspense fallback={<FinanceDashboardSkeleton />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PipelineChart
            activePlacements={Number(realtimeData?.metrics?.activePlacements || 0)}
            conversionRate={Number(realtimeData?.metrics?.conversionRate || 0)}
            monthlyRevenue={Number(realtimeData?.metrics?.monthlyRevenue || 0)}
          />
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Placement Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Placements</span>
                  <span className="text-white font-semibold">{filteredSponsors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Value</span>
                  <span className="text-white font-semibold">
                    KES {filteredSponsors.reduce((sum: number, s: any) => sum + (s.amount || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Organizations</span>
                  <span className="text-white font-semibold">{Object.keys(sponsorSummary).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {Object.keys(sponsorSummary).length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Sponsor/Employer Payments</h3>
              <div className="space-y-3">
                {Object.entries(sponsorSummary).map(([sponsor, data]: [string, any]) => (
                  <div key={sponsor} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-cyan-500" />
                      <div>
                        <p className="text-white font-medium">{sponsor}</p>
                        <p className="text-sm text-slate-400">{data.count} placements</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">KES {data.total.toLocaleString()}</p>
                      <p className="text-sm text-slate-400">
                        KES {data.count > 0 ? Math.round(data.total / data.count).toLocaleString() : '0'}/placement
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {filteredSponsors.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Placements</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-sm text-slate-400 pb-3">Organization</th>
                      <th className="text-left text-sm text-slate-400 pb-3">Amount</th>
                      <th className="text-left text-sm text-slate-400 pb-3">Status</th>
                      <th className="text-left text-sm text-slate-400 pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSponsors.map((sponsor: any) => (
                      <tr key={sponsor.id} className="border-b border-slate-800">
                        <td className="py-3 text-white">{sponsor.name}</td>
                        <td className="py-3 text-white font-semibold">KES {(sponsor.amount || 0).toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            sponsor.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {sponsor.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{sponsor.dueDate || sponsor.lastPayment || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredSponsors.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center text-slate-400">
              No placement data available
            </CardContent>
          </Card>
        )}

        <PlacementPipeline
          activePlacements={filteredSponsors.length}
          totalValue={filteredSponsors.reduce((sum: number, s: any) => sum + (s.amount || 0), 0)}
          averageSalary={
            filteredSponsors.length > 0
              ? filteredSponsors.reduce((sum: number, s: any) => sum + (s.amount || 0), 0) / filteredSponsors.length
              : 0
          }
        />
      </Suspense>
    </div>
  );
}

export default function PlacementsPage() {
  return (
    <RouteGuard requiredRoles={['finance']}>
      <PlacementsContent />
    </RouteGuard>
  );
}
