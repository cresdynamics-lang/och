'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { CardContent } from '@/components/ui/card-enhanced'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { apiGateway } from '@/services/apiGateway'
import { Ticket, CheckCircle, Clock, AlertCircle, Hash, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface TicketStats {
  by_status: Record<string, number>
  by_priority: Record<string, number>
  open_count: number
  total: number
}

export default function SupportDashboardPage() {
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiGateway
      .get<TicketStats>('/support/tickets/stats/')
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load stats')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <RouteGuard requiredRoles={['support']}>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="animate-pulse text-och-steel">Loading support dashboard...</div>
        </div>
      </RouteGuard>
    )
  }

  if (error) {
    return (
      <RouteGuard requiredRoles={['support']}>
        <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="text-och-orange">{error}</div>
        </div>
      </RouteGuard>
    )
  }

  const openCount = stats?.open_count ?? 0
  const total = stats?.total ?? 0
  const resolved = (stats?.by_status?.resolved ?? 0) + (stats?.by_status?.closed ?? 0)
  const urgent = stats?.by_priority?.urgent ?? 0

  return (
    <RouteGuard requiredRoles={['support']}>
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Support Dashboard</h1>
          <p className="text-sm text-slate-400">
            Track tickets, problem codes, and platform issues. Internal support role.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400">Open tickets</p>
                <Ticket className="w-5 h-5 text-cyan-500" aria-hidden />
              </div>
              <p className="text-2xl font-bold text-white">{openCount}</p>
              <p className="text-xs text-slate-400 mt-1">Need attention</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400">Resolved / Closed</p>
                <CheckCircle className="w-5 h-5 text-green-500" aria-hidden />
              </div>
              <p className="text-2xl font-bold text-white">{resolved}</p>
              <p className="text-xs text-slate-400 mt-1">Total completed</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400">Urgent priority</p>
                <AlertCircle className="w-5 h-5 text-och-orange" aria-hidden />
              </div>
              <p className="text-2xl font-bold text-white">{urgent}</p>
              <p className="text-xs text-slate-400 mt-1">High priority</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400">Total tickets</p>
                <TrendingUp className="w-5 h-5 text-och-defender" aria-hidden />
              </div>
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-xs text-slate-400 mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link href="/support/tickets">
                  <Button variant="defender">View all tickets</Button>
                </Link>
                <Link href="/support/tickets?new=1">
                  <Button variant="outline">New ticket</Button>
                </Link>
                <Link href="/support/problem-codes">
                  <Button variant="outline">Problem codes</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">How support benefits the platform</h2>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-och-defender shrink-0 mt-0.5" aria-hidden />
                  <span>Faster resolution of user and technical issues via structured tickets and problem codes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Hash className="w-4 h-4 text-och-defender shrink-0 mt-0.5" aria-hidden />
                  <span>Problem tracking codes enable reporting, SLA monitoring, and knowledge base.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-och-defender shrink-0 mt-0.5" aria-hidden />
                  <span>Directors assign support staff; support is an internal role for platform health.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </RouteGuard>
  )
}
