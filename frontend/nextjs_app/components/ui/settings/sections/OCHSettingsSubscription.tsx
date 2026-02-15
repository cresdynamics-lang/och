'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, AlertCircle, CheckCircle2, Zap, Calendar, DollarSign, Shield, Target
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { apiGateway } from '@/services/apiGateway';

interface SubscriptionData {
  tier: 'free' | 'starter' | 'professional';
  status: 'active' | 'inactive' | 'past_due' | 'cancelled';
  enhanced_access_until?: string;
  days_enhanced_left?: number;
  next_payment?: string;
  grace_period_until?: string;
  can_upgrade: boolean;
  features: string[];
}

interface Plan {
  id: string;
  name: string;
  tier: string;
  price_monthly: number;
  features: string[];
  enhanced_access_days: number | null;
  mentorship_access: boolean;
  talentscope_access: string;
  missions_access_type: string;
  mode_note: string;
}

export function OCHSettingsSubscription() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, [user?.id]);

  const loadSubscription = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const [statusData, plansData] = await Promise.all([
        apiGateway.get<any>('/subscription/status'),
        apiGateway.get<Plan[]>('/subscription/plans'),
      ]);

      setSubscription({
        tier: statusData.tier || 'free',
        status: statusData.status || 'inactive',
        enhanced_access_until: statusData.enhanced_access_until,
        days_enhanced_left: statusData.days_enhanced_left,
        next_payment: statusData.next_payment,
        grace_period_until: statusData.grace_period_until,
        can_upgrade: statusData.can_upgrade !== false,
        features: statusData.features || [],
      });
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (err: any) {
      console.error('Failed to load subscription:', err);
      setError(err?.message || 'Failed to load subscription data');
      setSubscription({
        tier: 'free',
        status: 'inactive',
        can_upgrade: true,
        features: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeOrDowngrade = async (planName: string, action: 'upgrade' | 'downgrade') => {
    setUpgrading(true);
    setError(null);
    try {
      await apiGateway.post('/subscription/simulate-payment', { plan: planName });
      await loadSubscription();
      alert(`Successfully ${action}d to ${planName} plan!`);
    } catch (err: any) {
      setError(err?.message || `${action.charAt(0).toUpperCase() + action.slice(1)} failed`);
    } finally {
      setUpgrading(false);
    }
  };

  const getTierDisplayName = (tier: string): string => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getStatusBadgeVariant = (status: string): 'mint' | 'orange' | 'steel' | 'gold' => {
    switch (status) {
      case 'active':
        return 'mint';
      case 'past_due':
        return 'orange';
      case 'cancelled':
        return 'steel';
      default:
        return 'steel';
    }
  };

  const getTierBadgeVariant = (tier: string): 'gold' | 'mint' | 'defender' | 'steel' => {
    switch (tier) {
      case 'professional':
        return 'gold';
      case 'starter':
        return 'mint';
      case 'free':
        return 'steel';
      default:
        return 'steel';
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-och-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-och-steel font-black uppercase tracking-widest text-xs">Loading Subscription Data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-och-orange mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Subscription</h2>
              <p className="text-och-steel mb-6">{error}</p>
              <Button variant="defender" onClick={loadSubscription}>Retry</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-och-gold" />
              Subscription & Access Control
            </h1>
            <p className="text-och-steel text-sm italic max-w-2xl">
              Manage your subscription tier and feature entitlements
            </p>
          </div>
          <div className="flex items-center gap-4">
            {subscription && (
              <>
                <Badge variant={getTierBadgeVariant(subscription.tier)} className="text-xs font-black uppercase">
                  {getTierDisplayName(subscription.tier)} Tier
                </Badge>
                <Badge variant={getStatusBadgeVariant(subscription.status)} className="text-xs font-black uppercase">
                  {subscription.status === 'active' ? 'Active' : 
                   subscription.status === 'past_due' ? 'Past Due' :
                   subscription.status === 'cancelled' ? 'Cancelled' : 'Inactive'}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Current Subscription */}
        {subscription && (
          <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-och-gold/10 flex items-center justify-center border border-och-gold/20">
                <CreditCard className="w-6 h-6 text-och-gold" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Current Subscription</h2>
                <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Your active plan and entitlements</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-och-gold" />
                  <p className="text-xs font-bold text-och-steel uppercase tracking-widest">Tier</p>
                </div>
                <p className="text-2xl font-bold text-white">{getTierDisplayName(subscription.tier)}</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-och-defender" />
                  <p className="text-xs font-bold text-och-steel uppercase tracking-widest">Status</p>
                </div>
                <p className="text-2xl font-bold text-white capitalize">{subscription.status}</p>
              </div>

              {subscription.next_payment && (
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-och-mint" />
                    <p className="text-xs font-bold text-och-steel uppercase tracking-widest">Next Payment</p>
                  </div>
                  <p className="text-lg font-bold text-white">{formatDate(subscription.next_payment)}</p>
                </div>
              )}
            </div>

            {/* Enhanced Access Info */}
            {subscription.enhanced_access_until && subscription.days_enhanced_left !== undefined && (
              <div className="p-4 bg-och-gold/5 border border-och-gold/20 rounded-xl mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Enhanced Access Active</p>
                    <p className="text-xs text-och-steel">
                      {subscription.days_enhanced_left > 0 
                        ? `${subscription.days_enhanced_left} days remaining until ${formatDate(subscription.enhanced_access_until)}`
                        : `Expired on ${formatDate(subscription.enhanced_access_until)}`}
                    </p>
                  </div>
                  <Badge variant="gold" className="text-xs font-black uppercase">
                    {subscription.days_enhanced_left > 0 ? 'Active' : 'Expired'}
                  </Badge>
                </div>
              </div>
            )}

            {/* Grace Period Info */}
            {subscription.grace_period_until && (
              <div className="p-4 bg-och-orange/5 border border-och-orange/20 rounded-xl mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Grace Period</p>
                    <p className="text-xs text-och-steel">
                      Grace period until {formatDate(subscription.grace_period_until)}
                    </p>
                  </div>
                  <Badge variant="orange" className="text-xs font-black uppercase">
                    Active
                  </Badge>
                </div>
              </div>
            )}

            {/* Features List */}
            {subscription.features && subscription.features.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Included Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subscription.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-och-mint flex-shrink-0" />
                      <span className="text-sm text-white">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              {subscription.can_upgrade && subscription.tier !== 'professional' && (
                <Button
                  variant="gold"
                  onClick={() => router.push('/dashboard/student/subscription')}
                >
                  Upgrade Subscription
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/student/subscription')}
              >
                Manage Subscription
              </Button>
              <Button
                variant="outline"
                onClick={loadSubscription}
              >
                Refresh Status
              </Button>
            </div>
          </Card>
        )}

        {/* Subscription Tiers Info */}
        <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-och-mint/10 flex items-center justify-center border border-och-mint/20">
              <Target className="w-6 h-6 text-och-mint" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Available Tiers</h2>
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Choose the plan that fits your needs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => {
              const isCurrent = plan.tier === subscription?.tier ||
                (plan.tier === 'premium' && subscription?.tier === 'professional')

              // Determine if this is an upgrade or downgrade
              const TIER_LEVEL: Record<string, number> = { free: 0, starter: 1, premium: 2, professional: 2 }
              const currentTierLevel = TIER_LEVEL[subscription?.tier || 'free'] ?? 0
              const planTierLevel = TIER_LEVEL[plan.tier] ?? 0
              const isUpgrade = planTierLevel > currentTierLevel
              const isDowngrade = planTierLevel < currentTierLevel

              const tierColors = {
                free: { bg: 'bg-white/5', border: 'border-white/5', badge: 'steel' as const },
                starter: { bg: 'bg-och-mint/5', border: 'border-och-mint/20', badge: 'mint' as const },
                premium: { bg: 'bg-och-gold/5', border: 'border-och-gold/20', badge: 'gold' as const },
              }
              const colors = tierColors[plan.tier as keyof typeof tierColors] || tierColors.free

              return (
                <div key={plan.id} className={`p-6 ${colors.bg} border ${colors.border} rounded-xl`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white capitalize">{plan.name}</h3>
                    {isCurrent && <Badge variant={colors.badge}>Current</Badge>}
                  </div>

                  <div className="mb-4">
                    <span className="text-2xl font-bold text-white">${plan.price_monthly.toFixed(0)}</span>
                    <span className="text-sm text-och-steel">/month</span>
                  </div>

                  {plan.mode_note && (
                    <p className="text-sm text-och-steel mb-4">{plan.mode_note}</p>
                  )}

                  <ul className="space-y-2 mb-6 min-h-[120px]">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-white">
                        <CheckCircle2 className={`w-4 h-4 ${plan.tier === 'premium' ? 'text-och-gold' : 'text-och-mint'}`} />
                        {feature.replace(/_/g, ' ')}
                      </li>
                    ))}
                    {plan.mentorship_access && (
                      <li className="flex items-center gap-2 text-sm text-white">
                        <CheckCircle2 className="w-4 h-4 text-och-gold" />
                        Human mentorship
                      </li>
                    )}
                    {plan.enhanced_access_days && (
                      <li className="flex items-center gap-2 text-sm text-och-gold">
                        <CheckCircle2 className="w-4 h-4 text-och-gold" />
                        {Math.round(plan.enhanced_access_days / 30)}mo Enhanced Access
                      </li>
                    )}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      variant={plan.tier === 'premium' ? 'gold' : 'mint'}
                      className="w-full"
                      disabled={upgrading}
                      onClick={() => handleUpgradeOrDowngrade(plan.name, 'upgrade')}
                    >
                      {upgrading ? 'Processing...' : `Upgrade — $${plan.price_monthly.toFixed(0)}/mo`}
                    </Button>
                  ) : isDowngrade ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={upgrading}
                      onClick={() => handleUpgradeOrDowngrade(plan.name, 'downgrade')}
                    >
                      {upgrading ? 'Processing...' : 'Downgrade'}
                    </Button>
                  ) : null}
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}


