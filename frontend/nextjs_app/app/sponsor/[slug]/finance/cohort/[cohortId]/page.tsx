'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  FileText,
  Target,
  Users,
  Calendar,
  Download,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react';

interface CohortBillingData {
  cohort: {
    id: string;
    name: string;
    track_slug: string;
    students_enrolled: number;
    target_size: number;
    budget_allocated: number;
    placement_goal: number;
  };
  billing_history: Array<{
    billing_month: string;
    students_active: number;
    platform_cost: number;
    mentor_cost: number;
    lab_cost: number;
    scholarship_cost: number;
    total_cost: number;
    revenue_share_kes: number;
    net_amount: number;
    hires: number;
    payment_status: string;
    payment_date?: string;
    invoice_generated: boolean;
  }>;
  transaction_history: Array<{
    id: string;
    transaction_type: string;
    description: string;
    amount: number;
    currency: string;
    status: string;
    period_start?: string;
    period_end?: string;
    created_at: string;
  }>;
  revenue_share_details: Array<{
    id: string;
    student_name: string;
    employer_name: string;
    role_title: string;
    first_year_salary_kes: number;
    revenue_share_3pct: number;
    payment_status: string;
    paid_date?: string;
    created_at: string;
  }>;
  summary: {
    total_billed: number;
    total_paid: number;
    total_revenue_share: number;
    total_hires: number;
  };
}

export default function CohortBillingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const cohortId = params.cohortId as string;

  const [billingData, setBillingData] = useState<CohortBillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, [slug, cohortId]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/sponsors/${slug}/cohorts/${cohortId}/billing/`,
        {
          // Add auth headers when authentication is implemented
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch billing data: ${response.status}`);
      }

      const data: CohortBillingData = await response.json();
      setBillingData(data);
    } catch (err: any) {
      console.error('Error fetching billing data:', err);
      setError(err.message || 'Failed to load billing data');

      // Mock data for development
      setBillingData({
        cohort: {
          id: cohortId,
          name: 'Jan 2026 - Defender',
          track_slug: 'defender',
          students_enrolled: 127,
          target_size: 187,
          budget_allocated: 5000000,
          placement_goal: 25
        },
        billing_history: [
          {
            billing_month: '2026-01-01',
            students_active: 127,
            platform_cost: 2540000,
            mentor_cost: 800000,
            lab_cost: 600000,
            scholarship_cost: 0,
            total_cost: 3940000,
            revenue_share_kes: 1280000,
            net_amount: 2660000,
            hires: 12,
            payment_status: 'paid',
            payment_date: '2026-01-15T10:00:00Z',
            invoice_generated: true
          },
          {
            billing_month: '2026-02-01',
            students_active: 150,
            platform_cost: 3000000,
            mentor_cost: 900000,
            lab_cost: 700000,
            scholarship_cost: 100000,
            total_cost: 4700000,
            revenue_share_kes: 0,
            net_amount: 4700000,
            hires: 0,
            payment_status: 'invoiced',
            invoice_generated: true
          }
        ],
        transaction_history: [
          {
            id: '1',
            transaction_type: 'platform_fee',
            description: 'Monthly platform fee for Jan 2026',
            amount: -3940000,
            currency: 'KES',
            status: 'paid',
            period_start: '2026-01-01',
            period_end: '2026-01-31',
            created_at: '2026-01-01T10:00:00Z'
          },
          {
            id: '2',
            transaction_type: 'revenue_share',
            description: 'Revenue share credits for Jan 2026 hires',
            amount: 1280000,
            currency: 'KES',
            status: 'paid',
            created_at: '2026-01-15T14:30:00Z'
          }
        ],
        revenue_share_details: [
          {
            id: '1',
            student_name: 'Sarah K.',
            employer_name: 'MTN',
            role_title: 'SOC Analyst L1',
            first_year_salary_kes: 2160000,
            revenue_share_3pct: 64800,
            payment_status: 'paid',
            paid_date: '2026-01-15T14:30:00Z',
            created_at: '2026-01-15T14:30:00Z'
          }
        ],
        summary: {
          total_billed: 7360000,
          total_paid: 2660000,
          total_revenue_share: 1280000,
          total_hires: 12
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPayment = async (billingRecordId: string) => {
    if (!billingData) return;

    setProcessingPayment(billingRecordId);
    try {
      const response = await fetch(`/api/sponsors/${slug}/payments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers when authentication is implemented
        },
        body: JSON.stringify({
          billing_record_id: billingRecordId,
          payment_date: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Payment update failed: ${response.status}`);
      }

      const result = await response.json();

      // Refresh data
      await fetchBillingData();

      // Show success message
      alert(`Payment marked as paid: KES ${(result.amount_paid / 1000).toFixed(0)}K`);

    } catch (err: any) {
      console.error('Error marking payment:', err);
      alert(`Payment update failed: ${err.message}`);
    } finally {
      setProcessingPayment(null);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'KES') => {
    if (amount >= 1000000) return `${currency} ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${currency} ${(amount / 1000).toFixed(0)}K`;
    return `${currency} ${amount}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Billing Details</h2>
          <p className="text-slate-400">Fetching cohort financial data...</p>
        </div>
      </div>
    );
  }

  if (error || !billingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Data</h2>
          <p className="text-slate-400 mb-6">{error || 'Unable to load billing information'}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={fetchBillingData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Link href={`/sponsor/${slug}/finance`}>
              <Button variant="outline" className="text-slate-400 border-slate-600">
                Back to Finance
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { cohort, billing_history, transaction_history, revenue_share_details, summary } = billingData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link href={`/sponsor/${slug}/finance`}>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Finance
              </Button>
            </Link>
            <span className="text-slate-400">/</span>
            <Link href={`/sponsor/${slug}/finance/cohort/${cohortId}`}>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                {cohort.name}
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{cohort.name}</h1>
              <p className="text-slate-400">
                {cohort.track_slug} Track • {cohort.students_enrolled} Students • Billing & Payment History
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" className="text-slate-400 border-slate-600">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <FileText className="w-4 h-4 mr-2" />
                Generate Invoice
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-slate-900/30 border-amber-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Billed</p>
                <p className="text-amber-400 text-2xl font-bold">
                  {formatCurrency(summary.total_billed)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-400" />
            </div>
          </Card>

          <Card className="p-6 bg-slate-900/50 border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Paid</p>
                <p className="text-green-400 text-2xl font-bold">
                  {formatCurrency(summary.total_paid)}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </Card>

          <Card className="p-6 bg-slate-900/50 border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Revenue Share</p>
                <p className="text-blue-400 text-2xl font-bold">
                  {formatCurrency(summary.total_revenue_share)}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-400" />
            </div>
          </Card>

          <Card className="p-6 bg-slate-900/50 border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Hires</p>
                <p className="text-purple-400 text-2xl font-bold">
                  {summary.total_hires}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </Card>
        </div>

        {/* Billing History */}
        <Card className="p-6 bg-slate-900/50 border-slate-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Billing History</h2>

          <div className="space-y-4">
            {billing_history.map((billing, index) => (
              <div key={billing.billing_month} className="border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/20 rounded-lg">
                      <Calendar className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        {new Date(billing.billing_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {billing.students_active} active students • {billing.hires} hires
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className={`${
                      billing.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' :
                      billing.payment_status === 'invoiced' ? 'bg-blue-500/20 text-blue-400' :
                      billing.payment_status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {billing.payment_status}
                    </Badge>

                    {billing.payment_status !== 'paid' && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkPayment(`billing_${index}`)}
                        disabled={processingPayment === `billing_${index}`}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingPayment === `billing_${index}` ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-1" />
                            Mark Paid
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-white font-semibold">{formatCurrency(billing.platform_cost)}</div>
                    <div className="text-slate-400 text-xs">Platform</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold">{formatCurrency(billing.mentor_cost)}</div>
                    <div className="text-slate-400 text-xs">Mentors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold">{formatCurrency(billing.lab_cost)}</div>
                    <div className="text-slate-400 text-xs">Labs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold">{formatCurrency(billing.scholarship_cost)}</div>
                    <div className="text-slate-400 text-xs">Scholarships</div>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div>
                    <div className="text-white font-semibold">{formatCurrency(billing.total_cost)}</div>
                    <div className="text-slate-400 text-xs">Total Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-semibold">-{formatCurrency(billing.revenue_share_kes)}</div>
                    <div className="text-slate-400 text-xs">Revenue Share</div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 font-semibold">{formatCurrency(billing.net_amount)}</div>
                    <div className="text-slate-400 text-xs">Net Amount</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue Share Details */}
        <Card className="p-6 bg-slate-900/50 border-slate-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Revenue Share Details</h2>

          {revenue_share_details.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No revenue share details available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {revenue_share_details.map((share) => (
                <div key={share.id} className="flex items-center justify-between p-4 border border-slate-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Target className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{share.student_name}</h4>
                      <p className="text-slate-400 text-sm">
                        {share.employer_name} • {share.role_title}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {formatCurrency(share.first_year_salary_kes)} annual salary
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-green-400 font-semibold">
                      {formatCurrency(share.revenue_share_3pct)}
                    </div>
                    <div className="text-slate-400 text-xs">OCH Share (3%)</div>
                    <Badge className={`mt-1 ${
                      share.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {share.payment_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card className="p-6 bg-slate-900/50 border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6">Recent Transactions</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="text-left p-3 text-slate-400 font-medium">Date</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Type</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Description</th>
                  <th className="text-right p-3 text-slate-400 font-medium">Amount</th>
                  <th className="text-center p-3 text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {transaction_history.slice(0, 10).map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="p-3 text-slate-300">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <Badge className={`${
                        transaction.transaction_type === 'platform_fee' ? 'bg-blue-500/20 text-blue-400' :
                        transaction.transaction_type === 'revenue_share' ? 'bg-green-500/20 text-green-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {transaction.transaction_type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3 text-white max-w-xs truncate">
                      {transaction.description}
                    </td>
                    <td className={`p-3 text-right font-medium ${
                      transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge className={`${
                        transaction.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        transaction.status === 'invoiced' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {transaction.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
