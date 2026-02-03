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
  Download,
  Filter,
  Search,
  FileText,
  DollarSign,
  Calendar,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Transaction {
  id: string;
  transaction_type: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
  cohort_name?: string;
}

export default function SponsorFinanceInvoicesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, searchTerm, typeFilter, statusFilter, dateRange]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        type: typeFilter,
        status: statusFilter,
        date_range: dateRange
      });

      const response = await fetch(
        `/api/sponsors/${slug}/finance/transactions?${queryParams}`,
        {
          // Add auth headers when authentication is implemented
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.total_pages || 1);
      setTotalTransactions(data.total_count || 0);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load transactions');

      // Mock data for development
      setTransactions([
        {
          id: '1',
          transaction_type: 'platform_fee',
          description: 'Monthly platform fee for Jan 2026 Defender Cohort',
          amount: -3800000,
          currency: 'KES',
          status: 'paid',
          period_start: '2026-01-01',
          period_end: '2026-01-31',
          created_at: '2026-01-01T10:00:00Z',
          cohort_name: 'Jan 2026 - Defender'
        },
        {
          id: '2',
          transaction_type: 'revenue_share',
          description: '3% revenue share: Sarah K. → MTN SOC L1',
          amount: 64800,
          currency: 'KES',
          status: 'paid',
          created_at: '2026-01-15T14:30:00Z',
          cohort_name: 'Jan 2026 - Defender'
        },
        {
          id: '3',
          transaction_type: 'platform_fee',
          description: 'Monthly platform fee for Feb 2026 GRC Cohort',
          amount: -2100000,
          currency: 'KES',
          status: 'invoiced',
          period_start: '2026-02-01',
          period_end: '2026-02-28',
          created_at: '2026-02-01T10:00:00Z',
          cohort_name: 'Feb 2026 - GRC'
        }
      ]);
      setTotalPages(1);
      setTotalTransactions(3);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const queryParams = new URLSearchParams({
        format,
        search: searchTerm,
        type: typeFilter,
        status: statusFilter,
        date_range: dateRange
      });

      const response = await fetch(
        `/api/sponsors/${slug}/finance/transactions/export?${queryParams}`
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `financial_ledger_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err.message}`);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'KES') => {
    const formatted = Math.abs(amount).toLocaleString();
    const sign = amount < 0 ? '-' : '+';
    return `${sign}${currency} ${formatted}`;
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'platform_fee': return 'bg-blue-500/20 text-blue-400';
      case 'revenue_share': return 'bg-green-500/20 text-green-400';
      case 'mentor_fee': return 'bg-purple-500/20 text-purple-400';
      case 'lab_cost': return 'bg-orange-500/20 text-orange-400';
      case 'refund': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400';
      case 'invoiced': return 'bg-blue-500/20 text-blue-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'overdue': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

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
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Financial Ledger</h1>
              <p className="text-slate-400">
                Complete transaction history and billing records
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => fetchTransactions()}
                variant="outline"
                className="text-slate-400 border-slate-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>

              <Button
                onClick={() => handleExport('csv')}
                variant="outline"
                className="text-slate-400 border-slate-600"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV Export
              </Button>

              <Button
                onClick={() => handleExport('pdf')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF Export
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 bg-slate-900/50 border-slate-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <option value="all">All Types</option>
              <option value="platform_fee">Platform Fee</option>
              <option value="revenue_share">Revenue Share</option>
              <option value="mentor_fee">Mentor Fee</option>
              <option value="lab_cost">Lab Cost</option>
              <option value="refund">Refund</option>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="invoiced">Invoiced</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="this_year">This Year</option>
            </Select>

            <Button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setStatusFilter('all');
                setDateRange('all');
              }}
              variant="outline"
              className="text-slate-400 border-slate-600"
            >
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Transaction Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-4 bg-slate-900/50 border-slate-700 text-center">
            <div className="text-2xl font-bold text-white mb-1">{totalTransactions}</div>
            <div className="text-slate-400 text-sm">Total Transactions</div>
          </Card>

          <Card className="p-4 bg-slate-900/50 border-slate-700 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              KES {(transactions.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0) / 1000).toFixed(0)}K
            </div>
            <div className="text-slate-400 text-sm">Total Income</div>
          </Card>

          <Card className="p-4 bg-slate-900/50 border-slate-700 text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">
              KES {(Math.abs(transactions.reduce((sum, t) => t.amount < 0 ? sum + t.amount : sum, 0)) / 1000).toFixed(0)}K
            </div>
            <div className="text-slate-400 text-sm">Total Expenses</div>
          </Card>

          <Card className="p-4 bg-slate-900/50 border-slate-700 text-center">
            <div className="text-2xl font-bold text-amber-400 mb-1">
              KES {((transactions.reduce((sum, t) => t.amount, 0)) / 1000).toFixed(0)}K
            </div>
            <div className="text-slate-400 text-sm">Net Amount</div>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="bg-slate-900/50 border-slate-700">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-400 mb-4">Error: {error}</p>
              <Button onClick={fetchTransactions}>Try Again</Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-700">
                    <tr>
                      <th className="text-left p-4 text-slate-400 font-medium">Date</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Type</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Description</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Cohort</th>
                      <th className="text-right p-4 text-slate-400 font-medium">Amount</th>
                      <th className="text-center p-4 text-slate-400 font-medium">Status</th>
                      <th className="text-center p-4 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="p-4 text-slate-300">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                            {transaction.transaction_type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4 text-white max-w-xs truncate">
                          {transaction.description}
                        </td>
                        <td className="p-4 text-slate-300">
                          {transaction.cohort_name || 'N/A'}
                        </td>
                        <td className={`p-4 text-right font-medium ${
                          transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </td>
                        <td className="p-4 text-center">
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-700">
                  <div className="text-slate-400 text-sm">
                    Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalTransactions)} of {totalTransactions} transactions
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="text-slate-400 border-slate-600"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <span className="text-slate-300 text-sm px-3">
                      {currentPage} of {totalPages}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="text-slate-400 border-slate-600"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
