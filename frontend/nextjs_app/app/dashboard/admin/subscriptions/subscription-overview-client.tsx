'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'

export default function SubscriptionOverviewClient() {
  const [stats, setStats] = useState({
    total: '-', active: '-', revenue: '-', gateways: '-'
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [subsRes, txnRes, gwRes] = await Promise.all([
          apiGateway.get('/admin/subscriptions/') as Promise<any>,
          apiGateway.get('/admin/transactions/') as Promise<any>,
          apiGateway.get('/admin/gateways/') as Promise<any>,
        ])
        const subs: any[] = Array.isArray(subsRes) ? subsRes : (subsRes.results || [])
        const txns: any[] = Array.isArray(txnRes) ? txnRes : (txnRes.results || [])
        const gws: any[] = Array.isArray(gwRes) ? gwRes : (gwRes.results || [])
        const activeSubs = subs.filter((s: any) => s.status === 'active')
        const completedTxns = txns.filter((t: any) => t.status === 'completed')
        const revenue = completedTxns.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0)
        setStats({
          total: String(subs.length),
          active: String(activeSubs.length),
          revenue: `$${revenue.toFixed(2)}`,
          gateways: String(gws.filter((g: any) => g.enabled).length),
        })
      } catch {
        // Stats unavailable — keep dashes
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2 text-och-defender">Subscription Management</h1>
        <p className="text-och-steel">Configure subscription tiers, payment gateways, and manage user subscriptions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/admin/subscriptions/plans">
          <Card className="p-6 hover:border-och-defender transition-colors cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">📦</div>
              <div>
                <h3 className="text-xl font-bold text-white">Plans & Tiers</h3>
                <p className="text-sm text-och-steel">Manage subscription plans</p>
              </div>
            </div>
            <p className="text-och-steel text-sm">
              Configure Free, Starter ($3), and Premium ($7) tiers with feature access and limits
            </p>
          </Card>
        </Link>

        <Link href="/dashboard/admin/subscriptions/users">
          <Card className="p-6 hover:border-och-defender transition-colors cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">👤</div>
              <div>
                <h3 className="text-xl font-bold text-white">User Subscriptions</h3>
                <p className="text-sm text-och-steel">Manage user subscriptions</p>
              </div>
            </div>
            <p className="text-och-steel text-sm">
              View, upgrade, downgrade, and manage individual user subscriptions
            </p>
          </Card>
        </Link>

        <Link href="/dashboard/admin/subscriptions/gateways">
          <Card className="p-6 hover:border-och-defender transition-colors cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">🌐</div>
              <div>
                <h3 className="text-xl font-bold text-white">Payment Gateways</h3>
                <p className="text-sm text-och-steel">Configure payment methods</p>
              </div>
            </div>
            <p className="text-och-steel text-sm">
              Enable and configure Stripe, Paystack, Flutterwave, M-Pesa, and other payment gateways
            </p>
          </Card>
        </Link>

        <Link href="/dashboard/admin/subscriptions/transactions">
          <Card className="p-6 hover:border-och-defender transition-colors cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">💰</div>
              <div>
                <h3 className="text-xl font-bold text-white">Transactions</h3>
                <p className="text-sm text-och-steel">View payment history</p>
              </div>
            </div>
            <p className="text-och-steel text-sm">
              Monitor payment transactions, refunds, and payment status across all gateways
            </p>
          </Card>
        </Link>

        <Link href="/dashboard/admin/subscriptions/rules">
          <Card className="p-6 hover:border-och-defender transition-colors cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">⚙️</div>
              <div>
                <h3 className="text-xl font-bold text-white">Rules & Settings</h3>
                <p className="text-sm text-och-steel">Configure subscription rules</p>
              </div>
            </div>
            <p className="text-och-steel text-sm">
              Set upgrade/downgrade rules, grace periods, and enhanced access periods
            </p>
          </Card>
        </Link>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-och-midnight/50 p-4 rounded-lg">
              <div className="text-sm text-och-steel mb-1">Total Subscriptions</div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-och-midnight/50 p-4 rounded-lg">
              <div className="text-sm text-och-steel mb-1">Active Subscriptions</div>
              <div className="text-2xl font-bold text-och-mint">{stats.active}</div>
            </div>
            <div className="bg-och-midnight/50 p-4 rounded-lg">
              <div className="text-sm text-och-steel mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-och-defender">{stats.revenue}</div>
            </div>
            <div className="bg-och-midnight/50 p-4 rounded-lg">
              <div className="text-sm text-och-steel mb-1">Active Gateways</div>
              <div className="text-2xl font-bold text-white">{stats.gateways}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}















































































