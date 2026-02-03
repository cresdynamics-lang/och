'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SponsorFinanceSidebar } from './components/SponsorFinanceSidebar';
import { RevenueForecasting } from './components/RevenueForecasting';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  FileText,
  BarChart3,
  Settings,
  Plus,
  Download,
  Eye,
  Target
} from 'lucide-react';

export default function SponsorFinancePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleFinanceAction = (action: string, data?: any) => {
    switch (action) {
      case 'settings':
        // TODO: Open finance settings modal
        console.log('Open finance settings');
        break;
      case 'generate_invoice':
        // TODO: Open invoice generation modal
        console.log('Generate new invoice');
        break;
      case 'view_ledger':
        router.push(`/sponsor/${slug}/finance/invoices`);
        break;
      case 'view_all_invoices':
        router.push(`/sponsor/${slug}/finance/invoices`);
        break;
      case 'download_invoice':
        // TODO: Download specific invoice
        console.log('Download invoice for cohort:', data);
        break;
      case 'mark_paid':
        // TODO: Mark payment as paid
        console.log('Mark payment as paid for cohort:', data);
        break;
      default:
        console.log('Unknown finance action:', action, data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Finance Sidebar */}
      <SponsorFinanceSidebar
        sponsorSlug={slug}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onFinanceAction={handleFinanceAction}
      />

      {/* Main Content Area */}
      <div className="md:ml-80">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-slate-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Finance</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Link href={`/sponsor/${slug}/dashboard`}>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>
              </div>

              <h1 className="text-3xl font-bold text-white mb-2">Financial Overview</h1>
              <p className="text-slate-400">
                Complete transparency into your OCH investment returns, billing, and revenue sharing.
              </p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-slate-900/30 border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total ROI</p>
                    <p className="text-amber-400 text-3xl font-bold">4.2x</p>
                    <p className="text-slate-400 text-xs mt-1">Return on investment</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-amber-400" />
                </div>
              </Card>

              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Value Created</p>
                    <p className="text-white text-2xl font-bold">KES 42.7M</p>
                    <p className="text-slate-400 text-xs mt-1">Total career value</p>
                  </div>
                  <Target className="w-8 h-8 text-green-400" />
                </div>
              </Card>

              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Revenue Share</p>
                    <p className="text-green-400 text-2xl font-bold">KES 1.28M</p>
                    <p className="text-slate-400 text-xs mt-1">3% of salaries earned</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </Card>

              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Hires</p>
                    <p className="text-blue-400 text-2xl font-bold">23</p>
                    <p className="text-slate-400 text-xs mt-1">Students placed</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                </div>
              </Card>
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 bg-slate-900/50 border-slate-700 text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Generate Invoice</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Create monthly billing invoices for cohorts and track payments.
                </p>
                <Button
                  onClick={() => handleFinanceAction('generate_invoice')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Generate Invoice
                </Button>
              </Card>

              <Card className="p-6 bg-slate-900/50 border-slate-700 text-center">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Financial Ledger</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Complete transaction history, invoices, and payment tracking.
                </p>
                <Button
                  onClick={() => handleFinanceAction('view_ledger')}
                  variant="outline"
                  className="text-slate-400 border-slate-600"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Ledger
                </Button>
              </Card>

              <Card className="p-6 bg-slate-900/50 border-slate-700 text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Payment Settings</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Configure payment terms, currency preferences, and billing cycles.
                </p>
                <Button
                  onClick={() => handleFinanceAction('settings')}
                  variant="outline"
                  className="text-slate-400 border-slate-600"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Card>
            </div>

            {/* Billing Summary */}
            <Card className="p-6 bg-slate-900/50 border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Billing Summary</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">KES 6.1M</div>
                  <div className="text-slate-400 text-sm">Total Billed</div>
                  <div className="text-green-400 text-xs mt-1">KES 4.9M paid</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400 mb-1">KES 1.2M</div>
                  <div className="text-slate-400 text-sm">Outstanding</div>
                  <div className="text-red-400 text-xs mt-1">KES 0.3M overdue</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">Q2: KES 8.2M</div>
                  <div className="text-slate-400 text-sm">Forecast</div>
                  <div className="text-blue-400 text-xs mt-1">+34% growth</div>
                </div>
              </div>
            </Card>

            {/* Revenue Forecasting */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Revenue Forecasting</h2>
                <p className="text-slate-400">AI-powered predictions and growth scenarios</p>
              </div>
              <RevenueForecasting
                currentRevenue={1280000}
                currentHires={23}
                completionRate={68}
              />
            </section>

            {/* Recent Activity */}
            <Card className="p-6 bg-slate-900/50 border-slate-700 mt-8">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Payment Received</p>
                      <p className="text-slate-400 text-xs">Jan 2026 Defender Cohort - KES 3.8M</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">Paid</Badge>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Invoice Generated</p>
                      <p className="text-slate-400 text-xs">Feb 2026 GRC Cohort - KES 2.1M</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400">Invoiced</Badge>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Revenue Share Paid</p>
                      <p className="text-slate-400 text-xs">Sarah K. hire bonus - KES 64.8K</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">Completed</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
