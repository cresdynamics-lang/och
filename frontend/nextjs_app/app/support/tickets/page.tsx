'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { apiGateway } from '@/services/apiGateway'
import { Ticket, Plus } from 'lucide-react'
import Link from 'next/link'

interface TicketItem {
  id: number
  subject: string
  status: string
  priority: string
  problem_code: number | null
  problem_code_display: string | null
  reporter_email: string
  reporter_name: string
  assigned_to_email: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

const STATUS_VARIANT: Record<string, 'mint' | 'orange' | 'gold' | 'steel' | 'defender'> = {
  open: 'orange',
  in_progress: 'defender',
  pending_customer: 'gold',
  resolved: 'mint',
  closed: 'steel',
}

const PRIORITY_VARIANT: Record<string, 'orange' | 'gold' | 'steel'> = {
  urgent: 'orange',
  high: 'orange',
  medium: 'gold',
  low: 'steel',
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    let cancelled = false
    const params = filter !== 'all' ? `?status=${filter}` : ''
    apiGateway
      .get<TicketItem[] | { results: TicketItem[] }>(`/support/tickets/${params}`)
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : (data?.results ?? [])
          setTickets(list)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load tickets')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filter])

  if (loading) {
    return (
      <RouteGuard requiredRoles={['support']}>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="animate-pulse text-och-steel">Loading tickets...</div>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requiredRoles={['support']}>
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="pending_customer">Pending customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <Button asChild>
              <Link href="/support/tickets/new">
                <Plus className="w-4 h-4 mr-2" aria-hidden />
                New ticket
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-och-orange/10 border border-och-orange/30 rounded-lg text-och-orange">
            {error}
          </div>
        )}

        <Card className="bg-slate-800/50 border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-och-steel/20">
                  <th className="text-left p-3 text-och-steel text-sm font-semibold">ID</th>
                  <th className="text-left p-3 text-och-steel text-sm font-semibold">Subject</th>
                  <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                  <th className="text-left p-3 text-och-steel text-sm font-semibold">Priority</th>
                  <th className="text-left p-3 text-och-steel text-sm font-semibold">Problem code</th>
                  <th className="text-left p-3 text-och-steel text-sm font-semibold">Reporter</th>
                  <th className="text-left p-3 text-och-steel text-sm font-semibold">Assigned</th>
                  <th className="text-left p-3 text-och-steel text-sm font-semibold">Created</th>
                  <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-och-steel">
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                      <td className="p-3 text-white font-mono text-sm">#{t.id}</td>
                      <td className="p-3 text-white font-medium">{t.subject}</td>
                      <td className="p-3">
                        <Badge variant={STATUS_VARIANT[t.status] ?? 'steel'}>
                          {t.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={PRIORITY_VARIANT[t.priority] ?? 'steel'}>{t.priority}</Badge>
                      </td>
                      <td className="p-3 text-och-steel text-sm">
                        {t.problem_code_display ?? '—'}
                      </td>
                      <td className="p-3 text-och-steel text-sm">
                        {t.reporter_name || t.reporter_email || '—'}
                      </td>
                      <td className="p-3 text-och-steel text-sm">
                        {t.assigned_to_email ?? '—'}
                      </td>
                      <td className="p-3 text-och-steel text-sm">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3">
                        <Link href={`/support/tickets/${t.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </RouteGuard>
  )
}
