"use client"

import { Suspense, useState } from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent } from "@/components/ui/card-enhanced";
import { useAuth } from '@/hooks/useAuth';
import { FinanceDashboardSkeleton } from "../dashboard/components";
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Filter } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SubscriptionsContent() {
  const { user } = useAuth();
  const userId = user?.id || 'finance-user';
  const [selectedPlan, setSelectedPlan] = useState('all');

  const { data: subscriptionsData } = useSWR(`/api/finance/${userId}/subscriptions`, fetcher);
  const plans = subscriptionsData?.plans || [];

  const usersUrl = selectedPlan === 'all' 
    ? `/api/finance/${userId}/subscription-users`
    : `/api/finance/${userId}/subscription-users?plan=${selectedPlan}`;
  
  const { data: usersData } = useSWR(usersUrl, fetcher);
  const users = Array.isArray(usersData) ? usersData : [];

  const filteredPlans = selectedPlan === 'all' 
    ? plans 
    : plans.filter((p: any) => p.id === selectedPlan);

  const totalSubscribers = filteredPlans.reduce((sum: number, p: any) => sum + (p.users || 0), 0);
  const totalRevenue = filteredPlans.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Subscription Management</h1>
        
        {plans.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Plans</option>
              {plans.map((plan: any) => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Suspense fallback={<FinanceDashboardSkeleton />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <p className="text-sm text-slate-400">Active Subscribers</p>
              <p className="text-2xl font-bold text-white">{totalSubscribers}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <p className="text-sm text-slate-400">Monthly Revenue</p>
              <p className="text-2xl font-bold text-white">KES {totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <p className="text-sm text-slate-400">Plans</p>
              <p className="text-2xl font-bold text-white">{filteredPlans.length}</p>
              <p className="text-xs text-slate-500 mt-1">Active plans</p>
            </CardContent>
          </Card>
        </div>

        {filteredPlans.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center text-slate-400">
              No subscription data available
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {filteredPlans.map((plan: any) => (
                <Card key={plan.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">{plan.name} Plan</h3>
                        <p className="text-sm text-slate-400 mt-1">{plan.users || 0} active subscribers</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">KES {(plan.revenue || 0).toLocaleString()}</p>
                        <p className="text-sm text-slate-400">KES {(plan.price_monthly || 0).toLocaleString()}/month per user</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Subscribers</h3>
                {users.length === 0 ? (
                  <p className="text-center text-slate-400">No subscribers found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left text-sm text-slate-400 pb-3">User</th>
                          <th className="text-left text-sm text-slate-400 pb-3">Plan</th>
                          <th className="text-left text-sm text-slate-400 pb-3">Status</th>
                          <th className="text-left text-sm text-slate-400 pb-3">Expires</th>
                          <th className="text-left text-sm text-slate-400 pb-3">Monthly Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((sub: any) => (
                          <tr key={sub.id} className="border-b border-slate-800">
                            <td className="py-3">
                              <div>
                                <p className="text-white">{sub.user_name}</p>
                                <p className="text-xs text-slate-400">{sub.user_email}</p>
                              </div>
                            </td>
                            <td className="py-3 text-slate-300">{sub.plan_name}</td>
                            <td className="py-3">
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-3 text-slate-400">
                              {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}
                              {sub.days_remaining !== null && (
                                <span className="text-xs block">{sub.days_remaining} days left</span>
                              )}
                            </td>
                            <td className="py-3 text-white font-semibold">KES {Number(sub.price_monthly ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Suspense>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <RouteGuard requiredRoles={['finance']}>
      <SubscriptionsContent />
    </RouteGuard>
  );
}
