/**
 * Sponsorship and Wallet Management Page
 * Oversee third-party payer flows, wallets, and sponsorship codes
 */

'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { FinanceNavigation } from '@/components/navigation/FinanceNavigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Wallet, 
  Code, 
  Users,
  DollarSign,
  Plus,
  TrendingUp
} from 'lucide-react'

export default function SponsorshipPage() {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-och-midnight flex">
        <FinanceNavigation />
        <div className="flex-1 lg:ml-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-h1 font-bold text-white">Sponsorship & Wallet Management</h1>
                <p className="mt-1 body-m text-och-steel">
                  Oversee third-party payer flows, wallets, and sponsorship codes
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-s font-medium text-och-steel">Active Wallets</p>
                    <p className="text-2xl font-bold text-white mt-1">0</p>
                  </div>
                  <Wallet className="h-8 w-8 text-och-defender" />
                </div>
              </Card>
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-s font-medium text-och-steel">Total Budget</p>
                    <p className="text-2xl font-bold text-white mt-1">$0</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-och-gold" />
                </div>
              </Card>
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-s font-medium text-och-steel">Active Codes</p>
                    <p className="text-2xl font-bold text-white mt-1">0</p>
                  </div>
                  <Code className="h-8 w-8 text-och-mint" />
                </div>
              </Card>
            </div>

            {/* Sponsorship Wallets */}
            <Card className="p-6 mb-8 bg-och-midnight border border-och-steel/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-h2 font-semibold text-white">Sponsorship Wallets</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Wallet
                </Button>
              </div>
              <p className="body-m text-och-steel mb-4">
                Access and manage sponsorship wallets and budget tracking for foundations or corporate partners
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-och-steel/20">
                  <thead className="bg-och-midnight/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Wallet Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Remaining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-och-steel">
                        <p className="body-m">No wallets configured</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Sponsorship Codes */}
            <Card className="p-6 bg-och-midnight border border-och-steel/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-h2 font-semibold text-white">Sponsorship Codes</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Issue Code
                </Button>
              </div>
              <p className="body-m text-och-steel mb-4">
                Issue scholarship and sponsorship codes and view real-time utilization reports for corporate seats
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-och-steel/20">
                  <thead className="bg-och-midnight/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Wallet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Used / Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-och-steel">
                        <p className="body-m">No sponsorship codes issued</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

