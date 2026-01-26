/**
 * Finance Dashboard Client Component
 * Main dashboard for Finance role - Single Source of Truth for Financial Operations
 * 
 * Analogy: Control Tower of a Toll Road System
 * - Sets tolls (products/prices)
 * - Counts revenue
 * - Issues EZ-Pass (sponsorship codes)
 */

'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { FinanceNavigation } from '@/components/navigation/FinanceNavigation'
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  FileText, 
  Wallet, 
  Gift,
  Shield,
  BarChart3,
  CreditCard,
  Users
} from 'lucide-react'
import Link from 'next/link'

export default function FinanceDashboardClient() {
  const { user } = useAuth()

  // Quick stats overview - Using OCH Brand Colors
  const stats = [
    {
      label: 'MRR',
      value: '$0',
      change: '+0%',
      icon: TrendingUp,
      color: 'text-och-mint' // Cyber Mint - Highlights, success, data pulses
    },
    {
      label: 'ARR',
      value: '$0',
      change: '+0%',
      icon: DollarSign,
      color: 'text-och-defender' // Defender Blue - Primary CTA, brand strength
    },
    {
      label: 'DSO',
      value: '0 days',
      change: '0%',
      icon: CreditCard,
      color: 'text-och-orange' // Signal Orange - Alerts, warnings, mission urgency
    },
    {
      label: 'Active Subscriptions',
      value: '0',
      change: '+0',
      icon: Users,
      color: 'text-och-savanna-green' // Savanna Green - Growth, progression indicators
    },
  ]

  const dashboardSections = [
    {
      title: 'Product & Price Management',
      description: 'Catalog Management, Price Books, Tax Configuration, Seat Caps',
      icon: ShoppingCart,
      link: '/dashboard/finance/catalog',
      color: 'bg-och-defender' // Defender Blue - Primary CTA, brand strength
    },
    {
      title: 'Financial Analytics & Reporting',
      description: 'Revenue Metrics, KPIs, Payment Health, Financial Packs',
      icon: BarChart3,
      link: '/dashboard/finance/analytics',
      color: 'bg-och-mint' // Cyber Mint - Highlights, success, data pulses
    },
    {
      title: 'Billing & Transactions',
      description: 'Invoicing, Refunds, Dunning Queue, Reconciliation',
      icon: FileText,
      link: '/dashboard/finance/billing',
      color: 'bg-och-night-sky' // Night Sky Blue - Background gradients
    },
    {
      title: 'Sponsorship & Wallets',
      description: 'Sponsorship Wallets, Budget Tracking, Sponsorship Codes',
      icon: Wallet,
      link: '/dashboard/finance/sponsorship',
      color: 'bg-och-gold' // Sahara Gold - Leadership elements
    },
    {
      title: 'Engagement & Rewards',
      description: 'Rewards Budgeting, Reward Ledgers, Voucher Management',
      icon: Gift,
      link: '/dashboard/finance/rewards',
      color: 'bg-och-desert-clay' // Desert Clay - Entrepreneurship accents
    },
    {
      title: 'Security & Monitoring',
      description: 'Payment Logs, Service Health, System Monitoring',
      icon: Shield,
      link: '/dashboard/finance/security',
      color: 'bg-och-orange' // Signal Orange - Alerts, warnings, mission urgency
    },
  ]

  return (
    <div className="min-h-screen bg-och-midnight flex">
      <FinanceNavigation />
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <div className="bg-och-midnight border-b border-och-steel/20">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-h1 font-bold text-white">
                  Finance Dashboard
                </h1>
                <p className="mt-1 body-m text-och-steel">
                  Centralized billing, revenue operations, and financial oversight
                </p>
                {user?.mfa_enabled ? (
                  <Badge variant="mint" className="mt-2">
                    MFA Enabled
                  </Badge>
                ) : (
                  <Badge variant="orange" className="mt-2">
                    MFA Required
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-s font-medium text-och-steel">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    <p className={`body-s ${stat.color} mt-1`}>{stat.change}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </Card>
            )
          })}
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardSections.map((section) => {
            const Icon = section.icon
            return (
              <Link key={section.title} href={section.link}>
                <Card className="p-6 hover:shadow-lg hover:shadow-och-defender/20 transition-shadow cursor-pointer h-full bg-och-midnight border border-och-steel/20">
                  <div className={`${section.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-h3 font-semibold text-white mb-2">
                    {section.title}
                  </h3>
                  <p className="body-m text-och-steel">
                    {section.description}
                  </p>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Recent Activity */}
        <Card className="mt-8 p-6 bg-och-midnight border border-och-steel/20">
          <h2 className="text-h2 font-semibold text-white mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-och-steel">
            <p className="body-m">No recent activity</p>
          </div>
        </Card>
        </div>
      </div>
    </div>
  )
}

