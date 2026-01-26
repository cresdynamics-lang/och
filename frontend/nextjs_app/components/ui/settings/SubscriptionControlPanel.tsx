/**
 * Subscription Control Panel Component
 * Modern feature grid with upgrade CTAs, billing history, payment methods, and usage analytics
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, ArrowRight, X, CreditCard, Calendar, TrendingUp, BarChart3, Receipt, Clock, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// Local types to replace missing @/lib/settings imports
export interface UserEntitlements {
  tier: 'free' | 'starter' | 'professional' | 'starter_3' | 'professional_7';
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  aiCoachFullAccess?: boolean;
  mentorAccess?: boolean;
  portfolioExportEnabled?: boolean;
  missionAccess?: 'basic' | 'full';
  portfolioCapabilities?: string[];
  enhancedAccessUntil?: string;
  nextBillingDate?: string;
  [key: string]: any;
}

export interface UserSettings {
  [key: string]: any;
}

/**
 * Checks if a user has access to a feature based on entitlements
 * Stub implementation to replace missing @/lib/settings/entitlements
 */
export function checkFeatureAccess(
  entitlements: UserEntitlements, 
  settings: UserSettings, 
  feature: string
): { enabled: boolean; reason: string } {
  // Normalize tier value (handle both 'professional' and 'professional_7', etc.)
  const tier = entitlements.tier;
  const normalizedTier = tier === 'professional_7' || tier === 'professional' ? 'professional' :
                         tier === 'starter_3' || tier === 'starter' ? 'starter' : 'free';

  if (feature === 'ai_coach_full') {
    return normalizedTier === 'professional'
      ? { enabled: true, reason: 'Unlimited with Professional' }
      : normalizedTier === 'starter'
      ? { enabled: true, reason: 'Enhanced with Starter' }
      : { enabled: false, reason: 'Limited in Free' };
  }

  if (feature === 'mentor_access') {
    return normalizedTier !== 'free'
      ? { enabled: true, reason: 'Included in your plan' }
      : { enabled: false, reason: 'Requires Starter+' };
  }

  if (feature === 'portfolio_export') {
    return normalizedTier !== 'free'
      ? { enabled: true, reason: 'Included in your plan' }
      : { enabled: false, reason: 'Requires Starter+' };
  }

  return { enabled: true, reason: 'Basic access' };
}

/**
 * Gets upgrade recommendations based on current status
 */
export function getUpgradeRecommendations(entitlements: UserEntitlements, settings: UserSettings): string[] {
  const recs: string[] = [];
  // Normalize tier value
  const tier = entitlements.tier;
  const normalizedTier = tier === 'professional_7' || tier === 'professional' ? 'professional' :
                         tier === 'starter_3' || tier === 'starter' ? 'starter' : 'free';
  
  if (normalizedTier === 'free') {
    recs.push('Upgrade to Starter to unlock Mentor Reviews');
    recs.push('Upgrade to Professional for Unlimited AI Coaching');
  } else if (normalizedTier === 'starter') {
    recs.push('Upgrade to Professional for Unlimited AI Coaching');
  }
  return recs;
}

interface SubscriptionControlPanelProps {
  entitlements: UserEntitlements | null;
  settings: UserSettings | null;
}

export function SubscriptionControlPanel({ entitlements, settings }: SubscriptionControlPanelProps) {
  // All hooks must be called before any conditional returns
  const [showBillingHistory, setShowBillingHistory] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showUsageAnalytics, setShowUsageAnalytics] = useState(false);
  
  // Always render with defaults if data is missing
  if (!entitlements || !settings) {
    return (
      <div className="space-y-6">
        <Card className="glass-card glass-card-hover">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-indigo-400" />
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Subscription</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Subscription data is loading...
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const recommendations = getUpgradeRecommendations(entitlements, settings);
  const aiCoachAccess = checkFeatureAccess(entitlements, settings, 'ai_coach_full');
  const mentorAccess = checkFeatureAccess(entitlements, settings, 'mentor_access');
  const portfolioExport = checkFeatureAccess(entitlements, settings, 'portfolio_export');

  // Fetch billing history from API
  const [billingHistory, setBillingHistory] = useState<Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
    description: string;
  }>>([]);
  const [billingLoading, setBillingLoading] = useState(false);

  // Fetch billing history and refetch when entitlements change
  useEffect(() => {
    const fetchBillingHistory = async () => {
      setBillingLoading(true);
      try {
        const { apiGateway } = await import('@/services/apiGateway');
        const response = await apiGateway.get('/subscription/billing-history') as any;
        // Handle both array response and object with billing_history property
        if (Array.isArray(response)) {
          setBillingHistory(response);
        } else if (response && response.billing_history) {
          setBillingHistory(response.billing_history);
        } else {
          setBillingHistory([]);
        }
      } catch (error) {
        console.error('Error fetching billing history:', error);
        setBillingHistory([]);
      } finally {
        setBillingLoading(false);
      }
    };

    if (showBillingHistory) {
      fetchBillingHistory();
    }
  }, [showBillingHistory, entitlements?.tier]); // Refetch when tier changes

  // Normalize tier for comparison first
  const tier = entitlements.tier;
  const normalizedTier = tier === 'professional_7' || tier === 'professional' ? 'professional' :
                         tier === 'starter_3' || tier === 'starter' ? 'starter' : 'free';

  // Mock payment methods - in production, fetch from Stripe/Paystack
  const paymentMethods = [
    { id: '1', type: 'card', last4: '4242', brand: 'Visa', expiryMonth: 12, expiryYear: 2025, isDefault: true },
  ];

  // Mock usage analytics (use normalized tier)
  const usageStats = {
    aiCoachMessages: { used: 245, limit: normalizedTier === 'professional' ? -1 : normalizedTier === 'starter' ? 600 : 150 },
    mentorSessions: { used: 3, limit: entitlements.mentorAccess ? -1 : 0 },
    portfolioExports: { used: 2, limit: entitlements.portfolioExportEnabled ? -1 : 0 },
  };
  
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      priceLabel: 'Free forever',
      features: [
        { name: 'Basic portfolio', included: true },
        { name: 'Limited AI Coach (5 messages/day)', included: true },
        { name: 'Community access', included: true },
        { name: 'Mentor reviews', included: false },
        { name: 'Portfolio export', included: false },
        { name: 'Unlimited AI Coach', included: false },
        { name: 'Priority support', included: false },
      ],
      current: normalizedTier === 'free',
    },
    {
      name: 'Starter',
      price: '$29',
      priceLabel: 'per month',
      features: [
        { name: 'Everything in Free', included: true },
        { name: 'Mentor access', included: true },
        { name: 'Portfolio export', included: true },
        { name: 'Enhanced AI Coach (20 messages/day)', included: true },
        { name: 'Unlimited AI Coach', included: false },
        { name: 'Priority support', included: false },
      ],
      current: normalizedTier === 'starter',
    },
    {
      name: 'Professional',
      price: '$99',
      priceLabel: 'per month',
      features: [
        { name: 'Everything in Starter', included: true },
        { name: 'Unlimited AI Coach', included: true },
        { name: 'Priority support', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom habits', included: true },
      ],
      current: normalizedTier === 'professional',
    },
  ];

  const currentTier = tiers.find(t => t.current) || tiers[0];
  const canUpgrade = normalizedTier !== 'professional';

  return (
    <div className="space-y-6">
      {/* Current Tier Card */}
      <Card className="glass-card glass-card-hover">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-indigo-400" />
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Subscription</h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage your plan and feature access
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-semibold text-slate-400 mb-1">Current Plan</div>
                <div className="text-2xl font-bold text-slate-100 capitalize">
                  {normalizedTier === 'professional' ? 'Professional' : 
                   normalizedTier === 'starter' ? 'Starter' : 'Free'}
                </div>
                <div className="text-sm text-slate-500 mt-1">{currentTier.priceLabel}</div>
              </div>
              <Badge
                variant={entitlements.subscriptionStatus === 'active' ? 'mint' : 'steel'}
                className="bg-gradient-to-r from-indigo-500 to-purple-500"
              >
                {entitlements.subscriptionStatus}
              </Badge>
            </div>
          {entitlements.enhancedAccessUntil && (
            <div className="text-xs text-amber-400 mt-2">
              Enhanced access until {new Date(entitlements.enhancedAccessUntil).toLocaleDateString()}
            </div>
          )}
          {entitlements.nextBillingDate && (
            <div className="text-xs text-slate-400 mt-2">
              Next billing: {new Date(entitlements.nextBillingDate).toLocaleDateString()}
            </div>
          )}
          </div>

          {/* Feature Access Grid */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Unlocked Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                aiCoachAccess.enabled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
              }`}>
                <div>
                  <div className="text-sm font-medium text-slate-200">AI Coach Full Access</div>
                  <div className="text-xs text-slate-500">{aiCoachAccess.reason}</div>
                </div>
                {aiCoachAccess.enabled ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <X className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                mentorAccess.enabled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
              }`}>
                <div>
                  <div className="text-sm font-medium text-slate-200">Mentor Access</div>
                  <div className="text-xs text-slate-500">Get mentor reviews and feedback</div>
                </div>
                {mentorAccess.enabled ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <X className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                portfolioExport.enabled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
              }`}>
                <div>
                  <div className="text-sm font-medium text-slate-200">Portfolio Export</div>
                  <div className="text-xs text-slate-500">Download portfolio as PDF/JSON</div>
                </div>
                {portfolioExport.enabled ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <X className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                entitlements.missionAccess === 'full' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
              }`}>
                <div>
                  <div className="text-sm font-medium text-slate-200">Mission Access</div>
                  <div className="text-xs text-slate-500">
                    {entitlements.missionAccess === 'full' ? 'Full access to all missions' : 'Basic mission access'}
                  </div>
                </div>
                {entitlements.missionAccess === 'full' ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <X className="w-5 h-5 text-slate-600" />
                )}
              </div>
              {entitlements.portfolioCapabilities && entitlements.portfolioCapabilities.length > 0 && (
                <div className="p-3 rounded-lg border bg-indigo-500/10 border-indigo-500/30">
                  <div className="text-sm font-medium text-slate-200 mb-2">Portfolio Capabilities</div>
                  <div className="flex flex-wrap gap-2">
                    {entitlements.portfolioCapabilities.map((cap, idx) => (
                      <Badge key={idx} variant="steel" className="text-xs bg-indigo-500/20 text-indigo-400">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade CTA */}
          {canUpgrade && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/50 rounded-xl p-6 text-center"
            >
              <h3 className="text-lg font-bold text-slate-100 mb-2">Upgrade to Professional</h3>
              <p className="text-sm text-slate-400 mb-4">
                Unlock unlimited AI Coach and priority support
              </p>
              <div className="flex gap-3">
                <Button
                  variant="defender"
                  size="lg"
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                  onClick={() => {
                    // Navigate to upgrade page
                    window.location.href = '/dashboard/student/subscription/upgrade?plan=professional_7';
                  }}
                >
                  Upgrade Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    // Open billing portal for current plan management
                    window.open('/api/billing/portal', '_blank');
                  }}
                >
                  Manage Billing
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Tier Comparison */}
      <Card className="glass-card glass-card-hover">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tier.current
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-slate-100">{tier.name}</div>
                    <div className="text-sm text-slate-400">{tier.price} {tier.priceLabel}</div>
                  </div>
                  {tier.current && (
                    <Badge variant="steel" className="bg-indigo-500/20 text-indigo-400">
                      Current
                    </Badge>
                  )}
                </div>
                <ul className="space-y-2 mb-4">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                      {feature.included ? (
                        <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <X className="w-3 h-3 text-slate-600 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-slate-300' : 'text-slate-600'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                {!tier.current && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      const planTier = tier.name === 'Professional' ? 'professional_7' : 
                                      tier.name === 'Starter' ? 'starter_3' : 'free';
                      window.location.href = `/dashboard/student/subscription/upgrade?plan=${planTier}`;
                    }}
                  >
                    {tier.name === 'Professional' ? 'Upgrade' : 'Switch Plan'}
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

          {/* Upgrade Recommendations */}
      {recommendations.length > 0 && (
        <Card className="bg-amber-500/10 border border-amber-500/30 glass-card-hover">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-amber-400 mb-2">Upgrade Recommendations</h3>
            <ul className="space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-xs text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Billing History */}
      <Card className="glass-card glass-card-hover">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Receipt className="w-8 h-8 text-indigo-400" />
              <div>
                <h3 className="text-xl font-bold text-slate-100">Billing History</h3>
                <p className="text-xs text-slate-500 mt-1">View past invoices and payments</p>
              </div>
            </div>
            <button
              onClick={() => setShowBillingHistory(!showBillingHistory)}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              {showBillingHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence>
            {showBillingHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-4"
              >
                {billingHistory.length > 0 ? (
                  billingHistory.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium text-slate-200">{invoice.description}</div>
                          <Badge
                            variant={invoice.status === 'paid' ? 'mint' : 'steel'}
                            className={invoice.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(invoice.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-100">${invoice.amount}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs"
                          onClick={() => {
                            // Open invoice PDF
                            window.open(`/api/billing/invoice/${invoice.id}`, '_blank');
                          }}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p>No billing history available</p>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open('/api/billing/portal', '_blank');
                    }}
                  >
                    Manage Billing Portal
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Payment Methods */}
      <Card className="glass-card glass-card-hover">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-indigo-400" />
              <div>
                <h3 className="text-xl font-bold text-slate-100">Payment Methods</h3>
                <p className="text-xs text-slate-500 mt-1">Manage your payment cards and methods</p>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentMethods(!showPaymentMethods)}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              {showPaymentMethods ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence>
            {showPaymentMethods && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-4"
              >
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-indigo-400" />
                        <div>
                          <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
                            {method.brand} •••• {method.last4}
                            {method.isDefault && (
                              <Badge variant="steel" className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Set as default
                              alert('Setting as default payment method...');
                            }}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          onClick={() => {
                            if (confirm('Are you sure you want to remove this payment method?')) {
                              alert('Payment method removed');
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p className="mb-4">No payment methods on file</p>
                    <Button
                      variant="defender"
                      onClick={() => {
                        window.open('/api/billing/add-payment-method', '_blank');
                      }}
                    >
                      Add Payment Method
                    </Button>
                  </div>
                )}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      window.open('/api/billing/add-payment-method', '_blank');
                    }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Add New Payment Method
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Usage Analytics */}
      <Card className="glass-card glass-card-hover">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-400" />
              <div>
                <h3 className="text-xl font-bold text-slate-100">Usage Analytics</h3>
                <p className="text-xs text-slate-500 mt-1">Track your feature usage and limits</p>
              </div>
            </div>
            <button
              onClick={() => setShowUsageAnalytics(!showUsageAnalytics)}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              {showUsageAnalytics ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence>
            {showUsageAnalytics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 mt-4"
              >
                {/* AI Coach Messages */}
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-slate-200">AI Coach Messages</div>
                    <div className="text-xs text-slate-400">
                      {usageStats.aiCoachMessages.limit === -1
                        ? 'Unlimited'
                        : `${usageStats.aiCoachMessages.used} / ${usageStats.aiCoachMessages.limit}`}
                    </div>
                  </div>
                  {usageStats.aiCoachMessages.limit !== -1 && (
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((usageStats.aiCoachMessages.used / usageStats.aiCoachMessages.limit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Mentor Sessions */}
                {entitlements.mentorAccess && (
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-slate-200">Mentor Sessions</div>
                      <div className="text-xs text-slate-400">
                        {usageStats.mentorSessions.limit === -1
                          ? 'Unlimited'
                          : `${usageStats.mentorSessions.used} / ${usageStats.mentorSessions.limit}`}
                      </div>
                    </div>
                    {usageStats.mentorSessions.limit !== -1 && (
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min((usageStats.mentorSessions.used / usageStats.mentorSessions.limit) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Portfolio Exports */}
                {entitlements.portfolioExportEnabled && (
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-slate-200">Portfolio Exports</div>
                      <div className="text-xs text-slate-400">
                        {usageStats.portfolioExports.limit === -1
                          ? 'Unlimited'
                          : `${usageStats.portfolioExports.used} / ${usageStats.portfolioExports.limit}`}
                      </div>
                    </div>
                    {usageStats.portfolioExports.limit !== -1 && (
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min((usageStats.portfolioExports.used / usageStats.portfolioExports.limit) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                  <p className="text-xs text-indigo-300">
                    <strong>Usage Period:</strong> Current billing cycle resets on{' '}
                    {entitlements.nextBillingDate
                      ? new Date(entitlements.nextBillingDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
