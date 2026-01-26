'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function MarketplacePage() {
  return (
    <RouteGuard>
      <AdminLayout>
        <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-gold">Marketplace Management</h1>
            <p className="text-och-steel">Govern and oversee the Career/Marketplace module</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Employer Directory */}
            <Link href="/dashboard/admin/marketplace/employers">
              <Card className="p-6 hover:bg-och-midnight/50 transition-colors cursor-pointer h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-och-gold/20 rounded-lg">
                    <svg className="w-8 h-8 text-och-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Employer Directory</h3>
                    <p className="text-sm text-och-steel">Vet, onboard, and manage employers</p>
                  </div>
                </div>
                <p className="text-och-steel text-sm">
                  Manage employer registration, verification, account suspension, and role assignments
                </p>
              </Card>
            </Link>

            {/* Marketplace Audit View */}
            <Link href="/dashboard/admin/marketplace/audit">
              <Card className="p-6 hover:bg-och-midnight/50 transition-colors cursor-pointer h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-och-defender/20 rounded-lg">
                    <svg className="w-8 h-8 text-och-defender" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Audit View</h3>
                    <p className="text-sm text-och-steel">Monitor employer interest logs</p>
                  </div>
                </div>
                <p className="text-och-steel text-sm">
                  Track employer interactions with talent profiles, views, favorites, and contact requests
                </p>
              </Card>
            </Link>

            {/* Governance Console */}
            <Link href="/dashboard/admin/marketplace/governance">
              <Card className="p-6 hover:bg-och-midnight/50 transition-colors cursor-pointer h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-och-mint/20 rounded-lg">
                    <svg className="w-8 h-8 text-och-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Governance Console</h3>
                    <p className="text-sm text-och-steel">Moderate content and configure rules</p>
                  </div>
                </div>
                <p className="text-och-steel text-sm">
                  Moderate job postings, manage profile visibility rules, and configure marketplace settings
                </p>
              </Card>
            </Link>

            {/* Analytics & Insights */}
            <Link href="/dashboard/admin/marketplace/analytics">
              <Card className="p-6 hover:bg-och-midnight/50 transition-colors cursor-pointer h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-och-orange/20 rounded-lg">
                    <svg className="w-8 h-8 text-och-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Analytics & Insights</h3>
                    <p className="text-sm text-och-steel">Monitor marketplace health</p>
                  </div>
                </div>
                <p className="text-och-steel text-sm">
                  View aggregated readiness scores, marketplace rankings, and overall platform health metrics
                </p>
              </Card>
            </Link>
          </div>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
