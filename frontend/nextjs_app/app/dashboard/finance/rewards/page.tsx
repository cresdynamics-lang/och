/**
 * Engagement and Reward Oversight Page
 * Manage rewards budgeting, ledgers, and voucher management
 */

'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { FinanceNavigation } from '@/components/navigation/FinanceNavigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Gift, 
  DollarSign, 
  FileText,
  Plus,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function RewardsPage() {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-och-midnight flex">
        <FinanceNavigation />
        <div className="flex-1 lg:ml-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-h1 font-bold text-white">Engagement & Reward Oversight</h1>
              <p className="mt-1 body-m text-och-steel">
                Manage rewards budgeting, ledgers, and voucher management
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-s font-medium text-och-steel">Rewards Budget</p>
                    <p className="text-2xl font-bold text-white mt-1">$0</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-och-gold" />
                </div>
              </Card>
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-s font-medium text-och-steel">Total Redeemed</p>
                    <p className="text-2xl font-bold text-white mt-1">$0</p>
                  </div>
                  <Gift className="h-8 w-8 text-och-desert-clay" />
                </div>
              </Card>
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-s font-medium text-och-steel">Active Vouchers</p>
                    <p className="text-2xl font-bold text-white mt-1">0</p>
                  </div>
                  <FileText className="h-8 w-8 text-och-defender" />
                </div>
              </Card>
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-s font-medium text-och-steel">Pending Approval</p>
                    <p className="text-2xl font-bold text-white mt-1">0</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-och-orange" />
                </div>
              </Card>
            </div>

            {/* Rewards Budgeting */}
            <Card className="p-6 mb-8 bg-och-midnight border border-och-steel/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-h2 font-semibold text-white">Rewards Budgeting</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Set Budget
                </Button>
              </div>
              <p className="body-m text-och-steel mb-4">
                Define and manage budgets for credits, vouchers, and rewards
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-och-midnight/50 border border-och-steel/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">Total Rewards Budget</p>
                      <p className="body-s text-och-steel">Allocated for credits, vouchers, and rewards</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">$0.00</p>
                      <p className="body-s text-och-steel">Remaining: $0.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Reward Ledgers */}
            <Card className="p-6 mb-8 bg-och-midnight border border-och-steel/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-h2 font-semibold text-white">Reward Ledgers</h2>
                <Button variant="outline">
                  Export Ledger
                </Button>
              </div>
              <p className="body-m text-och-steel mb-4">
                View ledgers of redeemed points and approve high-value reward payouts
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-och-steel/20">
                  <thead className="bg-och-midnight/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Reward
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-och-steel">
                        <p className="body-m">No reward redemptions</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Voucher Management */}
            <Card className="p-6 bg-och-midnight border border-och-steel/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-h2 font-semibold text-white">Voucher Management</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Issue Voucher
                </Button>
              </div>
              <p className="body-m text-och-steel mb-4">
                Issue or revoke vouchers based on policy compliance
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-och-steel/20">
                  <thead className="bg-och-midnight/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Voucher Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Value
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-och-steel">
                        <p className="body-m">No vouchers issued</p>
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

