/**
 * Billing and Transactional Operations Page
 * Manage invoice lifecycle, refunds, dunning queue, and reconciliation
 */

'use client'

import { useState } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { FinanceNavigation } from '@/components/navigation/FinanceNavigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  FileText, 
  RefreshCcw, 
  AlertCircle,
  CheckCircle,
  Download,
  Plus,
  XCircle,
  Clock,
  Search,
  Eye,
  ArrowRightLeft
} from 'lucide-react'

type TabType = 'invoices' | 'refunds' | 'dunning' | 'reconciliation'

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('invoices')
  return (
    <RouteGuard>
      <div className="min-h-screen bg-och-midnight flex">
        <FinanceNavigation />
        <div className="flex-1 lg:ml-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-h1 font-bold text-white">Billing & Transactional Operations</h1>
              <p className="mt-1 body-m text-och-steel">
                Manage invoice lifecycle, refunds, dunning queue, and reconciliation
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-och-steel/20 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s ${
                    activeTab === 'invoices'
                      ? 'border-och-defender text-och-mint'
                      : 'border-transparent text-och-steel hover:text-white hover:border-och-steel/30'
                  }`}
                >
                  Invoices
                </button>
                <button
                  onClick={() => setActiveTab('refunds')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s ${
                    activeTab === 'refunds'
                      ? 'border-och-defender text-och-mint'
                      : 'border-transparent text-och-steel hover:text-white hover:border-och-steel/30'
                  }`}
                >
                  Refunds
                </button>
                <button
                  onClick={() => setActiveTab('dunning')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s ${
                    activeTab === 'dunning'
                      ? 'border-och-defender text-och-mint'
                      : 'border-transparent text-och-steel hover:text-white hover:border-och-steel/30'
                  }`}
                >
                  Dunning Queue
                </button>
                <button
                  onClick={() => setActiveTab('reconciliation')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s ${
                    activeTab === 'reconciliation'
                      ? 'border-och-defender text-och-mint'
                      : 'border-transparent text-och-steel hover:text-white hover:border-och-steel/30'
                  }`}
                >
                  Reconciliation
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-h2 font-semibold text-white">Invoicing</h2>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Issue Invoice
                  </Button>
                </div>
                <p className="body-m text-och-steel mb-4">
                  Issue tax-compliant PDFs, amend existing invoices (where permitted), and post credits
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-och-steel/20">
                    <thead className="bg-och-midnight/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-och-steel">
                          <FileText className="h-12 w-12 mx-auto mb-2 text-och-steel" />
                          <p className="body-m">No invoices found</p>
                          <p className="body-s text-och-steel/70 mt-2">Create your first invoice to get started</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Refunds Tab */}
            {activeTab === 'refunds' && (
              <>
                <Card className="p-6 mb-6 bg-och-midnight border border-och-steel/20">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-h2 font-semibold text-white">Refund Management</h2>
                    <Button>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Initiate Refund
                    </Button>
                  </div>
                  <p className="body-m text-och-steel mb-4">
                    Initiate and approve refunds, voids, or write-offs
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-och-steel/20">
                      <thead className="bg-och-midnight/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Refund ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Invoice #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Requested
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-och-steel">
                            <RefreshCcw className="h-12 w-12 mx-auto mb-2 text-och-steel" />
                            <p className="body-m">No refund requests</p>
                            <p className="body-s text-och-steel/70 mt-2">Initiate refunds, voids, or write-offs for invoices</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Refund Types Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 bg-och-midnight border border-och-steel/20">
                    <div className="flex items-center gap-3 mb-2">
                      <RefreshCcw className="h-5 w-5 text-och-defender" />
                      <p className="font-medium text-white">Total Refunds</p>
                    </div>
                    <p className="text-2xl font-bold text-white">$0.00</p>
                    <p className="body-s text-och-steel mt-1">0 requests</p>
                  </Card>
                  <Card className="p-4 bg-och-midnight border border-och-steel/20">
                    <div className="flex items-center gap-3 mb-2">
                      <XCircle className="h-5 w-5 text-och-orange" />
                      <p className="font-medium text-white">Pending Approval</p>
                    </div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="body-s text-och-steel mt-1">Awaiting review</p>
                  </Card>
                  <Card className="p-4 bg-och-midnight border border-och-steel/20">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="h-5 w-5 text-och-savanna-green" />
                      <p className="font-medium text-white">Processed</p>
                    </div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="body-s text-och-steel mt-1">Completed</p>
                  </Card>
                </div>
              </>
            )}

            {/* Dunning Queue Tab */}
            {activeTab === 'dunning' && (
              <>
                <Card className="p-6 mb-6 bg-och-midnight border border-och-steel/20">
                  <h2 className="text-h2 font-semibold text-white mb-4">Dunning Queue</h2>
                  <p className="body-m text-och-steel mb-4">
                    Monitor the dunning queue for failed payments, including tracking retry statuses and grace periods
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-och-steel/20">
                      <thead className="bg-och-midnight/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Invoice #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Retry Count
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Last Attempt
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Next Retry
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-och-steel">
                            <AlertCircle className="h-12 w-12 mx-auto mb-2 text-och-steel" />
                            <p className="body-m">No failed payments</p>
                            <p className="body-s text-och-steel/70 mt-2">All payments are current</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Dunning Queue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-och-orange/10 border border-och-orange/30">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="h-5 w-5 text-och-orange" />
                      <p className="font-medium text-white">Failed Payments</p>
                    </div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="body-s text-och-steel mt-1">In queue</p>
                  </Card>
                  <Card className="p-4 bg-och-midnight border border-och-steel/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="h-5 w-5 text-och-gold" />
                      <p className="font-medium text-white">Retrying</p>
                    </div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="body-s text-och-steel mt-1">Scheduled</p>
                  </Card>
                  <Card className="p-4 bg-och-midnight border border-och-steel/20">
                    <div className="flex items-center gap-3 mb-2">
                      <XCircle className="h-5 w-5 text-och-orange" />
                      <p className="font-medium text-white">Exhausted</p>
                    </div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="body-s text-och-steel mt-1">Max retries reached</p>
                  </Card>
                  <Card className="p-4 bg-och-savanna-green/10 border border-och-savanna-green/30">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="h-5 w-5 text-och-savanna-green" />
                      <p className="font-medium text-white">Recovered</p>
                    </div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="body-s text-och-steel mt-1">This month</p>
                  </Card>
                </div>
              </>
            )}

            {/* Reconciliation Tab */}
            {activeTab === 'reconciliation' && (
              <>
                <Card className="p-6 bg-och-midnight border border-och-steel/20">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-h2 font-semibold text-white">Reconciliation Dashboard</h2>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Search className="h-4 w-4 mr-2" />
                        Reconcile Now
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Gateway Files
                      </Button>
                    </div>
                  </div>
                  <p className="body-m text-och-steel mb-6">
                    Match internal ledgers against gateway payout files (e.g., Paystack, Flutterwave)
                  </p>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="p-4 bg-och-midnight/50 border border-och-steel/20 rounded-lg">
                      <p className="body-s font-medium text-och-steel mb-2">Internal Ledger</p>
                      <p className="text-2xl font-bold text-white">$0.00</p>
                      <p className="body-s text-och-steel mt-1">Total transactions</p>
                    </div>
                    <div className="p-4 bg-och-midnight/50 border border-och-steel/20 rounded-lg">
                      <p className="body-s font-medium text-och-steel mb-2">Gateway Payout</p>
                      <p className="text-2xl font-bold text-white">$0.00</p>
                      <p className="body-s text-och-steel mt-1">From payment gateway</p>
                    </div>
                  </div>

                  {/* Reconciliation Status */}
                  <div className="mb-6 p-4 bg-och-savanna-green/10 border border-och-savanna-green/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-och-savanna-green" />
                      <p className="body-s font-medium text-och-savanna-green">All transactions reconciled</p>
                    </div>
                  </div>

                  {/* Reconciliation History */}
                  <div>
                    <h3 className="text-h3 font-semibold text-white mb-4">Reconciliation History</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-och-steel/20">
                        <thead className="bg-och-midnight/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Gateway
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Internal Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Gateway Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Difference
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-och-steel">
                              <ArrowRightLeft className="h-12 w-12 mx-auto mb-2 text-och-steel" />
                              <p className="body-m">No reconciliation history</p>
                              <p className="body-s text-och-steel/70 mt-2">Reconcile transactions to view history</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

