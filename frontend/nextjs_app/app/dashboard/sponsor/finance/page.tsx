'use client'

import { useState, useEffect } from 'react'
import { sponsorClient } from '@/services/sponsorClient'

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  due_date: string
  cohort_id?: string
}

interface RefundRequest {
  id: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' })

  useEffect(() => {
    loadFinanceData()
  }, [])

  const loadFinanceData = async () => {
    try {
      setLoading(true)
      // TODO: Implement API endpoints
      // const [invoicesData, refundsData] = await Promise.all([
      //   sponsorClient.getInvoices(),
      //   sponsorClient.getRefunds(),
      // ])
      // setInvoices(invoicesData)
      // setRefunds(refundsData)
      setInvoices([])
      setRefunds([])
    } catch (error) {
      console.error('Failed to load finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestRefund = async () => {
    try {
      // TODO: Implement refund request API
      console.log('Request refund:', refundForm)
      alert('Refund request feature coming soon')
      setShowRefundModal(false)
      setRefundForm({ amount: '', reason: '' })
    } catch (error) {
      console.error('Failed to request refund:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BW', {
      style: 'currency',
      currency: 'BWP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const statusColors = {
    pending: 'bg-och-gold/20 text-och-gold',
    paid: 'bg-och-mint/20 text-och-mint',
    overdue: 'bg-och-orange/20 text-och-orange',
    approved: 'bg-och-mint/20 text-och-mint',
    rejected: 'bg-och-orange/20 text-och-orange',
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">💰 Finance & Billing</h1>
        <p className="text-och-steel">
          Manage invoices and refund requests
        </p>
      </div>
      
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowRefundModal(true)}
          className="px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors font-semibold"
        >
          Request Refund
        </button>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-white">Request Refund</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-och-steel mb-2">
                  Amount (BWP)
                </label>
                <input
                  type="number"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:ring-2 focus:ring-och-mint focus:border-och-mint"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-och-steel mb-2">
                  Reason
                </label>
                <textarea
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:ring-2 focus:ring-och-mint focus:border-och-mint"
                  rows={4}
                  placeholder="Explain the reason for this refund request..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRequestRefund}
                  disabled={!refundForm.amount || !refundForm.reason}
                  className="flex-1 px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Request
                </button>
                <button
                  onClick={() => {
                    setShowRefundModal(false)
                    setRefundForm({ amount: '', reason: '' })
                  }}
                  className="px-4 py-2 border border-och-steel/20 text-och-steel rounded-lg hover:bg-och-midnight/80 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoices */}
        <div className="bg-och-midnight border border-och-steel/20 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-och-steel/20">
            <h2 className="text-xl font-bold text-white">Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-och-midnight border-b border-och-steel/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-och-steel/20">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-och-steel">
                      Loading invoices...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-och-steel">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-och-midnight/80">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-white">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[invoice.status]}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-och-steel">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Refund Requests */}
        <div className="bg-och-midnight border border-och-steel/20 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-och-steel/20">
            <h2 className="text-xl font-bold text-white">Refund Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-och-midnight border-b border-och-steel/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-och-steel/20">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-och-steel">
                      Loading refunds...
                    </td>
                  </tr>
                ) : refunds.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-och-steel">
                      No refund requests
                    </td>
                  </tr>
                ) : (
                  refunds.map((refund) => (
                    <tr key={refund.id} className="hover:bg-och-midnight/80">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-white">
                        {formatCurrency(refund.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-och-steel max-w-xs truncate">
                        {refund.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[refund.status]}`}>
                          {refund.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-och-steel">
                        {new Date(refund.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
