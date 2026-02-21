"use client"

import { Suspense, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { CardContent, CardHeader } from '@/components/ui/card-enhanced'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { FinanceDashboardSkeleton } from '../dashboard/components'
import { InvoiceModal } from '../dashboard/components/InvoiceModal'
import { FilePlus, FileText, ChevronDown, ChevronRight, Building2 } from 'lucide-react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function InvoicesContent() {
  const { user } = useAuth()
  const userId = user?.id || 'finance-user'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, error, mutate } = useSWR<{ invoices: any[]; total_invoices: number }>(
    `/api/finance/${userId}/invoices`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const invoices = data?.invoices ?? []

  const handleCreateSubmit = async (invoiceData: any) => {
    const res = await fetch(`/api/finance/${userId}/actions/new-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    })
    const result = await res.json()
    if (res.ok && result.success) {
      setShowCreateModal(false)
      mutate()
    } else {
      alert(result.error || 'Failed to create invoice')
    }
  }

  const getStatusBadge = (status: string) => {
    const n = (status || '').toLowerCase()
    if (n === 'paid' || n === 'settled') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paid</Badge>
    if (n === 'waived') return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Waived</Badge>
    if (n === 'overdue') return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>
    return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Invoice Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          <FilePlus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <Suspense fallback={<FinanceDashboardSkeleton />}>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <h3 className="text-white flex items-center gap-2 text-lg font-semibold">
              <FileText className="w-5 h-5 text-cyan-400" />
              Invoices (system-generated and manual)
            </h3>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-sm text-red-400 mb-4">Failed to load invoices. Please try again.</div>
            )}
            {!invoices.length && !error && (
              <div className="text-sm text-slate-400 py-8 text-center">No invoices yet. Create one or wait for system-generated billing.</div>
            )}
            {invoices.length > 0 && (
              <div className="space-y-2">
                {invoices.map((inv: any) => {
                  const isExpanded = expandedId === inv.id
                  const lineItems = Array.isArray(inv.line_items) ? inv.line_items : []
                  const source = inv.source === 'manual' ? 'manual' : 'system'
                  return (
                    <div
                      key={inv.id}
                      className="rounded-lg bg-slate-900/50 border border-slate-700/50 overflow-hidden"
                    >
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/30"
                        onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                      >
                        <div className="flex items-center gap-3">
                          {lineItems.length > 0 ? (
                            isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )
                          ) : (
                            <span className="w-4" />
                          )}
                          <Building2 className="w-5 h-5 text-cyan-500" />
                          <div>
                            <p className="font-medium text-white">{inv.sponsor_name || '—'}</p>
                            <p className="text-sm text-slate-400">{inv.cohort_name ? `${inv.cohort_name} • ${inv.billing_month || ''}` : inv.billing_month || inv.created_at || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-white font-semibold">KES {Number(inv.net_amount ?? 0).toLocaleString()}</span>
                          {getStatusBadge(inv.payment_status)}
                          <Badge className={source === 'system' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'}>
                            {source === 'system' ? 'System generated' : 'Manual'}
                          </Badge>
                        </div>
                      </div>
                      {isExpanded && lineItems.length > 0 && (
                        <div className="border-t border-slate-700/50 bg-slate-950/50 px-4 py-3">
                          <p className="text-xs text-slate-400 mb-2">Line items</p>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-700">
                                <th className="text-left py-2">Description</th>
                                <th className="text-right py-2">Qty</th>
                                <th className="text-right py-2">Unit (KES)</th>
                                <th className="text-right py-2">Amount (KES)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lineItems.map((line: any, i: number) => (
                                <tr key={i} className="border-b border-slate-800/50">
                                  <td className="py-2 text-white">{line.description || '—'}</td>
                                  <td className="text-right py-2 text-slate-300">{line.quantity ?? '—'}</td>
                                  <td className="text-right py-2 text-slate-300">{Number(line.unit_price_kes ?? line.rate ?? 0).toLocaleString()}</td>
                                  <td className="text-right py-2 text-white font-medium">{Number(line.amount ?? 0).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </Suspense>

      <InvoiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSubmit}
      />
    </div>
  )
}

export default function InvoicesPage() {
  return (
    <RouteGuard requiredRoles={['finance']}>
      <InvoicesContent />
    </RouteGuard>
  )
}
