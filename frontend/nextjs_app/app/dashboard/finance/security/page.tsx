/**
 * Security and System Monitoring Page
 * MFA enforcement, payment logs, and service health monitoring
 */

'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { FinanceNavigation } from '@/components/navigation/FinanceNavigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Shield, 
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Activity
} from 'lucide-react'

export default function SecurityPage() {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-och-midnight flex">
        <FinanceNavigation />
        <div className="flex-1 lg:ml-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-8 w-8 text-och-orange" />
                <h1 className="text-h1 font-bold text-white">Security & System Monitoring</h1>
              </div>
              <p className="body-m text-och-steel">
                MFA enforcement, payment logs, and service health monitoring
              </p>
            </div>

            {/* MFA Status */}
            <Card className="p-6 mb-8 bg-och-savanna-green/10 border border-och-savanna-green/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-och-savanna-green" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Multi-Factor Authentication</h3>
                    <p className="body-s text-och-steel">MFA is mandatory for all Finance users</p>
                  </div>
                </div>
                <Badge variant="mint">Enabled</Badge>
              </div>
            </Card>

            {/* Payment Logs */}
            <Card className="p-6 mb-8 bg-och-midnight border border-och-steel/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-h2 font-semibold text-white">Payment Logs</h2>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
              </div>
              <p className="body-m text-och-steel mb-4">
                Track payment-related message logs and failed payment notification logs
              </p>
              
              {/* Log Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-och-defender/10 border border-och-defender/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-och-defender" />
                    <p className="font-medium text-white">Payment Messages</p>
                  </div>
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="body-s text-och-steel">Last 24 hours</p>
                </div>
                <div className="p-4 bg-och-orange/10 border border-och-orange/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-och-orange" />
                    <p className="font-medium text-white">Failed Notifications</p>
                  </div>
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="body-s text-och-steel">Last 24 hours</p>
                </div>
                <div className="p-4 bg-och-gold/10 border border-och-gold/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-och-gold" />
                    <p className="font-medium text-white">Pending Retries</p>
                  </div>
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="body-s text-och-steel">Awaiting action</p>
                </div>
              </div>

              {/* Recent Logs */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-och-steel/20">
                  <thead className="bg-och-midnight/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-och-steel">
                        <p className="body-m">No payment logs available</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Service Health */}
            <Card className="p-6 bg-och-midnight border border-och-steel/20">
              <h2 className="text-h2 font-semibold text-white mb-4">Service Health</h2>
              <p className="body-m text-och-steel mb-4">
                Access read-only service health dashboards (without access to raw system logs)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-och-savanna-green/10 border border-och-savanna-green/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-white">Payment Gateway</p>
                    <Badge variant="mint">Operational</Badge>
                  </div>
                  <p className="body-s text-och-steel">All services running normally</p>
                </div>
                <div className="p-4 bg-och-savanna-green/10 border border-och-savanna-green/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-white">Billing System</p>
                    <Badge variant="mint">Operational</Badge>
                  </div>
                  <p className="body-s text-och-steel">All services running normally</p>
                </div>
                <div className="p-4 bg-och-savanna-green/10 border border-och-savanna-green/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-white">Notification Service</p>
                    <Badge variant="mint">Operational</Badge>
                  </div>
                  <p className="body-s text-och-steel">All services running normally</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

