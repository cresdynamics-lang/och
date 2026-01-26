/**
 * Financial Analytics and Reporting Page
 * Single Source of Truth for financial state and revenue analytics
 */

'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { FinanceNavigation } from '@/components/navigation/FinanceNavigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Download,
  BarChart3,
  PieChart
} from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-och-midnight flex">
        <FinanceNavigation />
        <div className="flex-1 lg:ml-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-h1 font-bold text-white">Financial Analytics & Reporting</h1>
                <p className="mt-1 body-m text-och-steel">
                  Single Source of Truth for financial state and revenue analytics
                </p>
              </div>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Finance Pack
              </Button>
            </div>

            {/* Core Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-s font-medium text-och-steel">MRR</p>
                    <p className="text-2xl font-bold text-white mt-1">$0</p>
                    <p className="body-s text-och-mint mt-1">+0%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-och-mint" />
                </div>
              </Card>
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-s font-medium text-och-steel">ARR</p>
                    <p className="text-2xl font-bold text-white mt-1">$0</p>
                    <p className="body-s text-och-mint mt-1">+0%</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-och-defender" />
                </div>
              </Card>
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-s font-medium text-och-steel">Gross Revenue</p>
                    <p className="text-2xl font-bold text-white mt-1">$0</p>
                    <p className="body-s text-och-steel mt-1">This month</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-och-night-sky" />
                </div>
              </Card>
              <Card className="p-6 bg-och-midnight border border-och-steel/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-s font-medium text-och-steel">Net Revenue</p>
                    <p className="text-2xl font-bold text-white mt-1">$0</p>
                    <p className="body-s text-och-steel mt-1">This month</p>
                  </div>
                  <PieChart className="h-8 w-8 text-och-orange" />
                </div>
              </Card>
            </div>

            {/* Operational KPIs */}
            <Card className="p-6 mb-8 bg-och-midnight border border-och-steel/20">
              <h2 className="text-h2 font-semibold text-white mb-4">Operational KPIs</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="body-s font-medium text-och-steel">DSO (Days Sales Outstanding)</p>
                  <p className="text-2xl font-bold text-white mt-1">0 days</p>
                </div>
                <div>
                  <p className="body-s font-medium text-och-steel">Dunning Recovery %</p>
                  <p className="text-2xl font-bold text-white mt-1">0%</p>
                </div>
                <div>
                  <p className="body-s font-medium text-och-steel">Cohort Fill Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">0%</p>
                </div>
              </div>
            </Card>

            {/* Payment Health */}
            <Card className="p-6 mb-8 bg-och-midnight border border-och-steel/20">
              <h2 className="text-h2 font-semibold text-white mb-4">Payment Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="body-s font-medium text-och-steel mb-2">Payment Method Mix</p>
                  <div className="text-center py-8 text-och-steel">
                    <p className="body-m">No data available</p>
                  </div>
                </div>
                <div>
                  <p className="body-s font-medium text-och-steel mb-2">Authorization vs Capture Success Rate</p>
                  <div className="text-center py-8 text-och-steel">
                    <p className="body-m">No data available</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Revenue by Product/Currency */}
            <Card className="p-6 bg-och-midnight border border-och-steel/20">
              <h2 className="text-h2 font-semibold text-white mb-4">Revenue Breakdown</h2>
              <div className="space-y-4">
                <div>
                  <p className="body-s font-medium text-och-steel mb-2">By Product</p>
                  <div className="text-center py-8 text-och-steel">
                    <p className="body-m">No data available</p>
                  </div>
                </div>
                <div>
                  <p className="body-s font-medium text-och-steel mb-2">By Currency</p>
                  <div className="text-center py-8 text-och-steel">
                    <p className="body-m">No data available</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

