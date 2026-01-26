'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function SubscriptionOverviewClient() {
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
              <div className="text-2xl font-bold text-white">-</div>
            </div>
            <div className="bg-och-midnight/50 p-4 rounded-lg">
              <div className="text-sm text-och-steel mb-1">Active Subscriptions</div>
              <div className="text-2xl font-bold text-och-mint">-</div>
            </div>
            <div className="bg-och-midnight/50 p-4 rounded-lg">
              <div className="text-sm text-och-steel mb-1">Monthly Revenue</div>
              <div className="text-2xl font-bold text-och-defender">-</div>
            </div>
            <div className="bg-och-midnight/50 p-4 rounded-lg">
              <div className="text-sm text-och-steel mb-1">Payment Gateways</div>
              <div className="text-2xl font-bold text-white">-</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}















































































