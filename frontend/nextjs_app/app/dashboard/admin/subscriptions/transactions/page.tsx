'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'

interface PaymentTransaction {
  id: string
  user_email: string
  gateway_name: string | null
  amount: string
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'canceled'
  gateway_transaction_id: string
  failure_reason: string | null
  processed_at: string | null
  created_at: string
}

const STATUS_VARIANTS: Record<string, 'mint' | 'orange' | 'steel' | 'gold' | 'defender' | 'outline'> = {
  completed: 'mint',
  pending: 'gold',
  processing: 'defender',
  failed: 'orange',
  refunded: 'steel',
  canceled: 'steel',
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransaction | null>(null)
  const [refunding, setRefunding] = useState(false)

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiGateway.get('/admin/transactions/') as PaymentTransaction[] | { results: PaymentTransaction[] }
      setTransactions(Array.isArray(res) ? res : (res.results || []))
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!selectedTxn) return
    try {
      setRefunding(true)
      await apiGateway.post(`/admin/transactions/${selectedTxn.id}/refund/`)
      await loadTransactions()
      setSelectedTxn(null)
      alert('Transaction marked as refunded!')
    } catch (err: any) {
      alert(err.message || 'Failed to refund transaction')
    } finally {
      setRefunding(false)
    }
  }

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = !searchQuery ||
        t.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.gateway_transaction_id?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [transactions, searchQuery, statusFilter])

  const totals = useMemo(() => {
    const completed = transactions.filter(t => t.status === 'completed')
    const revenue = completed.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)
    return {
      total: transactions.length,
      completed: completed.length,
      failed: transactions.filter(t => t.status === 'failed').length,
      refunded: transactions.filter(t => t.status === 'refunded').length,
      revenue: revenue.toFixed(2),
    }
  }, [transactions])

  const formatDate = (d: string | null) => {
    if (!d) return 'N/A'
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-gold">Payment Transactions</h1>
            <p className="text-och-steel">Monitor all payment transactions across subscription plans</p>
          </div>

          {error && (
            <Card className="p-4 bg-och-orange/20 border-och-orange">
              <p className="text-och-orange">{error}</p>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: totals.total, color: 'text-white' },
              { label: 'Completed', value: totals.completed, color: 'text-och-mint' },
              { label: 'Failed', value: totals.failed, color: 'text-och-orange' },
              { label: 'Refunded', value: totals.refunded, color: 'text-och-steel' },
              { label: 'Revenue (USD)', value: `$${totals.revenue}`, color: 'text-och-gold' },
            ].map(stat => (
              <Card key={stat.label} className="p-4 text-center">
                <p className="text-xs text-och-steel mb-1">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-och-steel mb-1">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by email or transaction ID..."
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                />
              </div>
              <div>
                <label className="block text-sm text-och-steel mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-och-steel/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-och-steel">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-och-steel">User</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-och-steel">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-och-steel">Gateway</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-och-steel">Transaction ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-och-steel">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-och-steel">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-och-steel">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filtered.map(txn => (
                        <tr key={txn.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                          <td className="py-3 px-4 text-sm text-och-steel">{formatDate(txn.created_at)}</td>
                          <td className="py-3 px-4">
                            <p className="text-white text-sm">{txn.user_email}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-white font-medium">{txn.amount} {txn.currency}</p>
                          </td>
                          <td className="py-3 px-4 text-sm text-och-steel">{txn.gateway_name || 'Simulated'}</td>
                          <td className="py-3 px-4">
                            <p className="text-xs text-och-steel font-mono truncate max-w-[160px]">{txn.gateway_transaction_id}</p>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={STATUS_VARIANTS[txn.status] || 'steel'}>
                              {txn.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {txn.status === 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTxn(txn)}
                              >
                                Refund
                              </Button>
                            )}
                            {txn.status === 'failed' && txn.failure_reason && (
                              <span className="text-xs text-och-orange">{txn.failure_reason}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Refund Confirm Modal */}
          {selectedTxn && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Confirm Refund</h2>
                  <div className="bg-och-midnight/50 rounded-lg p-4 mb-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-och-steel">User:</span>
                      <span className="text-white">{selectedTxn.user_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Amount:</span>
                      <span className="text-white font-medium">{selectedTxn.amount} {selectedTxn.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Gateway:</span>
                      <span className="text-white">{selectedTxn.gateway_name || 'Simulated'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-och-steel">Date:</span>
                      <span className="text-white">{formatDate(selectedTxn.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-och-steel text-sm mb-6">
                    This will mark the transaction as refunded. For real gateways, process the actual refund in the gateway dashboard separately.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setSelectedTxn(null)}>Cancel</Button>
                    <Button
                      variant="orange"
                      className="flex-1"
                      disabled={refunding}
                      onClick={handleRefund}
                    >
                      {refunding ? 'Processing...' : 'Confirm Refund'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
